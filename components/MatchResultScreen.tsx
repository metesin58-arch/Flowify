
import React, { useEffect, useState } from 'react';
import { TrophyIcon, SkullIcon } from './Icons';

interface MatchResultScreenProps {
  result: 'win' | 'loss' | 'draw';
  myScore: number;
  opponentScore: number;
  opponentName: string;
  respectChange: number;
  onContinue: () => void;
}

export const MatchResultScreen: React.FC<MatchResultScreenProps> = ({ 
  result, 
  myScore, 
  opponentScore, 
  opponentName, 
  respectChange, 
  onContinue 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  const isWin = result === 'win';
  const isDraw = result === 'draw';

  const accentColor = isWin ? '#1ed760' : isDraw ? '#fbbf24' : '#ef4444';
  const titleText = isWin ? "KAZANDIN" : isDraw ? "BERABERE" : "KAYBETTİN";
  const Icon = isWin ? TrophyIcon : SkullIcon;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Main Card */}
        <div className={`w-full max-w-[280px] bg-[#0a0a0a] border border-white/10 rounded-3xl relative overflow-hidden shadow-2xl transform transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
            
            {/* Top Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60" style={{ color: accentColor }}></div>

            <div className="p-8 flex flex-col items-center">
                
                {/* Header Icon */}
                <div className="w-16 h-16 rounded-full bg-[#141414] border border-white/5 flex items-center justify-center shadow-lg mb-4" style={{ color: accentColor }}>
                    <Icon className="w-8 h-8" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black italic tracking-tighter text-white mb-6 uppercase">
                    {titleText}
                </h1>

                {/* Scores Grid */}
                <div className="w-full flex items-center justify-between mb-8 bg-[#141414] rounded-2xl p-4 border border-white/5">
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider mb-1">SEN</span>
                        <span className={`text-xl font-black ${isWin ? 'text-white' : 'text-neutral-400'}`}>{myScore}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider mb-1 truncate max-w-[70px]">{opponentName}</span>
                        <span className={`text-xl font-black ${!isWin && !isDraw ? 'text-white' : 'text-neutral-400'}`}>{opponentScore}</span>
                    </div>
                </div>

                {/* Respect Change */}
                {respectChange !== 0 && (
                    <div className="mb-6 flex flex-col items-center">
                        <div className={`text-sm font-black ${respectChange > 0 ? 'text-[#1ed760]' : 'text-red-500'}`}>
                            {respectChange > 0 ? '+' : ''}{respectChange} RESPECT
                        </div>
                        <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1">LİDERLİK PUANI</div>
                    </div>
                )}

                {/* Button */}
                <button 
                    onClick={onContinue}
                    className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-white text-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                    DEVAM ET
                </button>

            </div>
        </div>
    </div>
  );
};
