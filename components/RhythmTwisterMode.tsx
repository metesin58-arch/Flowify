
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playCountdownTick, playClickSound, playWinSound, playGoSound } from '../services/sfx';
import { SpectrumIcon } from './Icons';

// --- CONFIGURATION ---
const BPM = 180; 
const BEAT_MS = 60000 / BPM; // ~333ms
const INTRO_DELAY_MS = 2600; // 2.6 Saniye (Hızlandırıldı)
const BEAT_LOOP_URL = "https://files.catbox.moe/i8utl5.mp3"; 
const SESSION_LENGTH = 5; // 5 Seviye (Kısaltıldı)

const MASTER_LEVELS = [
  { id: 1, name: "GİRİŞ", pool: ["DOKUZ", "DOMUZ", "OTUZ", "HAVUZ"] },
  { id: 2, name: "A-K UYUMU", pool: ["YATAK", "TABAK", "KABAK", "TARAK"] },
  { id: 3, name: "GÖRSEL TUZAK", pool: ["KUTU", "KUYU", "KOYU", "KORU"] },
  { id: 4, name: "KISA SERİ", pool: ["MASA", "YASA", "KASA", "TASA"] },
  { id: 5, name: "S-Ş KARMAŞASI", pool: ["ŞAKA", "SAKA", "KAKA", "YAKA"] },
  { id: 6, name: "TEK HECELİLER", pool: ["CAM", "ÇAM", "GAM", "DAM"] },
  { id: 7, name: "İ-K UYUMU", pool: ["EZİK", "ÇİZİK", "DİZİK", "BİZİK"] },
  { id: 8, name: "R HARFİ", pool: ["SARI", "DARI", "YARI", "KARI"] },
  { id: 9, name: "ZİHİN YANILTMACA", pool: ["EKMEK", "EKME", "TEKME", "SEKME"] },
  { id: 10, name: "KLASİK VİRAL", pool: ["VUR", "TUR", "TUT", "DUR"] },
  { id: 11, name: "DUDAK TEMBELLİĞİ", pool: ["BABA", "PAPA", "SOPA", "KABA"] },
  { id: 12, name: "L-R AKICILIĞI", pool: ["LALE", "JALE", "KALE", "HALE"] },
  { id: 13, name: "Ş-Ç-K ZORLUĞU", pool: ["ŞİŞE", "ÇİŞE", "KÖŞE", "NEŞE"] },
  { id: 14, name: "Z-R SESTETİ", pool: ["AZI", "BAZI", "RAZI", "YAZI"] },
  { id: 15, name: "M-N NAZAL FİNAL", pool: ["MAMA", "MANA", "NANA", "DANA"] },
  { id: 16, name: "SAYILAR", pool: ["KIRK", "KÜRK", "TÜRK", "ÇARK"] },
  { id: 17, name: "O-Ş UYUMU", pool: ["KOŞ", "COŞ", "BOŞ", "HOŞ"] },
  { id: 18, name: "YUMUŞAK G", pool: ["DAĞ", "BAĞ", "SAĞ", "YAĞ"] },
  { id: 19, name: "Ü-L UYUMU", pool: ["TÜL", "KÜL", "GÜL", "DÜL"] },
  { id: 20, name: "SERT HECE", pool: ["AK", "PAK", "BAK", "ÇAK"] }
];

const FUNNY_ENDINGS = [
    "Eminem seni aradı, telefonu açmadın... Çok hızlıydın!",
    "Dilin düğümlendi mi? Su verelim abime!",
    "Bu hızla konuşursan seni kimse anlamaz ama olsun, şeklin yeter.",
    "Mikrofon eridi, stüdyo yandı. Masrafı kim ödeyecek?",
    "Tebrikler! Artık resmi olarak bir Flow Makinesi'sin.",
    "Ciğerin soldu biliyorum... Ama değdi!",
    "Hız sınırını aştın, radar cezası arkadan gelir.",
    "Nefes almayı unuttun sandık bir an!",
    "Beat sana yetişemedi, o derece..."
];

interface Props {
  onExit: () => void;
}

