'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, User, Briefcase, MapPin, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const router = useRouter();
  const [tenantState, setTenantState] = useState("Loading...");
  const [username, setUsername] = useState("Loading...");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  
  // New state variables for SSPR form
  const [showResetForm, setShowResetForm] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('naksha_token');
    const state = sessionStorage.getItem('naksha_state');
    
    if (!token || !state) {
        router.push('/login');
        return;
    }
    
    setTenantState(state);
    
    // Quick decode of JWT to get username for the UI
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.sub || "Officer");
    } catch (e) {
        setUsername("Government Officer");
    }
  }, [router]);

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto">
      <header className="px-10 py-8 border-b border-black/5 bg-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold tracking-widest text-[#D97706] mb-1 font-mono uppercase">System Preferences</p>
          <h2 className="text-3xl font-bold text-[#1C1917] font-serif tracking-tight">Profile & Security</h2>
      </header>

      <div className="p-10 max-w-5xl mx-auto space-y-8">
        
        {/* Profile Card */}
        <div id="profile" className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm scroll-mt-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <User className="text-[#14B8A6]" size={20} />
                Identity Profile
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Officer Username</p>
                    <p className="text-lg font-mono text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">{username}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                        <Briefcase size={16} className="text-slate-400" />
                        Verification Magistrate
                    </div>
                </div>
                <div className="col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Jurisdiction</p>
                    <div className="flex items-center gap-2 text-lg font-bold text-[#D97706] bg-[#D97706]/5 px-4 py-3 rounded-lg border border-[#D97706]/20">
                        <MapPin size={18} />
                        Govt. of {tenantState}
                    </div>
                </div>
            </div>
        </div>

        {/* Security & Passkey Card */}
        <div id="passkey" className="bg-white border border-red-500/10 rounded-2xl p-8 shadow-sm scroll-mt-10">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <KeyRound className="text-red-500" size={20} />
                Passkey & Cryptographic Security
            </h3>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6 flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-red-900 text-sm mb-1">Master Passkey Recovery Active</h4>
                    <p className="text-sm text-red-700/80 leading-relaxed">
                        Your account is secured by a 15-character cryptographic passkey. If you lose your password, you must provide this passkey to the Central Admin to regain access to the {tenantState} jurisdiction network.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {!showResetForm ? (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowResetForm(true)}
                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 justify-center"
                        >
                            Change Account Password
                        </button>
                        <button 
                            onClick={() => {
                                setIsVerifying(true);
                                setTimeout(() => {
                                    setIsVerifying(false);
                                    setVerifySuccess(true);
                                    setTimeout(() => setVerifySuccess(false), 4000);
                                }, 2000);
                            }}
                            disabled={isVerifying || verifySuccess}
                            className={`px-6 py-3 border font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 w-64 justify-center
                                ${verifySuccess 
                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        >
                            {isVerifying ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" /> : 
                             verifySuccess ? <><ShieldCheck size={18} /> Cryptographically Verified</> : 
                             <><KeyRound size={18} className="text-green-500" /> Verify Passkey Health</>}
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-lg">
                        <h4 className="font-bold text-slate-800 mb-4">Self-Service Password Reset</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recovery Passkey</label>
                                <input 
                                    type="text" 
                                    value={passkeyInput}
                                    onChange={(e) => setPasskeyInput(e.target.value)}
                                    placeholder="e.g. XXXX-XXXX-XXXX"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D97706]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter secure password"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D97706]/50"
                                />
                            </div>
                            
                            {resetError && <p className="text-sm text-red-500 font-medium">{resetError}</p>}
                            {resetSuccess && <p className="text-sm text-green-600 font-medium flex items-center gap-1"><ShieldCheck size={16}/> Password successfully updated!</p>}

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={async () => {
                                        setIsResetting(true);
                                        setResetError('');
                                        try {
                                            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/reset_password`, {
                                                passkey: passkeyInput,
                                                new_password: newPassword
                                            }, {
                                                headers: { Authorization: `Bearer ${sessionStorage.getItem('naksha_token')}` }
                                            });
                                            setResetSuccess(true);
                                            setPasskeyInput('');
                                            setNewPassword('');
                                            setTimeout(() => {
                                                setResetSuccess(false);
                                                setShowResetForm(false);
                                            }, 3000);
                                        } catch (err: any) {
                                            setResetError(err.response?.data?.detail || "Verification Failed");
                                        } finally {
                                            setIsResetting(false);
                                        }
                                    }}
                                    disabled={isResetting || !passkeyInput || !newPassword}
                                    className="px-6 py-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isResetting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Confirm Reset"}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowResetForm(false);
                                        setResetError('');
                                        setPasskeyInput('');
                                        setNewPassword('');
                                    }}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
