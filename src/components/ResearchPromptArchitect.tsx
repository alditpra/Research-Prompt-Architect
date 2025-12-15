'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle, GraduationCap, Languages, FileText, Users, BookOpen, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { AppState, FieldType, MethodType } from '@/types';
import { generatePrompt } from '@/lib/logic';
import { METHOD_LABELS, SUB_METHODS, ANALYSIS_TOOLS } from '@/lib/constants';
import { UploadedFile } from '@/types';
import { parseUploadedFile } from '@/lib/fileParser';

const INITIAL_STATE: AppState = {
    language: 'id',
    field: '',
    customField: '',
    topic: '',
    problem: { ideal: '', actual: '' },
    outputMode: 'proposal',
    uploadedFiles: [],
    method: 'quantitative',
    subMethod: '',
    tool: '',
    customTool: '',
    noveltyMode: 'traditional',
    details: {
        qualitative: { informant: '', focus: '' },
        quantitative: { varX: '', varY: '', varZ: '', population: '' },
        secondary: { varX: '', varY: '', varZ: '', source: '', population: '' }
    }
};

const FIELDS: FieldType[] = ['Ekonomi', 'Bisnis Digital', 'Manajemen', 'Akuntansi', 'Teknik Informatika', 'Sistem Informasi', 'Pendidikan', 'Kesehatan', 'Sastra', 'Hukum', 'Lainnya'];

