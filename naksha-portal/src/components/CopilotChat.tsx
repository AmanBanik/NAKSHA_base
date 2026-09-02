'use client';
import { useState } from 'react';
import axios from 'axios';
import { Bot, X, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePathname } from 'next/navigation';

export default function CopilotChat() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    if (pathname === '/login') return null;

    const sendMessage = async (e: any) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/chat', { message: userMsg });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to N.A.K.S.H.A. Copilot Backend. Ensure FastAPI is running.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 backdrop-blur-xl bg-white/70 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl flex flex-col overflow-hidden transform transition-all border-t-4 border-t-[#0D9488]">
                    {/* Header */}
                    <div className="bg-[#111827] text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 flex items-center justify-center">
                                <Bot className="text-[#14B8A6]" size={18} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold text-sm text-[#D97706] tracking-wide">N.A.K.S.H.A. Copilot</h4>
                                <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-pulse"></span>
                                    Database Linked
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="h-[350px] overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                                <Bot size={32} className="text-[#14B8A6] mb-3 opacity-50" />
                                <p className="text-slate-600 text-sm font-medium">Ask me anything about the digitized land records.</p>
                                <p className="text-slate-400 text-xs mt-2">Example: &quot;Who owns the largest plot of land?&quot;</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-[#D97706] to-[#B45309] text-white' : 'bg-white border border-black/10 text-[#0F766E]'}`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-[#1C1917] text-white rounded-tr-sm shadow-md' : 'bg-white border border-black/10 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                                    {msg.role === 'user' ? (
                                        msg.text
                                    ) : (
                                        <div className="prose prose-sm prose-slate max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot size={14} className="text-[#0F766E]" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-white border border-black/5 rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-3 border-t border-black/5 bg-white/80 backdrop-blur-md flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Query the database..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/50 text-sm shadow-inner transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={loading || !input.trim()}
                            className="bg-gradient-to-r from-[#0D9488] to-[#059669] text-white p-3 rounded-xl shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Bubble */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-tr from-[#111827] to-[#1F2937] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform group border border-slate-700 relative"
                >
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#84cc16] rounded-full border-2 border-[#111827] animate-pulse"></span>
                    <Bot size={24} className="text-[#14B8A6] group-hover:text-white transition-colors" />
                </button>
            )}
        </div>
    );
}
