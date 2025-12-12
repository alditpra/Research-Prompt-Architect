import { AppState } from '@/types';
import { METHOD_LABELS, METHOD_SPECIFIC_TASKS, STYLE_GUIDE } from './constants';


export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
        .slice(0, 2000); // Prevent extremely long inputs
}

export function formatDetailsForPrompt(method: string, details: AppState['details'], language: 'id' | 'en'): string {
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
            const value = methodDetails[key as keyof typeof methodDetails];
            return `- ${label}: ${sanitizeInput(value)}`;
        })
        .join('\n');
}

export function generatePrompt(state: AppState): string {
    const { language, field, customField, topic, problem, outputMode, method, subMethod, tool, customTool, details } = state;

    // Determine final field
    const finalField = field === 'Lainnya' ? sanitizeInput(customField) : field;

    // Determine final tool
    const finalTool = tool === 'Lainnya' ? sanitizeInput(customTool) : tool;

    // Get style guide
    const styleGuide = STYLE_GUIDE[language];

    // Get method label with Sub-Method
    const baseMethodLabel = METHOD_LABELS[language][method];
    const fullMethodLabel = subMethod ? `${baseMethodLabel} - ${subMethod}` : baseMethodLabel;

    // Format method details
    const detailsFormatted = formatDetailsForPrompt(method, details, language);

    // Get method-specific tasks
    const methodTasks = METHOD_SPECIFIC_TASKS[method][language];

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
- Topik Minat: ${sanitizeInput(topic)}
- Metode Bayangan: ${fullMethodLabel}
- ${problemSection}

DATA YANG TERSEDIA:
${detailsFormatted}

TUGAS ANDA:
Berikan 5 OPSI IDE PENELITIAN yang potensial. Untuk setiap opsi, jelaskan:
1. Judul: Yang menarik & akademis.
2. Research Gap: Kenapa ini penting diteliti? (Hubungkan dengan gap Ideal vs Aktual jika ada).
3. Kebaruan (Novelty): Apa bedanya dengan riset lain?
4. Tingkat Kesulitan: (Mudah/Sedang/Sulit) & Estimasi waktu.

Gaya Bahasa: Santai tapi berbobot, memotivasi, dan inspiratif.`;
        } else {
            return `Act as a Creative & Academic Research Consultant in ${finalField}.

Goal: Help me find fresh and valid research ideas (Brainstorming).

TENTATIVE CONTEXT:
- Interest Topic: ${sanitizeInput(topic)}
- Tentative Method: ${fullMethodLabel}
- ${problemSection}

AVAILABLE DATA:
${detailsFormatted}

YOUR TASK:
Provide 5 POTENTIAL RESEARCH IDEAS. For each option, explain:
1. Title: Engaging & academic.
2. Research Gap: Why is this important? (Connect with Ideal vs Actual gap if provided).
3. Novelty: What differentiates this from other research?
4. Difficulty Level: (Easy/Medium/Hard) & Time estimation.

Tone: Casual but insightful, motivating, and inspiring.`;
        }
    }

    // --- PROPOSAL MODE ---
    // Build template based on language
    if (language === 'id') {
        return `Bertindaklah sebagai Pakar Akademis di bidang ${finalField} dengan spesialisasi metodologi ${fullMethodLabel}.

Saya sedang menyusun PROPOSAL PENELITIAN LENGKAP dengan detail berikut:

KONTEKS PENELITIAN:
- Topik: ${sanitizeInput(topic)}
- Metode Utama: ${baseMethodLabel}
- Desain Spesifik: ${subMethod || '-'}
- Alat Analisis: ${finalTool || '-'}

${problemSection}

DETAIL DATA & VARIABEL:
${detailsFormatted}

${styleGuide}

TUGAS ANDA:
Buatkan outline proposal penelitian (Bab 1-3) yang mencakup:

1. Judul Penelitian: Buatkan judul yang akademis, spesifik, dan menarik (maksimal 20 kata). Hindari judul klise.

2. Latar Belakang & Masalah:
   - Narasi Gap: Buatkan paragraf latar belakang yang mengontraskan Kondisi Ideal vs Kondisi Aktual di atas.
   - Rumusan Masalah: Turunkan 3-4 pertanyaan penelitian spesifik dari gap tersebut.

3. Detail Metodologi (Sangat Penting):
   - Jelaskan alasan pemilihan desain ${subMethod} untuk topik ini.
   - Buatkan langkah operasional penggunaan ${finalTool} untuk analisis data.
${methodTasks}

4. Hipotesis/Proposisi (Jika Ada): ${method !== 'qualitative' && details.quantitative?.varZ ? 'Rumuskan hipotesis yang melibatkan variabel mediasi/moderasi (Z).' : 'Rumuskan dugaan sementara yang logis.'}

5. Referensi Teori: Sebutkan 3-5 teori atau kerangka konseptual yang relevan sebagai landasan penelitian.

CATATAN: Berikan output dalam kanvas yang rapi. Gunakan teks bold untuk poin kunci dan bullet lists untuk detail.`;
    } else {
        return `Act as an Academic Research Expert in ${finalField} specializing in ${fullMethodLabel}.

I am writing a FULL RESEARCH PROPOSAL with the following details:

RESEARCH CONTEXT:
- Topic: ${sanitizeInput(topic)}
- Main Method: ${baseMethodLabel}
- Specific Design: ${subMethod || '-'}
- Analysis Tool: ${finalTool || '-'}

${problemSection}

DATA & VARIABLES:
${detailsFormatted}

${styleGuide}

YOUR TASK:
Create a comprehensive research proposal outline (Chapters 1-3) including:

1. Research Title: Create an academic, specific, and engaging title (maximum 20 words). Avoid cliches.

2. Background & Problem:
   - Gap Narrative: Create a background paragraph contrasting the Ideal Condition vs Actual Condition above.
   - Problem Statement: Derive 3-4 specific research questions from that gap.

3. Methodological Details (Crucial):
   - Justify the choice of ${subMethod} design for this topic.
   - Outline operational steps for using ${finalTool} for data analysis.
${methodTasks}

4. Hypotheses/Propositions (If applicable): ${method !== 'qualitative' ? 'Formulate logical hypotheses.' : 'Formulate research propositions.'}

5. Theoretical Framework: Mention 3-5 relevant theories or conceptual frameworks as the research foundation.

NOTE: Provide the output in canvas. Use Bold text for key points and bullet lists for details.`;
    }
}
