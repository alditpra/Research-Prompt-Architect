# Review Lengkap Hasil Prompt Research Prompt Architect (v2 - Optimized)

Dokumen ini merangkum semua kemungkinan variasi prompt yang dihasilkan setelah optimalisasi Chain-of-Thought, Anti-Hallucination, dan Persona Tuning.

---

## Matriks Variasi Prompt

| Dimensi | Opsi | Dampak pada Prompt |
|---------|------|-------------------|
| **Output Mode** | Brainstorming / Proposal | Template berbeda total |
| **Language** | ID / EN | Semua teks diterjemahkan |
| **Method** | Qualitative / Quantitative / Secondary | Method-specific tasks berbeda |
| **Novelty** | Traditional / Advanced | Instruksi prioritas berbeda |
| **Tool** | Saran AI / Spesifik / Lainnya | Instruksi tool compatibility berbeda |
| **Data Source** | Manual / File Upload | Muncul dataset context atau tidak |

**Total kombinasi teoretis**: 2 × 2 × 3 × 2 × 3 × 2 = **144 variasi unik**

---

## Contoh Prompt: Mode Proposal (ID, Quantitative, Advanced, SPSS)

```text
Bertindaklah sebagai "Strict Methodologist Reviewer" (Dosen Metodologi yang Kritis) di bidang Manajemen.
Jangan bertele-tele. Fokus pada akurasi metodologis.

Saya sedang menyusun PROPOSAL PENELITIAN LENGKAP dengan detail berikut:

KONTEKS PENELITIAN:
- Topik: Pengaruh Work-Life Balance terhadap Kinerja Karyawan
- Metode Utama: Survei (Metode Kuantitatif)
- Desain Spesifik: Korelasional
- Alat Analisis: SPSS
- Mode Pendekatan: Mutakhir/High Novelty

INSTRUKSI NOVELTY (MUTAKHIR/ADVANCED): 
- Prioritaskan pendekatan state-of-the-art atau algoritma terbaru.
- Jangan gunakan pendekatan standar yang terlalu umum jika ada alternatif yang lebih tajam.
- Tekankan aspek kebaruan/gap yang unik.

GAP ANALYSIS (MASALAH RISET):
- Kondisi Ideal (Harapan): Produktivitas karyawan meningkat 15% per tahun
- Kondisi Aktual (Fakta): Produktivitas stagnan selama 3 tahun terakhir
- Kesenjangan: Terdapat gap antara harapan dan fakta di atas yang perlu diteliti.

DETAIL DATA & VARIABEL:
- Variabel X (Independen): Work-Life Balance
- Variabel Y (Dependen): Kinerja Karyawan
- Variabel Z (Moderasi/Intervening): Kepuasan Kerja
- Target Responden: Karyawan Tetap Perusahaan Manufaktur Jakarta

PANDUAN GAYA PENULISAN...

INSTRUKSI PROSES BERPIKIR (Chain-of-Thought):
Sebelum menulis output final, lakukan proses berpikir mendalam dalam blok `[THOUGHT_PROCESS]`:
1. Analisis kesesuaian antara Masalah (Produktivitas stagnan...) dengan Metode Survei (Metode Kuantitatif) - Korelasional.
2. Apakah variabel yang tersedia cukup untuk menjawab rumusan masalah?
3. Kritik apakah gap penelitian cukup kuat?

TUGAS ANDA:
Buatkan outline proposal penelitian (Bab 1-3) yang mencakup:

0. CEK VALIDITAS DATA & ALAT (CRITICAL):
   - Review "Table Structure Snippet". Apakah tipe data memadai?
   - KOMPATIBILITAS ALAT (STRICT): Pastikan fitur yang disarankan BENAR-BENAR ADA di SPSS versi standar. JANGAN berhalusinasi tentang fitur yang tidak ada.
   - Jika ada ketidakcocokan fatal, berikan PERINGATAN KERAS.

1. Judul Penelitian: Buatkan judul yang akademis, spesifik, dan menarik (maksimal 20 kata). Hindari judul klise.

2. Latar Belakang & Masalah:
   - Narasi Gap: Buatkan paragraf latar belakang yang mengontraskan Kondisi Ideal vs Kondisi Aktual di atas.
   - Rumusan Masalah: Turunkan 3-4 pertanyaan penelitian spesifik dari gap tersebut.

3. Detail Metodologi (Sangat Penting):
   - Jelaskan alasan pemilihan desain Korelasional untuk topik ini.
   - TABEL DEFINISI OPERASIONAL: Buat tabel yang memetakan [Nama Variabel] -> [Kolom di Dataset] -> [Skala Data] -> [Indikator/Teori Referensi].
   - Buatkan langkah operasional penggunaan SPSS untuk analisis data.

[Method-Specific Tasks untuk Quantitative]:
1. Hipotesis: Rumuskan H0 (hipotesis nol) dan Ha (hipotesis alternatif) yang jelas.
2. Indikator Kuesioner: Buatkan daftar indikator pengukuran untuk setiap variabel beserta skala pengukurannya (Likert/Guttman/dll).
3. Teknik Analisis Statistik: Tentukan metode analisis yang tepat (regresi, korelasi, uji beda, SEM, dll) beserta alasan pemilihannya.

4. Hipotesis/Proposisi (Jika Ada): Rumuskan hipotesis logis.

5. Landasan Teori (Crucial): 
   - Sarankan Grand Theory yang relevan untuk menghubungkan variabel-variabel di atas.
   - Sebutkan teori pendukung (Middle-range theory) untuk memperkuat argumen logika antar variabel.

CATATAN: Berikan output dalam kanvas yang rapi. Gunakan teks bold untuk poin kunci dan bullet lists untuk detail.
```

