import React from 'react';

interface GameOverScreenProps {
  score: number;
  earnedListeners?: number;
  totalListeners?: number;
  onContinue: () => void;
  gameName?: string;
  isWin?: boolean;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onContinue, gameName = "oyun bitti", isWin }) => {
  const isSuccess = isWin !== undefined ? isWin : score > 0;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in">
        
        {/* Cyberpunk Grid-based Frame */}
        <div 
            className={`w-full max-w-[280px] bg-[#020204] border-2 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)] transition-all duration-300 ${isSuccess ? 'border-emerald-500/20 shadow-emerald-500/10' : 'border-red-500/20 shadow-red-500/10'}`}
        >
            {/* Ambient Background Matrix Dots */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Micro Tech Corner Deco brackets */}
            <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 opacity-60 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
            <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 opacity-60 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
            <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 opacity-60 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 opacity-60 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />

            {/* Glowing top line indicator */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent opacity-80 ${isSuccess ? 'via-emerald-400' : 'via-red-400'}`}></div>

            <div className="p-8 flex flex-col items-center text-center relative z-10">
                
                {/* Status Code / Identity Indicator */}
                <div className="text-[8px] font-mono tracking-[0.2em] mb-3 uppercase opacity-40">
                    TERMINAL_NODE // {isSuccess ? 'SUCCESS_STABLE' : 'ABORTED'}
                </div>

                {/* Subtitle - Game Name */}
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                    {gameName}
                </span>

                {/* Main Outcome Heading */}
                <h1 className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">
                    {isSuccess ? 'KAYDEDİLDİ' : 'ELENDİN'}
                </h1>

                {/* Score Panel */}
                <div className="w-full bg-neutral-900/30 border border-white/5 rounded-2xl p-4.5 mb-7">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-1">TOPLAM SKOR</div>
                    <div className="text-4xl font-black text-white font-mono tracking-tight select-all">
                        {score.toLocaleString()}
                    </div>
                </div>

                {/* Futuristic Primary Button */}
                <button 
                    onClick={onContinue}
                    className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer ${
                      isSuccess 
                        ? 'bg-[#10b981] text-black hover:bg-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.3)]' 
                        : 'bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.3)]'
                    }`}
                >
                    DEVAM ET
                </button>

            </div>
        </div>
    </div>
  );
};
