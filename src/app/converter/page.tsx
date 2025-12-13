import BPSConverter from '@/components/BPSConverter';

export const metadata = {
    title: 'BPS Data Converter - Research Prompt Architect',
    description: 'Konversi file Excel/CSV dari BPS menjadi format rapi dengan satu baris header',
};

export default function ConverterPage() {
    return <BPSConverter />;
}
