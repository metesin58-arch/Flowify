
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../../types';
import { CoinIcon, RocketIcon } from '../Icons';
import { playClickSound, playWinSound, playErrorSound, playGoSound, playCountdownTick } from '../../services/sfx';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const HISTORY_SIZE = 8; 

export const ZeppelinGame: React.FC<Props> = ({ player, updateStat, onExit, cashType, showToast }) => {
  // Game Logic State
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'flying' | 'crashed' | 'cashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState(100);
  const [winnings, setWinnings] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(3);
  
  // Visual State - Using 0-100 coordinate system
  const [rocketPos, setRocketPos] = useState({ x: 5, y: 80 }); // Start lower
  const [pathData, setPathData] = useState<string>("M 5 80");
  const [shake, setShake] = useState(false);

  // Refs
  const currentBalance = player[cashType];
  const requestRef = useRef<number>(0);
  const crashPointRef = useRef(0);
  const startTimeRef = useRef(0);
  const gameRunningRef = useRef(false);
  const pathPointsRef = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
      // Mock history on mount
      setHistory(Array.from({length: 5}, () => 1 + Math.random() * 5));
      return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const initiateGame = () => {
      if (currentBalance < betAmount) {
          playErrorSound();
          showToast("Yetersiz bakiye!", 'error');
          return;
      }
      playClickSound();
      updateStat(cashType, -betAmount);
      
      setGameState('countdown');
      setCountdown(3);
      
      let count = 3;
      const interval = setInterval(() => {
          count--;
          if (count > 0) {
              setCountdown(count);
              playCountdownTick();
          } else {
              clearInterval(interval);
              startGame();
          }
      }, 800);
  };

  const startGame = () => {
      // Logic Reset
      const rand = Math.random();
      const calculatedCrash = Math.max(1.00, Math.floor((0.96 / (1 - rand)) * 100) / 100);
      crashPointRef.current = calculatedCrash;
      
      setMultiplier(1.00);
      setWinnings(0);
      setGameState('flying');
      playGoSound();
      
      // Visual Reset
      setRocketPos({ x: 5, y: 80 });
      setPathData("M 5 80");
      pathPointsRef.current = [{x: 5, y: 80}];
      setShake(false);

      gameRunningRef.current = true;
      startTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
      if (!gameRunningRef.current) return;

      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      
      // Growth Curve
      const currentMult = 1 + (elapsed * elapsed * 0.08) + (elapsed * 0.05);
      
      if (currentMult >= crashPointRef.current) {
          setMultiplier(crashPointRef.current);
          handleCrash();
      } else {
          setMultiplier(currentMult);
          updateVisuals(elapsed, currentMult);
          requestRef.current = requestAnimationFrame(gameLoop);
      }
  };

  const updateVisuals = (elapsed: number, mult: number) => {
      let x = 5 + (elapsed * 8); 
      
      const logVal = Math.log10(mult); 
      let y = 80 - (logVal * 65);
      
      y = Math.max(15, y);

      if (x > 85) {
          x = 85;
      }

      setRocketPos({ x, y });
      
      const lastP = pathPointsRef.current[pathPointsRef.current.length - 1];
      if (Math.abs(lastP.x - x) > 0.5 || Math.abs(lastP.y - y) > 0.5) {
          pathPointsRef.current.push({ x, y });
      }

      let d = `M 5 80`;
      pathPointsRef.current.forEach(p => {
          d += ` L ${p.x} ${p.y}`;
      });
      setPathData(d);
      
      if (mult > 5) setShake(true);
  };

  const handleCrash = () => {
      gameRunningRef.current = false;
      setGameState('crashed');
      playErrorSound();
      cancelAnimationFrame(requestRef.current);
      addToHistory(crashPointRef.current);
  };

  const handleCashOut = () => {
      if (gameState !== 'flying') return;
      gameRunningRef.current = false;
      cancelAnimationFrame(requestRef.current);
      playWinSound();
      
      const winAmount = Math.floor(betAmount * multiplier);
      updateStat(cashType, winAmount);
      setWinnings(winAmount);
      setGameState('cashed');
      addToHistory(multiplier);
  };

  const addToHistory = (val: number) => {
      setHistory(prev => [val, ...prev].slice(0, HISTORY_SIZE));
  };

  const isControlsDisabled = gameState === 'flying' || gameState === 'countdown';

  return (
    <div className="h-full w-full bg-[#030303] flex flex-col font-sans select-none overflow-hidden pb-safe relative">
        
        {/* === HEADER (FIXED TOP PADDING) === */}
        <div className="relative z-50 px-6 pt-12 pb-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5 shrink-0">
            {/* History Bar */}
            <div className="flex gap-1.5 overflow-hidden h-6 items-center flex-1 mr-4">
                {history.map((val, i) => (
                    <div key={i} className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${val >= 2 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-neutral-500 border-white/5'}`}>
                        {val.toFixed(2)}x
                    </div>
                ))}
            </div>
            <button 
                onClick={onExit} 
                disabled={gameState === 'flying'} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-opacity disabled:opacity-0 active:scale-90"
            >✕</button>
        </div>

        {/* === GAME AREA (FLEXIBLE) === */}
        <div className="flex-1 relative w-full overflow-hidden">
            {/* Background & Sky */}
            <div className={`absolute inset-0 transition-all duration-500 ${gameState === 'crashed' ? 'bg-red-950/10' : ''}`}>
                <div className="absolute inset-0 opacity-[0.03]" style={{ 
                         backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px)',
                         backgroundSize: '40px 40px',
                         transform: `perspective(500px) rotateX(15deg) translateY(${gameState === 'flying' ? (Date.now() % 40) : 0}px)`,
                     }}>
                </div>
            </div>

            {/* SVG Layer */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                    </linearGradient>
                </defs>
                
                {/* Threshold Lines */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2" />
                <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2" />

                {gameState !== 'idle' && gameState !== 'countdown' && (
                    <>
                        <path d={`${pathData} L ${rocketPos.x} 120 L 5 120 Z`} fill="url(#gradArea)" />
                        <path d={pathData} fill="none" stroke="#6366f1" strokeWidth="0.8" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    </>
                )}
            </svg>

            {/* Rocket */}
            {(gameState === 'flying' || gameState === 'crashed' || gameState === 'cashed') && (
                <div 
                    className="absolute w-10 h-10 flex items-center justify-center transition-transform will-change-transform z-10"
                    style={{ 
                        left: `${rocketPos.x}%`, 
                        top: `${rocketPos.y}%`,
                        transform: `translate(-50%, -50%) rotate(-45deg)`
                    }}
                >
                    {gameState === 'crashed' ? (
                        <div className="text-3xl animate-ping text-red-500 drop-shadow-[0_0_15px_red]">💥</div>
                    ) : (
                        <div className="relative">
                            <RocketIcon className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-transparent blur-[1px] animate-pulse origin-top"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Multiplier Center Display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                {gameState === 'countdown' ? (
                    <div className="text-7xl font-black text-indigo-400 animate-ping">{countdown}</div>
                ) : gameState === 'crashed' ? (
                    <div className="flex flex-col items-center animate-shake">
                        <div className="text-5xl font-black text-red-500 font-mono tracking-tight">{multiplier.toFixed(2)}x</div>
                        <div className="text-[10px] font-black text-white bg-red-600 px-3 py-0.5 rounded-full uppercase mt-2 shadow-lg lowercase">patladı.</div>
                    </div>
                ) : gameState === 'cashed' ? (
                    <div className="flex flex-col items-center animate-bounce-subtle">
                        <div className="text-5xl font-black text-indigo-400 font-mono tracking-tight">{multiplier.toFixed(2)}x</div>
                        <div className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase mt-2 lowercase">
                            kazanç: ₺{winnings.toLocaleString()}
                        </div>
                    </div>
                ) : (
                    <div className={`text-6xl font-black font-mono tracking-tighter transition-colors ${multiplier > 5 ? 'text-indigo-400' : 'text-white'} ${gameState === 'flying' && shake ? 'translate-x-0.5' : ''}`}>
                        {multiplier.toFixed(2)}x
                    </div>
                )}
            </div>
        </div>

        {/* === CONTROLS (FULL WIDTH BOTTOM) === */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#040404]/95 backdrop-blur-3xl border-t border-white/5 p-6 pb-safe flex flex-col gap-4">
            
            {/* Top Row: Balance & Bet Amount */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col text-left">
                    <span className="text-[9px] text-neutral-500 font-extrabold lowercase tracking-tight mb-0.5">bakiye.</span>
                    <div className="flex items-center gap-1.5 text-white font-black text-sm">
                        <CoinIcon className="w-4 h-4 text-indigo-400" />
                        <span className="tabular-nums">{currentBalance.toLocaleString()}</span>
                    </div>
                </div>
                
                {/* Modern Plus/Minus Bet Controller */}
                <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-3xl p-1 border border-white/5">
                    <button 
                        onClick={() => { playClickSound(); setBetAmount(Math.max(10, betAmount - 50)); }} 
                        disabled={isControlsDisabled} 
                        className="w-10 h-10 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 disabled:opacity-30 flex items-center justify-center border border-white/5"
                    >-</button>
                    
                    <div className="flex flex-col items-center justify-center min-w-[70px]">
                        <span className="text-[8px] text-neutral-500 font-extrabold lowercase tracking-tight">bahis.</span>
                        <div className="text-sm font-black text-white tabular-nums tracking-tight">₺{betAmount.toLocaleString()}</div>
                    </div>

                    <button 
                        onClick={() => { playClickSound(); setBetAmount(Math.min(currentBalance, betAmount + 50)); }} 
                        disabled={isControlsDisabled} 
                        className="w-10 h-10 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 disabled:opacity-30 flex items-center justify-center border border-white/5"
                    >+</button>
                </div>
            </div>

            {/* Main Action Button */}
            {gameState === 'flying' ? (
                <button
                    onClick={handleCashOut}
                    className="w-full h-12 rounded-[2rem] font-black text-xs lowercase bg-indigo-500 text-white hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
                >
                    <span>bozdur.</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-indigo-200 tabular-nums">₺{Math.floor(betAmount * multiplier).toLocaleString()}</span>
                </button>
            ) : (
                <button
                    onClick={initiateGame}
                    disabled={isControlsDisabled}
                    className={`w-full h-12 rounded-[2rem] font-black text-xs lowercase transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        !isControlsDisabled
                        ? 'bg-white text-black hover:scale-[1.01] shadow-2xl' 
                        : 'bg-neutral-900 border border-white/5 text-neutral-600 cursor-not-allowed'
                    }`}
                >
                    {gameState === 'countdown' ? (
                        <span className="animate-pulse">hazırlanıyor...</span>
                    ) : (
                        <>
                            <RocketIcon className="w-4 h-4" />
                            <span>fırlat.</span>
                        </>
                    )}
                </button>
            )}
        </div>

    </div>
  );
};
