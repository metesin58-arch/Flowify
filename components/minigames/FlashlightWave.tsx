import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Props {
  onComplete: (score: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const FlashlightWave: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0);

  // Sensor states
  const [gyroPermission, setGyroPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [usingGyro, setUsingGyro] = useState(false);

  // Positions (percentage 0 to 100)
  const targetX = useRef(50);
  const targetY = useRef(50);
  const playerXSmooth = useRef(50);
  const playerYSmooth = useRef(50);
  const playerXInput = useRef(50);
  const playerYInput = useRef(50);

  // Tracking metrics
  const scoreAccumulator = useRef(0);
  const isOverlappingRef = useRef(false);
  const particles = useRef<Particle[]>([]);
  const flashes = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);
  const animationFrameId = useRef<number>(0);

  // Check support early
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasOrientation = 'DeviceOrientationEvent' in window;
    const needsRequest = typeof (window.DeviceOrientationEvent as any)?.requestPermission === 'function';
    
    if (!hasOrientation) {
      setGyroPermission('unsupported');
    } else if (!needsRequest) {
      // Android / Chrome automatically support it on touch event
      setGyroPermission('granted');
      setUsingGyro(true);
    }
  }, []);

  // Intro countdown timer
  useEffect(() => {
    if (gyroPermission === 'prompt') return; // wait for user interaction to start

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
  }, [gyroPermission]);

  const handleEnablePermission = async () => {
    if (typeof (window.DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const res = await (window.DeviceOrientationEvent as any).requestPermission();
        if (res === 'granted') {
          setGyroPermission('granted');
          setUsingGyro(true);
        } else {
          setGyroPermission('denied');
        }
      } catch (err) {
        console.error("Gyro permission error:", err);
        setGyroPermission('denied');
      }
    } else {
      setGyroPermission('granted');
      setUsingGyro(true);
    }
  };

  const handleSkipPermission = () => {
    setGyroPermission('denied');
    setUsingGyro(false);
  };

  // Main gameplay loops
  useEffect(() => {
    if (!isPlaying) return;

    // Timer countdown
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gyro deviceorientation listener
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!usingGyro) return;
      if (event.beta === null || event.gamma === null) return;
      
      // Beta (front/back tilt: comfortable 35-70deg angle)
      // Gamma (left-right tilt: comfortable -20 to +20deg angle)
      const xPercent = Math.min(100, Math.max(0, ((event.gamma + 20) / 40) * 100));
      const yPercent = Math.min(100, Math.max(0, ((event.beta - 30) / 38) * 100));
      
      playerXInput.current = xPercent;
      playerYInput.current = yPercent;
    };

    if (usingGyro) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    const loop = () => {
      const now = performance.now();
      const w = canvas.width;
      const h = canvas.height;

      // 1. Move target mic in dynamic Lissajous trajectory
      targetX.current = 50 + Math.sin(now * 0.0019) * 35;
      targetY.current = 45 + Math.cos(now * 0.0027) * 22 + Math.sin(now * 0.0006) * 10;

      // 2. Smoothly damp player cursor coordinates toward targets
      playerXSmooth.current += (playerXInput.current - playerXSmooth.current) * 0.18;
      playerYSmooth.current += (playerYInput.current - playerYSmooth.current) * 0.18;

      // Translate coordinates to pixels
      const tPX = (targetX.current / 100) * w;
      const tPY = (targetY.current / 100) * h;
      const pPX = (playerXSmooth.current / 100) * w;
      const pPY = (playerYSmooth.current / 100) * h;

      // 3. Collision / Overlap check
      const distance = Math.hypot(tPX - pPX, tPY - pPY);
      const radiusOverlap = 75; // spotlight cone coverage
      const inZone = distance < radiusOverlap;
      isOverlappingRef.current = inZone;

      if (inZone) {
        scoreAccumulator.current += 1.4; // Tick progress
        const currentPercentage = Math.min(100, Math.floor((scoreAccumulator.current / 480) * 100));
        setScore(currentPercentage);

        // Emit sparkling stars from intersection
        if (now % 3 < 1.5) {
          spawnStarSparks(tPX, tPY);
        }
      }

      // Procedural flashes from back crowds
      if (Math.random() > 0.94) {
        flashes.current.push({
          x: Math.random() * w,
          y: h * 0.1 + Math.random() * h * 0.25,
          size: 15 + Math.random() * 20,
          alpha: 1.0,
        });
      }

      // 4. Draw theatrical concert stage scene
      drawConcertStage(ctx, w, h, tPX, tPY, pPX, pPY, inZone);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      clearInterval(gameTimer);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isPlaying, usingGyro]);

  // Handle game complete conditions
  useEffect(() => {
    if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameId.current);
      setTimeout(() => {
        onComplete(score);
      }, 0);
    }
  }, [timeLeft, isPlaying, onComplete, score]);

  const spawnStarSparks = (x: number, y: number) => {
    const goldYellowColors = ['#f59e0b', '#3b82f6', '#ec4899', '#ffffff'];
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.8;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: goldYellowColors[Math.floor(Math.random() * goldYellowColors.length)],
        size: 1.5 + Math.random() * 2,
        alpha: 0.9,
      });
    }
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let cx = 0;
    let cy = 0;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else if ('clientX' in e) {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    } else {
      return;
    }

    const relativeX = ((cx - rect.left) / rect.width) * 100;
    const relativeY = ((cy - rect.top) / rect.height) * 100;

    playerXInput.current = relativeX;
    playerYInput.current = relativeY;
  };

  const drawConcertStage = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tX: number,
    tY: number,
    pX: number,
    pY: number,
    inZone: boolean
  ) => {
    // 1. Solid Dark Stage background
    // Unified black background, graffitis, and camera flashes
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, w, h);

    // 2. Faint Graffiti (subtle urban look, low opacity)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#a855f7'; // purple tags
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw tag: "FLOW" on left side (height around 15% - 30%)
    ctx.beginPath();
    // F
    ctx.moveTo(w * 0.1, h * 0.15); ctx.lineTo(w * 0.1, h * 0.27);
    ctx.moveTo(w * 0.1, h * 0.15); ctx.lineTo(w * 0.18, h * 0.15);
    ctx.moveTo(w * 0.1, h * 0.21); ctx.lineTo(w * 0.16, h * 0.21);
    // L
    ctx.moveTo(w * 0.22, h * 0.15); ctx.lineTo(w * 0.22, h * 0.27); ctx.lineTo(w * 0.28, h * 0.27);
    // O (Rough circle)
    ctx.moveTo(w * 0.36, h * 0.21);
    ctx.arc(w * 0.36, h * 0.21, 25, 0, Math.PI * 2);
    // W
    ctx.moveTo(w * 0.44, h * 0.15);
    ctx.lineTo(w * 0.46, h * 0.27);
    ctx.lineTo(w * 0.49, h * 0.20);
    ctx.lineTo(w * 0.52, h * 0.27);
    ctx.lineTo(w * 0.54, h * 0.15);
    ctx.stroke();

    // Draw tag: "RAP" on right side (height around 40% - 55%)
    ctx.strokeStyle = '#3b82f6'; // blue tags
    ctx.lineWidth = 7;
    ctx.beginPath();
    // R
    ctx.moveTo(w * 0.58, h * 0.4); ctx.lineTo(w * 0.58, h * 0.52);
    ctx.moveTo(w * 0.58, h * 0.4); ctx.bezierCurveTo(w * 0.68, h * 0.38, w * 0.68, h * 0.46, w * 0.58, h * 0.46);
    ctx.moveTo(w * 0.60, h * 0.46); ctx.lineTo(w * 0.67, h * 0.52);
    // A
    ctx.moveTo(w * 0.72, h * 0.52); ctx.lineTo(w * 0.77, h * 0.4); ctx.lineTo(w * 0.82, h * 0.52);
    ctx.moveTo(w * 0.74, h * 0.47); ctx.lineTo(w * 0.80, h * 0.47);
    // P
    ctx.moveTo(w * 0.86, h * 0.4); ctx.lineTo(w * 0.86, h * 0.52);
    ctx.moveTo(w * 0.86, h * 0.4); ctx.bezierCurveTo(w * 0.96, h * 0.38, w * 0.96, h * 0.46, w * 0.86, h * 0.46);
    ctx.stroke();

    // Abstract cool crown
    ctx.strokeStyle = '#fbbf24'; // gold crown
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.31);
    ctx.lineTo(w * 0.42, h * 0.35);
    ctx.lineTo(w * 0.50, h * 0.32);
    ctx.lineTo(w * 0.58, h * 0.35);
    ctx.lineTo(w * 0.55, h * 0.31);
    ctx.lineTo(w * 0.45, h * 0.31);
    ctx.stroke();
    ctx.restore();

    // 2. Draw random photo flashes in the crowd
    flashes.current.forEach(f => {
      f.alpha -= 0.05;
      if (f.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        const beamGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size);
        beamGlow.addColorStop(0, '#ffffff');
        beamGlow.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        beamGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGlow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    flashes.current = flashes.current.filter(f => f.alpha > 0);

    // 3. Draw Theatrical spotlights casting downward
    // Left Blue beam
    const blueSpotX = w * 0.15;
    const blueSpotY = -20;
    const blueGrad = ctx.createLinearGradient(blueSpotX, blueSpotY, pX, pY);
    blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    blueGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = blueGrad;
    ctx.beginPath();
    ctx.moveTo(blueSpotX - 10, blueSpotY);
    ctx.lineTo(pX - 50, pY);
    ctx.lineTo(pX + 50, pY);
    ctx.lineTo(blueSpotX + 10, blueSpotY);
    ctx.closePath();
    ctx.fill();

    // Right Magenta beam
    const magSpotX = w * 0.85;
    const magSpotY = -20;
    const magGrad = ctx.createLinearGradient(magSpotX, magSpotY, tX, tY);
    magGrad.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
    magGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = magGrad;
    ctx.beginPath();
    ctx.moveTo(magSpotX - 10, magSpotY);
    ctx.lineTo(tX - 45, tY);
    ctx.lineTo(tX + 45, tY);
    ctx.lineTo(magSpotX + 10, magSpotY);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Cones on the floor
    // Target floor footprint slice (ambient magenta)
    ctx.save();
    const targetGrad = ctx.createRadialGradient(tX, tY, 15, tX, tY, 55);
    targetGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
    targetGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = targetGrad;
    ctx.beginPath();
    ctx.ellipse(tX, tY, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Player Follower Spotlight (glowing gold or emerald when overlapping)
    ctx.save();
    ctx.shadowBlur = inZone ? 30 : 15;
    ctx.shadowColor = inZone ? '#10b981' : '#3b82f6';
    const fPlayerGrad = ctx.createRadialGradient(pX, pY, 15, pX, pY, 70);
    fPlayerGrad.addColorStop(0, inZone ? 'rgba(16, 185, 129, 0.7)' : 'rgba(59, 130, 246, 0.5)');
    fPlayerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fPlayerGrad;
    ctx.beginPath();
    ctx.ellipse(pX, pY, 70, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Glowing perimeter rings
    ctx.strokeStyle = inZone ? '#10b981' : 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = inZone ? 3 : 1.5;
    ctx.beginPath();
    ctx.ellipse(pX, pY, 70, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Render performer artist silhouetted inside target spotlight
    ctx.save();
    ctx.translate(tX, tY - 10);
    
    // Performer mic stand and shadow
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(2, -26); // Mic stem
    ctx.moveTo(-10, 10);
    ctx.lineTo(10, 10); // Base crossbar
    ctx.stroke();

    // Glowing electric gold mic icon
    ctx.fillStyle = inZone ? '#10b981' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(2, -29, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Particle simulations on stage
    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    particles.current = particles.current.filter(p => p.alpha > 0);

    // 7. Solid Crowd silhouette + hands waving
    ctx.fillStyle = '#0a0a0c'; // Solid dark silhouette color
    ctx.fillRect(0, h - 55, w, 55);

    ctx.fillStyle = '#050507'; // Foreground black crowd layering
    for (let x = 8; x < w; x += 22) {
      const swingHeight = Math.sin(x * 0.1 + performance.now() * 0.003) * 12 + 18;
      ctx.beginPath();
      ctx.ellipse(x, h - 15, 6, swingHeight, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overlay warning
    if (inZone) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#10b981';
      ctx.font = '900 12px "Space Grotesk"';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.fillText('YAKALADIN! %150 ENERJI', pX, pY - 32);
      ctx.restore();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center overflow-hidden touch-none select-none font-sans">
      {gyroPermission === 'prompt' ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-black to-black">
          <h2 className="text-2xl font-black text-white leading-none tracking-tight mb-3 uppercase">SPOT IŞIĞI OYUNU</h2>
          <p className="text-neutral-300 text-xs font-bold leading-relaxed max-w-xs uppercase tracking-wider mb-8">
            Nasıl oynamak istersiniz? Telefon sensörüyle oynamak benzersiz bir performans deneyimi sunar!
          </p>

          <div className="w-full max-w-xs flex flex-col gap-3">
            <button
              onClick={handleEnablePermission}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm uppercase tracking-wide shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/20 hover:brightness-110"
            >
              <span>TELEFON SENSÖRÜ (TİLT)</span>
            </button>
            <button
              onClick={handleSkipPermission}
              className="w-full py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 font-extrabold text-xs uppercase tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10"
            >
              <span>DOKUNARAK / SÜRÜKLEYEREK</span>
            </button>
          </div>
        </div>
      ) : !isPlaying ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-black to-black">
          <span className="text-8xl font-black text-blue-400 mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(59,130,246,0.65)]">{countdown}</span>
          <h2 className="text-2xl font-black text-white leading-none tracking-tight mb-2 uppercase">TAKİP PROJEKSİYONU!</h2>
          <p className="text-neutral-400 text-xs font-bold leading-relaxed max-w-xs uppercase tracking-widest leading-normal">
            {usingGyro ? (
              <>
                <span className="text-blue-400 font-extrabold block mb-2">TELEFONU EĞİP BÜKEREK (TİLT)</span>
                spot ışığını sanatçının üzerinde tut ve coşkuyu patlat!
              </>
            ) : (
              <>
                Parmağını kaydırarak spot ışığını <br/>
                <span className="text-blue-300">Sanatçının üzerinde tut ve coşkuyu patlat!</span>
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          {/* Active play HUD overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 tracking-tight lowercase">mini-game • stage spotlight</span>
              <h2 className="text-xl font-extrabold text-white tracking-tighter leading-none lowercase">
                spot ışığını sabitle.
              </h2>
              {usingGyro && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span className="text-[9px] text-blue-400 uppercase font-black tracking-tight font-mono">📱 ciroskop aktif</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-blue-400 leading-none">{timeLeft}s</div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">COŞKU: %{score}</span>
            </div>
          </div>
        </>
      )}

      <canvas
        ref={canvasRef}
        width={380}
        height={580}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        className="w-full h-full max-w-md max-h-[800px] border border-white/5 rounded-3xl overflow-hidden bg-black shadow-2xl"
      />
    </div>
  );
};
