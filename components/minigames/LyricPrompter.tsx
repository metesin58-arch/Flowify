import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from '../Icons';
import { motion } from 'motion/react';

interface Props {
  onComplete: (score: number) => void;
}

const LYRIC_POOL = [
  "BURASI ISTANBUL BURDA HERKESIN BIR DERDI VAR",
  "SUSAMAM DEDIM VE BIR SABAH UYANDIM HER SEY AYNI",
  "NEYIM VAR KI RAPTEN GARI BU BIR YOLCULUK",
  "SAVAS COCUKLARI ICIN BARIS HEMEN SIMDI",
  "HAYAT ZOR BIR SINAV VE KOPYA CEKMEK SERBEST DEGIL",
  "GOLGE HARAMILERI BU GECE SEHRI TESLIM ALACAK",
  "BIR PESIMISTIN GOZYASLARI DUSER YERE DAMLA DAMLA",
  "YERLI PLAKA USTUNDE MIKROFON ELIMDE HAZIRIM",
  "BENIMLE DANS ETMEK ISTERSEN RITMI YAKALA",
  "SOKAKLARIN DILI OLSA DA KONUSSA ANLATSA DERDINI",
  "MEDCEZIR GELIR GIDER AKLIMDAKILER HIC BITMEZ",
  "RAPIN OGLU GELDI GERI CEKILIN ONUMDEN",
  "HOLOCAUST GIBI YAKAR GECERIM ALAYINI",
  "BIZIMKISI BIR ASK HIKAYESI DEGIL BIR YASAM MUCADELESI",
  "MIKROFON BENIM SILAHIM KELIMELER MERMIM",
  "KADERINI KENDIN YAZ BASKASININ KALEMIYLE DEGIL"
];

const normalizeText = (text: string) => {
  return text
    .replace(/İ/g, 'I').replace(/ı/g, 'I')
    .replace(/Ö/g, 'O').replace(/ö/g, 'O')
    .replace(/Ü/g, 'U').replace(/ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/ş/g, 'S')
    .replace(/Ç/g, 'C').replace(/ç/g, 'C')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'G')
    .toUpperCase();
};

