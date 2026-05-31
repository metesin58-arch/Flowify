
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
    <div className="fixed inset-0 z-[200] bg-[#030303] flex flex-col relative overflow-hidden font-sans select-none">
        
        {/* Background Lights */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Header */}
        <div className="relative z-[150] flex justify-between items-center px-6 pt-12 pb-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
            <button 
                onClick={onExit} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:scale-90"
            >✕</button>
            <div className="flex flex-col items-center text-center">
                <div className="text-[10px] font-black text-neutral-500 lowercase tracking-tight mb-0.5">casino.</div>
                <div className="text-xl font-black text-white tracking-tighter lowercase">
                    slot makinesi<span className="text-indigo-500">.</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-white/5 pl-2.5 pr-3.5 py-1.5 rounded-2xl shadow-md">
                <CoinIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-black text-xs tabular-nums leading-none">
                    {currentBalance.toLocaleString()}
                </span>
            </div>
        </div>

        {/* Machine Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pb-24">
            
            {/* The Machine */}
            <div className="bg-[#050505] p-5 rounded-[2.5rem] border border-white/5 shadow-2xl relative w-full max-w-sm">
                
                {/* Reels Window */}
                <div className="bg-black border border-white/5 rounded-2xl flex overflow-hidden relative h-32 items-center shadow-inner">
                    {/* Payline */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-indigo-500/20 z-20 pointer-events-none"></div>
                    
                    {reels.map((symbol, i) => (
                        <div key={i} className="flex-1 h-full flex items-center justify-center border-r border-white/5 last:border-0 bg-gradient-to-b from-black via-[#0d0d0d] to-black">
                            <span className={`text-4.5xl filter drop-shadow-md transform transition-all ${spinning ? 'blur-sm scale-90' : 'scale-100'}`}>
                                {symbol}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Status / Win Display */}
                <div className="mt-4 h-12 flex items-center justify-center">
                    {lastWin > 0 ? (
                        <div className="text-indigo-400 font-black text-lg tracking-tight animate-bounce-subtle">
                            kazandın! +₺{lastWin.toLocaleString()}
                        </div>
                    ) : (
                        <div className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest lowercase">
                            bol şans.
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-sm mt-8 space-y-4">
                
                <div className="flex justify-between items-center bg-[#070707] p-2 rounded-3xl border border-white/5">
                    <button 
                        onClick={() => { playClickSound(); setBetAmount(Math.max(10, betAmount - 50)); }}
                        disabled={spinning}
                        className="w-10 h-10 bg-[#0e0e0e] border border-white/5 rounded-2xl text-white font-black hover:bg-[#121212] transition-colors active:scale-95 disabled:opacity-30"
                    >-</button>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 font-extrabold lowercase tracking-tight mb-0.5">bahis.</span>
                        <span className="text-white font-black text-base tabular-nums">₺{betAmount.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={() => { playClickSound(); setBetAmount(Math.min(currentBalance, betAmount + 50)); }}
                        disabled={spinning}
                        className="w-10 h-10 bg-[#0e0e0e] border border-white/5 rounded-2xl text-white font-black hover:bg-[#121212] transition-colors active:scale-95 disabled:opacity-30 shadow-md"
                    >+</button>
                </div>

                <button
                    onClick={spin}
                    disabled={spinning || currentBalance < betAmount}
                    className={`w-full py-4 rounded-[2rem] font-black text-xs lowercase tracking-wide transition-all ${
                        spinning 
                        ? 'bg-neutral-900 border border-white/5 text-neutral-600 cursor-not-allowed' 
                        : 'bg-white text-black hover:scale-[1.01] active:scale-95 shadow-md'
                    }`}
                >
                    {spinning ? 'dönüyor...' : 'çevir.'}
                </button>

            </div>

        </div>
    </div>
  );
};
