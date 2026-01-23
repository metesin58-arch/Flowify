
import React, { useState } from 'react';
import { PlayIcon } from './Icons';
import { adMobService } from '../services/adMobService';

interface AdModalProps {
  title: string;
  rewardText: string;
  onWatch: () => void;
  onCancel: () => void;
  buttonText?: string;
}

export const AdModal: React.FC<AdModalProps> = ({ title, rewardText, onWatch, onCancel, buttonText = "REKLAM İZLE" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchAd = async () => {
      setIsLoading(true);
      
      // GÜNCELLENDİ: Artık 'reklami_baslat' fonksiyonu tetikleniyor.
      const success = await adMobService.reklami_baslat();
      
      setIsLoading(false);

      if (success) {
          onWatch(); // Ödülü ver (Can veya Enerji)
      } else {
          // Reklam yüklenemedi veya kullanıcı kapattı
          alert("Reklam şu anda yüklenemedi. Lütfen internet bağlantını kontrol et veya biraz sonra tekrar dene.");
      }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-blue-900/20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm bg-[#121212] border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-tr from-[#1ed760] to-emerald-600 rounded-full flex items-center justify-center text-white mb-6 shadow-[0_0_30px_rgba(30,215,96,0.3)] animate-bounce">
            <PlayIcon className="w-8 h-8 ml-1" />
        </div>

        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2 uppercase">{title}</h2>
        <p className="text-neutral-300 text-sm font-bold mb-8">
            {rewardText}
        </p>

        {isLoading ? (
            <div className="w-full py-4 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#1ed760] border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">REKLAM YÜKLENİYOR...</span>
            </div>
        ) : (
            <button 
                onClick={handleWatchAd}
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-lg mb-3 flex items-center justify-center gap-2"
            >
                <PlayIcon className="w-3 h-3" />
                {buttonText}
            </button>
        )}

        {!isLoading && (
            <button 
                onClick={onCancel}
                className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors p-2"
            >
                HAYIR, TEŞEKKÜRLER
            </button>
        )}

      </div>
    </div>
  );
};
