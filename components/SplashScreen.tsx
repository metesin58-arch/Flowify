
import React, { useEffect, useState } from 'react';

interface Props {
  onFinish: () => void;
  isReady: boolean; // New prop to check if App assets are loaded
}

const LOADING_TEXTS = [
    "Beatler Yükleniyor...",
    "Mikrofon Ayarlanıyor...",
    "Rhyme Defteri Açılıyor...",
    "Stüdyo Işıkları Yakılıyor...",
    "Flow Analiz Ediliyor...",
    "Menajer Aranıyor...",
    "Yeraltı Bağlantıları Kuruluyor..."
];

export const SplashScreen: React.FC<Props> = ({ onFinish, isReady }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);

  useEffect(() => {
    // Artificial progress up to 90%
    // If isReady becomes true, we jump to 100%
    const intervalTime = 30;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        // If app is ready, accelerate to 100
        if (isReady && prev >= 90) {
            return Math.min(100, prev + 2);
        }
        
        // If not ready, cap at 90
        if (!isReady && prev >= 90) {
            return 90;
        }

        // Normal increment
        return Math.min(100, prev + 1);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isReady]);

  // Watch for completion
  useEffect(() => {
      if (progress >= 100) {
          setIsFading(true);
          const timeout = setTimeout(onFinish, 600); // Wait for fade out
          return () => clearTimeout(timeout);
      }
  }, [progress, onFinish]);

  // Text cycler
  useEffect(() => {
    const textInterval = setInterval(() => {
        setLoadingText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    }, 800);
    return () => clearInterval(textInterval);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center w-full max-w-[200px]">
        
        {/* Logo */}
        <div className="w-32 h-32 relative mb-12 animate-pulse">
            <img 
                src="https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png" 
                alt="Flowify" 
                className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            />
        </div>

        {/* Minimal Bar Container */}
        <div className="w-32 h-[3px] bg-[#222] rounded-full overflow-hidden relative mb-3">
            {/* The Filling Bar */}
            <div 
                className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        
        {/* Percentage & Text */}
        <div className="text-center space-y-1">
            <div className="text-[10px] font-black text-white font-mono tracking-widest">
                %{Math.floor(progress)}
            </div>
            <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest h-4 animate-fade-in">
                {loadingText}
            </div>
        </div>

      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[8px] text-neutral-800 font-bold uppercase tracking-[0.3em]">
          FLOWIFY ENGINE v1.0
      </div>
    </div>
  );
};
