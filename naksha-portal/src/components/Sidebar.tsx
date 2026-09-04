'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UploadCloud, ShieldCheck, LogOut, ChevronUp, KeyRound } from "lucide-react";
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [tenantState, setTenantState] = useState("Loading...");

  useEffect(() => {
    const savedState = sessionStorage.getItem('naksha_state');
    if (savedState) {
      setTenantState(`Govt. of ${savedState}`);
    } else {
      setTenantState("Unauthorized");
    }
  }, [pathname]);

  const navItems = [
    { name: "Magistrate Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Bulk Digitization", href: "/bulk", icon: UploadCloud },
    { name: "Public Validator", href: "/verify", icon: ShieldCheck },
  ];

  if (pathname === '/login') return null;

  const handleLogout = () => {
    sessionStorage.removeItem('naksha_token');
    sessionStorage.removeItem('naksha_state');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-[#111827]/95 backdrop-blur-xl border-r border-white/10 text-white flex flex-col shadow-2xl z-20 shrink-0 relative">
        <div className="p-6 border-b border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <h1 className="font-serif text-3xl font-bold tracking-wider text-[#D97706] drop-shadow-md">N.A.K.S.H.A.</h1>
            <div className="mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse shadow-[0_0_8px_#84cc16]"></span>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Central Node</p>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                    <Link 
                        key={item.name} 
                        href={item.href} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all shadow-sm ${
                            isActive 
                            ? 'bg-white/10 text-white font-semibold border-l-2 border-[#84cc16] shadow-inner hover:bg-white/20' 
                            : 'hover:bg-white/5 text-slate-400 border-l-2 border-transparent hover:border-white/20 hover:text-slate-200'
                        }`}
                    >
                        <Icon size={18} className={isActive ? "text-[#84cc16]" : ""} />
                        <span>{item.name}</span>
                    </Link>
                )
            })}
        </nav>
        <div className="p-4 m-4 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col items-center justify-center backdrop-blur-sm relative group cursor-pointer transition-all">
            
            {/* Sliding Profile Menu */}
            <div className="absolute bottom-full left-0 w-full pb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50">
                <div className="bg-[#1C1917] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                    <Link href="/settings" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
                        <ShieldCheck size={14} className="text-[#14B8A6]" />
                        <span>Profile & Security</span>
                    </Link>
                    <div className="w-full h-[1px] bg-white/10 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                        <LogOut size={14} />
                        <span>Secure Log Out</span>
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mb-2 tracking-widest uppercase flex items-center gap-1 transition-colors">
              Jurisdiction 
            </p>
            <div className="px-3 py-1 bg-[#1F2937] rounded-full border border-white/5 shadow-inner w-full overflow-hidden text-ellipsis whitespace-nowrap group-hover:border-white/20 transition-colors flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 truncate">{tenantState}</span>
                <ChevronUp size={12} className="text-slate-500 shrink-0 ml-1" />
            </div>
        </div>
    </aside>
  );
}
