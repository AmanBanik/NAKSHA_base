'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Lock, User, KeyRound, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send login request to FastAPI Auth Gateway
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/login`, {
        username: username,
        password: password
      });

      // Save the JWT token and Tenant State to LocalStorage
      localStorage.setItem('naksha_token', res.data.access_token);
      localStorage.setItem('naksha_state', res.data.state_jurisdiction);

      // Redirect to the Central Dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Secure connection dropped.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center relative bg-[#1C1917] overflow-hidden -mt-10">
        {/* Deep Ambient Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D97706]/20 blur-[150px] rounded-full mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0D9488]/20 blur-[150px] rounded-full mix-blend-screen"></div>
        </div>

        <div className="z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#D97706]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(217,119,6,0.3)]">
                    <Lock size={32} className="text-[#D97706]" />
                </div>
                <h1 className="text-4xl font-serif font-bold text-white tracking-widest drop-shadow-lg mb-2">N.A.K.S.H.A.</h1>
                <p className="text-[#14B8A6] font-mono tracking-widest text-xs uppercase shadow-sm">Multi-Tenant Secure Gateway</p>
            </div>

            {/* Login Card */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D97706] to-transparent opacity-50"></div>
                
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div className="relative">
                        <ShieldAlert size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                            required
                            defaultValue=""
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/50 transition-all font-medium appearance-none cursor-pointer overflow-y-auto max-h-48"
                        >
                            <option value="" disabled>Select Government Jurisdiction</option>
                            {[
                                "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
                                "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
                                "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
                                "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
                                "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
                            ].map(state => (
                                <option key={state} value={state} className="bg-[#1C1917] text-white py-2">Govt. of {state}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            required
                            placeholder="Officer Username (e.g. amit24101995)" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/50 transition-all font-medium placeholder-slate-500"
                        />
                    </div>

                    <div className="relative">
                        <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="password" 
                            required
                            placeholder="Secure Passphrase" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/50 transition-all font-medium placeholder-slate-500"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 flex items-start gap-3">
                            <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200 font-medium">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading || !username || !password}
                        className="mt-4 w-full bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D97706] text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                Authenticate Identity <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-center text-slate-500 text-xs font-mono mt-8 uppercase tracking-widest opacity-60">
                Unauthorized access is strictly prohibited under the National Data Security Act.
            </p>
        </div>
    </div>
  );
}
