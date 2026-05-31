
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
}

const MESSAGES = [
  "beatler yükleniyor...",
  "mikrofon ses ayarı yapılıyor...",
  "stüdyo ışıkları açılıyor...",
  "menajer aranıyor...",
  "rhyme defteri açılıyor...",
  "flow kontrol ediliyor...",
  "yeraltı bağlantıları kuruluyor...",
  "auto-tune ayarlanıyor..."
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      
      {/* Subtle FX only */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[200px] flex flex-col items-center">
        
        {/* Logo Area */}
        <div className="mb-10 text-center select-none">
            <span className="text-white text-3xl font-black tracking-tighter lowercase leading-none">
              flowify<span className="text-[#1DB954]">.</span>
            </span>
        </div>

        {/* Improved Loading Bar */}
        <div className="w-full h-1 bg-[#1a1a1a] relative overflow-hidden mb-3 rounded-full">
            {/* The Bar */}
            <div 
                className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        {/* Minimal Text Info */}
        <div className="w-full flex justify-between items-center text-[10px] font-bold tracking-tight text-neutral-500 lowercase">
            <span className="truncate max-w-[145px]">{message}</span>
            <span className="text-white font-extrabold ml-2">{progress}%</span>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] text-white/60 font-black lowercase tracking-tight">
          flowify engine<span className="text-[#1DB954]">.</span>
      </div>
    </div>
  );
};
