'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Download, CheckCircle, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function DigitalPropertyCard({ params }: { params: { hash: string } }) {
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://naksha-6bytes.koreacentral.cloudapp.azure.com:8000'}/api/records/hash/${params.hash}`)
            .then(res => {
                setRecord(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [params.hash]);

    if (loading) return <div className="flex-1 flex items-center justify-center h-screen"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
    if (!record) return <div className="flex-1 flex items-center justify-center h-screen text-red-500 font-bold">Invalid Document Hash. Record not found.</div>;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://naksha-6bytes.koreacentral.cloudapp.azure.com:3000/certificate/${params.hash}`;

    return (
        <div className="min-h-screen bg-slate-100 p-8 flex justify-center items-start print:bg-white print:p-0">
            <div className="max-w-3xl w-full bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
                
                {/* Certificate Header */}
                <div className="bg-emerald-900 text-white p-8 text-center border-b-[8px] border-emerald-500">
                    <img src="/images/emblem.png" alt="Gov" className="h-16 mx-auto mb-4 opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    <h1 className="text-3xl font-serif font-bold uppercase tracking-widest">Digitized Property Card</h1>
                    <p className="text-emerald-300 font-mono text-sm mt-2">Government of {record.state_jurisdiction || 'India'}</p>
                </div>

                {/* Certificate Body */}
                <div className="p-10 relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <ShieldCheck size={400} />
                    </div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cryptographic Hash</p>
                            <p className="text-lg font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                                {record.document_hash}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-emerald-600 text-xs font-bold">
                                <CheckCircle size={14} /> Immutable Record Minted
                            </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scan to Verify</p>
                            <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                                <img src={qrUrl} alt="QR Code" className="w-24 h-24" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building size={14}/> Registration Number</p>
                                <p className="text-xl font-bold text-slate-800">{record.registration_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Owner(s)</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {record.primary_parties && record.primary_parties.length > 0 ? record.primary_parties.join(', ') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Area</p>
                                <p className="text-lg font-bold text-slate-800">{record.acres} <span className="text-sm font-normal text-slate-500">Acres</span></p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={14}/> GIS Status</p>
                                {record.geo_polygon ? (
                                    <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm font-bold border border-teal-200">
                                        <CheckCircle size={14}/> Georeferenced
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-bold border border-amber-200">
                                        Unmapped
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Issuance Date</p>
                                <p className="text-md font-medium text-slate-700">{new Date(record.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Confidence Score</p>
                                <p className="text-md font-medium text-slate-700">{record.ai_confidence ? `${record.ai_confidence}%` : 'Manual Override'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center print:hidden">
                    <p className="text-xs text-slate-400 font-medium">This document is cryptographically secured on the NAKSHA platform.</p>
                    <button 
                        onClick={() => window.print()} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2 text-sm"
                    >
                        <Download size={16} /> Print / Save PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
