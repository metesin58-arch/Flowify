
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../../types';
import { CoinIcon } from '../Icons';
import { playClickSound, playWinSound, playErrorSound, playMoneySound } from '../../services/sfx';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash';
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
const PAYOUTS = {
    '🍒': 3,
    '🍋': 5,
    '🍇': 10,
    '💎': 25,
    '7️⃣': 100
};

export const SlotMachineGame: React.FC<Props> = ({ player, updateStat, onExit, cashType }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [lastWin, setLastWin] = useState(0);
  
  const currentBalance = player[cashType];
  const spinIntervals = useRef<any[]>([]);

  useEffect(() => {
      return () => {
          spinIntervals.current.forEach(clearInterval);
      };
  }, []);

  const spin = () => {
      if (spinning) return;
      if (currentBalance < betAmount) {
          playErrorSound();
          alert("Yetersiz bakiye!");
          return;
      }

      playClickSound();
      setSpinning(true);
      setLastWin(0);
      updateStat(cashType, -betAmount);

      const newReels = [...reels];
      const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ];

      // Start spinning effect
      [0, 1, 2].forEach((index) => {
          spinIntervals.current[index] = setInterval(() => {
              newReels[index] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
              setReels([...newReels]);
          }, 100);

          // Stop reels one by one
          setTimeout(() => {
              clearInterval(spinIntervals.current[index]);
              newReels[index] = finalReels[index];
              setReels([...newReels]);
              playMoneySound(); // Click sound on stop

              if (index === 2) {
                  setSpinning(false);
                  checkWin(finalReels);
              }
          }, 1000 + (index * 500));
      });
  };

  const checkWin = (result: string[]) => {
      const [r1, r2, r3] = result;
      let winMultiplier = 0;

      if (r1 === r2 && r2 === r3) {
          // Jackpot (3 Match)
          winMultiplier = PAYOUTS[r1 as keyof typeof PAYOUTS];
          playWinSound();
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
          // 2 Match (Small Win) - Return bet
          winMultiplier = 1; 
      }

      if (winMultiplier > 0) {
          const payout = betAmount * winMultiplier;
          setLastWin(payout);
          updateStat(cashType, payout);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#100010] flex flex-col relative overflow-hidden font-sans">
        
        {/* Background Lights */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-px h-full bg-purple-500/20 blur-sm"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-purple-500/20 blur-sm"></div>
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px]"></div>
        </div>

        {/* Header */}
        <div className="relative z-[150] flex justify-between items-center px-6 pt-24 pb-4">
            <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">✕</button>
            <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] drop-shadow-sm mb-1">CASINO</div>
                <div className="text-xl font-black italic text-white tracking-tighter">SLOT MACHINE</div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#2a0a2a] pl-2 pr-3 py-1.5 rounded-full border border-purple-500/30 shadow-lg">
                <CoinIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-mono font-bold text-xs">{currentBalance.toLocaleString()}</span>
            </div>
        </div>

        {/* Machine Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
            
            {/* The Machine */}
            <div className="bg-[#2d1b3e] p-6 rounded-3xl border-4 border-[#4c1d95] shadow-[0_0_50px_rgba(124,58,237,0.4)] relative w-full max-w-sm">
                
                {/* Reels Window */}
                <div className="bg-black border-4 border-[#111] rounded-xl flex overflow-hidden relative h-32 items-center shadow-inner">
                    {/* Payline */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-20 pointer-events-none"></div>
                    
                    {reels.map((symbol, i) => (
                        <div key={i} className="flex-1 h-full flex items-center justify-center border-r border-[#222] last:border-0 bg-gradient-to-b from-black via-[#1a1a1a] to-black">
                            <span className={`text-5xl filter drop-shadow-lg transform transition-all ${spinning ? 'blur-sm scale-90' : 'scale-100'}`}>
                                {symbol}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Status / Win Display */}
                <div className="mt-4 h-12 flex items-center justify-center">
                    {lastWin > 0 ? (
                        <div className="text-yellow-400 font-black text-2xl animate-bounce drop-shadow-md">
                            KAZANDIN! +₺{lastWin}
                        </div>
                    ) : (
                        <div className="text-purple-300/50 font-bold text-xs uppercase tracking-widest">
                            BOL ŞANS
                        </div>
                    )}
                </div>

                {/* Lever (Decorative) */}
                <div className={`absolute top-10 -right-6 w-4 h-32 bg-gray-600 rounded-full border-2 border-gray-400 transition-all origin-top ${spinning ? 'scale-y-50' : 'scale-y-100'}`}>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-600 rounded-full border-2 border-red-400 shadow-lg"></div>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-sm mt-8 space-y-4">
                
                <div className="flex justify-between items-center bg-[#2a0a2a] p-2 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setBetAmount(Math.max(10, betAmount - 50))}
                        disabled={spinning}
                        className="w-10 h-10 bg-purple-900/50 rounded-lg text-white font-bold disabled:opacity-50"
                    >-</button>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">BAHİS</span>
                        <span className="text-white font-mono font-bold text-lg">₺{betAmount}</span>
                    </div>
                    <button 
                        onClick={() => setBetAmount(Math.min(currentBalance, betAmount + 50))}
                        disabled={spinning}
                        className="w-10 h-10 bg-purple-900/50 rounded-lg text-white font-bold disabled:opacity-50"
                    >+</button>
                </div>

                <button
                    onClick={spin}
                    disabled={spinning || currentBalance < betAmount}
                    className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all transform ${
                        spinning 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02] active:scale-95 shadow-purple-500/30'
                    }`}
                >
                    {spinning ? 'DÖNÜYOR...' : 'ÇEVİR'}
                </button>

            </div>

        </div>
    </div>
  );
};
