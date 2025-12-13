'use client';

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, Upload, Trash2, Eye, CheckCircle, Home, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface CleanedData {
    headers: string[];
    rows: any[][];
    originalFileName: string;
    sheetName: string;
    originalRowCount: number;
    skippedRows: number;
}

export default function BPSConverter() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cleanedData, setCleanedData] = useState<CleanedData | null>(null);
    const [previewMode, setPreviewMode] = useState<'table' | 'raw'>('table');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const processFile = async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

            if (jsonData.length < 2) {
                throw new Error('File terlalu kosong atau tidak valid');
            }

            const limit = Math.min(jsonData.length, 25);
            let firstDataRowIndex = -1;
            let maxCols = 0;

            for (let i = 0; i < limit; i++) {
                const row = jsonData[i];
                if (row.length > maxCols) maxCols = row.length;
            }

            for (let i = 0; i < limit; i++) {
                const row = jsonData[i];
                if (row.length < maxCols * 0.5) continue;

                const filledCount = row.filter(c => c !== '' && c !== null && c !== undefined).length;
                let numericCount = 0;
                let yearLikeCount = 0;
                let floatCount = 0;

                row.forEach(c => {
                    let val = NaN;
                    if (typeof c === 'number') val = c;
                    else if (typeof c === 'string') {
                        const clean = c.trim().replace(/,/g, '.');
                        if (!isNaN(parseFloat(clean))) val = parseFloat(clean);
                    }

                    if (!isNaN(val)) {
                        numericCount++;
                        if (Number.isInteger(val) && val > 1900 && val < 2100) {
                            yearLikeCount++;
                        }
                        if (!Number.isInteger(val)) {
                            floatCount++;
                        }
                    }
                });

                const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
                const isExplicitHeader = rowStr.includes('provinsi') || rowStr.includes('kabupaten') ||
                    rowStr.includes('wilayah') || rowStr.includes('tabel') || rowStr.includes('keterangan');

                if (!isExplicitHeader) {
                    const isYearHeader = yearLikeCount > filledCount * 0.5;

                    if (floatCount > 0 && !isYearHeader) {
                        firstDataRowIndex = i;
                        break;
                    }

                    if (numericCount > filledCount * 0.5 && !isYearHeader && filledCount > 2) {
                        firstDataRowIndex = i;
                        break;
                    }
                }
            }

            if (firstDataRowIndex === -1) {
                let maxFilled = 0;
                for (let i = 0; i < limit; i++) {
                    const filled = jsonData[i].filter(c => c).length;
                    if (filled > maxFilled) {
                        maxFilled = filled;
                        firstDataRowIndex = i + 1;
                    }
                }
            }

            if (firstDataRowIndex < 1) firstDataRowIndex = 1;

            const headerCandidates: any[][] = [];
            let cursor = firstDataRowIndex - 1;

            while (cursor >= 0 && headerCandidates.length < 4) {
                const row = jsonData[cursor];
                if (!row) { cursor--; continue; }

                const hasContent = row.some(c => c && String(c).trim().length > 0);

                if (!hasContent && headerCandidates.length > 0) {
                    break;
                }

                if (hasContent) {
                    headerCandidates.unshift(row);
                }
                cursor--;
            }

            if (headerCandidates.length === 0) {
                headerCandidates.push(jsonData[0]);
            }

            const finalHeaders: string[] = [];
            const colCount = Math.max(
                maxCols,
                headerCandidates.length > 0 ? headerCandidates[0].length : 0
            );

            for (let col = 0; col < colCount; col++) {
                const parts: string[] = [];

                headerCandidates.forEach((row, rowIndex) => {
                    const isLastRow = rowIndex === headerCandidates.length - 1;
                    let cellVal = row[col];

                    if (cellVal === null || cellVal === undefined) cellVal = '';

                    if (!isLastRow && String(cellVal).trim() === '' && col > 0) {
                        const prevVal = row[col - 1];
                        if (prevVal) {
                            cellVal = prevVal;
                            row[col] = prevVal;
                        }
                    }

                    if (cellVal && String(cellVal).trim()) {
                        parts.push(String(cellVal).trim());
                    }
                });

                const uniqueParts = [...new Set(parts)];
                const name = uniqueParts.length > 0 ? uniqueParts.join(' - ') : `Kolom ${col + 1}`;
                finalHeaders.push(name);
            }

            const rows = jsonData.slice(firstDataRowIndex);
            const skippedRows = firstDataRowIndex;

            setCleanedData({
                headers: finalHeaders,
                rows: rows,
                originalFileName: file.name,
                sheetName: sheetName,
                originalRowCount: jsonData.length,
                skippedRows: skippedRows
            });

            setSuccessMessage(`Berhasil memproses ${rows.length} baris data dari ${headerCandidates.length} baris header`);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Gagal memproses file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls')) {
                processFile(file);
            } else {
                setError('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
            }
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const downloadCSV = () => {
        if (!cleanedData) return;

        const csvContent = [
            cleanedData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
            ...cleanedData.rows.map(row =>
                row.map(cell => {
                    const val = cell === null || cell === undefined ? '' : String(cell);
                    return `"${val.replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = cleanedData.originalFileName.replace(/\.(xlsx|xls|csv)$/i, '_clean.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadExcel = () => {
        if (!cleanedData) return;

        const ws = XLSX.utils.aoa_to_sheet([cleanedData.headers, ...cleanedData.rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Bersih');

        XLSX.writeFile(wb, cleanedData.originalFileName.replace(/\.(xlsx|xls|csv)$/i, '_clean.xlsx'));
    };

    const resetConverter = () => {
        setCleanedData(null);
        setError(null);
        setSuccessMessage(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <main className="max-w-4xl mx-auto space-y-8">

                {/* Header - Same style as main page */}
                <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                            <h1 className="font-bold text-2xl text-gray-900">BPS Data Converter</h1>
                        </div>
                        <p className="text-gray-600">Konversi file BPS menjadi format rapi (single header)</p>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors text-gray-700"
                    >
                        <Home className="w-4 h-4" />
                        Kembali ke Home
                    </Link>
                </header>

                {/* Upload Section */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm">
                            📊
                        </div>
                        <h2 className="font-semibold text-gray-800">Upload File BPS</h2>
                    </div>

                    {/* Upload Zone */}
                    {!cleanedData && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-white
                                ${isDragging
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-500'
                                }
                                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                            `}
                        >
                            <input
                                type="file"
                                id="fileInput"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <label htmlFor="fileInput" className="cursor-pointer block">
                                {isProcessing ? (
                                    <div className="animate-spin w-10 h-10 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full" />
                                ) : (
                                    <Upload className={`w-10 h-10 mx-auto ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
                                )}
                                <p className="text-indigo-600 font-medium text-lg mt-4">
                                    {isProcessing ? 'Memproses file...' : 'Klik untuk Upload atau Drag & Drop'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Upload file Excel/CSV dari BPS. Multi-header akan digabung otomatis.
                                </p>
                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                                    <span className="px-2 py-1 bg-gray-100 rounded">.xlsx</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded">.xls</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-center text-sm flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            {successMessage}
                        </div>
                    )}
                </section>

                {/* Results Section */}
                {cleanedData && (
                    <>
                        {/* Stats Cards */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">File Asli</p>
                                    <p className="text-gray-900 font-semibold truncate text-sm mt-1" title={cleanedData.originalFileName}>
                                        {cleanedData.originalFileName}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Header Skipped</p>
                                    <p className="text-orange-600 font-bold text-2xl">{cleanedData.skippedRows}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Kolom</p>
                                    <p className="text-indigo-600 font-bold text-2xl">{cleanedData.headers.length}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Baris Data</p>
                                    <p className="text-emerald-600 font-bold text-2xl">{cleanedData.rows.length}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                <button
                                    onClick={downloadCSV}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV
                                </button>
                                <button
                                    onClick={downloadExcel}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Excel
                                </button>
                                <button
                                    onClick={resetConverter}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Reset
                                </button>
                            </div>
                        </section>

                        {/* Preview Section */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    Preview Data
                                </h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setPreviewMode('table')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${previewMode === 'table'
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        Table View
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('raw')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${previewMode === 'raw'
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        Headers Only
                                    </button>
                                </div>
                            </div>

                            {/* Preview Table */}
                            {previewMode === 'table' && (
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                {cleanedData.headers.map((header, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="px-4 py-3 text-left text-indigo-700 font-medium whitespace-nowrap border-b border-gray-200 text-xs"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cleanedData.rows.slice(0, 10).map((row, rowIdx) => (
                                                <tr
                                                    key={rowIdx}
                                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                >
                                                    {cleanedData.headers.map((_, colIdx) => (
                                                        <td
                                                            key={colIdx}
                                                            className="px-4 py-2 text-gray-700 whitespace-nowrap text-xs"
                                                        >
                                                            {row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx] !== ''
                                                                ? String(row[colIdx])
                                                                : <span className="text-gray-300">-</span>
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {cleanedData.rows.length > 10 && (
                                        <div className="p-3 text-center text-gray-500 text-xs bg-gray-50 border-t border-gray-100">
                                            ... dan {cleanedData.rows.length - 10} baris lainnya
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Headers Only View */}
                            {previewMode === 'raw' && (
                                <div className="p-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Merged Headers ({cleanedData.headers.length} kolom)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {cleanedData.headers.map((header, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs"
                                            >
                                                <span className="text-gray-400 mr-1">{idx + 1}.</span>
                                                {header}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Info Section */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-gray-800 font-semibold flex items-center gap-2 mb-4">
                        <span className="text-xl">ℹ️</span>
                        Cara Kerja
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">1</div>
                            <div>
                                <p className="text-gray-900 font-medium">Deteksi Header</p>
                                <p className="text-gray-500 text-xs mt-1">Mendeteksi baris header multi-level dari file BPS</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">2</div>
                            <div>
                                <p className="text-gray-900 font-medium">Merge Header</p>
                                <p className="text-gray-500 text-xs mt-1">Menggabungkan header bertingkat dengan separator " - "</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">3</div>
                            <div>
                                <p className="text-gray-900 font-medium">Export Bersih</p>
                                <p className="text-gray-500 text-xs mt-1">Download sebagai CSV atau Excel siap pakai</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-gray-500 text-xs py-4">
                    <p>🔒 File diproses secara lokal di browser. Data tidak dikirim ke server manapun.</p>
                </footer>

            </main>
        </div>
    );
}
