'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { ArrowLeft, CheckCircle, AlertTriangle, FileText, Loader2, Save, Cpu, Map as MapIcon } from 'lucide-react';

const CadastralMap = dynamic(() => import('@/components/CadastralMap'), { ssr: false });

export default function VerifyDesk({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [successHash, setSuccessHash] = useState<string | null>(null);

    // Form states
    const [regNumber, setRegNumber] = useState('');
    const [acres, setAcres] = useState<number>(0);
    const [primaryParty, setPrimaryParty] = useState('');
    
    // GIS Form States
    const [customPolygon, setCustomPolygon] = useState<any>(null);
    const [isMapEditing, setIsMapEditing] = useState(false);
    const [rawCoordsInput, setRawCoordsInput] = useState('');

    useEffect(() => {
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`}/api/records/${params.id}`)
            .then(res => {
                setRecord(res.data);
                setRegNumber(res.data.registration_number || '');
                setAcres(res.data.acres || 0);
                setPrimaryParty(res.data.primary_parties?.[0] || '');
                setCustomPolygon(res.data.geo_polygon);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [params.id]);

    const handleCoordsInput = (val: string) => {
        setRawCoordsInput(val);
        try {
            // E.g. [[88.3639, 22.5726], [88.3640, 22.5727]]
            let parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length >= 3) {
                // Ensure loop is closed
                if (parsed[0][0] !== parsed[parsed.length - 1][0] || parsed[0][1] !== parsed[parsed.length - 1][1]) {
                    parsed.push(parsed[0]);
                }
                setCustomPolygon({
                    type: "Polygon",
                    coordinates: [parsed]
                });
            }
        } catch(e) {
            // Invalid JSON, ignore
        }
    }

    const handleApprove = async () => {
        setApproving(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`}/api/records/${params.id}/approve`, {
                registration_number: regNumber,
                acres: acres,
                primary_parties: [primaryParty],
                geo_polygon: customPolygon
            });
            setSuccessHash(res.data.hash);
            setTimeout(() => router.push('/'), 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to approve record.");
        } finally {
            setApproving(false);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#D97706]" size={40} /></div>;
    if (!record) return <div className="flex-1 flex items-center justify-center text-red-500">Record not found.</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header */}
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Human Verification Desk</h1>
                        <p className="text-xs text-slate-500 font-mono">Record ID: {record.id} | AI Confidence: {record.ai_confidence || 'N/A'}</p>
                    </div>
                </div>
                {successHash ? (
                    <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle size={18} /> Approved! Hash: {successHash}
                    </div>
                ) : (
                    <button 
                        onClick={handleApprove}
                        disabled={approving}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-green-600/20 transition-all flex items-center gap-2"
                    >
                        {approving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Approve & Mint Hash
                    </button>
                )}
            </header>

            {/* Split Screen Workspace */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Left Side: Document Viewer (Simulated) */}
                <div className="w-1/2 border-r border-slate-200 bg-slate-100 p-6 overflow-y-auto flex flex-col">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Original Scanned Document</h2>
                    <div className="flex-1 bg-white border border-slate-300 shadow-sm rounded-lg p-8 relative">
                        {/* Since we don't store the actual image blob in DB yet, we simulate the OCR text overlay for the demo */}
                        <div className="absolute top-0 right-0 bg-[#D97706] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
                            AI OCR RECONSTRUCTION
                        </div>
                        <pre className="whitespace-pre-wrap font-serif text-slate-700 text-sm leading-relaxed mt-4">
                            {record.raw_ocr_text || "No OCR Text available."}
                        </pre>
                    </div>
                </div>

                {/* Right Side: Human Editable Form */}
                <div className="w-1/2 p-6 overflow-y-auto bg-white">
                    <div className="flex items-center gap-2 mb-6">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest"><Cpu size={16} className="inline mr-1 text-teal-600"/> AI Extraction Results</h2>
                        {record.ai_confidence && record.ai_confidence < 90 && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 font-bold">
                                <AlertTriangle size={12}/> Low Confidence ({record.ai_confidence})
                            </span>
                        )}
                    </div>
                    
                    <div className="space-y-6 max-w-lg">
                        
                        {/* Form Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Registration Number</label>
                            <input 
                                type="text" 
                                value={regNumber} 
                                onChange={(e) => setRegNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
                            />
                        </div>

                        {/* Form Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Party / Owner Name</label>
                            <input 
                                type="text" 
                                value={primaryParty} 
                                onChange={(e) => setPrimaryParty(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                            />
                        </div>

                        {/* Form Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Area (Acres)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={acres} 
                                onChange={(e) => setAcres(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
                            />
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-8">
                            <h4 className="text-sm font-bold text-blue-900 mb-1">Human-in-the-Loop Process</h4>
                            <p className="text-xs text-blue-800/80 leading-relaxed">
                                Review the AI-extracted fields above against the original document on the left. Correct any misinterpretations. Clicking &quot;Approve&quot; will permanently encode these values into a cryptographic SHA-256 hash.
                            </p>
                        </div>
                        
                        {/* GIS Mapping Block */}
                        <div className="mt-8 mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <MapIcon size={16} className="text-emerald-600"/> Cadastral Boundary
                                </h2>
                                <button 
                                    onClick={() => {
                                        setIsMapEditing(!isMapEditing);
                                        if(!isMapEditing) setCustomPolygon(null); // Clear map for new drawing
                                    }}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isMapEditing ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {isMapEditing ? 'Stop Drawing' : '✏️ Draw Map'}
                                </button>
                            </div>

                            {/* Manual Coordinate Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 mb-1">Manual Input: High-Precision Survey Array [[lng, lat]]</label>
                                <textarea
                                    value={rawCoordsInput}
                                    onChange={(e) => handleCoordsInput(e.target.value)}
                                    placeholder="e.g. [[88.363, 22.572], [88.364, 22.573], ...]"
                                    className="w-full h-12 text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            <CadastralMap 
                                geoJsonPolygon={customPolygon} 
                                isEditing={isMapEditing} 
                                onPolygonChange={setCustomPolygon}
                            />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
