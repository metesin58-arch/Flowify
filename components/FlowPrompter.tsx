
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playCountdownTick, playClickSound } from '../services/sfx';

const CHAOS_POOLS = [
  // SEVİYE 1: Klasik Viral (V ve T benzerliği)
  { id: 'classic', words: ['VUR', 'TUR', 'TUT'] },

  // SEVİYE 2: Sesli Harf Tuzağı (A ve E karışır)
  { id: 'vowels', words: ['TAK', 'TEK', 'TOK'] },

  // SEVİYE 3: Sert Ünsüzler (K, S, B birbirine girer)
  { id: 'hard', words: ['KAS', 'BAS', 'KUS'] },

  // SEVİYE 4: Ç Harfi (Diksiyonu en çok zorlayan)
  { id: 'ch_sound', words: ['ÇAK', 'ÇEK', 'ÇOK'] },
  
  // SEVİYE 5: R ve Z (Dil dolandıranlar)
  { id: 'rz_sound', words: ['BAR', 'BAZ', 'BOZ'] }
];

interface FlowPrompterProps {
  onExit: () => void;
}

export const FlowPrompter: React.FC<FlowPrompterProps> = ({ onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [pattern, setPattern] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const timerRef = useRef<any>(null);

  const generatePattern = useCallback(() => {
    // Rastgele bir kaos havuzu seç
    const selectedPool = CHAOS_POOLS[Math.floor(Math.random() * CHAOS_POOLS.length)];
    const newPattern: string[] = [];
    
    // 24'lük kesintisiz dizi oluştur
    for (let i = 0; i < 24; i++) {
        const randomWord = selectedPool.words[Math.floor(Math.random() * selectedPool.words.length)];
        newPattern.push(randomWord);
    }

    setPattern(newPattern);
    setActiveIndex(0);
  }, []);

  // Initial pattern
  useEffect(() => {
    generatePattern();
  }, [generatePattern]);

  // Metronome Loop
  useEffect(() => {
    if (isPlaying) {
        const interval = (60000 / bpm);
        timerRef.current = setInterval(() => {
            setActiveIndex(prev => {
                const next = (prev + 1) % pattern.length;
                // Her adımda ses çal (Artık boşluk yok)
                playCountdownTick();
                return next;
            });
        }, interval);
    } else {
        clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, bpm, pattern]);

  const togglePlay = () => {
    playClickSound();
    setIsPlaying(!isPlaying);
  };

  const handleShuffle = () => {
    playClickSound();
    generatePattern();
  };

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5">
            <div>
                <h1 className="text-xl font-black text-white italic tracking-tighter">FLOW PROMPTER</h1>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}></div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Chaos Engine v2.0</span>
                </div>
            </div>
            <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10">✕</button>
        </div>

        {/* PROMPTER DISPLAY AREA */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden px-10">
            {/* Center Focus Window */}
            <div className="absolute inset-x-0 h-40 border-y border-white/10 bg-white/5 pointer-events-none z-0"></div>
            
            {/* Sliding Words Container */}
            <div 
                className="flex items-center transition-transform duration-200 ease-out gap-10 md:gap-20"
                style={{ transform: `translateX(calc(50% - ${(activeIndex * 140) + 70}px))` }}
            >
                {pattern.map((word, i) => {
                    const isActive = i === activeIndex;
                    return (
                        <div 
                            key={i}
                            className={`min-w-[100px] text-center transition-all duration-150 ${isActive ? 'scale-150 z-20' : 'opacity-20 scale-90 blur-[1px]'}`}
                            style={{ width: '100px' }}
                        >
                            <span className={`text-5xl md:text-7xl font-black italic tracking-tighter ${isActive ? 'text-[#0f0] drop-shadow-[0_0_20px_#0f0]' : 'text-[#444]'}`}>
                                {word}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Vertical Scanline Indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#0f0]/20 z-10 pointer-events-none shadow-[0_0_15px_#0f0]"></div>
        </div>

        {/* CONTROLS AREA */}
        <div className="p-8 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-12 z-20">
            <div className="max-w-md mx-auto space-y-8">
                
                {/* BPM Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">TEMPO / BPM</label>
                        <div className="text-3xl font-mono font-black text-white">{bpm}</div>
                    </div>
                    <input 
                        type="range" min="60" max="180" step="1" 
                        value={bpm} 
                        onChange={(e) => setBpm(parseInt(e.target.value))}
                        className="w-full accent-[#0f0] h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Primary Actions */}
                <div className="flex gap-4">
                    <button 
                        onClick={handleShuffle}
                        className="flex-1 py-4 bg-[#1a1a1a] border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#222] transition-all"
                    >
                        KARIŞTIR 🔀
                    </button>
                    <button 
                        onClick={togglePlay}
                        className={`flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 ${isPlaying ? 'bg-red-600 text-white' : 'bg-[#0f0] text-black shadow-[0_0_25px_rgba(0,255,0,0.3)]'}`}
                    >
                        {isPlaying ? (
                            <>DURDUR ■</>
                        ) : (
                            <>BAŞLAT ▶</>
                        )}
                    </button>
                </div>

                <p className="text-center text-[9px] text-neutral-600 font-bold uppercase tracking-widest">DURAKSAMADAN OKUMAYA ÇALIŞ</p>
            </div>
        </div>
    </div>
  );
};
