'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, FileText, AlertTriangle, Download, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantState, setTenantState] = useState("Loading...");
  const [azureHealth, setAzureHealth] = useState<{status: string, latency: number, msg: string}>({
      status: "loading", latency: 0, msg: "Checking Azure..."
  });

  useEffect(() => {
    // Read JWT Auth State
    const token = sessionStorage.getItem('naksha_token');
    const state = sessionStorage.getItem('naksha_state');
    
    if (!token || !state) {
        router.push('/login');
        return;
    }
    
    setTenantState(state);

    // Fetch live data from our Python backend
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });

    // Azure Real-Time Health Ping
    const pingAzure = () => {
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/health/azure`)
            .then(res => {
                setAzureHealth({
                    status: res.data.status, 
                    latency: res.data.latency_ms, 
                    msg: res.data.message
                });
            })
            .catch(() => setAzureHealth({status: "offline", latency: 0, msg: "Disconnected"}));
    };
    
    pingAzure();
    const interval = setInterval(pingAzure, 300000); // Ping every 5 minutes
    return () => clearInterval(interval);

  }, [router]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-10 py-8 flex justify-between items-end border-b border-black/5 bg-white/30 backdrop-blur-md relative z-10">
          <div>
              <p className="text-sm font-semibold tracking-widest text-[#D97706] mb-1 font-mono uppercase">Jurisdiction Active</p>
              <h2 className="text-3xl font-bold text-[#1C1917] font-serif tracking-tight">Regional Overview: {tenantState}</h2>
          </div>
          <div className="flex items-center space-x-6">
              {/* Dynamic Azure Health Badge */}
              <div className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-2 shadow-sm transition-colors duration-500
                  ${azureHealth.status === 'healthy' ? 'bg-[#14B8A6]/10 text-[#0F766E] border-[#14B8A6]/20' : 
                    azureHealth.status === 'degraded' ? 'bg-amber-100 text-amber-700 border-amber-300' : 
                    azureHealth.status === 'offline' ? 'bg-red-100 text-red-700 border-red-300' : 
                    'bg-slate-100 text-slate-500 border-slate-300'}`}
              >
                  <Cpu size={14} className={azureHealth.status === 'healthy' ? 'text-[#0D9488]' : ''} /> 
                  <div className="flex flex-col">
                      <span>Azure Cloud: {azureHealth.status.toUpperCase()}</span>
                      {azureHealth.latency > 0 && <span className="text-[9px] font-mono opacity-80">{azureHealth.latency}ms • {azureHealth.msg}</span>}
                  </div>
                  {azureHealth.status === 'healthy' && (
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D9488]"></span>
                      </span>
                  )}
              </div>
          </div>
      </header>

      {/* Content Body */}
      <div className="p-10 max-w-7xl mx-auto w-full flex-1">
          
          {/* Metrics Cards - Acrylic Glassmorphism */}
          <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-2xl border-t-2 border-t-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a3e635] to-[#bef264]"></div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} className="text-[#84cc16]" /> Documents Scanned
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                      <p className="font-serif text-5xl font-black text-[#1C1917] tracking-tighter">
                          {loading ? "..." : stats?.metrics?.total_scanned || 0}
                      </p>
                  </div>
              </div>
              
              <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-2xl border-t-2 border-t-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D97706] to-[#FBBF24]"></div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#D97706]" /> Pending Verification
                  </h3>
                  <p className="font-serif text-5xl font-black text-[#1C1917] tracking-tighter mt-4">
                      {loading ? "..." : stats?.metrics?.pending_verification || 0}
                  </p>
              </div>

              <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-2xl border-t-2 border-t-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-rose-400"></div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-600" /> Fraud Alerts
                  </h3>
                  <p className="font-serif text-5xl font-black text-[#1C1917] tracking-tighter mt-4">
                      {loading ? "..." : stats?.metrics?.fraud_alerts || 0}
                  </p>
              </div>
          </div>

          {/* Data Table Section */}
          <div className="backdrop-blur-xl bg-white/60 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl overflow-hidden border-t border-t-white/90">
              
              {/* Toolbar */}
              <div className="px-8 py-5 border-b border-black/5 bg-white/40 flex justify-between items-center">
                  <div className="flex gap-4">
                      <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Search records, names, hashes..." className="pl-9 pr-4 py-2 rounded-xl border border-black/10 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/50 w-72 placeholder-slate-400 font-mono transition-all" />
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 bg-white/50 text-sm font-semibold hover:bg-white text-slate-600 transition-all shadow-sm">
                          <Filter size={16} /> Status: All
                      </button>
                  </div>
                  <button className="bg-gradient-to-r from-[#0D9488] to-[#059669] hover:from-[#0F766E] hover:to-[#047857] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95">
                      <Download size={16} /> Export Report
                  </button>
              </div>

              {/* Table */}
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-black/[0.02] text-[11px] uppercase tracking-wider text-slate-500 border-b border-black/5">
                          <th className="px-8 py-4 font-bold">Reg. No</th>
                          <th className="px-8 py-4 font-bold">Primary Holder</th>
                          <th className="px-8 py-4 font-bold">Area (Acres)</th>
                          <th className="px-8 py-4 font-bold">Status</th>
                          <th className="px-8 py-4 font-bold">Crypto Hash</th>
                          <th className="px-8 py-4 font-bold text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-black/5">
                      
                      {loading && (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading AI database records...</td></tr>
                      )}

                      {!loading && stats?.recent_records?.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-500">No records found. Upload documents via the Bulk Digitization tab.</td></tr>
                      )}

                      {!loading && stats?.recent_records?.map((record: any) => (
                          <tr key={record.id} className="hover:bg-[#D97706]/5 transition-colors duration-200 cursor-pointer group">
                              <td className="px-8 py-5 font-mono text-[#1C1917] font-semibold text-xs tracking-tight">{record.registration_number || 'UNKNOWN'}</td>
                              <td className="px-8 py-5 text-[#1C1917] font-medium">{record.primary_parties && record.primary_parties.length > 0 ? record.primary_parties[0] : 'Not Found'}</td>
                              <td className="px-8 py-5 text-slate-600 font-mono text-xs">{record.acres || '0.00'}</td>
                              <td className="px-8 py-5">
                                  {record.status === 'APPROVED' ? (
                                      <span className="px-2.5 py-1 bg-[#bef264]/20 text-[#4d7c0f] text-[11px] rounded-full border border-[#a3e635]/40 font-bold tracking-wide">Verified</span>
                                  ) : (
                                      <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] text-[11px] rounded-full border border-[#FCD34D] font-bold tracking-wide">AI Pending</span>
                                  )}
                              </td>
                              <td className="px-8 py-5 font-mono text-xs text-slate-400 group-hover:text-[#0D9488] transition-colors">{record.document_hash ? record.document_hash.substring(0, 10) + '...' : 'N/A'}</td>
                              <td className="px-8 py-5 text-right">
                                  {record.status === 'APPROVED' ? (
                                      <button onClick={() => router.push(`/certificate/${record.document_hash}`)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4d7c0f] hover:text-[#3f6212] bg-[#a3e635]/20 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                          View Certificate <ArrowRight size={14} />
                                      </button>
                                  ) : (
                                      <button onClick={() => router.push(`/verify-desk/${record.id}`)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] hover:text-[#B45309] bg-[#FBBF24]/20 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                          Inspect AI <ArrowRight size={14} />
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                      
                  </tbody>
              </table>
          </div>
          
      </div>
    </div>
  );
}
