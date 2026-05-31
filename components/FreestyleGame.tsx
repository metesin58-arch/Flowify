
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
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black z-0"></div>

             <div className="z-10 relative mb-8">
                 <div className="absolute inset-0 bg-purple-600/10 blur-[60px] rounded-full"></div>
                 <div className="w-24 h-24 rounded-2xl border border-white/5 flex items-center justify-center mx-auto bg-black/60 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                    <MicIcon className="w-8 h-8 text-purple-400 animate-pulse" />
                 </div>
             </div>

             <h1 className="text-4xl font-black text-white mb-2 z-10 relative tracking-tighter lowercase leading-none">
                 freestyle<br/><span className="text-purple-500">cypher.</span>
             </h1>
             
             <p className="text-neutral-500 mb-8 max-w-xs z-10 relative text-[11px] font-bold lowercase tracking-tight leading-relaxed">
                 2 kişilik offline mod • beat çalar, kelimeler akar • her oyuncuya 20 saniye.
             </p>

             <button 
                onClick={startGame}
                className="z-10 bg-white hover:bg-neutral-100 text-black text-[11px] font-black py-3.5 px-8 rounded-xl hover:scale-105 transition-transform uppercase tracking-tighter"
             >
                KAPIŞMAYI BAŞLAT
             </button>
             
             <button onClick={onExit} className="mt-6 text-neutral-600 z-10 font-bold text-[10px] lowercase tracking-tighter hover:text-white transition-colors">
                 vazgeç
             </button>
        </div>
      );
  }

  if (phase === 'countdown') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black relative font-sans">
              <ExitButton />
              <div className="relative flex items-center justify-center w-36 h-36">
                  <div className="absolute inset-0 rounded-full bg-purple-500/5 border border-purple-500/10 animate-pulse"></div>
                  <div className="text-7xl font-black text-white tracking-tighter select-none">
                      {countdown > 0 ? countdown : 'başla'}
                  </div>
              </div>
              <span className="text-[10px] font-black text-neutral-500 tracking-wider lowercase mt-6">kapışma başlıyor...</span>
          </div>
      );
  }

  if (phase === 'switching') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 text-center relative font-sans">
              <ExitButton />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <div className="w-[400px] h-[400px] border border-purple-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                   <div className="w-[260px] h-[260px] border border-purple-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse] absolute"></div>
              </div>

              <div className="relative z-10">
                  <h2 className="text-3xl font-black text-white mb-2 lowercase tracking-tighter">sıra değişiyor.</h2>
                  <p className="text-[10px] text-purple-500 font-black mb-8 tracking-wider lowercase animate-pulse">cihazı sıradaki rakibe teslim et</p>
                  
                  <button 
                    onClick={startNextPlayer}
                    className="bg-transparent border border-purple-500/30 text-purple-400 font-black py-3 px-8 rounded-xl text-[11px] hover:bg-purple-500 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all lowercase tracking-tighter"
                  >
                      ben hazırım.
                  </button>
              </div>
          </div>
      );
  }

  if (phase === 'finished') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 text-center font-sans">
              <h1 className="text-4xl font-black text-white mb-2 lowercase tracking-tighter">bitti.</h1>
              <p className="text-neutral-500 mb-8 text-[11px] font-bold lowercase tracking-tighter">seyirci kimi daha çok sevdi?</p>
              
              <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button 
                    onClick={() => { setPhase('menu'); }}
                    className="bg-purple-600 text-white font-black py-3.5 rounded-xl hover:scale-105 transition-transform lowercase text-[11px] tracking-tighter"
                  >
                      tekrar oyna.
                  </button>
                  <button 
                    onClick={onExit}
                    className="bg-neutral-900 text-neutral-400 font-bold py-3.5 rounded-xl border border-white/5 hover:bg-neutral-800 lowercase text-[11px] tracking-tighter"
                  >
                      çıkış yap.
                  </button>
              </div>
          </div>
      );
  }

  // PLAYING PHASE (P1 or P2)
  const isP1 = phase === 'p1_turn';
  const accentColor = isP1 ? 'text-purple-400' : 'text-pink-500';
  const bgColor = isP1 ? 'bg-purple-950/5' : 'bg-pink-950/5';
  
  return (
    <div className={`h-full flex flex-col relative overflow-hidden bg-black ${bgColor} font-sans`}>
        <ExitButton />
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
             <div className={`absolute top-[-50%] left-[-20%] w-[500px] h-[500px] ${isP1 ? 'bg-purple-500/5' : 'bg-pink-500/5'} blur-[120px] rounded-full animate-pulse`}></div>
        </div>
        
        {/* Header HUD */}
        <div className="relative z-10 pt-safe p-6 flex justify-between items-end border-b border-white/5 pb-4">
            <div>
                <div className="text-[9px] font-black text-neutral-500 lowercase tracking-tighter mb-1">
                    sıra kimde?
                </div>
                <div className={`text-xl font-black lowercase tracking-tighter ${accentColor}`}>
                    {isP1 ? 'oyuncu 1' : 'oyuncu 2'}
                </div>
            </div>
            <div className="flex items-center text-white font-black text-4xl tracking-tighter leading-none">
                {timeLeft}<span className="text-[10px] text-neutral-500 font-bold ml-1 tracking-tighter">sn</span>
            </div>
        </div>

        {/* Word Display Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
            
            <div className="mb-6 flex gap-1 h-12 items-end">
                 {/* Fake Visualizer */}
                 {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 rounded-t-sm animate-[bounce_0.5s_infinite] ${isP1 ? 'bg-purple-500' : 'bg-pink-500'}`}
                        style={{ 
                            height: `${20 + Math.random() * 80}%`,
                            animationDuration: `${0.3 + Math.random() * 0.4}s`,
                            opacity: 0.6
                        }} 
                    ></div>
                ))}
            </div>

            <div className="text-[9px] font-black text-neutral-500 lowercase tracking-tighter mb-4 border border-white/5 px-3.5 py-1 rounded-full bg-neutral-900/60">
                konu.
            </div>
            
            <div className="relative w-full text-center">
                <h1 
                    key={currentWord} 
                    className="text-5xl md:text-6xl font-black text-white break-all leading-none tracking-tighter animate-[slideIn_0.3s_cubic-bezier(0.2,0.8,0.2,1)] lowercase"
                >
                    {currentWord}
                </h1>
                <div className={`absolute -inset-4 blur-xl opacity-10 ${isP1 ? 'bg-purple-500' : 'bg-pink-500'} -z-10`}></div>
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
