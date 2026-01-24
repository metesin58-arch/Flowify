
import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, PlayIcon, ClockIcon } from './Icons';

// !!! MÜZİK LİNKİ BURAYA !!!
const GAME_MUSIC_URL = "https://files.catbox.moe/ww3mw8.mp3"; // MP3 Linkinizi buraya yapıştırın

// Türkçe Rap Kültürü Kelime Havuzu
const WORDS = [
  'SOKAK', 'MAHALLE', 'SİLAH', 'PARA', 'SAYGI', 'YERALTI', 'POLİS', 'KARANLIK',
  'BEAT', 'RİTİM', 'KAFİYE', 'MİKROFON', 'SAHNE', 'IŞIKLAR', 'YALAN', 'GERÇEK',
  'DOST', 'DÜŞMAN', 'SAVAŞ', 'BARIŞ', 'GURUR', 'HIRS', 'ŞÖHRET', 'İSTANBUL',
  'ANKARA', 'İZMİR', 'ADANA', 'GETTO', 'SİREN', 'DUMAN', 'HAYAL', 'KABUS',
  'ZAMAN', 'GEÇMİŞ', 'GELECEK', 'KADER', 'YAZGI', 'KAN', 'TER', 'GÖZYAŞI'
];

interface FreestyleGameProps {
  onExit: () => void;
}

type GamePhase = 'menu' | 'countdown' | 'p1_turn' | 'switching' | 'p2_turn' | 'finished';

