import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playErrorSound } from '../../services/sfx';
import { GameOverScreen } from '../GameOverScreen';

interface Props {
  onExit: () => void;
  onGameEnd: (score: number) => void;
}

// Custom gameplay config
const GAME_SPEED_INITIAL = 2.8; 
const ROTATION_SPEED_INITIAL = 0.022;
const PLAYER_DISTANCE = 70; 
const WALL_THICKNESS = 18;
const WALL_SPAWN_RATE = 45; 

// Modern Glowing Theme
const THEME = {
    bg: '#000000',
    primary: '#f43f5e', // Hot Cyber Pink-Red
    accent: '#ffffff',
    danger: '#ef4444',
    grid: '#120408'
};

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
}

export const HexagonGame: React.FC<Props> = ({ onExit, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // High Frequency engine references
  const engineRef = useRef({
      isRunning: false,
      rotation: 0, 
      rotationSpeed: ROTATION_SPEED_INITIAL,
      walls: [] as { side: number, distance: number, height: number }[],
      playerAngle: 0, 
      speed: GAME_SPEED_INITIAL,
      frameCount: 0,
      score: 0,
      pulse: 0,
      particles: [] as Particle[]
  });

  const requestRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef({ left: false, right: false });

  // Handle Resize safely using ResizeObserver behavior
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  useEffect(() => {
      const stored = localStorage.getItem('flowify_hexagon_hs');
      if (stored) setHighScore(parseInt(stored));

      audioRef.current = new Audio("https://files.catbox.moe/ksaxm7.mp3"); 
      audioRef.current.loop = true;
      audioRef.current.volume = 0.55;

      return () => stopGame();
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 15) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.2 + Math.random() * 4.4;
          engineRef.current.particles.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color,
              life: 1.0,
              size: 2 + Math.random() * 3
          });
      }
  };

  const startGame = () => {
      engineRef.current = {
          isRunning: true,
          rotation: 0,
          rotationSpeed: ROTATION_SPEED_INITIAL,
          walls: [],
          playerAngle: 0, 
          speed: GAME_SPEED_INITIAL,
          frameCount: 0,
          score: 0,
          pulse: 0,
          particles: []
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
      const finalScore = Math.floor(engineRef.current.score);
      if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('flowify_hexagon_hs', finalScore.toString());
      }
      setGameState('gameover');
  };

  const spawnWall = () => {
      const { score } = engineRef.current;
      
      if (score > 12 && score % 10 < 0.1) engineRef.current.speed += 0.12;
      if (score > 18 && score % 12 < 0.1) engineRef.current.rotationSpeed += 0.0015;

      const randomSide = Math.floor(Math.random() * 6);
      const spawnDist = 450; 

      const patternType = Math.random();
      if (patternType > 0.35) {
          for(let i=0; i<6; i++) {
              if (i !== randomSide) {
                  engineRef.current.walls.push({ side: i, distance: spawnDist, height: WALL_THICKNESS });
              }
          }
      } else {
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
      
      // Update ticks and scores
      engineRef.current.frameCount++;
      engineRef.current.score += 0.0166; 
      setScore(Math.floor(engineRef.current.score));

      // Synchronize game rotation and zoom pulse
      engineRef.current.pulse = Math.sin(engineRef.current.frameCount * 0.15) * 4;
      engineRef.current.rotation += engineRef.current.rotationSpeed;

      // Handle input rotations
      const moveSpeed = 0.13; 
      if (inputRef.current.left) engineRef.current.playerAngle -= moveSpeed;
      if (inputRef.current.right) engineRef.current.playerAngle += moveSpeed;

      // Wrap angles
      if (engineRef.current.playerAngle < 0) engineRef.current.playerAngle += Math.PI * 2;
      if (engineRef.current.playerAngle > Math.PI * 2) engineRef.current.playerAngle -= Math.PI * 2;

      // Spawn walls
      const currentSpawnRate = Math.max(30, WALL_SPAWN_RATE - Math.floor(engineRef.current.score / 2.5));
      if (engineRef.current.frameCount % currentSpawnRate === 0) {
          spawnWall();
      }

      // Physics/Walls updates
      for (let i = engineRef.current.walls.length - 1; i >= 0; i--) {
          const wall = engineRef.current.walls[i];
          wall.distance -= engineRef.current.speed;

          if (wall.distance < 15) {
              engineRef.current.walls.splice(i, 1);
              continue;
          }

          const hitDist = PLAYER_DISTANCE; 
          if (wall.distance < hitDist + 14 && wall.distance > hitDist - 4) {
              let relAngle = (engineRef.current.playerAngle - engineRef.current.rotation) % (Math.PI * 2);
              if (relAngle < 0) relAngle += Math.PI * 2;

              const sector = Math.floor(relAngle / (Math.PI / 3)); 
              const sectorCenter = (sector * (Math.PI / 3)) + (Math.PI / 6);
              let angleDiff = relAngle - sectorCenter;
              
              if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

              const hitTolerance = 0.44; 
              if (sector === wall.side && Math.abs(angleDiff) < hitTolerance) {
                  // Fire spectacular death particles!
                  const pAngle = engineRef.current.playerAngle - engineRef.current.rotation;
                  const deathX = centerX + Math.cos(pAngle) * hitDist;
                  const deathY = centerY + Math.sin(pAngle) * hitDist;
                  spawnParticles(deathX, deathY, '#ffffff', 25);
                  spawnParticles(deathX, deathY, THEME.primary, 25);
                  gameOver();
                  return;
              }
          }
      }

      // --- RENDER ACTION ---
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Radial reactive scanline grid
      ctx.save();
      ctx.rotate(engineRef.current.rotation * 0.1);
      ctx.strokeStyle = THEME.grid;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * (1000 + engineRef.current.pulse), Math.sin(angle) * (1000 + engineRef.current.pulse));
      }
      ctx.stroke();
      
      // Beautiful glowing outer rings
      const ringOffset = (engineRef.current.frameCount * 1.5) % 180;
      ctx.strokeStyle = '#180206';
      ctx.lineWidth = 1;
      for (let r = 0; r < 4; r++) {
          const dist = 80 + (r * 180) + ringOffset;
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) {
              const angle = i * Math.PI / 3;
              if (i === 0) ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
              else ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
          }
          ctx.stroke();
      }
      ctx.restore();

      // Dynamic canvas screen rotating
      ctx.rotate(engineRef.current.rotation);

      // Safe glowing center hexagon
      const pulseSize = 35 + engineRef.current.pulse;
      ctx.fillStyle = '#0f0205';
      ctx.strokeStyle = THEME.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
          const angle = i * Math.PI / 3;
          const x = Math.cos(angle) * pulseSize;
          const y = Math.sin(angle) * pulseSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw obstacle walls
      ctx.fillStyle = THEME.primary;
      engineRef.current.walls.forEach(wall => {
          const startAngle = wall.side * (Math.PI / 3);
          const endAngle = (wall.side + 1) * (Math.PI / 3);
          const dist = wall.distance;
          const thickness = wall.height;
          const pad = 0.04; 

          ctx.beginPath();
          ctx.moveTo(dist * Math.cos(startAngle + pad), dist * Math.sin(startAngle + pad));
          ctx.lineTo((dist + thickness) * Math.cos(startAngle + pad), (dist + thickness) * Math.sin(startAngle + pad));
          ctx.lineTo((dist + thickness) * Math.cos(endAngle - pad), (dist + thickness) * Math.sin(endAngle - pad));
          ctx.lineTo(dist * Math.cos(endAngle - pad), dist * Math.sin(endAngle - pad));
          ctx.closePath();
          ctx.fill();
      });

      // Draw active player wedge
      const pAngle = engineRef.current.playerAngle - engineRef.current.rotation;
      const pDist = PLAYER_DISTANCE;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const tipX = Math.cos(pAngle) * (pDist + 9);
      const tipY = Math.sin(pAngle) * (pDist + 9);
      const wing1X = Math.cos(pAngle + 0.16) * (pDist - 6);
      const wing1Y = Math.sin(pAngle + 0.16) * (pDist - 6);
      const wing2X = Math.cos(pAngle - 0.16) * (pDist - 6);
      const wing2Y = Math.sin(pAngle - 0.16) * (pDist - 6);

      ctx.moveTo(tipX, tipY);
      ctx.lineTo(wing1X, wing1Y);
      ctx.lineTo(wing2X, wing2Y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Render non-rotated particles in screen-space
      engineRef.current.particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.022;
          
          if (p.life > 0) {
              ctx.save();
              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
          }
      });
      engineRef.current.particles = engineRef.current.particles.filter(p => p.life > 0);

      requestRef.current = requestAnimationFrame(gameLoop);
  };

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

  if (gameState === 'menu') {
      return (
          <div className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
              
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
                  <span className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">arcade • hexagon</span>
                  <button 
                    onClick={onExit} 
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/5 text-[9px] font-black text-neutral-400 hover:text-white transition-all lowercase"
                  >
                      geri dön
                  </button>
              </div>
              
              <div className="relative z-10 text-center max-w-sm px-6 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500/10 to-black rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] mb-6 flex items-center justify-center border border-rose-500/20 relative overflow-hidden">
                      <div className="text-2xl font-black text-rose-500 tracking-tighter">HEX</div>
                  </div>
                  
                  <span className="text-[9px] font-black tracking-widest text-[#f43f5e] uppercase mb-1">REFLEKS VE ODAK</span>
                  <h1 className="text-3xl font-black text-white tracking-tighter leading-none lowercase mb-3">akış tuzağı.</h1>
                  <p className="text-[10px] text-neutral-500 font-medium tracking-tight mb-8 lowercase leading-relaxed">
                      kapanan altıgen engellerden yüksek reflekslerle kurtul. ne kadar dayanabilirsin?
                  </p>

                  <button 
                    onClick={startGame}
                    className="bg-rose-500 text-white font-black py-3.5 px-10 rounded-2xl hover:scale-103 active:scale-95 transition-all text-[11px] tracking-wide shadow-[0_4px_25px_rgba(244,63,94,0.2)] lowercase"
                  >
                      oyuna başla
                  </button>
                  
                  {highScore > 0 && (
                      <div className="mt-8 text-neutral-500 text-[10px] font-bold lowercase tracking-tight">
                          en yüksek skorun: <span className="text-rose-400">{highScore}</span>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (gameState === 'gameover') {
      return (
          <GameOverScreen 
            gameName="HEXAGON"
            score={Math.floor(score)}
            onContinue={() => { onGameEnd(Math.floor(score)); onExit(); }}
          />
      );
  }

  return (
      <div 
        className="h-full w-full bg-black relative overflow-hidden touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
          {/* HUD Overlay */}
          <div className="absolute top-0 left-0 right-0 p-5 pt-safe z-20 flex justify-between pointer-events-none items-center">
              <div className="text-3xl font-black text-white/40 tracking-tighter">{Math.floor(score)}</div>
              <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                  {score < 10 ? 'TEMPO' : score < 25 ? 'HIZLI' : 'CRAZY MODE'}
              </div>
          </div>

          <div className="absolute top-5 right-5 z-30 pointer-events-auto">
             <button onClick={gameOver} className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 hover:text-white">✕</button>
          </div>

          {/* Interactive touch indicator areas */}
          <div className="absolute inset-0 flex pointer-events-none z-10 bg-transparent">
              <div className={`flex-1 transition-colors duration-150 ${inputRef.current.left ? 'border-r border-rose-500/5 bg-gradient-to-r from-rose-500/[0.015] to-transparent' : ''}`}></div>
              <div className={`flex-1 transition-colors duration-150 ${inputRef.current.right ? 'border-l border-rose-500/5 bg-gradient-to-l from-rose-500/[0.015] to-transparent' : ''}`}></div>
          </div>

          <canvas 
              ref={canvasRef}
              className="w-full h-full block"
          />
      </div>
  );
};
