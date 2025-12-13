export interface ColumnProfile {
    name: string;
    type: 'numeric' | 'categorical' | 'text' | 'date';
    sampleValues: string;
}

export interface SheetData {
    sheetName: string;
    columns: ColumnProfile[];
    rowCount: number;
    rawPreview: any[][]; // New: Raw snippet for AI context
}

export interface UploadedFile {
    fileName: string;
    sheets: SheetData[];
}

export interface AppState {
    language: 'id' | 'en'; // Default: 'id'
    field: 'Ekonomi' | 'Hukum' | 'Teknik Informatika' | 'Pendidikan' | 'Kesehatan' | 'Sastra' | 'Bisnis Digital' | 'Manajemen' | 'Sistem Informasi' | 'Lainnya' | '';
    customField: string; // Only used when field === 'Lainnya'
    topic: string;
    problem: { ideal: string; actual: string }; // Changed to structured object
    outputMode: 'brainstorming' | 'proposal'; // New: Focus of the output
    uploadedFiles: UploadedFile[]; // New: Data-Driven Research
    method: 'qualitative' | 'quantitative' | 'secondary'; // Default: 'quantitative'
    subMethod: string; // New: Case Study, Correlational, etc.
    tool: string; // New: SPSS, NVivo, etc.
    customTool: string; // Only used when tool === 'Lainnya'
    noveltyMode: 'traditional' | 'advanced'; // New: Determines the "risk/reward" of the method
    details: {
        qualitative: { informant: string; focus: string };
        quantitative: { varX: string; varY: string; varZ: string; population: string };
        secondary: { varX: string; varY: string; varZ: string; source: string; population: string };
    };
}

export type FieldType = AppState['field'];
export type MethodType = AppState['method'];