export const FreestyleGame: React.FC<FreestyleGameProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [timeLeft, setTimeLeft] = useState(20);
  const [currentWord, setCurrentWord] = useState('HAZIRLAN');
  const [countdown, setCountdown] = useState(3);
  
  const wordIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Init
  useEffect(() => {
    // Preload
    audioRef.current = new Audio(GAME_MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      stopAudio(); // Stop only when unmounting (exiting game)
      clearInterval(wordIntervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const playBeat = () => {
    if(audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log("Music blocked", e));
    }
  };

  const stopAudio = () => {
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  const startGame = async () => {
    setPhase('countdown');
    setCountdown(3);
    playBeat(); // Start music at countdown
    
    const countInterval = setInterval(() => {
        setCountdown(prev => {
            if (prev === 1) {
                clearInterval(countInterval);
                startRound('p1_turn');
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const startRound = (roundPhase: 'p1_turn' | 'p2_turn') => {
    setPhase(roundPhase);
    setTimeLeft(20);
    // Music continues playing
    changeWord();

    wordIntervalRef.current = setInterval(changeWord, 4000); 

    timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                endRound(roundPhase);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const changeWord = () => {
    const random = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(random);
  };

  const endRound = (finishedPhase: 'p1_turn' | 'p2_turn') => {
    clearInterval(wordIntervalRef.current);
    clearInterval(timerRef.current);
    // Don't stop audio here!

    if (finishedPhase === 'p1_turn') {
        setPhase('switching');
    } else {
        stopAudio(); // Stop audio only when game finishes
        setPhase('finished');
    }
  };

  const startNextPlayer = () => {
      startRound('p2_turn');
  };

  // --- RENDER ---

  const ExitButton = () => (
      <button 
        onClick={onExit} 
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center text-white/50 border border-white/10 hover:bg-purple-900/50 hover:text-white hover:border-purple-500 transition-all font-bold"
      >
          ✕
      </button>
  );

  if (phase === 'menu') {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-[#050505] text-center relative overflow-hidden font-sans">
             
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] to-black z-0"></div>
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>

             <div className="z-10 relative mb-8">
                 <div className="absolute inset-0 bg-purple-600 blur-[80px] opacity-20 rounded-full"></div>
                 <div className="w-32 h-32 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto bg-black/50 backdrop-blur-md shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                    <MicIcon className="w-12 h-12 text-purple-400" />
                 </div>
             </div>

             <h1 className="text-5xl font-black italic text-white mb-4 z-10 relative tracking-tighter drop-shadow-xl">
                 FREESTYLE<br/><span className="text-purple-500">CYPHER</span>
             </h1>
             
             <p className="text-neutral-500 mb-10 max-w-xs z-10 relative text-xs font-bold uppercase tracking-widest leading-relaxed">
                 2 Kişilik Offline Mod<br/>Beat çalar, kelimeler akar.<br/>Süreniz 20 saniye.
             </p>

             <button 
                onClick={startGame}
                className="z-10 bg-white text-black text-sm font-black py-4 px-12 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)] uppercase tracking-widest border-2 border-transparent hover:border-purple-500"
             >
                KAPIŞMAYI BAŞLAT
             </button>
             
             <button onClick={onExit} className="mt-8 text-neutral-600 z-10 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                 Ana Menüye Dön
             </button>
        </div>
      );
  }

  if (phase === 'countdown') {
      return (
          <div className="h-full flex items-center justify-center bg-black relative">
              <ExitButton />
              <div className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-800 animate-ping">
                  {countdown > 0 ? countdown : 'BAŞLA'}
              </div>
          </div>
      );
  }

  if (phase === 'switching') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 text-center relative">
              <ExitButton />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   <div className="w-[500px] h-[500px] border border-purple-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                   <div className="w-[300px] h-[300px] border border-purple-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse] absolute"></div>
              </div>

              <div className="relative z-10">
                  <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tight">SIRA DEĞİŞİYOR</h2>
                  <p className="text-sm text-purple-500 font-bold mb-10 tracking-[0.3em] animate-pulse">TELEFONU RAKİBE VER</p>
                  
                  <button 
                    onClick={startNextPlayer}
                    className="bg-transparent border-2 border-purple-500 text-purple-500 font-black py-4 px-10 rounded-xl text-sm hover:bg-purple-500 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all uppercase tracking-widest"
                  >
                      BEN HAZIRIM
                  </button>
              </div>
          </div>
      );
  }

  if (phase === 'finished') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 text-center">
              <h1 className="text-6xl font-black text-white mb-4 italic tracking-tighter">BİTTİ!</h1>
              <p className="text-neutral-500 mb-12 text-sm font-bold uppercase tracking-widest">Seyirci kimi daha çok sevdi?</p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={() => { setPhase('menu'); }}
                    className="bg-purple-600 text-white font-black py-4 rounded-xl hover:scale-105 transition-transform uppercase tracking-widest text-xs"
                  >
                      TEKRAR OYNA
                  </button>
                  <button 
                    onClick={onExit}
                    className="bg-neutral-900 text-white font-bold py-4 rounded-xl border border-white/10 hover:bg-neutral-800 uppercase tracking-widest text-xs"
                  >
                      ÇIKIŞ YAP
                  </button>
              </div>
          </div>
      );
  }

  // PLAYING PHASE (P1 or P2)
  const isP1 = phase === 'p1_turn';
  const accentColor = isP1 ? 'text-purple-400' : 'text-pink-500';
  const bgColor = isP1 ? 'bg-purple-900/10' : 'bg-pink-900/10';
  const borderColor = isP1 ? 'border-purple-500' : 'border-pink-500';

  return (
    <div className={`h-full flex flex-col relative overflow-hidden bg-black ${bgColor}`}>
        <ExitButton />
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
             <div className={`absolute top-[-50%] left-[-20%] w-[600px] h-[600px] ${isP1 ? 'bg-purple-500' : 'bg-pink-500'} blur-[150px] opacity-10 rounded-full animate-pulse`}></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
        </div>
        
        {/* Header HUD */}
        <div className="relative z-10 pt-safe p-6 flex justify-between items-end border-b border-white/5 pb-4">
            <div>
                <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isP1 ? 'text-purple-600' : 'text-pink-600'}`}>
                    SIRA KİMDE?
                </div>
                <div className={`text-2xl font-black italic ${accentColor}`}>
                    {isP1 ? 'OYUNCU 1' : 'OYUNCU 2'}
                </div>
            </div>
            <div className="flex items-center text-white font-mono font-bold text-3xl">
                {timeLeft}<span className="text-sm text-neutral-600 ml-1">sn</span>
            </div>
        </div>

        {/* Word Display Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
            
            <div className="mb-8 flex gap-1 h-16 items-end">
                 {/* Fake Visualizer */}
                 {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-2 rounded-t-sm animate-[bounce_0.5s_infinite] ${isP1 ? 'bg-purple-500' : 'bg-pink-500'}`}
                        style={{ 
                            height: `${Math.random() * 100}%`,
                            animationDuration: `${0.3 + Math.random() * 0.4}s`,
                            opacity: 0.5
                        }} 
                    ></div>
                ))}
            </div>

            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.5em] mb-6 border border-white/10 px-4 py-1 rounded-full bg-black/50">
                KONU
            </div>
            
            <div className="relative w-full text-center">
                <h1 
                    key={currentWord} 
                    className="text-6xl md:text-8xl font-black text-white break-all leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-[slideIn_0.3s_cubic-bezier(0.2,0.8,0.2,1)]"
                >
                    {currentWord}
                </h1>
                <div className={`absolute -inset-4 blur-xl opacity-20 ${isP1 ? 'bg-purple-500' : 'bg-pink-500'} -z-10`}></div>
            </div>
            
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-neutral-900 w-full relative z-10">
            <div 
                className={`h-full transition-all duration-1000 linear ${isP1 ? 'bg-purple-500 shadow-[0_0_15px_purple]' : 'bg-pink-500 shadow-[0_0_15px_pink]'}`}
                style={{ width: `${(timeLeft / 20) * 100}%` }}
            ></div>
        </div>
    </div>
  );
};
