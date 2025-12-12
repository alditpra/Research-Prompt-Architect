import * as XLSX from 'xlsx';
import { SheetData, ColumnProfile } from '@/types';

/**
 * Parses uploaded files and returns structured metadata with smart profiling.
 */
export async function parseUploadedFile(file: File): Promise<SheetData[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);

    const results: SheetData[] = [];

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        // Read raw data (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (jsonData.length < 2) return; // Skip empty sheets

        // --- Advanced Header Detection (Multi-Level) ---
        // Strategy: Find the first "Data Row" (mostly numeric or follows max-width pattern). 
        // The rows immediately preceding it are the Headers.

        const limit = Math.min(jsonData.length, 25);
        let firstDataRowIndex = -1;
        let maxCols = 0;

        // 1. Calculate Max Width to identify "Main Table" area
        for (let i = 0; i < limit; i++) {
            const row = jsonData[i];
            const width = row.length;
            if (width > maxCols) maxCols = width;
        }

        // 2. Find First Data Row
        for (let i = 0; i < limit; i++) {
            const row = jsonData[i];
            // Skip extremely short rows (Metadata/Titles)
            if (row.length < maxCols * 0.5) continue;

            const filledCount = row.filter(c => c !== '' && c !== null && c !== undefined).length;

            // Robust numeric check & Type differentiation
            let numericCount = 0;
            let yearLikeCount = 0;
            let floatCount = 0;

            row.forEach(c => {
                let val = NaN;
                if (typeof c === 'number') val = c;
                else if (typeof c === 'string') {
                    const clean = c.trim().replace(/,/g, '.'); // Handle comma decimals for detection
                    if (!isNaN(parseFloat(clean))) val = parseFloat(clean);
                }

                if (!isNaN(val)) {
                    numericCount++;
                    // Check for Year-like integers (1900 - 2100)
                    if (Number.isInteger(val) && val > 1900 && val < 2100) {
                        yearLikeCount++;
                    }
                    // Check for Floats (decimals)
                    if (!Number.isInteger(val)) {
                        floatCount++;
                    }
                }
            });

            // Header keywords
            const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
            const isExplicitHeader = rowStr.includes('provinsi') || rowStr.includes('kabupaten') || rowStr.includes('wilayah') || rowStr.includes('tabel');

            // Heuristic for Data Row:
            // 1. MUST NOT be an explicit header
            // 2. If it's mostly "Years", it's likely a Header Row (e.g. 2014, 2015, 2016)
            // 3. It should have some Floats (data values) OR match the column density

            if (!isExplicitHeader) {
                const filledRatio = filledCount / maxCols;

                // If row is mostly years, it's a HEADER, NOT DATA.
                const isYearHeader = yearLikeCount > filledCount * 0.5;

                // Strong signal: It has floats (Data) and is not just years
                if (floatCount > 0 && !isYearHeader) {
                    firstDataRowIndex = i;
                    break;
                }

                // Weak signal: It's numbers, not years, and dense
                if (numericCount > filledCount * 0.5 && !isYearHeader && filledCount > 2) {
                    firstDataRowIndex = i;
                    break;
                }
            }
        }

        // Fallback: If no numeric data found, use the "Densest Row" logic (likely Text Data)
        if (firstDataRowIndex === -1) {
            let maxFilled = 0;
            for (let i = 0; i < limit; i++) {
                const filled = jsonData[i].filter(c => c).length;
                if (filled > maxFilled) {
                    maxFilled = filled;
                    firstDataRowIndex = i + 1; // Assume header is the dense row, data starts next
                }
            }
        }

        // Safety check
        if (firstDataRowIndex < 1) firstDataRowIndex = 1;

        // 3. Extract Header Rows (up to 4 rows above Data Start)
        // We look backwards from firstDataRowIndex
        const headerCandidates: any[][] = [];
        let cursor = firstDataRowIndex - 1;

        while (cursor >= 0 && headerCandidates.length < 4) {
            const row = jsonData[cursor];

            // Just check if row exists
            if (!row) { cursor--; continue; }

            // Relaxed Sparsity Check:
            // Only stop if the row is COMPLETELY empty.
            // Even a single value (e.g. "Table Title") might be useful, but usually Title is row 0.
            // We rely on the "Forward Fill" to make use of sparse merged headers.
            const hasContent = row.some(c => c && String(c).trim().length > 0);

            if (!hasContent && headerCandidates.length > 0) {
                // If we hit a total blank line between headers, maybe stop? 
                // But BPS sometimes puts blank lines. Let's just skip it?
                // Safer to stop if we already have candidates.
                break;
            }

            if (hasContent) {
                headerCandidates.unshift(row); // Prepend
            }
            cursor--;
        }

        if (headerCandidates.length === 0) {
            headerCandidates.push(jsonData[0]);
        }

        // 4. Merge Headers
        // - Forward Fill the top rows (Merged cell handling)
        // - Join with ' - '

        const finalHeaders: string[] = [];
        // Ensure we cover all columns present in the Data Row (or maxCols)
        const colCount = Math.max(
            maxCols,
            headerCandidates.length > 0 ? headerCandidates[0].length : 0
        );

        for (let col = 0; col < colCount; col++) {
            const parts: string[] = [];

            // Forward Fill Logic: If current cell empty, use value from previous column in SAME row
            // (Only for rows above the bottom-most header row, as those are usually the grouping headers)
            // actually BPS Row 1 (Gender) is merged. Row 2 (Male/Female) is not.
            headerCandidates.forEach((row, rowIndex) => {
                // Skip the LAST row from forward filling (usually the specific variable name/year)
                // UNLESS it's the only row.
                const isLastRow = rowIndex === headerCandidates.length - 1;

                let cellVal = row[col];

                // Normalize cell value
                if (cellVal === null || cellVal === undefined) cellVal = '';

                // Forward Fill only for upper rows
                if (!isLastRow && String(cellVal).trim() === '' && col > 0) {
                    // Inherit from left
                    const prevVal = row[col - 1];
                    if (prevVal) {
                        cellVal = prevVal;
                        row[col] = prevVal; // Persist for next column
                    }
                }

                if (cellVal && String(cellVal).trim()) {
                    parts.push(String(cellVal).trim());
                }
            });

            // If parts empty (e.g. empty column), name it
            // Clean up: join, remove duplicates if any?
            // "Gender - Gender" -> "Gender"
            const uniqueParts = [...new Set(parts)];
            const name = uniqueParts.length > 0 ? uniqueParts.join(' - ') : `Column ${col + 1}`;
            finalHeaders.push(name);
        }

        const rows = jsonData.slice(firstDataRowIndex);
        const rowCount = rows.length;

        // Sample for profiling (max 50 rows)
        const sampleRows = rows.slice(0, 50);

        // Raw Preview (Original structure including titles)
        const rawPreview = jsonData.slice(0, 10);

        const columns: ColumnProfile[] = finalHeaders.map((header, index) => {
            return profileColumn(header, index, sampleRows);
        });

        results.push({
            sheetName,
            columns,
            rowCount,
            rawPreview
        });
    });

    return results;
}

function profileColumn(name: string, index: number, rows: any[]): ColumnProfile {
    const values = rows.map(r => r[index]).filter(v => v !== undefined && v !== '' && v !== null);

    if (values.length === 0) {
        return { name, type: 'text', sampleValues: '-' };
    }

    // Check if numeric
    const isNumeric = values.every(v => !isNaN(Number(v)));
    if (isNumeric) {
        // Create range sample
        const nums = values.map(v => Number(v));
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        return { name, type: 'numeric', sampleValues: `${min} - ${max}` };
    }

    // Check unique values (Categorical)
    const uniqueValues = new Set(values.map(v => String(v).trim()));
    if (uniqueValues.size <= 20) {
        const samples = Array.from(uniqueValues).slice(0, 5).join(', ');
        return { name, type: 'categorical', sampleValues: samples };
    }

    // Default to Text
    const textSamples = values.slice(0, 3).map(v => String(v)).join(', ');
    return { name, type: 'text', sampleValues: textSamples };
}
