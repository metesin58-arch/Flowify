
import React, { useRef, useEffect, useState } from 'react';
import { playErrorSound } from '../../services/sfx';
import { PlayIcon } from '../Icons';
import { GameOverScreen } from '../GameOverScreen';

interface Props {
  onExit: () => void;
  onGameEnd: (score: number) => void;
}

// --- GAME CONFIG ---
const GAME_SPEED_INITIAL = 3.0; 
const ROTATION_SPEED_INITIAL = 0.03;
const PLAYER_DISTANCE = 65; 
const WALL_THICKNESS = 20;
const WALL_SPAWN_RATE = 50; 

// Spotify Palette
const THEME = {
    bg: '#000000',
    primary: '#1ed760', // Spotify Green
    accent: '#ffffff',
    danger: '#ef4444',
    grid: '#121212'
};

export const HexagonGame: React.FC<Props> = ({ onExit, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Refs for Game Engine
  const engineRef = useRef({
      isRunning: false,
      rotation: 0, 
      rotationSpeed: ROTATION_SPEED_INITIAL,
      walls: [] as { side: number, distance: number, height: number }[],
      playerAngle: 0, 
      speed: GAME_SPEED_INITIAL,
      frameCount: 0,
      score: 0,
      pulse: 0
  });

  const requestRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef({ left: false, right: false });

  useEffect(() => {
      const stored = localStorage.getItem('flowify_hexagon_hs');
      if (stored) setHighScore(parseInt(stored));

      audioRef.current = new Audio("https://files.catbox.moe/ksaxm7.mp3"); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6;

      return () => stopGame();
  }, []);

  const startGame = () => {
      engineRef.current = {
          isRunning: true,
          rotation: 0,
          rotationSpeed: ROTATION_SPEED_INITIAL,
          walls: [],
          playerAngle: 0, // 0 radyan
          speed: GAME_SPEED_INITIAL,
          frameCount: 0,
          score: 0,
          pulse: 0
      };
      
      setScore(0);
      setGameState('playing');
      
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
      }

      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  const stopGame = () => {
      engineRef.current.isRunning = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioRef.current) audioRef.current.pause();
  };

  const gameOver = () => {
      stopGame();
      playErrorSound();
      if (engineRef.current.score > highScore) {
          setHighScore(Math.floor(engineRef.current.score));
          localStorage.setItem('flowify_hexagon_hs', Math.floor(engineRef.current.score).toString());
      }
      setGameState('gameover');
  };

  const spawnWall = () => {
      const { score } = engineRef.current;
      
      // Zorluk artışı
      if (score > 15 && score % 10 < 0.1) engineRef.current.speed += 0.15;
      if (score > 20 && score % 15 < 0.1) engineRef.current.rotationSpeed += 0.002;

      const randomSide = Math.floor(Math.random() * 6);
      const spawnDist = 800; 

      // Pattern: Genelde tek boşluk bırak
      const patternType = Math.random();
      
      if (patternType > 0.4) {
          // Tek delik (Standart Hexagon stili)
          for(let i=0; i<6; i++) {
              if (i !== randomSide) {
                  engineRef.current.walls.push({ side: i, distance: spawnDist, height: WALL_THICKNESS });
              }
          }
      } else {
          // Spiral veya rastgele
          engineRef.current.walls.push({ side: randomSide, distance: spawnDist, height: WALL_THICKNESS });
          engineRef.current.walls.push({ side: (randomSide + 3) % 6, distance: spawnDist, height: WALL_THICKNESS });
      }
  };

  const gameLoop = () => {
      if (!engineRef.current.isRunning || !canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Update Physics
      engineRef.current.frameCount++;
      engineRef.current.score += 0.02; 
      setScore(Math.floor(engineRef.current.score));

      // Beat Pulse (Visual only)
      engineRef.current.pulse = Math.sin(engineRef.current.frameCount * 0.2) * 5;

      // Rotation Logic
      engineRef.current.rotation += engineRef.current.rotationSpeed;

      // Player Movement - Balanced Speed
      const moveSpeed = 0.17; // Increased speed for better control feeling
      if (inputRef.current.left) engineRef.current.playerAngle -= moveSpeed;
      if (inputRef.current.right) engineRef.current.playerAngle += moveSpeed;

      // Normalize Angle
      if (engineRef.current.playerAngle < 0) engineRef.current.playerAngle += Math.PI * 2;
      if (engineRef.current.playerAngle > Math.PI * 2) engineRef.current.playerAngle -= Math.PI * 2;

      // Spawn Logic
      const currentSpawnRate = Math.max(25, WALL_SPAWN_RATE - Math.floor(engineRef.current.score / 2));
      if (engineRef.current.frameCount % currentSpawnRate === 0) {
          spawnWall();
      }

      // Wall Movement & Collision
      for (let i = engineRef.current.walls.length - 1; i >= 0; i--) {
          const wall = engineRef.current.walls[i];
          wall.distance -= engineRef.current.speed;

          if (wall.distance < 10) {
              engineRef.current.walls.splice(i, 1);
              continue;
          }

          // Collision Range
          const hitDist = PLAYER_DISTANCE; 
          // Wall depth check (Is the wall crossing the player's radius?)
          if (wall.distance < hitDist + 15 && wall.distance > hitDist - 5) {
              
              // Angular Check
              let relAngle = (engineRef.current.playerAngle - engineRef.current.rotation) % (Math.PI * 2);
              if (relAngle < 0) relAngle += Math.PI * 2;

              const sector = Math.floor(relAngle / (Math.PI / 3)); // 60 derece
              
              // Calculate offset within the sector (-30 to +30 degrees approx)
              const sectorCenter = (sector * (Math.PI / 3)) + (Math.PI / 6);
              let angleDiff = relAngle - sectorCenter;
              
              // Normalize angle diff
              if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

              // COLLISION FIX: Only die if the angle difference is small (meaning the tip hits the wall)
              // If the player is on the edge of the sector, allow them to graze it
              const hitTolerance = 0.4; // Radians (~23 degrees). Narrower means harder to hit sides.

              if (sector === wall.side && Math.abs(angleDiff) < hitTolerance) {
                  gameOver();
                  return;
              }
          }
      }

      // --- RENDER ---
      
      // 1. Clear Screen (Deep Black)
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      
      // 2. Background Grid (Pulse effect)
      // Rotating subtle lines
      ctx.save();
      ctx.rotate(engineRef.current.rotation * 0.2);
      ctx.strokeStyle = THEME.grid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * 1000, Math.sin(angle) * 1000);
      }
      ctx.stroke();
      
      // Hexagon Grid Rings (expanding)
      const ringOffset = (engineRef.current.frameCount * 2) % 200;
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      for (let r = 0; r < 5; r++) {
          const dist = 100 + (r * 200) + ringOffset;
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) {
              const angle = i * Math.PI / 3;
              if (i === 0) ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
              else ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
          }
          ctx.stroke();
      }
      ctx.restore();

      // 3. Apply Global Rotation for Game Objects
      ctx.rotate(engineRef.current.rotation);

      // 4. Draw Walls (Neon Bars)
      ctx.shadowBlur = 20;
      ctx.shadowColor = THEME.primary;
      ctx.fillStyle = THEME.primary;
      
      engineRef.current.walls.forEach(wall => {
          const startAngle = wall.side * (Math.PI / 3);
          const endAngle = (wall.side + 1) * (Math.PI / 3);
          
          // Draw as curved thick line segment (looks cleaner than trapezoid)
          const dist = wall.distance;
          const thickness = wall.height;
          
          // Use path for trapezoid shape to match sector logic
          // Add gap between sectors for "digital" look
          const pad = 0.05; 

          ctx.beginPath();
          ctx.moveTo(dist * Math.cos(startAngle + pad), dist * Math.sin(startAngle + pad));
          ctx.lineTo((dist + thickness) * Math.cos(startAngle + pad), (dist + thickness) * Math.sin(startAngle + pad));
          ctx.lineTo((dist + thickness) * Math.cos(endAngle - pad), (dist + thickness) * Math.sin(endAngle - pad));
          ctx.lineTo(dist * Math.cos(endAngle - pad), dist * Math.sin(endAngle - pad));
          ctx.closePath();
          ctx.fill();
      });

      // 5. Draw Player (Bright White Spark)
      // Calculate relative position
      const pAngle = engineRef.current.playerAngle - engineRef.current.rotation;
      const pDist = PLAYER_DISTANCE;
      
      // Glow Reset
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fff';
      ctx.fillStyle = '#fff';

      ctx.beginPath();
      // Triangle pointing outwards
      const tipX = Math.cos(pAngle) * (pDist + 8);
      const tipY = Math.sin(pAngle) * (pDist + 8);
      
      const wing1X = Math.cos(pAngle + 0.15) * (pDist - 8);
      const wing1Y = Math.sin(pAngle + 0.15) * (pDist - 8);
      
      const wing2X = Math.cos(pAngle - 0.15) * (pDist - 8);
      const wing2Y = Math.sin(pAngle - 0.15) * (pDist - 8);

      ctx.moveTo(tipX, tipY);
      ctx.lineTo(wing1X, wing1Y);
      ctx.lineTo(wing2X, wing2Y);
      ctx.closePath();
      ctx.fill();

      // 6. Draw Center Anchor (Tiny dot)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  // --- INPUT ---
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      let clientX;
      if ('touches' in e) clientX = e.touches[0].clientX;
      else clientX = (e as React.MouseEvent).clientX;

      if (clientX < window.innerWidth / 2) {
          inputRef.current.left = true;
          inputRef.current.right = false;
      } else {
          inputRef.current.right = true;
          inputRef.current.left = false;
      }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      inputRef.current = { left: false, right: false };
  };

  const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') inputRef.current.left = true;
      if (e.code === 'ArrowRight') inputRef.current.right = true;
  };

  const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') inputRef.current.left = false;
      if (e.code === 'ArrowRight') inputRef.current.right = false;
  };

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  // --- UI RENDER ---

  // Vignette Overlay Style
  const vignetteStyle: React.CSSProperties = {
      background: 'radial-gradient(circle, transparent 40%, black 100%)',
      pointerEvents: 'none'
  };

  if (gameState === 'menu') {
      return (
          <div className="h-full w-full bg-[#000] flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
              <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
              
              {/* Close Button */}
              <button onClick={onExit} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-white/10">✕</button>
              
              <div className="relative z-10 text-center animate-fade-in flex flex-col items-center">
                  
                  {/* Album Cover Style Logo */}
                  <div className="w-40 h-40 bg-gradient-to-br from-[#1ed760] to-[#121212] rounded shadow-[0_0_50px_rgba(30,215,96,0.3)] mb-8 flex items-center justify-center border border-white/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="text-6xl font-black italic text-black mix-blend-overlay">FLOW</div>
                      <div className="absolute bottom-2 right-3 text-xs font-bold text-black bg-[#1ed760] px-1 rounded">TRAP</div>
                  </div>
                  
                  <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2 drop-shadow-xl">
                      FLOW TRAP
                  </h1>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em] mb-12">
                      REFLEKS TESTİ
                  </p>

                  <button 
                    onClick={startGame}
                    className="w-16 h-16 bg-[#1ed760] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(30,215,96,0.4)]"
                  >
                      <PlayIcon className="w-6 h-6 text-black ml-1" />
                  </button>
                  
                  {highScore > 0 && (
                      <div className="mt-8 text-[#1ed760] text-sm font-mono font-bold">
                          HIGH SCORE: {highScore}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (gameState === 'gameover') {
      return (
          <GameOverScreen 
            gameName="FLOW TRAP"
            score={Math.floor(score)}
            onContinue={() => { onGameEnd(Math.floor(score)); onExit(); }}
          />
      );
  }

  return (
      <div 
        className="h-full w-full bg-black relative overflow-hidden touch-none select-none cursor-crosshair"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
          {/* HUD Layer */}
          <div className="absolute top-0 left-0 right-0 p-8 z-20 flex justify-between pointer-events-none">
              <div className="text-4xl font-black text-white/20 font-mono tracking-tighter">{Math.floor(score)}</div>
              <div className="text-[10px] font-bold text-[#1ed760] uppercase tracking-widest bg-[#1ed760]/10 px-2 py-1 rounded border border-[#1ed760]/20">
                  {score < 10 ? 'BAŞLANGIÇ' : score < 30 ? 'HIZLANIYOR' : 'GOD MODE'}
              </div>
          </div>

          <div className="absolute top-6 right-6 z-30 pointer-events-auto">
             <button onClick={gameOver} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white">✕</button>
          </div>

          {/* Touch Zones Visual (Very subtle) */}
          <div className="absolute inset-0 flex pointer-events-none z-10">
              <div className={`flex-1 border-r border-white/5 transition-colors duration-100 ${inputRef.current.left ? 'bg-white/[0.02]' : ''}`}></div>
              <div className={`flex-1 border-l border-white/5 transition-colors duration-100 ${inputRef.current.right ? 'bg-white/[0.02]' : ''}`}></div>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 z-10" style={vignetteStyle}></div>

          <canvas 
              ref={canvasRef}
              width={window.innerWidth}
              height={window.innerHeight}
              className="w-full h-full block"
          />
      </div>
  );
};
