
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
  const titleText = isWin ? "ZAFER" : isDraw ? "BERABERE" : "MAĞLUBİYET";
  const Icon = isWin ? TrophyIcon : SkullIcon;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Background Glow */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 animate-pulse"
          style={{ backgroundColor: accentColor }}
        ></div>

        {/* Main Card */}
        <div className={`w-full max-w-[320px] bg-[#0a0a0a] border border-white/10 rounded-[3rem] relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] transform transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-75 translate-y-20 opacity-0'}`}>
            
            {/* Top Decorative Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-80" style={{ color: accentColor }}></div>

            <div className="p-10 flex flex-col items-center">
                
                {/* Header Icon with Ring */}
                <div className="relative mb-8">
                    <div 
                      className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
                      style={{ backgroundColor: accentColor }}
                    ></div>
                    <div 
                      className="w-24 h-24 rounded-full bg-[#141414] border-2 flex items-center justify-center shadow-2xl relative z-10" 
                      style={{ borderColor: `${accentColor}40`, color: accentColor }}
                    >
                        <Icon className="w-12 h-12" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                        {titleText}
                    </h1>
                    <div className="h-1 w-12 mx-auto rounded-full" style={{ backgroundColor: accentColor }}></div>
                </div>

                {/* Scores Display */}
                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">SEN</span>
                        <span className={`text-3xl font-black italic tracking-tighter ${isWin ? 'text-white' : 'text-neutral-400'}`}>{myScore}</span>
                    </div>

                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 truncate max-w-full">{opponentName}</span>
                        <span className={`text-3xl font-black italic tracking-tighter ${!isWin && !isDraw ? 'text-white' : 'text-neutral-400'}`}>{opponentScore}</span>
                    </div>
                </div>

                {/* Respect Change */}
                {respectChange !== 0 && (
                    <div className="mb-10 flex flex-col items-center animate-bounce-subtle">
                        <div 
                          className="text-xl font-black italic tracking-tighter px-6 py-2 rounded-full border-2"
                          style={{ borderColor: `${accentColor}20`, backgroundColor: `${accentColor}10`, color: accentColor }}
                        >
                            {respectChange > 0 ? '+' : ''}{respectChange} RESPECT
                        </div>
                        <div className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.3em] mt-3">LİDERLİK PUANI</div>
                    </div>
                )}

                {/* Button */}
                <button 
                    onClick={onContinue}
                    className="w-full py-5 rounded-2xl font-black text-xs italic uppercase tracking-[0.3em] bg-white text-black hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)]"
                >
                    DEVAM ET
                </button>

            </div>
        </div>
    </div>
  );
};