---

## Contoh Prompt: Mode Brainstorming (EN, Secondary, Traditional)

```text
Act as a Creative & Academic Research Consultant in Economics.

Goal: Help me find fresh and valid research ideas (Brainstorming).

TENTATIVE CONTEXT:
- Interest Topic: Inflation Impact on Poverty
- Tentative Method: Quantitative Secondary (Secondary Data) - Panel Data Regression
- NOVELTY INSTRUCTIONS (STANDARD/TRADITIONAL):
- Use established, time-tested approaches (High Reliability).
- Avoid high-risk experimental methods.
- Focus on rigorous adherence to standard academic verification.
- (User has not defined specific problem. Please help identify crucial Gaps)

AVAILABLE DATA:
- Variable X (Independent): (Please suggest relevant options based on Theory)
- Variable Y (Dependent): (Please suggest relevant options based on Theory)
- Data Source: World Bank, BPS
- Period & Population: Indonesia 2015-2023

YOUR TASK:
Provide 5 POTENTIAL RESEARCH IDEAS. For each option, explain:
1. Title: Engaging & academic.
2. Research Gap: Why is this important? (Connect with Ideal vs Actual gap if provided).
3. Novelty: What differentiates this from other research?
4. Method & Tool Validation: Is Quantitative Secondary (Secondary Data) - Panel Data Regression and tool EViews suitable for this idea?
5. Difficulty & Risk: Time estimation and potential data hurdles.

Tone: Casual but insightful, motivating, and inspiring.
```

---

## Saran Optimalisasi Lanjutan

### ✅ Sudah Diterapkan
1. **Chain-of-Thought (CoT)** - Blok `[THOUGHT_PROCESS]` untuk memaksa AI "berpikir" sebelum menulis.
2. **Anti-Hallucination** - Instruksi `STRICT` dan peringatan keras untuk kompatibilitas tool.
3. **Persona Tuning** - "Strict Methodologist Reviewer" menggantikan persona generik.

### 🔄 Saran Tambahan (Belum Diterapkan)

| # | Saran | Dampak | Kompleksitas |
|---|-------|--------|--------------|
| 1 | **Few-Shot Examples** | Tambahkan 1 contoh output ideal singkat di akhir prompt untuk "prime" AI | Medium |
| 2 | **Output Constraints** | Tambah batasan: "Jawaban MAKSIMAL 1500 kata" atau "Gunakan format Markdown H2/H3" | Easy |
| 3 | **Citation Format** | Minta AI menyebutkan format kutipan (APA 7th) jika menyebut referensi | Easy |
| 4 | **Confidence Indicator** | Minta AI memberikan skor keyakinan 1-10 untuk setiap rekomendasi metodologi | Medium |
| 5 | **Variable Relationship Diagram** | Minta AI menggambar diagram ASCII hubungan X -> Z -> Y | Easy |
| 6 | **Risk Assessment Table** | Minta AI membuat tabel risiko: [Risiko] -> [Probabilitas] -> [Mitigasi] | Medium |

### 🚩 Potensi Masalah yang Perlu Diperhatikan

1. **Prompt Terlalu Panjang**: Dengan semua instruksi, prompt bisa mencapai 1000+ token. Ini bisa:
   - Mengurangi "ruang" untuk output AI
   - Meningkatkan biaya API (jika menggunakan paid models)
   - **Solusi**: Buat mode "Compact" vs "Detailed" di UI

2. **CoT Block Overhead**: Tidak semua model akan menghasilkan `[THOUGHT_PROCESS]` block yang berguna. Beberapa model mungkin skip atau isi asal.
   - **Solusi**: Buat instruksi lebih eksplisit: "Anda WAJIB menulis minimal 50 kata di blok `[THOUGHT_PROCESS]` sebelum melanjutkan."

3. **Strict Persona Bisa Backfire**: Jika gap penelitian memang lemah, AI mungkin terlalu kritis dan tidak memberikan solusi konstruktif.
   - **Solusi**: Tambahkan instruksi: "Jika gap lemah, berikan saran perbaikan gap, bukan hanya kritik."

---

## Rekomendasi Prioritas

1. **Paling Mudah & Berdampak**: Tambahkan **Output Constraints** (batasan panjang + format Markdown).
2. **Jika Ada Waktu**: Tambahkan **Confidence Indicator** agar user tahu seberapa yakin AI dengan rekomendasinya.
3. **Untuk Versi Berikutnya**: Implementasikan **Few-Shot Examples** untuk konsistensi output.

---

Apakah Anda ingin saya menerapkan salah satu saran tambahan di atas?
