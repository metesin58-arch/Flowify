import React, { useEffect, useState } from 'react';
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
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Modern Cybernetic Card */}
        <div 
            className={`w-full max-w-[290px] bg-[#020204] border-2 border-emerald-500/20 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] transform transition-all duration-500 ease-out ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
        >
            {/* Ambient Background Matrix Dots */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            {/* Dynamic Corner Decors */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#10b981] opacity-60" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#10b981] opacity-60" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#10b981] opacity-60" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#10b981] opacity-60" />

            {/* Glowing Top Laser Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-80 animate-pulse"></div>

            <div className="p-8 flex flex-col items-center text-center relative z-10">
                {/* Tech Code Watermark */}
                <div className="text-[8px] font-mono text-[#10b981]/45 tracking-[0.25em] mb-4 uppercase">PRM_OUTCOME_STATUS // SUCCESS</div>

                {/* Main Header */}
                <h1 className="text-2xl font-black text-white italic tracking-tighter mb-6 uppercase">
                    TEBRİKLER!
                </h1>

                {/* Rewards List */}
                <div className="w-full space-y-3 mb-8">
                    {/* Cash Row */}
                    {cash > 0 ? (
                        <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.15em] mb-1">KAZANILAN ÖDÜL</span>
                            <div className="text-3xl font-black text-[#10b981] font-mono tracking-tight">
                                +₺{cash.toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">PERFORMANS DURUMU</span>
                            <div className="text-lg font-black text-neutral-300 uppercase tracking-tight">
                                TAMAMLANDI
                            </div>
                        </div>
                    )}

                    {/* Disclaimer: Explicit indicator that no listeners are awarded for offline play */}
                    <div className="text-[8px] text-neutral-500 uppercase tracking-wider font-semibold pt-1">
                        * ÇEVRİMDIŞI OYUN // FAN KAZANIMI KAPALI
                    </div>
                </div>

                {/* S-Arm Inspired Minimal Button */}
                <button 
                    onClick={onClose}
                    className="w-full py-4 rounded-xl bg-[#10b981] hover:bg-emerald-400 active:scale-95 text-black font-black text-[11px] uppercase tracking-[0.18em] transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] cursor-pointer"
                >
                    STÜDYOYA DÖN
                </button>
            </div>
        </div>
    </div>
  );
};
