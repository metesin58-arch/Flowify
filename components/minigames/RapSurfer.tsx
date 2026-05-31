import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Props {
  onComplete: (score: number) => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface BeatNode {
  y: number;
  type: 'perfect' | 'bonus' | 'hazard';
  hit: boolean;
  scoreGained: boolean;
}

export const RapSurfer: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10); // 10s gameplay

  // Game tracking states
  const playerXHandler = useRef(0);
  const playerXSmooth = useRef(0);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const totalRef = useRef(0);
  const offsetRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const beatNodesRef = useRef<BeatNode[]>([]);
  const flashes = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);
  const animationRef = useRef<number>(0);

  // Procedural wave params - randomized drastically each play!
  const waveParams = useRef({
    baseAmp: 80,
    frequency1: 0.006,
    frequency2: 0.015,
    speed: 7.5,
    hue: 280,
    wobbleSpeed: 0.1,
    noiseFactor: 1.0,
  });

  const PATH_WIDTH = 130;

  useEffect(() => {
    // Generate organic variety for this session
    const h = Math.random() * 360;
    waveParams.current = {
      baseAmp: 75 + Math.random() * 55, // 75-130px amplitude
      frequency1: 0.003 + Math.random() * 0.005, // base wavelength
      frequency2: 0.01 + Math.random() * 0.015, // subharmonic wavelength
      speed: 7 + Math.random() * 4, // scroll speed
      hue: h, // completely dynamic neon color scheme!
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      noiseFactor: 10 + Math.random() * 20,
    };

    // Initialize random beat nodes along the vertical path
    const nodes: BeatNode[] = [];
    for (let y = -2000; y < 1000; y += 120) {
      if (Math.random() > 0.4) {
        nodes.push({
          y,
          type: Math.random() > 0.85 ? 'bonus' : 'perfect',
          hit: false,
          scoreGained: false,
        });
      }
    }
    beatNodesRef.current = nodes;

    const introTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(introTimer);
          setIsPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(introTimer);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const spawnPerfectParticles = (x: number, y: number, color: string, count = 5) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: 2 + Math.random() * 3,
      });
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset smooth pointer to center
    playerXSmooth.current = canvas.width / 2;
    playerXHandler.current = canvas.width / 2;

    const gameLoop = () => {
      // 1. Dark Neon Scanline grid background
      // Update camera flashes inside the loop
      const w = canvas.width;
      const h = canvas.height;
      if (Math.random() > 0.94) {
        flashes.current.push({
          x: Math.random() * w,
          y: h * 0.1 + Math.random() * h * 0.35,
          size: 15 + Math.random() * 20,
          alpha: 1.0,
        });
      }
      flashes.current.forEach(f => {
        f.alpha -= 0.05;
      });
      flashes.current = flashes.current.filter(f => f.alpha > 0);

      // 1. Unified black background, graffitis, and camera flashes
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

      // 3. Render exploding camera flashes
      flashes.current.forEach(f => {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        const flashGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size);
        flashGlow.addColorStop(0, '#ffffff');
        flashGlow.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        flashGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = flashGlow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Solid Crowd silhouette + hands waving
      ctx.fillStyle = '#0a0a0c'; // Solid dark silhouette color
      ctx.fillRect(0, h - 55, w, 55);

      ctx.fillStyle = '#050507'; // Foreground black crowd layering
      for (let x = 8; x < w; x += 22) {
        const swingHeight = Math.sin(x * 0.1 + performance.now() * 0.003) * 12 + 18;
        ctx.beginPath();
        ctx.ellipse(x, h - 15, 6, swingHeight, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update vertical scrolling offset
      const wp = waveParams.current;
      offsetRef.current += wp.speed;

      // 2. Procedural Compound wave equation (Highly dynamic and varying!)
      const getWaveX = (y: number) => {
        const virtualY = y - offsetRef.current;
        // Primary Harmonic
        const sin1 = Math.sin(virtualY * wp.frequency1) * wp.baseAmp;
        // Secondary Harmonic (adds roughness/rhythm details)
        const cos2 = Math.cos(virtualY * wp.frequency2) * (wp.baseAmp * 0.4);
        // Dynamic wobble over time
        const wob = Math.sin(performance.now() * 0.002) * wp.noiseFactor;
        
        return (canvas.width / 2) + sin1 + cos2 + wob;
      };

      const playerY = canvas.height - 180;

      // Smooth modern dampening for player cursor responsiveness
      playerXSmooth.current += (playerXHandler.current - playerXSmooth.current) * 0.28;

      // Draw flowing outer glow path
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = `hsla(${wp.hue}, 90%, 55%, 0.4)`;
      ctx.strokeStyle = `hsla(${wp.hue}, 85%, 35%, 0.15)`;
      ctx.lineWidth = PATH_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let y = -40; y < canvas.height + 40; y += 15) {
        const wx = getWaveX(y);
        if (y === -40) ctx.moveTo(wx, y);
        else ctx.lineTo(wx, y);
      }
      ctx.stroke();
      ctx.restore();

      // Draw sweet center tracking laser pipeline
      ctx.strokeStyle = `hsla(${wp.hue}, 100%, 55%, 0.85)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = -40; y < canvas.height + 40; y += 15) {
        const wx = getWaveX(y);
        if (y === -40) ctx.moveTo(wx, y);
        else ctx.lineTo(wx, y);
      }
      ctx.stroke();

      // Draw procedural sub-bars (equalizer look and feel intersecting the path)
      for (let y = 30; y < canvas.height; y += 80) {
        const wx = getWaveX(y);
        const volumeHeight = 15 + Math.sin(y * 0.1 + performance.now() * 0.015) * 18;
        ctx.strokeStyle = `hsla(${wp.hue + 45}, 90%, 50%, 0.12)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx - PATH_WIDTH / 2, y);
        ctx.lineTo(wx - PATH_WIDTH / 2 - volumeHeight, y);
        ctx.moveTo(wx + PATH_WIDTH / 2, y);
        ctx.lineTo(wx + PATH_WIDTH / 2 + volumeHeight, y);
        ctx.stroke();
      }

      // Update and Draw collectible Beat Nodes
      beatNodesRef.current.forEach(node => {
        // Move nodes downward as we scroll
        const nodeY = node.y + offsetRef.current;
        if (nodeY > -50 && nodeY < canvas.height + 50) {
          const nodeX = getWaveX(nodeY);

          // Render beat node
          ctx.save();
          if (node.hit) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
            ctx.strokeStyle = '#10b981';
          } else {
            ctx.fillStyle = node.type === 'bonus' ? '#f59e0b' : '#3b82f6';
            ctx.strokeStyle = '#ffffff';
            ctx.shadowBlur = 12;
            ctx.shadowColor = ctx.fillStyle as string;
          }
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, node.type === 'bonus' ? 10 : 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Collision with Player tracking window
          if (!node.hit && Math.abs(nodeY - playerY) < 22) {
            const discToX = Math.abs(playerXSmooth.current - nodeX);
            if (discToX < PATH_WIDTH / 2) {
              node.hit = true;
              scoreRef.current += node.type === 'bonus' ? 85 : 45;
              spawnPerfectParticles(nodeX, nodeY, `hsla(${wp.hue}, 100%, 70%, 1)`, 12);
            }
          }
        }
      });

      // Calculate perfect center difference
      const targetWaveX = getWaveX(playerY);
      const diff = Math.abs(playerXSmooth.current - targetWaveX);
      const inZone = diff < (PATH_WIDTH / 2);

      totalRef.current += 1;
      if (inZone) {
        hitsRef.current += 1;
        scoreRef.current += diff < 15 ? 3 : 1; // Double points for absolute perfect center
        
        // Emitting trails continuously
        if (performance.now() % 3 < 1.5) {
          particlesRef.current.push({
            id: Math.random().toString(),
            x: playerXSmooth.current,
            y: playerY,
            vx: (Math.random() - 0.5) * 3,
            vy: 2 + Math.random() * 3, // Drift upward/downward
            color: `hsla(${wp.hue + (diff < 15 ? 60 : 0)}, 100%, 65%, 0.8)`,
            alpha: 0.8,
            size: 2 + Math.random() * 2,
          });
        }
      } else {
        // Red Glitch Overlay when Detone occurs
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

      // Draw Player Node
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = inZone ? `hsla(${wp.hue}, 100%, 65%, 0.8)` : '#ef4444';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = inZone ? `hsla(${wp.hue}, 100%, 55%, 1)` : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerXSmooth.current, playerY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini-equalizer circles expanding
      if (inZone && diff < 15) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(playerXSmooth.current, playerY, 20 + (performance.now() % 15), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    // Timer logic
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(gameTimer);
    };
  }, [isPlaying]);

  // Handle completion when timeLeft hits 0
  useEffect(() => {
    if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
      // Determine final performance out of 100%
      const accuracy = (hitsRef.current / totalRef.current) * 100;
      const finalScore = Math.min(100, Math.floor(accuracy));
      setTimeout(() => {
        onComplete(finalScore);
      }, 0);
    }
  }, [timeLeft, isPlaying, onComplete]);

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let cx = 0;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
    } else if ('clientX' in e) {
      cx = (e as React.MouseEvent).clientX;
    } else {
      return;
    }
    playerXHandler.current = cx - rect.left;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden touch-none select-none">
      {!isPlaying ? (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/10 via-black to-black">
          <span className="text-8xl font-black text-purple-400 mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.65)]">{countdown}</span>
          <h2 className="text-2xl font-black text-white italic leading-none tracking-tight mb-2">SES DALGASI SÖRFÜ!</h2>
          <p className="text-neutral-400 text-xs font-bold leading-relaxed max-w-xs uppercase tracking-widest leading-normal">
            Parmağını kaydırarak rotada kal. <br/>
            <span className="text-yellow-400">Ritim noktalarını yakalayarak efsane kombo patlat!</span>
          </p>
        </div>
      ) : (
        <>
          {/* Real-time HUD stats visual overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10 font-sans">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 tracking-tight lowercase">mini-game • rap surfer</span>
              <h2 className="text-xl font-extrabold text-white tracking-tighter leading-none lowercase">
                akışı koru.
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-purple-400 leading-none">{timeLeft}s</div>
              <span className="text-[9px] font-bold text-lime-400 uppercase tracking-wider">Kombo canlanıyor!</span>
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
