
import React from 'react';
import { TrophyIcon, SkullIcon } from './Icons';

interface GameOverScreenProps {
  score: number;
  earnedListeners?: number; // Optional now, mainly score focus
  totalListeners?: number;
  onContinue: () => void;
  gameName?: string;
  isWin?: boolean;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onContinue, gameName = "OYUN BİTTİ", isWin }) => {
  
  // Logic: Generally if score > 0 it's not a total loss in Arcade, but we can style based on magnitude
  const isSuccess = isWin !== undefined ? isWin : score > 0;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
        
        {/* Main Card - Minimalist Dark Theme */}
        <div 
            className={`w-full max-w-[260px] bg-[#0a0a0a] border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl transform transition-all duration-300 ease-out scale-100`}
        >
            {/* Subtle Top Glow line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-${isSuccess ? '[#1ed760]' : 'red-500'} to-transparent opacity-50`}></div>

            <div className="p-6 flex flex-col items-center text-center">
                
                {/* Header Icon - Static & Small */}
                <div className={`mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isSuccess ? 'text-[#1ed760]' : 'text-red-500'}`}>
                    {isSuccess ? <TrophyIcon className="w-10 h-10" /> : <SkullIcon className="w-10 h-10" />}
                </div>

                {/* Title */}
                <h1 className="text-xl font-black text-white italic tracking-tighter mb-1 uppercase">
                    {isSuccess ? 'OYUN BİTTİ' : 'BAŞARISIZ'}
                </h1>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">
                    {gameName}
                </p>

                {/* Score Box */}
                <div className="w-full bg-[#141414] border border-white/5 rounded-xl p-4 mb-6">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">TOPLAM SKOR</div>
                    <div className="text-4xl font-black text-white font-mono tracking-tight">{score.toLocaleString()}</div>
                </div>

                {/* Minimal Button */}
                <button 
                    onClick={onContinue}
                    className="w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg"
                >
                    DEVAM ET
                </button>

            </div>
        </div>
    </div>
  );
};
