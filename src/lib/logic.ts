import { AppState } from '@/types';
import { METHOD_LABELS, METHOD_SPECIFIC_TASKS, STYLE_GUIDE } from './constants';


export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
        .slice(0, 2000); // Prevent extremely long inputs
}

export function formatDetailsForPrompt(method: string, details: AppState['details'], language: 'id' | 'en', hasUploadedFiles: boolean = false): string {
    const labels = {
        qualitative: {
            id: { informant: 'Informan Kunci', focus: 'Fokus Galian' },
            en: { informant: 'Key Informant', focus: 'Focus of Inquiry' }
        },
        quantitative: {
            id: { varX: 'Variabel X (Independen)', varY: 'Variabel Y (Dependen)', varZ: 'Variabel Z (Moderasi/Intervening)', population: 'Target Responden' },
            en: { varX: 'Variable X (Independent)', varY: 'Variable Y (Dependent)', varZ: 'Variable Z (Moderating/Intervening)', population: 'Target Respondents' }
        },
        secondary: {
            id: { varX: 'Variabel X (Independen)', varY: 'Variabel Y (Dependen)', varZ: 'Variabel Z (Moderasi/Intervening)', source: 'Sumber Data', population: 'Periode & Populasi' },
            en: { varX: 'Variable X (Independent)', varY: 'Variable Y (Dependent)', varZ: 'Variable Z (Moderating/Intervening)', source: 'Data Source', population: 'Period & Population' }
        }
    };

    // Safe access using keyof
    const methodKey = method as keyof typeof labels;
    const methodLabels = labels[methodKey][language];
    const methodDetails = details[methodKey as keyof typeof details];

    return Object.keys(methodDetails)
        .map(key => {
            const label = methodLabels[key as keyof typeof methodLabels];
            const value = methodDetails[key as keyof typeof methodDetails] as string;

            let displayValue = '';
            if (value.trim()) {
                displayValue = sanitizeInput(value);
            } else if (hasUploadedFiles) {
                // If files uploaded and value empty, refer to dataset
                // Special case for 'source' or 'population'
                if (key === 'source' || key === 'population') {
                    displayValue = language === 'id' ? '(Analisis otomatis dari Metadata file di atas)' : '(Auto-analyzed from File Metadata above)';
                } else {
                    displayValue = language === 'id' ? '(Lihat struktur dataset di atas)' : '(See dataset structure above)';
                }
            } else {
                // Default fallback
                displayValue = language === 'id' ? '(Mohon berikan saran opsi yang relevan dari Teori)' : '(Please suggest relevant options based on Theory)';
            }

            return `- ${label}: ${displayValue}`;
        })
        .join('\n');
}

