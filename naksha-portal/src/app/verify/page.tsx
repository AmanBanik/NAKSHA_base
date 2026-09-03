'use client';
import { useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle, CheckCircle2, Loader2, QrCode } from 'lucide-react';

export default function Validator() {
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`}/api/records/verify/${hashInput.trim()}`);
      setResult(res.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('Cryptographic hash not found in the national registry. This document may be fraudulent or unregistered.');
      } else {
        setError('An error occurred while verifying the document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center relative p-8">
      {/* Container */}
      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center">
            <h2 className="text-4xl font-bold text-[#1C1917] font-serif tracking-tight mb-4">Public Document Validator</h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              Verify the authenticity of any N.A.K.S.H.A. digitized land record. Enter the 64-character SHA-256 hash or scan the QR code located at the bottom of the modern title deed.
            </p>
        </div>

        {/* Input Box */}
        <form onSubmit={handleVerify} className="backdrop-blur-xl bg-white/60 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-4 flex gap-4 transition-all focus-within:bg-white/80 focus-within:shadow-lg">
            <div className="relative flex-1">
                <QrCode size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                <input 
                  type="text" 
                  placeholder="Enter Cryptographic Hash (e.g. 5a1b3c9...)" 
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border-none bg-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/50 font-mono text-slate-700 placeholder-slate-400 transition-all"
                />
            </div>
            <button 
              type="submit"
              disabled={loading || !hashInput.trim()}
              className="bg-gradient-to-r from-[#0D9488] to-[#059669] hover:from-[#0F766E] hover:to-[#047857] disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                Verify
            </button>
        </form>

        {/* Result Area */}
        {result && (
            <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 border-t-4 border-t-[#84cc16] animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#bef264]/20 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={32} className="text-[#65a30d]" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#1C1917] font-serif">Document Verified</h3>
                        <p className="text-sm font-bold text-[#65a30d] uppercase tracking-widest mt-1">Cryptographic Signature Match</p>
                    </div>
                </div>
                
                <div className="bg-white/50 rounded-2xl border border-black/5 p-6 grid grid-cols-2 gap-y-6 gap-x-8 shadow-sm">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Registration Number</p>
                        <p className="font-mono font-bold text-[#1C1917]">{result.registration_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Primary Holder</p>
                        <p className="font-medium text-[#1C1917]">{result.primary_parties?.[0] || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Area (Acres)</p>
                        <p className="font-mono text-[#1C1917]">{result.acres || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Verification Hash</p>
                        <p className="font-mono text-xs text-[#0D9488] break-all">{result.document_hash}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Error Area */}
        {error && (
            <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 border-t-4 border-t-red-600 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                        <AlertCircle size={32} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#1C1917] font-serif mb-2">Verification Failed</h3>
                        <p className="text-slate-600 leading-relaxed font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
