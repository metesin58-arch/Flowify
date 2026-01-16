
import React, { useState, useEffect, useRef } from 'react';
import { DiscIcon } from '../Icons';
import { playScratchSound } from '../../services/sfx';

interface Props {
  onComplete: (score: number) => void;
}

export const DJScratch: React.FC<Props> = ({ onComplete }) => {
  const [hypeLevel, setHypeLevel] = useState(0); // 0 to 100
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [countdown, setCountdown] = useState(3);
  
  // Physics Refs
  const rotationRef = useRef(0);
  const lastAngleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScratchingRef = useRef(false);
  
  // Logic Refs
  const hypeRef = useRef(30); // Start with some hype
  const lastSoundTime = useRef(0);

  // Intro Countdown
  useEffect(() => {
      const timer = setInterval(() => {
          setCountdown(prev => {
              if (prev <= 1) {
                  clearInterval(timer);
                  setGameState('playing');
                  startGame();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const startGame = () => {
      rafRef.current = requestAnimationFrame(gameLoop);
      
      const gameTimer = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  clearInterval(gameTimer);
                  endGame();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const endGame = () => {
      cancelAnimationFrame(rafRef.current);
      setGameState('ended');
      // Normalize score based on hype level
      onComplete(Math.floor(hypeRef.current));
  };

  const gameLoop = () => {
      if (gameState === 'ended') return;

      // Constant Decay (Gravity)
      // Harder to maintain max hype
      const decay = 0.3 + (hypeRef.current / 200); 
      hypeRef.current = Math.max(0, hypeRef.current - decay);
      
      // Auto-rotation (Slow idle spin)
      if (!isScratchingRef.current) {
          rotationRef.current += 0.5;
      }

      setHypeLevel(hypeRef.current);
      rafRef.current = requestAnimationFrame(gameLoop);
  };

  const getAngle = (clientX: number, clientY: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const startScratch = (e: React.MouseEvent | React.TouchEvent) => {
      isScratchingRef.current = true;
      let clientX, clientY;
      if ('touches' in e && e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      lastAngleRef.current = getAngle(clientX, clientY);
  };

  const moveScratch = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isScratchingRef.current || gameState !== 'playing') return;
      
      let clientX, clientY;
      if ('touches' in e && e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      } else {
          return;
      }
      
      const currentAngle = getAngle(clientX, clientY);
      let delta = currentAngle - lastAngleRef.current;
      
      // Handle wrap-around
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      // Update Rotation
      rotationRef.current += delta;
      lastAngleRef.current = currentAngle;

      // Add Hype on Movement
      // More movement = more hype
      const movement = Math.abs(delta);
      if (movement > 2) {
          hypeRef.current = Math.min(100, hypeRef.current + (movement * 0.5));
          
          // Play Sound (Throttled)
          const now = Date.now();
          if (now - lastSoundTime.current > 100) {
              playScratchSound();
              lastSoundTime.current = now;
          }
      }
  };

  const endScratch = () => {
      isScratchingRef.current = false;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl select-none touch-none overflow-hidden font-sans">
        
        {/* Intro Overlay */}
        {gameState === 'intro' && (
            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80">
                <div className="text-[120px] font-black text-white animate-ping">{countdown}</div>
                <div className="text-xl font-bold text-neutral-400 mt-8 uppercase tracking-widest animate-pulse">Plağı Döndür!</div>
            </div>
        )}

        {/* HUD */}
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start z-[60]">
            <div>
                <h2 className="text-2xl font-black italic text-white tracking-tighter">SCRATCH</h2>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Seyirciyi Coştur!</div>
            </div>
            <div className="text-right">
                <div className="text-4xl font-mono font-bold text-white">{timeLeft}s</div>
            </div>
        </div>

        {/* HYPE METER (Horizontal Bar) */}
        <div className="absolute top-24 w-64 h-8 bg-[#1a1a1a] rounded-full border-2 border-white/20 overflow-hidden z-[60] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black z-10 text-white mix-blend-difference tracking-[0.2em]">HYPE LEVEL</div>
            <div 
                className={`h-full transition-all duration-75 ease-linear ${hypeLevel > 80 ? 'bg-red-500 animate-pulse' : hypeLevel > 50 ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${hypeLevel}%` }}
            ></div>
        </div>

        {/* FEEDBACK TEXT */}
        <div className="absolute top-36 text-center z-[60] h-10">
            {hypeLevel < 30 && <div className="text-blue-500 font-black text-xl animate-bounce">DAHA HIZLI!</div>}
            {hypeLevel > 80 && <div className="text-red-500 font-black text-2xl animate-ping">YANIIYOR! 🔥</div>}
        </div>

        {/* TURNTABLE */}
        <div className="relative w-80 h-80 bg-[#1a1a1a] rounded-full border-4 border-neutral-700 shadow-2xl flex items-center justify-center mt-20">
            {/* Tone Arm */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-64 pointer-events-none z-20 origin-top-right rotate-12">
                <div className="absolute top-4 right-4 w-2 h-48 bg-neutral-400 rounded-full shadow-lg border border-neutral-500"></div>
                <div className="absolute bottom-10 right-4 w-8 h-12 bg-neutral-800 rounded border border-white/10"></div>
            </div>

            {/* VINYL DISC */}
            <div 
                ref={containerRef}
                className="relative w-72 h-72 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 touch-none"
                onMouseDown={startScratch}
                onMouseMove={moveScratch}
                onMouseUp={endScratch}
                onMouseLeave={endScratch}
                onTouchStart={startScratch}
                onTouchMove={moveScratch}
                onTouchEnd={endScratch}
            >
                <div 
                    className="w-full h-full rounded-full bg-[#0a0a0a] border-2 border-[#222] shadow-2xl relative overflow-hidden"
                    style={{ transform: `rotate(${rotationRef.current}deg)` }}
                >
                    {/* Grooves */}
                    <div className="absolute inset-0 opacity-40" style={{
                        background: 'repeating-radial-gradient(#111 0, #111 2px, #222 3px, #222 4px)'
                    }}></div>
                    
                    {/* Label */}
                    <div className="absolute inset-[30%] bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center border-4 border-black shadow-inner">
                        <DiscIcon className="w-12 h-12 text-black/50" />
                    </div>
                    
                    {/* Scratch Marker */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-12 bg-white/90 rounded-full shadow-lg blur-[0.5px]"></div>
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-12 text-neutral-500 text-xs font-bold uppercase tracking-widest animate-pulse pointer-events-none">
            Parmağınla İleri Geri Yap!
        </div>
    </div>
  );
};