export default function ResearchPromptArchitect() {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newUploadedFiles: UploadedFile[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const sheets = await parseUploadedFile(file);
                newUploadedFiles.push({ fileName: file.name, sheets });
            }

            setState(prev => ({
                ...prev,
                uploadedFiles: [...prev.uploadedFiles, ...newUploadedFiles],
                // Auto-switch to quantitative if qualitative was selected (since dataset implies quant/secondary)
                method: prev.method === 'qualitative' ? 'quantitative' : prev.method,
                // Auto-fill population logic (simple heuristic: take max row count)
                details: {
                    ...prev.details,
                    quantitative: {
                        ...prev.details.quantitative,
                        population: prev.details.quantitative.population || (newUploadedFiles[0]?.sheets[0]?.rowCount ? `Approx. ${newUploadedFiles[0].sheets[0].rowCount} rows (from dataset)` : '')
                    }
                }
            }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Gagal membaca file. Pastikan format .xlsx atau .csv valid.");
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setState(prev => {
            const newFiles = [...prev.uploadedFiles];
            newFiles.splice(index, 1);
            return { ...prev, uploadedFiles: newFiles };
        });
    };

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('research-prompt-architect-v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse saved state', e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        try {
            localStorage.setItem('research-prompt-architect-v2', JSON.stringify(state));
        } catch (e) {
            console.error('LocalStorage save failed:', e);
        }
    }, [state]);

    // Unified State Updater
    const updateState = (key: string, value: any) => {
        // Handle side-effects for Novelty Mode
        if (key === 'noveltyMode' && value === 'advanced') {
            setState(prev => ({
                ...prev,
                [key]: value,
                subMethod: 'Saran AI', // Auto-select AI Design
                tool: 'Saran AI', // Auto-select AI Tool
                customTool: ''
            }));
            return;
        }

        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            setState((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof AppState] as any,
                    [child]: value
                }
            }));
        } else {
            setState((prev) => ({ ...prev, [key]: value }));
        }
    };

    const updateDetail = (method: MethodType, field: string, value: string) => {
        setState(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [method]: {
                    ...prev.details[method],
                    [field]: value
                }
            }
        }));
    };

    const texts = {
        id: {
            title: 'Research Prompt Architect',
            subtitle: (
                <>
                    Perancang instruksi riset akademis berbasis logika by{' '}
                    <a
                        href="https://aldit.pages.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 inline-flex items-center hover:underline"
                    >
                        alditpra
                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </a>
                </>
            ),
            fieldLabel: 'Bidang Studi',
            customFieldLabel: 'Spesifikasikan Bidang Studi',
            customFieldPlaceholder: 'Contoh: Antropologi, Fisika Teoretis...',
            topicLabel: 'Topik Penelitian',
            topicPlaceholder: 'Misal: Pemasaran Digital, Kinerja Karyawan, atau Dampak AI...',
            outputModeLabel: 'Tujuan Output',
            outputModes: {
                brainstorming: 'Cari Ide / Brainstorming',
                proposal: 'Buat Outline Lengkap'
            },
            problemLabel: 'Latar Belakang Masalah (Gap Analysis)',
            problemIdealPlaceholder: 'Kondisi Ideal / Harapan (Das Sollen). Contoh: Target penjualan seharusnya naik 10%...',
            problemActualPlaceholder: 'Kondisi Aktual / Fakta (Das Sein). Contoh: Realisasinya turun 5% selama 3 tahun...',
            problemNote: 'Opsional. Isi keduanya untuk hasil analisis masalah yang tajam.',
            generateBtn: 'Rakit Prompt',
            regenerateBtn: 'Rakit Ulang',
            resetBtn: 'Reset Form',
            generating: 'Merakit instruksi...',
            copyBtn: 'Salin ke Clipboard',
            copied: 'Berhasil disalin!',
            resetConfirm: 'Yakin ingin mengosongkan semua input? Data yang tersimpan akan hilang.',
            resetSuccess: 'Form berhasil direset',
            copyError: 'Gagal menyalin. Silakan select & copy manual.',
            requiredError: 'Field ini wajib diisi',
            methods: {
                qualitative: 'Wawancara (Kualitatif)',
                quantitative: 'Survei (Kuantitatif)',
                secondary: 'Kuantitatif (Sekunder)'
            },
            helpers: {
                informant: 'Siapa narasumber utamanya? misal: Korban Banjir, Preman Pasar, Koruptor',
                focus: 'Apa fenomena/pengalaman unik yang ingin digali?',
                varX: 'Faktor yang mempengaruhi. Misal: Diskon, Beban Kerja, Kualitas Produk',
                varY: 'Yang dipengaruhi. Misal: Keputusan Beli, Stres Kerja, Loyalitas',
                population: 'Siapa yang mengisi kuesioner? Misal: Gen Z Tangerang, Karyawan Bank',
                source: 'Misal: BPS, World Bank, Laporan Tahunan Perusahaan, Data Curah Hujan BMKG',
                year: 'Periode waktu dan subjek. Misal: Perusahaan Manufaktur 2019-2024, Lahan Sawah Jatim 2023'
            },
            inputLabels: {
                informant: 'Informan Kunci',
                focus: 'Fokus Galian',
                varX: 'Variabel X (Sebab)',
                varY: 'Variabel Y (Akibat)',
                population: 'Target Responden',
                source: 'Sumber Data',
                year: 'Periode & Populasi'
            }
        },
        en: {
            title: 'Research Prompt Architect',
            subtitle: (
                <>
                    Logic-based academic research prompt builder by{' '}
                    <a
                        href="https://aldit.pages.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 inline-flex items-center hover:underline"
                    >
                        alditpra
                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </a>
                </>
            ),
            fieldLabel: 'Field of Study',
            customFieldLabel: 'Specify Field of Study',
            customFieldPlaceholder: 'Example: Anthropology, Theoretical Physics...',
            topicLabel: 'Research Topic',
            topicPlaceholder: 'e.g. Digital Marketing, Employee Performance, or AI Impact...',
            outputModeLabel: 'Output Goal',
            outputModes: {
                brainstorming: 'Find Ideas / Brainstorming',
                proposal: 'Create Full Outline'
            },
            problemLabel: 'Background Problem (Gap Analysis)',
            problemIdealPlaceholder: 'Ideal Condition (Expectation). e.g. Sales reflected 10% growth...',
            problemActualPlaceholder: 'Actual Condition (Reality). e.g. Actual sales declined by 5%...',
            problemNote: 'Optional. Fill both for sharp problem analysis.',
            generateBtn: 'Build Prompt',
            regenerateBtn: 'Regenerate',
            resetBtn: 'Reset Form',
            generating: 'Buiding instructions...',
            copyBtn: 'Copy to Clipboard',
            copied: 'Copied successfully!',
            resetConfirm: 'Are you sure you want to clear all inputs? Saved data will be lost.',
            resetSuccess: 'Form reset successfully',
            copyError: 'Copy failed. Please select and copy manually.',
            requiredError: 'This field is required',
            methods: {
                qualitative: 'Interview (Qualitative)',
                quantitative: 'Survey (Quantitative)',
                secondary: 'Quantitative (Secondary)'
            },
            helpers: {
                informant: 'Who is the main source? e.g. flood victims, market thugs, corruptors.',
                focus: 'What unique phenomenon/experience to explore?',
                varX: 'Influencing factor. e.g. Discount, Workload, Product Quality',
                varY: 'The outcome. e.g. Purchase Decision, Job Stress, Loyalty',
                population: 'Who fills the questionnaire? e.g. Gen Z, Bank Employees',
                source: 'e.g. Annual Reports, World Bank Data, Rainfall Data',
                year: 'Time period and subject. e.g. Mfg Companies 2019-2024, Rice Fields 2023'
            },
            inputLabels: {
                informant: 'Key Informant',
                focus: 'Focus of Inquiry',
                varX: 'Variable X (Cause)',
                varY: 'Variable Y (Effect)',
                population: 'Target Respondents',
                source: 'Data Source',
                year: 'Period & Population'
            }
        }
    };

    const t = texts[state.language];

    // Validation Logic
    const getIsFormValid = () => {
        // Basic required fields that define the structure
        if (!state.field) return false;
        if (state.field === 'Lainnya' && !state.customField) return false;
        if (!state.subMethod) return false;
        if (!state.tool) return false;
        if (state.tool === 'Lainnya' && !state.customTool) return false;

        // Topic is required ONLY if no files are uploaded
        // If files are present, Topic can be inferred or optional
        if (state.uploadedFiles.length === 0 && !state.topic) return false;

        // If Data Uploaded, skip detailed manual checks for specific method inputs
        // (Assuming files provide enough context for those details, or they are less critical)
        if (state.uploadedFiles.length > 0) return true;

        if (state.method === 'qualitative') {
            return !!(state.details.qualitative.informant && state.details.qualitative.focus);
        }
        if (state.method === 'quantitative') {
            return !!(state.details.quantitative.population);
        }
        if (state.method === 'secondary') {
            return !!(state.details.secondary.source && state.details.secondary.population);
        }
        return false;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const prompt = generatePrompt(state);
        setGeneratedPrompt(prompt);
        setIsGenerating(false);

        // Smooth scroll
        setTimeout(() => {
            outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleReset = () => {
        if (window.confirm(t.resetConfirm)) {
            setState(INITIAL_STATE);
            localStorage.removeItem('research-prompt-architect-v2');
            setGeneratedPrompt('');
            // Toast logic can be added here
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error(err);
            alert(t.copyError);
        }
    };

    const ErrorMsg = () => <p className="text-sm text-red-600 mt-1">{t.requiredError}</p>;

    // Check valid for UI feedback (only show errors if user tried to submit or field is touched - for now just show if empty and required is standard, but the spec says "inline validation errors near empty required fields" for primary button click flow maybe? 
    // Spec: "Show inline validation errors near empty required fields when: Required field is empty AND user has clicked 'Rakit Prompt' button"
    // Implementing simplified logic here: just use disabled button state as primary blocking mechanism, and maybe visual cues. 
    // Since we don't have a "touched" state tracker for "clicked button", I will rely on the disabled button state for visual feedback primarily, 
    // but if I strictly follow "Show error messages below inputs when ... AND user has clicked", I need a "hasAttemptedSubmit" state.
    // Instead, typically disabled button is enough. The spec requirement "AND user has clicked button" implies the button is NOT disabled? 
    // Re-reading: "Button Enable Conditions (ALL must be true)". So the button IS disabled. 
    // "Show inline validation errors near empty required fields when... user has clicked". Wait, if the button is disabled, they CAN'T click it. 
    // Perhaps the spec means "When fields are touched/dirty". 
    // I will stick to the DISABLED button behavior as it is safer and clearer.
    // I will add the red asterisk to labels.

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <main className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="w-8 h-8 text-indigo-600" />
                            <h1 className="font-bold text-2xl text-gray-900">{t.title}</h1>
                        </div>
                        <p className="text-gray-600">{t.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/converter"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-sm font-medium transition-colors text-indigo-600"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            BPS Converter
                        </Link>
                        <button
                            onClick={() => updateState('language', state.language === 'id' ? 'en' : 'id')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
                            aria-label="Toggle Language"
                        >
                            <Languages className="w-4 h-4" />
                            {state.language === 'id' ? '🇮🇩 IND' : '🇬🇧 ENG'}
                        </button>
                    </div>
                </header>

                {/* Output Mode Selection (Moved to Top) */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        {t.outputModeLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex bg-gray-50 p-1 rounded-lg">
                        <button
                            onClick={() => updateState('outputMode', 'brainstorming')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${state.outputMode === 'brainstorming'
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            ✨ {t.outputModes.brainstorming}
                        </button>
                        <button
                            onClick={() => updateState('outputMode', 'proposal')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${state.outputMode === 'proposal'
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            📄 {t.outputModes.proposal}
                        </button>
                    </div>
                </section>

                {/* Phase 1: Context */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {t.fieldLabel} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={state.field}
                                onChange={(e) => updateState('field', e.target.value as AppState['field'])}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">Select...</option>
                                {FIELDS.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>

                        {state.field === 'Lainnya' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.customFieldLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={state.customField}
                                    onChange={(e) => updateState('customField', e.target.value)}
                                    placeholder={t.customFieldPlaceholder}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                        )}

                        <div className={`space-y-2 ${state.field !== 'Lainnya' ? 'md:col-span-1' : 'md:col-span-2'}`}>
                            {/* Adjust colspan if custom field is not there to balance generic grid if needed, or just let it flow */}
                        </div>
                    </div>

                    {/* Data Source Upload (Integrated) */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">
                                📊
                            </div>
                            <h2 className="font-semibold text-gray-800">
                                {state.language === 'id' ? 'Data Sumber (Opsional misal data survei atau BPS)' : 'Data Source (Optional)'}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors bg-white">
                                <input
                                    type="file"
                                    id="fileUpload"
                                    multiple
                                    accept=".xlsx, .csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <label htmlFor="fileUpload" className="cursor-pointer block">
                                    <p className="text-indigo-600 font-medium text-lg">
                                        {uploading ? 'Scanning data...' : (state.language === 'id' ? 'Klik untuk Upload Excel / CSV' : 'Click to Upload Excel / CSV')}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {state.language === 'id' ? 'AI akan membaca nama kolom & tipe data (Privasi aman, file tidak dikirim ke server)' : 'AI will scan columns & data types (Privacy safe, local processing)'}
                                    </p>
                                </label>
                            </div>

                            {/* File Preview Cards */}
                            {state.uploadedFiles.length > 0 && (
                                <div className="grid gap-3">
                                    {state.uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 text-sm shadow-sm relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">📄</span>
                                                    <span className="font-semibold text-gray-700">{file.fileName}</span>
                                                </div>
                                                <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500">
                                                    🗑️
                                                </button>
                                            </div>
                                            {file.sheets.map((sheet, sIdx) => (
                                                <div key={sIdx} className="ml-8 mb-3 text-xs text-gray-600">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Sheet: {sheet.sheetName}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="font-medium text-emerald-600">{sheet.rowCount} rows</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {sheet.columns.slice(0, 8).map((col, cIdx) => (
                                                            <span key={cIdx} className={`px-2 py-1 rounded-md text-[10px] border ${col.type === 'numeric' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                col.type === 'categorical' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                                }`}>
                                                                {col.name} <span className="opacity-50">({col.type.substr(0, 1).toUpperCase()})</span>
                                                            </span>
                                                        ))}
                                                        {sheet.columns.length > 8 && <span className="px-2 py-1 text-gray-400">+ more</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {t.topicLabel} {state.uploadedFiles.length === 0 ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs font-normal">(Optional by dataset)</span>}
                        </label>
                        <input
                            type="text"
                            value={state.topic}
                            onChange={(e) => updateState('topic', e.target.value)}
                            placeholder={state.uploadedFiles.length > 0 ? (state.language === 'id' ? "(Opsional: Kosongkan untuk saran AI dari data)" : "(Optional: Leave empty for AI suggestion)") : t.topicPlaceholder}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {state.outputMode === 'proposal' && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                {t.problemLabel}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <textarea
                                    value={state.problem.ideal}
                                    onChange={(e) => setState(prev => ({ ...prev, problem: { ...prev.problem, ideal: e.target.value } }))}
                                    placeholder={t.problemIdealPlaceholder}
                                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-gray-900 text-sm"
                                />
                                <textarea
                                    value={state.problem.actual}
                                    onChange={(e) => setState(prev => ({ ...prev, problem: { ...prev.problem, actual: e.target.value } }))}
                                    placeholder={t.problemActualPlaceholder}
                                    className="w-full px-4 py-2 border border-red-200 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-gray-900 text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-500">{t.problemNote}</p>
                        </div>
                    )}
                </section>



                {/* Phase 2: Method Strategy */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div className="flex flex-col sm:flex-row bg-gray-50 p-1 rounded-xl">
                        {[
                            { id: 'qualitative', icon: Users, label: t.methods.qualitative },
                            { id: 'quantitative', icon: FileText, label: t.methods.quantitative },
                            { id: 'secondary', icon: BookOpen, label: t.methods.secondary },
                        ].map((tab) => {
                            const isFilesUploaded = state.uploadedFiles.length > 0;
                            const isDisabled = isFilesUploaded && tab.id === 'qualitative';

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => !isDisabled && updateState('method', tab.id as AppState['method'])}
                                    disabled={isDisabled}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${state.method === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                        : isDisabled
                                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    title={isDisabled ? (state.language === 'id' ? 'Kualitatif tidak tersedia saat mode Data Upload' : 'Qualitative disabled in Data Upload mode') : ''}
                                >
                                    <tab.icon className={`w-4 h-4 ${isDisabled ? 'opacity-50' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub-Method & Tool Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {state.language === 'id' ? 'Desain Spesifik' : 'Specific Design'} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={state.noveltyMode === 'advanced' ? 'Saran AI' : state.subMethod}
                                onChange={(e) => updateState('subMethod', e.target.value)}
                                disabled={state.noveltyMode === 'advanced'}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 ${state.noveltyMode === 'advanced' ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                            >
                                <option value="">{state.language === 'id' ? 'Pilih Desain...' : 'Select Design...'}</option>
                                {SUB_METHODS[state.method][state.language].map((m: string) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            {state.noveltyMode === 'advanced' && (
                                <p className="text-xs text-purple-600">🔒 {state.language === 'id' ? 'Otomatis: Saran AI (Mode Mutakhir)' : 'Auto: AI Recommendation (Advanced Mode)'}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {state.language === 'id' ? 'Alat Analisis' : 'Analysis Tool'} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={state.noveltyMode === 'advanced' ? 'Saran AI' : state.tool}
                                onChange={(e) => updateState('tool', e.target.value)}
                                disabled={state.noveltyMode === 'advanced'}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 ${state.noveltyMode === 'advanced' ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                            >
                                <option value="">{state.language === 'id' ? 'Pilih Software...' : 'Select Software...'}</option>
                                {ANALYSIS_TOOLS[state.method].map((t: string) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {state.noveltyMode === 'advanced' && (
                                <p className="text-xs text-purple-600">🔒 {state.language === 'id' ? 'Otomatis: Saran AI (Mode Mutakhir)' : 'Auto: AI Recommendation (Advanced Mode)'}</p>
                            )}
                        </div>

                        {state.tool === 'Lainnya' && (
                            <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
                                <label className="block text-sm font-medium text-gray-700">
                                    {state.language === 'id' ? 'Sebutkan Alat Analisis' : 'Specify Analysis Tool'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={state.customTool}
                                    onChange={(e) => updateState('customTool', e.target.value)}
                                    placeholder={state.language === 'id' ? 'Contoh: Knime, Orange, Tableau...' : 'e.g. Knime, Orange, Tableau...'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                        )}
                    </div>

                    {/* Novelty Mode Selection */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {state.language === 'id' ? 'Tingkat Kebaruan (Novelty)' : 'Novelty Level'} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => updateState('noveltyMode', 'traditional')}
                                className={`text-left p-4 rounded-xl border transition-all duration-200 ${state.noveltyMode === 'traditional'
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">🛡️</span>
                                    <h4 className={`font-semibold text-sm ${state.noveltyMode === 'traditional' ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {state.language === 'id' ? 'Metode Standar' : 'Traditional Method'}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {state.language === 'id'
                                        ? 'Prioritas metode mapan & teruji. (Tanpa Coding)'
                                        : 'Prioritizes established methods. (No Coding)'}
                                </p>
                            </button>

                            <button
                                onClick={() => updateState('noveltyMode', 'advanced')}
                                className={`text-left p-4 rounded-xl border transition-all duration-200 ${state.noveltyMode === 'advanced'
                                    ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">🚀</span>
                                    <h4 className={`font-semibold text-sm ${state.noveltyMode === 'advanced' ? 'text-purple-800' : 'text-gray-800'}`}>
                                        {state.language === 'id' ? 'Metode Mutakhir' : 'Advanced Method'}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {state.language === 'id'
                                        ? 'Prioritas algoritma state-of-the-art. (Novelty Tinggi)'
                                        : 'Prioritizes state-of-the-art algorithms. (High Novelty)'}
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Data Details OR Auto-Detection Banner */}
                    {state.uploadedFiles.length > 0 ? (
                        // --- AUTO-DETECTION MODE ---
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 flex items-center justify-between gap-4 animate-in fade-in duration-500 mt-6">
                            <div>
                                <h3 className="text-lg font-semibold text-indigo-900 mb-1">
                                    {state.language === 'id' ? '✨ Mode Deteksi Otomatis Aktif' : '✨ Auto-Detection Mode Active'}
                                </h3>
                                <p className="text-indigo-700 text-sm leading-relaxed">
                                    {state.language === 'id'
                                        ? 'Variabel, Populasi, dan Unit Analisis akan diambil otomatis dari file data Anda.'
                                        : 'Variables, Population, and Analysis Units will be automatically extracted from your data files.'}
                                </p>
                            </div>
                            <div className="text-4xl">🤖</div>
                        </div>
                    ) : (
                        // --- MANUAL INPUT MODE ---
                        <div className="grid gap-6 animate-in fade-in duration-300 mt-6 pt-6 border-t border-gray-100">
                            {state.method === 'qualitative' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t.inputLabels.informant} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={state.details.qualitative.informant}
                                            onChange={(e) => updateDetail('qualitative', 'informant', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t.helpers.informant}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t.inputLabels.focus} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={state.details.qualitative.focus}
                                            onChange={(e) => updateDetail('qualitative', 'focus', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t.helpers.focus}</p>
                                    </div>
                                </>
                            )}

                            {state.method === 'quantitative' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t.inputLabels.varX} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.quantitative.varX}
                                                onChange={(e) => updateDetail('quantitative', 'varX', e.target.value)}
                                                placeholder={state.language === 'id' ? "(Biarkan kosong untuk saran AI)" : "(Leave empty for AI suggestion)"}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{t.helpers.varX}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t.inputLabels.varY} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.quantitative.varY}
                                                onChange={(e) => updateDetail('quantitative', 'varY', e.target.value)}
                                                placeholder={state.language === 'id' ? "(Biarkan kosong untuk saran AI)" : "(Leave empty for AI suggestion)"}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{t.helpers.varY}</p>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {state.language === 'id' ? 'Variabel Z (Moderasi/Intervening)' : 'Variable Z (Moderating/Intervening)'} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.quantitative.varZ}
                                                onChange={(e) => updateDetail('quantitative', 'varZ', e.target.value)}
                                                placeholder={state.language === 'id' ? 'Misal: Kepuasan Kerja, Budaya Organisasi' : 'e.g. Job Satisfaction, Org Culture'}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t.inputLabels.population} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={state.details.quantitative.population}
                                            onChange={(e) => updateDetail('quantitative', 'population', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t.helpers.population}</p>
                                    </div>
                                </>
                            )}

                            {state.method === 'secondary' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t.inputLabels.varX} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.secondary.varX}
                                                onChange={(e) => updateDetail('secondary', 'varX', e.target.value)}
                                                placeholder={state.language === 'id' ? "(Biarkan kosong untuk saran AI)" : "(Leave empty for AI suggestion)"}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{state.language === 'id' ? 'Bisa lebih dari satu, pisahkan dengan koma' : 'Can be multiple, separate with comma'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {t.inputLabels.varY} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.secondary.varY}
                                                onChange={(e) => updateDetail('secondary', 'varY', e.target.value)}
                                                placeholder={state.language === 'id' ? "(Biarkan kosong untuk saran AI)" : "(Leave empty for AI suggestion)"}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {state.language === 'id' ? 'Variabel Z (Moderasi/Intervening)' : 'Variable Z (Moderating/Intervening)'} <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={state.details.secondary.varZ}
                                                onChange={(e) => updateDetail('secondary', 'varZ', e.target.value)}
                                                placeholder={state.language === 'id' ? 'Misal: Kebijakan Pemerintah, Teknologi' : 'e.g. Govt Policy, Technology'}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t.inputLabels.source} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={state.details.secondary.source}
                                            onChange={(e) => updateDetail('secondary', 'source', e.target.value)}
                                            placeholder={state.language === 'id' ? "Misal: BPS, Dinas Pertanian" : "e.g. Central Bureau of Statistics"}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t.helpers.source}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t.inputLabels.year} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={state.details.secondary.population}
                                            onChange={(e) => updateDetail('secondary', 'population', e.target.value)}
                                            placeholder={state.language === 'id' ? "Misal: Lahan Sawah di Banyumas 2020-2024" : "e.g. Rice Fields in East Java 2020-2024"}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t.helpers.year}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* Actions */}
                <section className="flex gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={!getIsFormValid() || isGenerating}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isGenerating ? t.generating : (generatedPrompt ? t.regenerateBtn : t.generateBtn)}
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm bg-white"
                    >
                        {t.resetBtn}
                    </button>
                </section>

                {/* Phase 3: Output */}
                {generatedPrompt && (
                    <section ref={outputRef} className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <textarea
                                value={generatedPrompt}
                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                className="w-full h-[400px] p-4 font-mono text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-gray-800"
                            />
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={`flax w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${isCopied
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {isCopied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {isCopied ? t.copied : t.copyBtn}
                        </button>
                    </section>
                )}
            </main>

            {/* Collaboration Footer */}
            <footer className="mt-12 border-t border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-indigo-100 flex flex-col md:flex-row items-center gap-8">
                        {/* Avatar / Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl shadow-inner text-indigo-600">
                                🤝
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-grow text-center md:text-left space-y-3">
                            <h3 className="text-xl font-bold text-indigo-900">
                                {state.language === 'id' ? 'Tawaran Kolaborasi Riset (Gratis)' : 'Open Collaboration Opportunity (Free)'}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {state.language === 'id'
                                    ? 'Stuck dengan data yang rumit? Saya akan kerjakan bagian Analisis Data, Coding, Visualisasi, & Interpretasi (Metode & Hasil) secara GRATIS. Timbal balik: Jadikan saya Penulis Kedua (2nd Author). Anda urus teori, penulisan naskah, submit & biaya. Tapi tergantung levelnya juga sih.'
                                    : 'Stuck with complex data? I will handle Data Analysis, Coding, Visualization, & Interpretation (Method & Result Chapters) for FREE. In exchange: 2nd Authorship. You handle Theory, Writing, Submission & Fees. Depends on the level of the paper.'}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                <a
                                    href="mailto:alditpra@gmail.com"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                >
                                    📧 alditpra@gmail.com
                                </a>
                                <a
                                    href="https://wa.me/628158141112"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg text-sm font-medium text-white hover:bg-green-600 shadow-sm transition-all hover:shadow-green-200"
                                >
                                    💬 WhatsApp Me
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-8 text-gray-400 text-xs">
                        &copy; 2025 Research Prompt Architect by alditpra. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
