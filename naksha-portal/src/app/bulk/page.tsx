'use client';
import { useState } from 'react';
import { UploadCloud, File, CheckCircle, XCircle, ArrowRight, Loader2, Cpu } from 'lucide-react';
import axios from 'axios';

export default function BulkDigitization() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<any[]>([]);

  const handleDrop = (e: any) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Send to FastAPI Celery Worker
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/extract/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // The API immediately returns task IDs while it processes in the background
      const newTasks = res.data.tasks.map((id: string) => ({ id, status: 'PROCESSING' }));
      setTaskStatus(newTasks);
      setFiles([]); // Clear the visual queue
      
      // Normally we would set up WebSockets to track celery task completion in real-time.
      // For this hackathon UI, we will simulate the UI updating to 'COMPLETED' after a few seconds.
      setTimeout(() => {
          setTaskStatus(newTasks.map((t:any) => ({...t, status: 'COMPLETED'})));
          setUploading(false);
      }, 5000);

    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-10 py-8 flex justify-between items-end border-b border-black/5 bg-white/30 backdrop-blur-md relative z-10">
          <div>
              <p className="text-sm font-semibold tracking-widest text-[#D97706] mb-1 font-mono uppercase">Ingestion Engine</p>
              <h2 className="text-3xl font-bold text-[#1C1917] font-serif tracking-tight">Bulk Digitization Node</h2>
          </div>
      </header>

      <div className="p-10 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-8">
          
          {/* Acrylic Dropzone */}
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="backdrop-blur-xl bg-white/40 border-2 border-dashed border-[#14B8A6]/40 rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all hover:bg-white/60 hover:border-[#14B8A6] cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
              <div className="w-20 h-20 bg-[#14B8A6]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <UploadCloud size={40} className="text-[#0D9488]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] font-serif mb-2">Drag & Drop Legacy Archives</h3>
              <p className="text-slate-500 mb-6 max-w-md">Drop high-resolution TIFF, JPG, or PDF scans of land records here. The AI will automatically denoise, deskew, and extract metadata.</p>
              
              <label className="bg-gradient-to-r from-[#1C1917] to-[#292524] hover:from-black hover:to-[#1C1917] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-black/10 transition-all cursor-pointer hover:scale-105 active:scale-95">
                  Browse Local Files
                  <input type="file" multiple className="hidden" onChange={(e) => {
                      if(e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                  }} />
              </label>
          </div>

          {/* Queue List */}
          {files.length > 0 && (
              <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 border-t-2 border-t-white">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-[#1C1917]">Queued for Neural Extraction ({files.length})</h3>
                      <button 
                        onClick={handleProcess}
                        disabled={uploading}
                        className="bg-gradient-to-r from-[#D97706] to-[#B45309] hover:opacity-90 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                      >
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                          {uploading ? "Initializing Models..." : "Commence Extraction"}
                      </button>
                  </div>
                  <div className="space-y-3">
                      {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/50 border border-black/5 rounded-xl transition-all hover:bg-white">
                              <div className="flex items-center gap-3">
                                  <File size={20} className="text-slate-400" />
                                  <span className="font-medium text-sm text-[#1C1917]">{f.name}</span>
                              </div>
                              <span className="text-xs font-mono text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Processing Tasks (Celery Status) */}
          {taskStatus.length > 0 && (
              <div className="backdrop-blur-md bg-[#FDFBF7]/90 border border-[#14B8A6]/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 border-t-2 border-t-[#14B8A6] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-[#1C1917] mb-6 flex items-center gap-2">
                    <Cpu size={18} className="text-[#0D9488]" /> Active Celery Workers
                  </h3>
                  <div className="space-y-4">
                      {taskStatus.map((task, i) => (
                          <div key={i} className="p-4 bg-white/60 border border-black/5 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  {task.status === 'PROCESSING' ? (
                                      <Loader2 size={20} className="text-[#D97706] animate-spin" />
                                  ) : (
                                      <CheckCircle size={20} className="text-[#84cc16]" />
                                  )}
                                  <div>
                                      <p className="text-sm font-bold text-[#1C1917]">Task ID: {task.id.substring(0,12)}...</p>
                                      <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">{task.status}</p>
                                  </div>
                              </div>
                              {task.status === 'PROCESSING' && (
                                  <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-[#D97706] to-[#FBBF24] w-2/3 animate-pulse"></div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
      </div>
    </div>
  );
}
