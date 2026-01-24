
import React, { useEffect, useState } from 'react';
import { CoinIcon, UsersIcon, TrophyIcon } from './Icons';
import { playWinSound } from '../services/sfx';

interface RewardModalProps {
  fans: number;
  cash: number;
  onClose: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ fans, cash, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    playWinSound();
    // Slight delay for smooth entry
    setTimeout(() => setShow(true), 50);
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Main Card - Minimalist Dark Theme */}
        <div 
            className={`w-full max-w-[260px] bg-[#0a0a0a] border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl transform transition-all duration-300 ease-out ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        >
            {/* Subtle Top Glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1ed760] to-transparent opacity-50"></div>

            <div className="p-6 flex flex-col items-center text-center">
                
                {/* Header Icon - Static & Small */}
                <div className="mb-3 text-[#1ed760] drop-shadow-[0_0_15px_rgba(30,215,96,0.3)]">
                    <TrophyIcon className="w-8 h-8" />
                </div>

                {/* Title */}
                <h1 className="text-xl font-black text-white italic tracking-tighter mb-6 uppercase">
                    KAZANDIN
                </h1>

                {/* Rewards List - Sleek Rows */}
                <div className="w-full space-y-0 mb-6 border-t border-white/5 border-b">
                    
                    {/* Fans Row */}
                    {fans > 0 && (
                        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
                            <div className="flex items-center gap-3 text-neutral-400">
                                <UsersIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Fan (XP)</span>
                            </div>
                            <div className="text-white font-mono font-bold text-sm text-shadow-sm">
                                +{fans.toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Cash Row */}
                    {cash > 0 && (
                        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
                            <div className="flex items-center gap-3 text-neutral-400">
                                <CoinIcon className="w-4 h-4 text-yellow-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Nakit</span>
                            </div>
                            <div className="text-[#1ed760] font-mono font-bold text-sm text-shadow-sm">
                                +₺{cash.toLocaleString()}
                            </div>
                        </div>
                    )}

                </div>

                {/* Minimal Button */}
                <button 
                    onClick={onClose}
                    className="w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                    DEVAM ET
                </button>

            </div>
        </div>
    </div>
  );
};