export function generatePrompt(state: AppState): string {
    const { language, field, customField, topic, problem, outputMode, uploadedFiles, method, subMethod, tool, customTool, noveltyMode, details } = state;

    // Determine final field
    const finalField = field === 'Lainnya' ? sanitizeInput(customField) : field;

    // Determine final Topic (Fall back to "Inferred from dataset" if empty and files exist)
    let finalTopic = topic.trim();
    if (!finalTopic && uploadedFiles && uploadedFiles.length > 0) {
        finalTopic = language === 'id'
            ? '(TOPIC BELUM DITENTUKAN - HARAP ANALISIS DARI DATASET)'
            : '(TOPIC UNDEFINED - PLEASE INFER FROM DATASET)';
    } else {
        finalTopic = sanitizeInput(topic);
    }

    // Determine final tool
    const finalTool = tool === 'Lainnya' ? sanitizeInput(customTool) : tool;

    // Build Dataset Context
    let datasetContext = '';
    if (uploadedFiles && uploadedFiles.length > 0) {
        const title = language === 'id' ? 'DATASET TERSEDIA (SUMBER DATA):' : 'AVAILABLE DATASETS (DATA SOURCE):';
        const content = uploadedFiles.map(file => {
            return `File: ${file.fileName}\n` + file.sheets.map(sheet => {
                const colInfo = sheet.columns.slice(0, 15).map(c => `   - ${c.name} [${c.type}]`).join('\n');
                // Format raw preview as JSON-like structure for clarity
                const rawStructure = JSON.stringify(sheet.rawPreview);

                return `  Sheet: ${sheet.sheetName} (${sheet.rowCount} rows)
  Variables Detected:
${colInfo}
  Table Structure Snippet (Top 8 rows):
  ${rawStructure}`;
            }).join('\n\n');
        }).join('\n\n' + '='.repeat(20) + '\n');

        datasetContext = `\n${title}\n${content}\n${language === 'id' ? '(PENTING: Gunakan "Table Structure Snippet" untuk memahami header yang kompleks, misal data BPS/Time Series. Identifikasi variabel yang sebenarnya dari struktur tersebut)' : '(IMPORTANT: Use "Table Structure Snippet" to understand complex headers, e.g. Time Series/BPS data. Identify true variables from this structure)'}\n`;
    }
    // Get style guide
    const styleGuide = STYLE_GUIDE[language];

    // Check if Sub-Method is "AI Recommendation"
    const isAiMethod = subMethod?.includes('Saran AI') || subMethod?.includes('AI Recommendation');
    const displaySubMethod = isAiMethod ? (language === 'id' ? 'Saran AI (Belum Ditentukan)' : 'AI Recommendation (To Be Determined)') : subMethod;

    // Get method label with Sub-Method
    const baseMethodLabel = METHOD_LABELS[language][method];
    const fullMethodLabel = subMethod ? `${baseMethodLabel} - ${displaySubMethod}` : baseMethodLabel;

    // Format method details
    const hasUploadedFilesFlag = uploadedFiles && uploadedFiles.length > 0;
    const detailsFormatted = formatDetailsForPrompt(method, details, language, hasUploadedFilesFlag);

    // Get method-specific tasks (Override if AI Method)
    let methodTasks = METHOD_SPECIFIC_TASKS[method][language];
    if (isAiMethod) {
        if (language === 'id') {
            methodTasks = `1. REKOMENDASI DESAIN (CRITICAL): Analisis data/variabel di atas, lalu tentukan Desain Spesifik yang paling tepat (misal: Studi Kasus vs Fenomenologi, atau Eksperimen vs Korelasional). Jelaskan alasan metodologisnya secara kuat.
` + methodTasks;
        } else {
            methodTasks = `1. DESIGN RECOMMENDATION (CRITICAL): Analyze the data/variables above, then determine the most appropriate Specific Design (e.g., Case Study vs Phenomenology, or Experiment vs Correlational). Provide strong methodological justification.
` + methodTasks;
        }
    }

    // Novelty/Approach Instructions
    let noveltyInstructions = '';
    if (noveltyMode === 'advanced') {
        noveltyInstructions = language === 'id'
            ? `INSTRUKSI NOVELTY (MUTAKHIR/ADVANCED): 
- Prioritaskan pendekatan state-of-the-art atau algoritma terbaru.
- Jangan gunakan pendekatan standar yang terlalu umum jika ada alternatif yang lebih tajam.
- Tekankan aspek kebaruan/gap yang unik.`
            : `NOVELTY INSTRUCTIONS (ADVANCED):
- Prioritize state-of-the-art approaches or recent algorithms.
- Avoid standard/generic approaches if sharper alternatives exist.
- Emphasize unique novelty/gap.`;
    } else {
        noveltyInstructions = language === 'id'
            ? `INSTRUKSI NOVELTY (STANDAR/TRADISIONAL): 
- Gunakan pendekatan yang sudah mapan dan teruji (High Reliability).
- Hindari metode eksperimental yang berisiko tinggi.
- Fokus pada ketelitian replikasi standar akademik yang baku.`
            : `NOVELTY INSTRUCTIONS (STANDARD/TRADITIONAL):
- Use established, time-tested approaches (High Reliability).
- Avoid high-risk experimental methods.
- Focus on rigorous adherence to standard academic verification.`;
    }

    // Format Problem / Gap
    let problemSection = '';
    const hasProblem = problem.ideal.trim() || problem.actual.trim();

    if (hasProblem) {
        if (language === 'id') {
            problemSection = `GAP ANALYSIS (MASALAH RISET):
- Kondisi Ideal (Harapan): ${sanitizeInput(problem.ideal)}
- Kondisi Aktual (Fakta): ${sanitizeInput(problem.actual)}
- Kesenjangan: Terdapat gap antara harapan dan fakta di atas yang perlu diteliti.`;
        } else {
            problemSection = `GAP ANALYSIS (RESEARCH PROBLEM):
- Ideal Condition (Expectation): ${sanitizeInput(problem.ideal)}
- Actual Condition (Reality): ${sanitizeInput(problem.actual)}
- The Gap: There is a discrepancy between expectation and reality that requires investigation.`;
        }
    } else {
        problemSection = language === 'id'
            ? '(User belum memiliki rumusan masalah spesifik. Mohon bantu identifikasi Gap yang krusial)'
            : '(User has not defined specific problem. Please help identify crucial Gaps)';
    }

    // --- BRAINSTORMING MODE ---
    if (outputMode === 'brainstorming') {
        if (language === 'id') {
            return `Bertindaklah sebagai Konsultan Riset Kreatif & Akademis di bidang ${finalField}.

Tujuan: Membantu saya menemukan ide penelitian yang segar dan valid (Brainstorming).

KONTEKS SEMENTARA:
- Topik Minat: ${finalTopic}
- Metode Bayangan: ${fullMethodLabel}
- ${noveltyInstructions}
- ${problemSection}
${datasetContext}

DATA YANG TERSEDIA:
${detailsFormatted}

TUGAS ANDA:
Berikan 5 OPSI IDE PENELITIAN yang potensial. Untuk setiap opsi, jelaskan:
1. Judul: Yang menarik & akademis.
2. Research Gap: Kenapa ini penting diteliti? (Hubungkan dengan gap Ideal vs Aktual jika ada).
3. Kebaruan (Novelty): Apa bedanya dengan riset lain?
4. Validasi Metode & Alat: Apakah metode ${fullMethodLabel} dan alat ${finalTool} cocok untuk ide ini?
5. Tingkat Kesulitan & Risiko: Estimasi waktu dan potensi kendala data.

Gaya Bahasa: Santai tapi berbobot, memotivasi, dan inspiratif.`;
        } else {
            return `Act as a Creative & Academic Research Consultant in ${finalField}.

Goal: Help me find fresh and valid research ideas (Brainstorming).

TENTATIVE CONTEXT:
- Interest Topic: ${finalTopic}
- Tentative Method: ${fullMethodLabel}
- ${noveltyInstructions}
- ${problemSection}
${datasetContext}

AVAILABLE DATA:
${detailsFormatted}

YOUR TASK:
Provide 5 POTENTIAL RESEARCH IDEAS. For each option, explain:
1. Title: Engaging & academic.
2. Research Gap: Why is this important? (Connect with Ideal vs Actual gap if provided).
3. Novelty: What differentiates this from other research?
4. Method & Tool Validation: Is ${fullMethodLabel} and tool ${finalTool} suitable for this idea?
5. Difficulty & Risk: Time estimation and potential data hurdles.

Tone: Casual but insightful, motivating, and inspiring.`;
        }
    }

    // --- PROPOSAL MODE ---
    // Build template based on language
    if (language === 'id') {
        return `Bertindaklah sebagai "Strict Methodologist Reviewer" (Dosen Metodologi yang Kritis) di bidang ${finalField}.
        Jangan bertele-tele. Fokus pada akurasi metodologis.

Saya sedang menyusun PROPOSAL PENELITIAN LENGKAP dengan detail berikut:

KONTEKS PENELITIAN:
- Topik: ${finalTopic}
- Metode Utama: ${baseMethodLabel}
- Desain Spesifik: ${subMethod || '-'}
- Alat Analisis: ${finalTool || '-'}
- Mode Pendekatan: ${noveltyMode === 'advanced' ? 'Mutakhir/High Novelty' : 'Standar/Aman'}

${noveltyInstructions}

${problemSection}
${datasetContext}

DETAIL DATA & VARIABEL:
${detailsFormatted}

${styleGuide}

INSTRUKSI PROSES BERPIKIR (Chain-of-Thought):
Sebelum menulis output final, lakukan proses berpikir mendalam dalam blok \`[THOUGHT_PROCESS]\`:
1. Analisis kesesuaian antara Masalah (${sanitizeInput(problem.actual)}) dengan Metode ${fullMethodLabel}.
2. Apakah variabel yang tersedia cukup untuk menjawab rumusan masalah?
3. Kritik apakah gap penelitian cukup kuat?

TUGAS ANDA:
Buatkan outline proposal penelitian (Bab 1-3) yang mencakup:

0. CEK VALIDITAS DATA & ALAT (CRITICAL):
   - Review "Table Structure Snippet". Apakah tipe data memadai?
   - ${finalTool === 'Saran AI'
                ? 'REKOMENDASI ALAT: Pilih software yang PALING EFISIEN. Jika butuh koding (R/Python), sebutkan nama library spesifiknya.'
                : `KOMPATIBILITAS ALAT (STRICT): Pastikan fitur yang disarankan BENAR-BENAR ADA di ${finalTool} versi standar. JANGAN berhalusinasi tentang fitur yang tidak ada.`}
   - Jika ada ketidakcocokan fatal, berikan PERINGATAN KERAS.

1. Judul Penelitian: Buatkan judul yang akademis, spesifik, dan menarik (maksimal 20 kata). Hindari judul klise.

2. Latar Belakang & Masalah:
   - Narasi Gap: Buatkan paragraf latar belakang yang mengontraskan Kondisi Ideal vs Kondisi Aktual di atas.
   - Rumusan Masalah: Turunkan 3-4 pertanyaan penelitian spesifik dari gap tersebut.

3. Detail Metodologi (Sangat Penting):
   - ${isAiMethod ? 'Tentukan desain spesifik dan jelaskan alasannya.' : `Jelaskan alasan pemilihan desain ${subMethod} untuk topik ini.`}
   - TABEL DEFINISI OPERASIONAL: Buat tabel yang memetakan [Nama Variabel] -> [Kolom di Dataset] -> [Skala Data (Nominal/Ordinal/Rasio)] -> [Indikator/Teori Referensi].
   - ${finalTool === 'Saran AI'
                ? 'Jelaskan alasan kenapa Software yang Anda rekomendasikan tadi adalah pilihan terbaik.'
                : `Buatkan langkah operasional penggunaan ${finalTool} untuk analisis data.`}
${methodTasks}

4. Hipotesis/Proposisi (Jika Ada): ${method !== 'qualitative' ? 'Rumuskan hipotesis logis.' : 'Rumuskan proposisi penelitian.'}

5. Landasan Teori (Crucial): 
   - Sarankan Grand Theory yang relevan untuk menghubungkan variabel-variabel di atas.
   - Sebutkan teori pendukung (Middle-range theory) untuk memperkuat argumen logika antar variabel.

CATATAN: Berikan output dalam kanvas yang rapi. Gunakan teks bold untuk poin kunci dan bullet lists untuk detail.`;
    } else {
        return `Act as a "Strict Methodologist Reviewer" in ${finalField}.
        Be critical, precise, and avoid fluff. Focus on methodological accuracy.

I am writing a FULL RESEARCH PROPOSAL with the following details:

RESEARCH CONTEXT:
- Topic: ${finalTopic}
- Main Method: ${baseMethodLabel}
- Specific Design: ${subMethod || '-'}
- Analysis Tool: ${finalTool || '-'}
- Approach Mode: ${noveltyMode === 'advanced' ? 'Advanced/High Novelty' : 'Traditional/Safe'}

${noveltyInstructions}

${problemSection}
${datasetContext}

DATA & VARIABLES:
${detailsFormatted}

${styleGuide}

THINKING PROCESS INSTRUCTION (Chain-of-Thought):
Before writing the final output, you MUST perform a deep thinking process inside a \`[THOUGHT_PROCESS]\` block:
1. Analyze if the Research Gap is logical and strong. If weak, CRITICIZE IT.
2. Check if Variables matches the Method ${fullMethodLabel}.
3. Verify if ${finalTool} is capable of running the analysis.

YOUR TASK:
Create a comprehensive research proposal outline (Chapters 1-3) including:

0. DATA & TOOL FEASIBILITY CHECK (CRITICAL):
   - Review "Table Structure Snippet". Are data types suitable?
   - ${finalTool === 'Saran AI'
                ? 'TOOL RECOMMENDATION: Select the most EFFICIENT software. If code is needed (R/Python), SPECIFY LIBRARIES.'
                : `TOOL COMPATIBILITY (STRICT): Ensure suggested features REALLY EXIST in ${finalTool} standard version. DO NOT hallucinate nonexistent plugins.`}
   - If there is a mismatch, provide a STRONG WARNING. I prefer harsh truth over false hope.

1. Research Title: Create an academic, specific, and engaging title (maximum 20 words). Avoid cliches.

2. Background & Problem:
   - Gap Narrative: Create a background paragraph contrasting the Ideal Condition vs Actual Condition above.
   - Problem Statement: Derive 3-4 specific research questions from that gap.

3. Methodological Details (Crucial):
   - ${isAiMethod ? 'Determine the specific design and justify the choice.' : `Justify the choice of ${subMethod} design for this topic.`}
   - OPERATIONAL DEFINITION TABLE: Create a table mapping [Variable Name] -> [Dataset Column] -> [Data Scale (Nominal/Ordinal/Ratio)] -> [Indicator/Theoretical Reference].
   - ${finalTool === 'Saran AI'
                ? 'Explain why the Software you recommended is the best choice (justify vs others).'
                : `Outline operational steps for using ${finalTool} for data analysis.`}
${methodTasks}

4. Hypotheses/Propositions (If applicable): ${method !== 'qualitative' ? 'Formulate logical hypotheses.' : 'Formulate research propositions.'}

5. Theoretical Framework (Crucial):
   - Suggest a Grand Theory relevant to connecting the variables above.
   - Mention supporting theories (Middle-range) to strengthen the logical arguments between variables.

NOTE: Provide the output in canvas. Use Bold text for key points and bullet lists for details.`;
    }
}
