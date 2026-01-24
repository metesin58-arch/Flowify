
import React, { useRef, useEffect, useState } from 'react';

interface Props {
  onComplete: (score: number) => void;
}

export const RapSurfer: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); // REDUCED DURATION TO 10
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Game Logic Refs
  const playerX = useRef(0);
  const offsetRef = useRef(0); // Y-axis scroll offset
  const scoreRef = useRef(0);
  const rafRef = useRef(0);
  
  // Wave Config (Randomized on mount)
  const waveParams = useRef({
      amplitude: 100, // Genişlik
      frequency: 0.01, // Sıklık
      speed: 8, // Akış Hızı
      curve: 1 // Dalga varyasyonu
  });

  const PATH_WIDTH = 120; // Biraz daha genişletildi

  // 1. Intro Countdown
  useEffect(() => {
      // Randomize params slightly for variety
      waveParams.current = {
          amplitude: 80 + Math.random() * 60, // 80-140px arası genişlik
          frequency: 0.005 + Math.random() * 0.005, // Dalga sıklığı
          speed: 7 + Math.random() * 3, // Hız
          curve: Math.random() > 0.5 ? 1 : -1 // Yön varyasyonu
      };

      const timer = setInterval(() => {
          setCountdown(prev => {
              if (prev <= 1) {
                  clearInterval(timer);
                  setIsPlaying(true);
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  // 3. Game Loop
  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial player position centered
    playerX.current = canvas.width / 2;

    const gameLoop = () => {
        // Clear
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid Background
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); }
        ctx.stroke();

        // Update Offset (Vertical Scroll simulation)
        offsetRef.current += waveParams.current.speed;
        
        // Calculate Wave Function based on Y
        const getTargetX = (y: number) => {
            // y + offsetRef simulates moving through the wave
            const virtualY = y - offsetRef.current; 
            const wp = waveParams.current;
            
            // Smooth Sine Wave
            const sine = Math.sin(virtualY * wp.frequency) * wp.amplitude * wp.curve;
            return (canvas.width / 2) + sine;
        };

        // Draw Path
        ctx.beginPath();
        ctx.lineWidth = PATH_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)'; // Purple glow
        
        let currentTargetX = 0;
        const playerY = canvas.height - 150; // Player is fixed at bottom area

        // Draw visible segment
        for (let y = 0; y < canvas.height; y += 10) {
            const x = getTargetX(y);
            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            if (Math.abs(y - playerY) < 10) currentTargetX = x;
        }
        ctx.stroke();

        // Draw Center Line
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#a855f7'; // Purple
        for (let y = 0; y < canvas.height; y += 20) {
            const x = getTargetX(y);
            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Player
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(playerX.current, playerY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Collision Logic
        const diff = Math.abs(playerX.current - currentTargetX);
        const safeZone = PATH_WIDTH / 2;
        
        if (diff < safeZone) {
            scoreRef.current += 1;
            setScore(Math.floor(scoreRef.current / 5)); 
            
            // Visual feedback for perfect tracking
            if (diff < 20) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(playerX.current, playerY, 16, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // Detone Effect (Red Glitch Overlay)
            ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.2})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    // Timer
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                setIsPlaying(false);
                cancelAnimationFrame(rafRef.current);
                // Calculate percentage based on max possible score
                // 60fps * 10s = 600 ticks max (adjusted for reduced duration)
                const performance = Math.min(100, Math.floor((scoreRef.current / 550) * 100));
                onComplete(performance);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => {
        cancelAnimationFrame(rafRef.current);
        clearInterval(timer);
    };
  }, [isPlaying]);

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      
      let clientX;
      // Safe check for touches array
      if ('touches' in e && e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
      } else if ('clientX' in e) {
          clientX = (e as React.MouseEvent).clientX;
      } else {
          return;
      }

      const x = clientX - rect.left;
      playerX.current = x;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden touch-none select-none">
        
        {!isPlaying ? (
            // INTRO OVERLAY
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in text-center p-6">
                <div className="text-6xl font-black text-purple-500 mb-4 animate-ping">{countdown}</div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">DETONE OLMA!</h2>
                <p className="text-neutral-300 text-sm uppercase tracking-widest max-w-xs leading-relaxed">
                    Parmağınla ses dalgasını takip et. <br/>
                    <span className="text-purple-400 font-bold">Çizginin dışına çıkarsan şarkı bozulur.</span>
                </p>
                <div className="mt-8 w-16 h-16 border-t-4 border-purple-500 rounded-full animate-spin"></div>
            </div>
        ) : (
            // HUD
            <>
                <div className="absolute top-6 left-0 right-0 flex justify-between px-6 z-10 pointer-events-none">
                    <div className="text-white font-black text-xl italic flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        CANLI PERFORMANS
                    </div>
                    <div className="font-mono text-purple-400 font-bold text-xl">{timeLeft}s</div>
                </div>
                
                <div className="absolute top-20 text-center z-10 pointer-events-none">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">SKOR</div>
                    <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{score}</div>
                </div>
            </>
        )}

        <canvas 
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseMove={handleTouch}
            onTouchMove={handleTouch}
            className="w-full h-full bg-[#050505] cursor-crosshair"
        />
    </div>
  );
};