export const RhythmTwisterMode: React.FC<Props> = ({ onExit }) => {
  // --- VISUAL STATE ---
  const [visualState, setVisualState] = useState({
      visibleCount: 0, 
      activeIdx: -1,   
      words: [] as string[],
      levelName: "HAZIRLAN",
      currentLevelIndex: 0,
      phase: 'IDLE' as 'IDLE' | 'INTRO' | 'REVEAL' | 'HIGHLIGHT' | 'FINISHED'
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameOverMsg, setGameOverMsg] = useState("");
  const [beatPulse, setBeatPulse] = useState(false);

  // --- ENGINE STATE (Refs) ---
  const engineRef = useRef({
      levelQueue: [] as typeof MASTER_LEVELS,
      currentLvlIdx: 0,
      step16: -1, 
      isRunning: false,
      lastTickTime: 0 // Delta time tracking
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0); // requestAnimationFrame ID

  // 1. INIT AUDIO
  useEffect(() => {
    audioRef.current = new Audio(BEAT_LOOP_URL);
    audioRef.current.loop = true; 
    audioRef.current.volume = 0.6;
    audioRef.current.preload = 'auto';
    audioRef.current.load();

    // Initial setup
    const initialPool = MASTER_LEVELS[0].pool;
    const initialWords = Array(8).fill(null).map(() => initialPool[Math.floor(Math.random() * initialPool.length)]);
    setVisualState(prev => ({ ...prev, words: initialWords, levelName: "RİTİM OYUNU" }));

    return () => {
        stopEngine();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  const generateSessionQueue = () => {
      const shuffled = [...MASTER_LEVELS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, SESSION_LENGTH);
  };

  const generateWordsForLevel = (level: typeof MASTER_LEVELS[0]) => {
      const pool = level.pool;
      const newWords: string[] = [];
      for (let i = 0; i < 8; i++) {
          newWords.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      return newWords;
  };

  const startSequence = () => {
      if (engineRef.current.isRunning) return;
      
      playClickSound();
      setVisualState(prev => ({ ...prev, phase: 'INTRO' }));
      
      // 1. Start Audio Immediately
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Audio block", e));
      }

      // 2. Start Visual Countdown 
      setCountdown(3);
      playCountdownTick();
      
      let count = 3;
      // Calculate interval to fit exactly into INTRO_DELAY_MS
      const stepDuration = INTRO_DELAY_MS / 3;

      const countInterval = setInterval(() => {
          count--;
          if (count > 0) {
              setCountdown(count);
              playCountdownTick();
          } else {
              clearInterval(countInterval);
              setCountdown(null);
              startGameLoop(); // Start IMMEDIATELY after countdown ends
          }
      }, stepDuration); 
  };

  const startGameLoop = () => {
      const queue = generateSessionQueue();
      
      // Initialize Engine State
      engineRef.current = {
          levelQueue: queue,
          currentLvlIdx: 0,
          step16: -1, // Will become 0 instantly
          isRunning: true,
          lastTickTime: performance.now()
      };

      const firstLvl = queue[0];
      const words = generateWordsForLevel(firstLvl);
      
      // Force initial visual state immediately
      setVisualState({ 
          words, 
          levelName: firstLvl.name,
          currentLevelIndex: 1, 
          visibleCount: 0, 
          activeIdx: -1, 
          phase: 'REVEAL' 
      });

      // Manually trigger the first tick immediately so there is no delay
      // Reset tick time to now to avoid large delta
      engineRef.current.lastTickTime = performance.now();
      processGameTick(); 

      // Start Game Loop for subsequent ticks
      rafRef.current = requestAnimationFrame(gameLoop);
  };

  // --- 60 FPS LOOP WITH DELTA TIME ---
  const gameLoop = (timestamp: number) => {
      if (!engineRef.current.isRunning) return;

      const elapsed = timestamp - engineRef.current.lastTickTime;

      // Check if enough time has passed for a beat
      if (elapsed >= BEAT_MS) {
          // Compensate for drift
          engineRef.current.lastTickTime = timestamp - (elapsed % BEAT_MS);
          processGameTick();
      }

      rafRef.current = requestAnimationFrame(gameLoop);
  };

  const processGameTick = () => {
      let { step16, currentLvlIdx, levelQueue } = engineRef.current;
      
      // Visual Beat Pulse
      setBeatPulse(true);
      setTimeout(() => setBeatPulse(false), 100);

      step16++;

      // --- CYCLE RESET LOGIC ---
      if (step16 > 15) {
          step16 = 0; 
          currentLvlIdx++;

          if (currentLvlIdx >= levelQueue.length) {
              handleGameFinish();
              return;
          }

          const nextLvl = levelQueue[currentLvlIdx];
          const nextWords = generateWordsForLevel(nextLvl);
          
          engineRef.current.currentLvlIdx = currentLvlIdx;
          
          setVisualState({
              visibleCount: 1, 
              activeIdx: -1,
              words: nextWords,
              levelName: nextLvl.name,
              currentLevelIndex: currentLvlIdx + 1,
              phase: 'REVEAL'
          });
      } 
      else {
          // REVEAL (Steps 0-7)
          if (step16 < 8) {
              setVisualState(prev => ({
                  ...prev,
                  visibleCount: step16 + 1, 
                  activeIdx: -1,
                  phase: 'REVEAL'
              }));
          } 
          // BURN/HIGHLIGHT (Steps 8-15)
          else {
              setVisualState(prev => ({
                  ...prev,
                  visibleCount: 8, 
                  activeIdx: step16 - 8,
                  phase: 'HIGHLIGHT'
              }));
          }
      }

      engineRef.current.step16 = step16;
  };

  const stopEngine = () => {
      engineRef.current.isRunning = false;
      cancelAnimationFrame(rafRef.current);
      setCountdown(null);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
  };

  const handleGameFinish = () => {
      stopEngine();
      playWinSound();
      const randomMsg = FUNNY_ENDINGS[Math.floor(Math.random() * FUNNY_ENDINGS.length)];
      setGameOverMsg(randomMsg);
      setVisualState(prev => ({ ...prev, phase: 'FINISHED' }));
  };

  const handleRestart = () => {
      setVisualState(prev => ({ ...prev, phase: 'IDLE' }));
      startSequence(); 
  };

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans select-none touch-none">
        
        {/* Dynamic Background (GPU Accelerated) */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505]"></div>
            
            <div className={`absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] transition-opacity duration-100 will-change-opacity ${beatPulse ? 'opacity-30' : 'opacity-10'}`}></div>
            <div className={`absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] transition-opacity duration-100 will-change-opacity ${beatPulse ? 'opacity-30' : 'opacity-10'}`}></div>
            
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', 
                     backgroundSize: '40px 40px',
                     transform: 'perspective(500px) rotateX(10deg) scale(1.2)'
                 }}>
            </div>
        </div>
        
        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-start pt-safe-top">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]"></div>
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">RITIM OYUNU</span>
                </div>
                <h1 className={`text-2xl font-black italic tracking-tighter text-white transition-transform duration-100 ${beatPulse ? 'scale-105 text-cyan-200' : ''}`}>
                    {visualState.phase === 'REVEAL' ? 'EZBERLE' : visualState.phase === 'HIGHLIGHT' ? 'OKU!' : 'HAZIRLAN'}
                </h1>
                {visualState.phase !== 'IDLE' && visualState.phase !== 'FINISHED' && (
                    <div className="text-[10px] text-neutral-500 font-bold mt-1 tracking-wide">
                        SEVİYE {visualState.currentLevelIndex} / {SESSION_LENGTH}
                    </div>
                )}
            </div>

            <button 
                onClick={() => { stopEngine(); onExit(); }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform hover:bg-white/10"
            >✕</button>
        </div>

        {/* Visualizer Bar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex gap-1 h-8 items-end opacity-50">
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1.5 rounded-full bg-cyan-500 transition-all duration-75 will-change-transform`} 
                    style={{ 
                        height: beatPulse ? `${40 + Math.random() * 60}%` : '20%',
                        opacity: beatPulse ? 1 : 0.3
                    }}
                ></div>
            ))}
        </div>

        {/* GAME AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative pb-32 z-10">
            
            {/* Countdown Overlay - UPDATED VISUALS */}
            {countdown !== null && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    {/* Fixed clipping issue by adding w-full and text-center, removed tight tracking */}
                    <div className="w-full text-center text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 italic animate-ping drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] leading-none pr-4">
                        {countdown}
                    </div>
                </div>
            )}

            {/* FINISHED OVERLAY */}
            {visualState.phase === 'FINISHED' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-8 text-center animate-fade-in">
                    <SpectrumIcon className="w-20 h-20 text-cyan-400 mb-6 animate-pulse" />
                    <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4">BİTTİ!</h2>
                    <div className="bg-[#111] border border-white/10 p-6 rounded-2xl mb-8 w-full max-w-xs shadow-2xl">
                        <p className="text-neutral-300 text-sm font-medium leading-relaxed">
                            "{gameOverMsg}"
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button 
                            onClick={handleRestart}
                            className="bg-cyan-500 text-black font-black py-4 rounded-xl hover:scale-105 transition-transform uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                        >
                            TEKRAR OYNA ↻
                        </button>
                        <button 
                            onClick={onExit}
                            className="bg-transparent border border-white/20 text-neutral-400 font-bold py-4 rounded-xl hover:text-white hover:border-white transition-colors uppercase tracking-widest text-sm"
                        >
                            ÇIKIŞ
                        </button>
                    </div>
                </div>
            )}

            {/* THE GRID */}
            <div className={`grid grid-cols-2 gap-3 w-full max-w-sm transition-all duration-300 ${visualState.phase === 'IDLE' ? 'opacity-40 grayscale scale-95' : 'opacity-100 scale-100'}`}>
                {visualState.words.map((word, idx) => {
                    const isVisible = idx < visualState.visibleCount;
                    const isActive = idx === visualState.activeIdx;
                    
                    return (
                        <div 
                            key={idx}
                            className={`flex items-center justify-center rounded-2xl border-2 h-20 transition-all duration-100 relative overflow-hidden backdrop-blur-sm ${
                                isActive 
                                ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-[1.03] z-20' 
                                : isVisible
                                    ? 'bg-[#111]/80 border-cyan-900/50'
                                    : 'bg-black/20 border-white/5'
                            }`}
                        >
                            {/* Active Glow BG */}
                            {isActive && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>}

                            <span className={`text-xl md:text-2xl font-black italic tracking-tighter transition-all duration-75 text-center break-all px-2 leading-none w-full ${
                                isActive 
                                ? 'text-cyan-50 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] scale-110' 
                                : isVisible
                                    ? 'text-cyan-100/70'
                                    : 'opacity-0'
                            }`}>
                                {word}
                            </span>
                            
                            <div className={`absolute top-2 left-3 text-[9px] font-mono font-bold ${isActive ? 'text-cyan-300' : 'text-white/20'}`}>
                                0{idx + 1}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* CONTROLS */}
        {visualState.phase === 'IDLE' && (
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/95 to-transparent z-40 flex justify-center">
                <button 
                    onClick={startSequence}
                    className="w-full max-w-sm bg-cyan-400 text-black font-black py-5 rounded-2xl text-lg uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-[1.01] active:scale-95 transition-all border-4 border-transparent hover:border-white/20"
                >
                    BAŞLAT
                </button>
            </div>
        )}

        {/* Active Game Info Footer */}
        {(visualState.phase === 'REVEAL' || visualState.phase === 'HIGHLIGHT') && (
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <div className={`text-[10px] font-black uppercase tracking-[0.5em] transition-colors ${visualState.phase === 'HIGHLIGHT' ? 'text-pink-500 animate-pulse' : 'text-neutral-500'}`}>
                    {visualState.phase === 'REVEAL' ? 'HAFIZAYA AL...' : 'RİTMİ TAKİP ET!'}
                </div>
            </div>
        )}

    </div>
  );
};