export const LyricPrompter: React.FC<Props> = ({ onComplete }) => {
  const [targetLyric, setTargetLyric] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(12);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFail, setIsFail] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const random = LYRIC_POOL[Math.floor(Math.random() * LYRIC_POOL.length)];
    setTargetLyric(random);

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 150);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!isSuccess && !isFail && timeLeft === 0) {
      handleFail();
    }
  }, [timeLeft, isSuccess, isFail]);

  const handleFail = () => {
    clearInterval(timerRef.current);
    setIsFail(true);
    setTimeout(() => {
      onComplete(0);
    }, 1500);
  };

  const handleSuccess = () => {
    clearInterval(timerRef.current);
    setIsSuccess(true);
    setTimeout(() => {
      onComplete(100);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSuccess || isFail) return;

    const val = e.target.value.toUpperCase();
    setUserInput(val);

    if (normalizeText(val) === normalizeText(targetLyric)) {
      handleSuccess();
    }
  };

  const keepFocus = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#030303] flex flex-col items-center justify-between p-6 pt-24 font-sans select-none overflow-hidden"
      onClick={keepFocus}
    >
      {/* 1. Black Background & Embedded Low-Opacity Graffiti Graphic Markers */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.06] flex items-center justify-between z-0">
        <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" stroke="currentColor">
          {/* FLOW tag on left */}
          <path d="M80 90 L80 162 M80 90 L144 90 M80 126 L128 126" stroke="#a855f7" strokeWidth="12" strokeLinecap="round" />
          <path d="M176 90 L176 162 L224 162" stroke="#a855f7" strokeWidth="12" strokeLinecap="round" />
          <circle cx="288" cy="126" r="36" stroke="#a855f7" strokeWidth="12" />
          <path d="M352 90 L368 162 L392 120 L416 162 L432 90" stroke="#a855f7" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* RAP tag on right */}
          <path d="M464 240 L464 312 M464 240 Q544 228 544 276 Q544 312 464 312" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
          <path d="M576 312 L616 240 L656 312 M592 282 L640 282" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
          <path d="M688 240 L688 312 M688 240 Q768 228 768 276 Q768 312 688 312" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
          
          {/* Central Crown */}
          <path d="M360 186 L336 210 L400 192 L464 210 L440 186 Z" stroke="#fbbf24" strokeWidth="6" />
        </svg>
      </div>

      {/* 2. Infinite Staggered Camera Flash Strobes in Back crowds */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute w-8 h-8 rounded-full bg-white blur-md opacity-0 animate-[radial_1.5s_infinite_100ms] scale-150 shadow-[0_0_20px_white]" style={{ left: '12%', top: '25%' }} />
        <div className="absolute w-6 h-6 rounded-full bg-white blur-md opacity-0 animate-[radial_1.8s_infinite_500ms] scale-150 shadow-[0_0_20px_white]" style={{ right: '18%', top: '15%' }} />
        <div className="absolute w-10 h-10 rounded-full bg-white blur-md opacity-0 animate-[radial_2s_infinite_900ms] scale-150 shadow-[0_0_20px_white]" style={{ left: '42%', top: '35%' }} />
        <div className="absolute w-7 h-7 rounded-full bg-white blur-md opacity-0 animate-[radial_1.4s_infinite_1200ms] scale-150 shadow-[0_0_20px_white]" style={{ right: '35%', top: '45%' }} />
        <div className="absolute w-9 h-9 rounded-full bg-white blur-md opacity-0 animate-[radial_2.3s_infinite_200ms] scale-150 shadow-[0_0_20px_white]" style={{ left: '25%', top: '48%' }} />
      </div>

      {/* 3. Solid Waving Fan Hands Silhouette at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#0a0a0c] pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[#050507] flex items-end justify-around px-2 opacity-90">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div 
              key={i}
              className="w-1.5 bg-[#050507] rounded-full origin-bottom"
              style={{ height: '32px' }}
              animate={{
                scaleY: [1, 1.4, 1.1, 1.5, 1],
                rotate: [0, i % 2 === 0 ? 10 : -10, 0, i % 2 === 0 ? -10 : 10, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Header telemetry style */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-r from-purple-900/10 via-black to-purple-900/10 border-b border-purple-500/15 flex justify-between items-center z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
          <span className="text-white text-[10px] font-black tracking-widest uppercase">PROMPTER TRANSMISSION ACTIVE</span>
        </div>
        <div className="text-right flex items-center gap-3">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tight">Kalan süre:</span>
          <span className="font-mono font-black text-lg text-purple-400">{timeLeft}s</span>
        </div>
      </div>

      {/* Core instructions */}
      <div className="text-center w-full max-w-md mt-6 relative z-10">
        <span className="text-[9px] font-black text-purple-400 tracking-widest uppercase mb-1 block">SAHNE ODAK TESTİ</span>
        <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none lowercase">sözleri hatırla.</h2>
        <p className="text-neutral-500 text-[10px] uppercase font-bold mt-2 tracking-wider">aşağıdaki cümleyi klavyenle yazarak mikrofonu besle</p>
      </div>

      {/* Giant Teleprompter monitor screen with cyberpunk borders */}
      <div className="w-full max-w-lg bg-neutral-950/80 border border-purple-500/20 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-2 left-3 text-[7px] font-mono text-purple-500 opacity-60">PROMPTER RECT.05</div>
        <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

        {/* Matrix cyber grid */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] z-0 bg-[length:100%_4px]" />

        <div className="relative z-10 text-xl md:text-2xl font-black text-left leading-normal tracking-wide break-words">
          {targetLyric.split('').map((char, index) => {
            let colorClass = "text-white/20";
            if (index < userInput.length) {
              if (normalizeText(userInput[index]) === normalizeText(char)) {
                colorClass = "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
              } else {
                colorClass = "text-rose-500 bg-rose-500/10 rounded px-0.5 border border-rose-500/20";
              }
            }
            return <span key={index} className={`transition-all duration-100 ${colorClass}`}>{char}</span>;
          })}
          <span className="animate-pulse text-purple-400 font-extrabold ml-1">|</span>
        </div>
      </div>

      {/* Input hidden hook */}
      <input 
        ref={inputRef}
        type="text" 
        value={userInput} 
        onChange={handleChange}
        className="opacity-0 absolute top-0 left-0 h-full w-full cursor-default"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Footer tactile status indicator */}
      <div className="mb-8 w-full max-w-xs flex flex-col items-center z-10">
        <div className="flex items-center gap-3 bg-neutral-900/60 border border-white/5 py-3 px-6 rounded-2xl w-full justify-center">
          <MicIcon className="w-4 h-4 text-purple-400" />
          <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase animate-pulse">KLAVYE ETKİN • HEMEN YAZ!</span>
        </div>
      </div>

      {/* Interactive flash status alerts */}
      {isSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-md z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.8, rotate: -4 }}
            animate={{ scale: 1, rotate: -4 }}
            className="bg-emerald-500 text-black font-black text-3xl px-8 py-5 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)] border border-emerald-400"
          >
            🔥 SÜPER AKIŞ!
          </motion.div>
        </div>
      )}

      {isFail && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20 backdrop-blur-md z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.8, rotate: 4 }}
            animate={{ scale: 1, rotate: 4 }}
            className="bg-rose-600 text-white font-black text-3xl px-8 py-5 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] border border-rose-500"
          >
            ☠ SÖZLER KAÇTI!
          </motion.div>
        </div>
      )}
    </div>
  );
};
