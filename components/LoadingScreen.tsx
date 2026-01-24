
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
}

const MESSAGES = [
  "Beatler yükleniyor...",
  "Mikrofon ses ayarı yapılıyor...",
  "Stüdyo ışıkları açılıyor...",
  "Menajer aranıyor...",
  "Rhyme defteri açılıyor...",
  "Flow kontrol ediliyor...",
  "Yeraltı bağlantıları kuruluyor...",
  "Auto-tune ayarlanıyor..."
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
        <div className="mb-12 relative text-center">
            <img 
                src="https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png" 
                alt="Flowify" 
                className="w-32 h-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] opacity-90"
            />
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
        <div className="w-full flex justify-between items-center text-[9px] font-bold tracking-[0.2em] text-neutral-600 uppercase">
            <span className="truncate max-w-[120px]">{message}</span>
            <span className="text-white ml-2">{progress}%</span>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[8px] text-neutral-800 font-bold uppercase tracking-[0.3em]">
          FLOWIFY ENGINE
      </div>
    </div>
  );
};
