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
            id: { varX: 'Variabel X (Independen)', varY: 'Variabel Y (Dependen)', population: 'Target Responden' },
            en: { varX: 'Variable X (Independent)', varY: 'Variable Y (Dependent)', population: 'Target Respondents' }
        },
        secondary: {
            id: { source: 'Sumber Data', year: 'Periode Waktu' },
            en: { source: 'Data Source', year: 'Time Period' }
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
    const { language, field, customField, topic, problem, method, details } = state;

    // Determine final field
    const finalField = field === 'Lainnya' ? sanitizeInput(customField) : field;

    // Get style guide
    const styleGuide = STYLE_GUIDE[language];

    // Get method label
    const methodLabel = METHOD_LABELS[language][method];

    // Format method details
    const detailsFormatted = formatDetailsForPrompt(method, details, language);

    // Determine problem section
    const problemSection = problem.trim()
        ? sanitizeInput(problem)
        : (language === 'id'
            ? '(Belum ditentukan, mohon saran opsi research gap yang krusial dan relevan)'
            : '(Undecided, please suggest crucial and relevant research gap options)');

    // Get method-specific tasks
    const methodTasks = METHOD_SPECIFIC_TASKS[method][language];

    // Build template based on language
    if (language === 'id') {
        return `Bertindaklah sebagai Pakar Akademis di bidang ${finalField}.

Saya sedang menyusun penelitian dengan detail berikut:

KONTEKS PENELITIAN:
- Topik: ${sanitizeInput(topic)}
- Masalah Utama: ${problemSection}
- Metode: ${methodLabel}

DETAIL DATA:
${detailsFormatted}

${styleGuide}

TUGAS ANDA:
Buatkan outline proposal penelitian yang mencakup:

1. Judul Penelitian: Buatkan judul yang akademis, spesifik, dan menarik (maksimal 20 kata).

2. ${problem.trim() ? 'Rumusan Masalah: Buatkan 3-4 pertanyaan penelitian yang tajam dan fokus untuk menjawab masalah di atas.' : 'Identifikasi Masalah: Berikan 3 opsi Research Gap yang potensial dan krusial di bidang ini, lalu pilih salah satu opsi terbaik dan buatkan rumusan masalahnya dalam bentuk 3-4 pertanyaan penelitian.'}

3. Detail Metodologi:
${methodTasks}

4. Referensi Teori: Sebutkan 3-5 teori atau kerangka konseptual yang relevan sebagai landasan penelitian.

CATATAN: Berikan output dalam kanvas yang rapi. Gunakan teks bold untuk poin kunci dan bullet lists untuk detail.`;
    } else {
        return `Act as an Academic Research Expert in ${finalField}.

I am writing a research proposal with the following details:

RESEARCH CONTEXT:
- Topic: ${sanitizeInput(topic)}
- Main Problem/Gap: ${problemSection}
- Method: ${methodLabel}

DATA DETAILS:
${detailsFormatted}

${styleGuide}

YOUR TASK:
Create a comprehensive research proposal outline including:

1. Research Title: Create an academic, specific, and engaging title (maximum 20 words).

2. ${problem.trim() ? 'Problem Statement: Formulate 3-4 sharp and focused research questions to address the problem above.' : 'Problem Identification: Suggest 3 potential and crucial Research Gaps in this field, then select the best option and formulate its problem statement in 3-4 research questions.'}

3. Methodological Details:
${methodTasks}

4. Theoretical Framework: Mention 3-5 relevant theories or conceptual frameworks as the research foundation.

NOTE: Provide the output in canvas. Use Bold text for key points and bullet lists for details.`;
    }
}
