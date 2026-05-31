import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { chatWithCharacter } from '../services/geminiService';
import { playClickSound, playWinSound } from '../services/sfx';
import { 
    ArrowLeftIcon, 
    BriefcaseIcon, 
    HeartIcon, 
    MessageCircleIcon, 
    SendIcon 
} from './Icons';


interface Message {
    role: 'user' | 'model';
    text: string;
}

interface MessagingAppProps {
    player: PlayerStats;
    updateMultipleStats: (updates: Partial<PlayerStats>) => void;
    onBack?: () => void;
}

export const MessagingApp: React.FC<MessagingAppProps> = ({ player, updateMultipleStats, onBack }) => {
    const [activeChat, setActiveChat] = useState<'manager' | 'partner' | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const hasManager = player.career.managerTier > 0;
    const hasPartner = !!player.career.partnerName;

    const managerName = player.career.managerName || 'Menajer';
    const partnerName = player.career.partnerName || 'Sevgili';

    const chatHistory = player.career.chatHistory || {};
    const currentHistory = activeChat ? (chatHistory[activeChat] || []) : [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentHistory, activeChat]);

    const handleSendMessage = async () => {
        if (!input.trim() || !activeChat || isLoading) return;

        const userMsg: Message = { role: 'user', text: input };
        const newHistory = [...currentHistory, userMsg];
        
        // Update local state immediately
        const updatedChatHistory = { ...chatHistory, [activeChat]: newHistory };
        updateMultipleStats({ career: { ...player.career, chatHistory: updatedChatHistory } });
        
        setInput('');
        setIsLoading(true);
        playClickSound();

        try {
            const response = await chatWithCharacter(
                activeChat,
                activeChat === 'manager' ? managerName : partnerName,
                player,
                input,
                currentHistory
            );

            const modelMsg: Message = { role: 'model', text: response || 'Bir hata oluştu.' };
            const finalHistory = [...newHistory, modelMsg];
            
            updateMultipleStats({ 
                career: { 
                    ...player.career, 
                    chatHistory: { ...chatHistory, [activeChat]: finalHistory } 
                } 
            });
            playWinSound(); // Subtle notification trigger
        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeChat) {
        return (
            <div className="h-full flex flex-col bg-[#030303] p-6 pt-12 animate-fade-in pb-28">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {onBack && (
                        <button 
                            onClick={onBack} 
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex flex-col text-left">
                        <h2 className="text-2xl font-black text-white tracking-tighter lowercase">mesaj kutum<span className="text-indigo-500">.</span></h2>
                        <span className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight mt-0.5">aktif partner ve temsilci sohbetleri</span>
                    </div>
                </div>

                {/* Conversation rows */}
                <div className="space-y-4">
                    {hasManager && (
                        <button 
                            onClick={() => { playClickSound(); setActiveChat('manager'); }}
                            className="w-full bg-[#0a0a0a]/60 hover:bg-[#111111]/80 transition-all border border-white/5 rounded-3xl p-4.5 flex items-center gap-4 text-left group hover:shadow-2xl duration-200"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform duration-150">
                                <BriefcaseIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-extrabold text-sm lowercase tracking-tight truncate pr-2">{managerName}</span>
                                    <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 shrink-0">menajer</span>
                                </div>
                                <p className="text-neutral-500 text-[10px] font-bold leading-relaxed truncate mt-1 lowercase">
                                    {currentHistory.length > 0 
                                        ? currentHistory[currentHistory.length - 1].text 
                                        : 'kariyerinizi, bütçenizi ve anlaşmaları konuşun.'}
                                </p>
                            </div>
                        </button>
                    )}
                    {hasPartner && (
                        <button 
                            onClick={() => { playClickSound(); setActiveChat('partner'); }}
                            className="w-full bg-[#0a0a0a]/60 hover:bg-[#111111]/80 transition-all border border-white/5 rounded-3xl p-4.5 flex items-center gap-4 text-left group hover:shadow-2xl duration-200"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform duration-150">
                                <HeartIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-extrabold text-sm lowercase tracking-tight truncate pr-2">{partnerName}</span>
                                    <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 shrink-0">sevgili</span>
                                </div>
                                <p className="text-neutral-500 text-[10px] font-bold leading-relaxed truncate mt-1 lowercase">
                                    {currentHistory.length > 0 
                                        ? currentHistory[currentHistory.length - 1].text 
                                        : 'ilişkinizi derinleştirmek için mesaj gönderin.'}
                                </p>
                            </div>
                        </button>
                    )}
                    {!hasManager && !hasPartner && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center text-neutral-500 mb-6 font-semibold animate-pulse-slow">
                                <MessageCircleIcon className="w-5 h-5 text-neutral-600" />
                            </div>
                            <h3 className="text-xs font-black lowercase tracking-widest text-indigo-400 mb-1.5">mesaj kutun boş.</h3>
                            <p className="text-[10px] max-w-[240px] leading-relaxed text-neutral-500 font-medium lowercase">
                                kariyerinde ilerledikçe menajer edinebilir, minder üzerinden yeni insanlarla tanışarak ilişkiler kurabilirsin.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#030303] relative animate-fade-in font-sans">
            {/* Header */}
            <div className="h-20 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center px-4.5 pt-6 gap-3.5 z-20">
                <button 
                    onClick={() => { playClickSound(); setActiveChat(null); }} 
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all shrink-0"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-[#0a0a0a] border-white/5 text-indigo-400">
                    {activeChat === 'manager' ? <BriefcaseIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <div className="text-white font-extrabold text-sm lowercase tracking-tight truncate leading-none mb-1.5">{activeChat === 'manager' ? managerName : partnerName}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]" />
                        <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">çevrimiçi</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-32">
                {currentHistory.map((msg: Message, idx: number) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[80vw] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
                                isUser 
                                    ? 'bg-indigo-500 text-white font-extrabold rounded-tr-none shadow-[0_4px_16px_rgba(99,102,241,0.15)]' 
                                    : 'bg-[#0a0a0a]/95 text-neutral-200 rounded-tl-none border border-white/5'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-[#0a0a0a]/95 px-5 py-3.5 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-6 left-0 w-full px-4 z-20">
                <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/5 focus-within:border-indigo-500/40 rounded-full p-2 flex items-center gap-2 shadow-2xl transition-all duration-150">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="mesaj yaz..."
                        className="flex-1 bg-transparent border-none outline-none px-4 text-xs text-white placeholder-neutral-500 focus:ring-0 lowercase font-medium"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-md shrink-0 border border-white/5"
                    >
                        <SendIcon className="w-4 h-4 text-black" />
                    </button>
                </div>
            </div>
        </div>
    );
};
