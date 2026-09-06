'use client';
import { useEffect, useState } from 'react';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
    const router = useRouter();
    const [grafanaUrl, setGrafanaUrl] = useState<string>('');

    useEffect(() => {
        // Dynamically grab the current Azure VM IP so we don't have to hardcode it!
        // We look for the dashboard UID 'naksha_main'. We will set this UID when we create it in Grafana.
        const currentHost = window.location.hostname;
        setGrafanaUrl(`http://${currentHost}:3001/d/naksha_main/national-analytics?orgId=1&kiosk=tv`);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <header className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                            <BarChart3 size={24} />
                            MINISTRY CONTROL CENTER
                        </h1>
                        <p className="text-xs text-slate-400 font-mono">LIVE NATIONAL TELEMETRY</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 relative">
                {grafanaUrl ? (
                    <iframe 
                        src={grafanaUrl} 
                        className="w-full h-full min-h-[85vh] rounded-xl border border-slate-700 shadow-2xl bg-slate-950"
                        frameBorder="0"
                        title="Grafana Analytics"
                    ></iframe>
                ) : (
                    <div className="w-full h-full min-h-[85vh] flex items-center justify-center text-slate-500">
                        Initializing Secure Telemetry Link...
                    </div>
                )}
            </main>
        </div>
    );
}
