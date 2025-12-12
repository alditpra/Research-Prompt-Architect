export const STYLE_GUIDE = {
    en: `STYLE GUIDE (Write in a scholarly but authentically human style):
1. STRUCTURE: Vary sentence length naturally. Allow occasional awkward transitions (use "However", "In addition" but not always smoothly). Let arguments develop organically.
2. LANGUAGE: Mix formal academic phrases with slightly more casual scholarly language. Use hedging language realistically ("suggests that", "appears to").
3. IMPERFECTIONS: Allow minor grammatical variations. Use "this" or "these" without always clarifying the antecedent immediately.
4. AVOID AI PATTERNS: Do NOT use perfect parallel structures or pristine three-part lists. Avoid overused AI phrases like "delve into", "multifaceted", "paradigm shift", "holistic approach".
5. AUTHENTICITY: Show thinking process, not just polished conclusions. Write as a knowledgeable researcher drafting a paper, NOT an AI trying to sound academic.`,

    id: `PANDUAN GAYA PENULISAN (Tulis dengan gaya akademis yang manusiawi & autentik):
1. STRUKTUR: Variasikan panjang kalimat secara alami (campur kalimat kompleks dan pendek). Biarkan ada transisi yang sedikit kaku atau kurang mulus antar ide.
2. BAHASA: Campurkan istilah akademis formal dengan bahasa ilmiah yang sedikit lebih santai. Gunakan kata-kata yang tidak terlalu kaku/baku layaknya robot.
3. KETIDAKSEMPURNAAN: Jangan membuat struktur paragraf yang terlalu simetris. Gunakan kata tunjuk seperti "hal ini" atau "tersebut" secara natural tanpa selalu menjelaskan rujukannya.
4. HINDARI POLA AI: JANGAN gunakan daftar tiga poin yang terlalu rapi. Hindari frasa klise AI seperti "menyelami secara mendalam", "ranah yang komprehensif", "pergeseran paradigma".
5. AUTENTISITAS: Tulis seolah-olah Anda adalah dosen/peneliti yang sedang membuat draft kasar, bukan AI yang berusaha terdengar pintar. Tunjukkan alur berpikir, bukan hanya kesimpulan yang terpoles sempurna.`
};

export const METHOD_LABELS = {
    en: {
        qualitative: 'Interview (Qualitative Method)',
        quantitative: 'Survey (Quantitative Method)',
        secondary: 'Quantitative Secondary (Secondary Data)'
    },
    id: {
        qualitative: 'Wawancara (Metode Kualitatif)',
        quantitative: 'Survei (Metode Kuantitatif)',
        secondary: 'Kuantitatif Sekunder (Data Sekunder)'
    }
};

export const METHOD_SPECIFIC_TASKS = {
    qualitative: {
        id: `1. Draft Pedoman Wawancara: Buatkan minimal 10 pertanyaan eksploratif yang mendalam untuk menggali pengalaman/perspektif informan.
2. Grand Theory: Identifikasi dan jelaskan teori besar yang relevan sebagai landasan analisis.
3. Teknik Analisis: Jelaskan saran metode analisis data atau algoritma yang akan digunakan.`,

        en: `1. Interview Guide Draft: Create at least 10 exploratory questions to deeply explore informant experiences/perspectives.
2. Grand Theory: Identify and explain relevant grand theory as the analytical foundation.
3. Analysis Technique: Describe the suggested method or algorithm for analyzing the data.`
    },

    quantitative: {
        id: `1. Hipotesis: Rumuskan H0 (hipotesis nol) dan Ha (hipotesis alternatif) yang jelas.
2. Indikator Kuesioner: Buatkan daftar indikator pengukuran untuk setiap variabel beserta skala pengukurannya (Likert/Guttman/dll).
3. Teknik Analisis Statistik: Tentukan metode analisis yang tepat (regresi, korelasi, uji beda, SEM, dll) beserta alasan pemilihannya.`,

        en: `1. Hypotheses: Formulate clear H0 (null hypothesis) and Ha (alternative hypothesis).
2. Questionnaire Indicators: Create a list of measurement indicators for each variable with their measurement scales (Likert/Guttman/etc).
3. Statistical Analysis Technique: Determine appropriate analysis methods (regression, correlation, difference test, SEM, etc) with reasoning.`
    },

    secondary: {
        id: `1. Pra-Analisis Data: Jelaskan rencana uji prasyarat (Uji Normalitas, Uji Stasioneritas untuk time series, dll).
2. Uji Asumsi Klasik: Rincikan uji yang relevan (Multikolinearitas, Heteroskedastisitas, Autokorelasi).
3. Teknik Analisis: Tentukan jenis regresi yang tepat (Regresi Data Panel, Berganda, atau Path Analysis) sesuai struktur data.`,

        en: `1. Data Pre-Analysis: Explain prerequisite tests (Normality Test, Stationarity Test for time series, etc).
2. Classical Assumption Tests: Detail relevant tests (Multicollinearity, Heteroscedasticity, Autocorrelation).
3. Analysis Technique: Determine appropriate regression type (Panel Data, Multiple Regression, or Path Analysis) based on data structure.`
    }
};
