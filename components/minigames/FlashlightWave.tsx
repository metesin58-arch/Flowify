
import React, { useState, useEffect, useRef } from 'react';
import { MicFilledIcon } from '../Icons';

interface Props {
  onComplete: (score: number) => void;
}

export const FlashlightWave: React.FC<Props> = ({ onComplete }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); // 10s duration
  const [isTracking, setIsTracking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gyroAvailable, setGyroAvailable] = useState<boolean | null>(null);

  // Game Loop Refs
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const scoreAccumulator = useRef<number>(0);
  
  // Positions (0 to 100 percentage)
  const targetPos = useRef({ x: 50, y: 50 });
  const playerPos = useRef({ x: 50, y: 50 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // --- INIT GYRO ---
  const requestGyro = async () => {
      // iOS 13+ permission request
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          try {
              const permissionState = await (DeviceOrientationEvent as any).requestPermission();
              if (permissionState === 'granted') {
                  setGyroAvailable(true);
                  window.addEventListener('deviceorientation', handleOrientation);
                  startGame();
              } else {
                  setGyroAvailable(false);
                  alert("Jiroskop izni reddedildi. Dokunmatik mod aktif.");
                  startGame();
              }
          } catch (e) {
              console.error(e);
              setGyroAvailable(false);
              startGame();
          }
      } else {
          // Non-iOS or older devices (usually auto-granted)
          setGyroAvailable(true);
          window.addEventListener('deviceorientation', handleOrientation);
          startGame();
      }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      
      let y = event.beta; 
      let x = event.gamma;

      // Clamp and Normalize
      // X: -35(left) to 35(right) -> 0 to 100
      const xPercent = Math.min(100, Math.max(0, ((x + 35) / 70) * 100));
      
      // Y: 10(top) to 80(bottom) -> 0 to 100 (Phone held naturally)
      const yPercent = Math.min(100, Math.max(0, ((y - 10) / 70) * 100));

      playerPos.current = { x: xPercent, y: yPercent };
  };

  const startGame = () => {
      setGameStarted(true);
      startTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
      return () => {
          cancelAnimationFrame(requestRef.current);
          window.removeEventListener('deviceorientation', handleOrientation);
      };
  }, []);

  const gameLoop = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
          endGame();
          return;
      }

      // --- RANDOM MICROPHONE MOVEMENT ---
      // Moves in a figure-8 / Lissajous pattern to simulate a performer walking on stage
      const t = now * 0.001;
      
      targetPos.current = {
          // X: Swings left and right
          x: 50 + (Math.sin(t * 1.5) * 40), 
          
          // Y: Bobs up and down slightly randomly
          y: 40 + (Math.cos(t * 2.3) * 20) + (Math.sin(t * 0.5) * 10)
      };

      // Check Collision
      const dx = playerPos.current.x - targetPos.current.x;
      const dy = playerPos.current.y - targetPos.current.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      const isHit = distance < 15; // Hit radius
      setIsTracking(isHit);

      if (isHit) {
          scoreAccumulator.current += 1; 
          // 60fps * 10s = 600 ticks
          const currentScore = Math.min(100, Math.floor((scoreAccumulator.current / 500) * 100)); 
          setScore(currentScore);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = () => {
      cancelAnimationFrame(requestRef.current);
      const finalScore = Math.min(100, Math.floor((scoreAccumulator.current / 500) * 100));
      onComplete(finalScore);
  };

  // Touch Fallback
  const handleTouchMove = (e: React.TouchEvent) => {
      if (gyroAvailable === true) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Safe check for touches
      if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          const x = ((touch.clientX - rect.left) / rect.width) * 100;
          const y = ((touch.clientY - rect.top) / rect.height) * 100;
          playerPos.current = { x, y };
      }
  };

  return (
    <div 
        ref={containerRef}
        className="absolute inset-0 z-50 bg-black overflow-hidden touch-none select-none"
        onTouchMove={handleTouchMove}
    >
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start pointer-events-none">
            <div>
                <div className="text-white font-black text-2xl italic tracking-tighter">SPOT IŞIĞI</div>
                <div className="text-neutral-400 text-xs font-bold uppercase">
                    {gyroAvailable ? "Telefonunu Çevir!" : "Parmağınla Takip Et!"}
                </div>
            </div>
            <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">{Math.ceil(timeLeft)}s</div>
                <div className={`text-xl font-black ${isTracking ? 'text-green-400' : 'text-neutral-600'}`}>%{score}</div>
            </div>
        </div>

        {!gameStarted ? (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/90 px-6 text-center">
                <div className="animate-fade-in flex flex-col items-center">
                    <div className="text-6xl mb-6 animate-bounce">📱</div>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase italic">FLAŞLARI YAK!</h2>
                    <p className="text-neutral-400 font-bold tracking-wider text-sm mb-8">TELEFONU EĞEREK IŞIĞI TAKİP ET</p>
                    
                    <button 
                        onClick={requestGyro}
                        className="bg-white text-black font-black py-4 px-10 rounded-full text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    >
                        BAŞLAT
                    </button>
                </div>
            </div>
        ) : (
            <>
                {/* BACKGROUND STAGE LIGHTS */}
                <div className="absolute inset-0 bg-[#050505] overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-20 h-[100vh] bg-blue-500/10 blur-[50px] transform -rotate-12 origin-top animate-pulse"></div>
                    <div className="absolute top-0 right-1/4 w-20 h-[100vh] bg-purple-500/10 blur-[50px] transform rotate-12 origin-top animate-pulse delay-700"></div>
                </div>

                {/* TARGET (MICROPHONE) */}
                <div 
                    className="absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-linear z-10 flex items-center justify-center"
                    style={{ 
                        left: `${targetPos.current.x}%`, 
                        top: `${targetPos.current.y}%` 
                    }}
                >
                    <div className={`text-white transition-transform duration-200 ${isTracking ? 'scale-125 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]' : 'scale-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}>
                        <MicFilledIcon className="w-12 h-12" />
                    </div>
                </div>

                {/* PLAYER (THE SPOTLIGHT) */}
                <div 
                    className="absolute w-full h-full pointer-events-none z-20 transition-transform duration-75 ease-out"
                    style={{ 
                        background: `radial-gradient(circle 120px at ${playerPos.current.x}% ${playerPos.current.y}%, transparent 0%, rgba(0,0,0,0.95) 100%)`
                    }}
                >
                    {/* The Center Hotspot */}
                    <div 
                        className="absolute w-[240px] h-[240px] border-4 border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 box-border"
                        style={{
                            left: `${playerPos.current.x}%`, 
                            top: `${playerPos.current.y}%`,
                            boxShadow: isTracking ? '0 0 30px 5px rgba(34,197,94,0.5), inset 0 0 20px rgba(34,197,94,0.3)' : '0 0 20px 0 rgba(255,255,255,0.2)'
                        }}
                    ></div>

                    {/* Feedback Text inside the light */}
                    {isTracking && (
                        <div 
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-green-400 font-black text-xl tracking-[0.2em] animate-bounce drop-shadow-md"
                            style={{
                                left: `${playerPos.current.x}%`, 
                                top: `${playerPos.current.y + 15}%`,
                            }}
                        >
                            YAKALADIN!
                        </div>
                    )}
                </div>
            </>
        )}
    </div>
  );
};
