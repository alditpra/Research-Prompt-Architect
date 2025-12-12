export interface AppState {
    language: 'id' | 'en'; // Default: 'id'
    field: 'Ekonomi' | 'Hukum' | 'Teknik Informatika' | 'Pendidikan' | 'Kesehatan' | 'Sastra' | 'Bisnis Digital' | 'Manajemen' | 'Sistem Informasi' | 'Lainnya' | '';
    customField: string; // Only used when field === 'Lainnya'
    topic: string;
    problem: string; // OPTIONAL - never blocks button
    method: 'qualitative' | 'quantitative' | 'secondary'; // Default: 'quantitative'
    details: {
        qualitative: { informant: string; focus: string };
        quantitative: { varX: string; varY: string; population: string };
        secondary: { varX: string; varY: string; source: string; population: string };
    };
}

export type FieldType = AppState['field'];
export type MethodType = AppState['method'];
