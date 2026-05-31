import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DiscIcon } from '../Icons';
import { playErrorSound } from '../../services/sfx';
import { GameOverScreen } from '../GameOverScreen';
import { motion } from 'motion/react';

interface FlappyDiskGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
}

const GAME_MUSIC_URL = "https://files.catbox.moe/buq95f.mp3"; 

const GRAVITY = 0.55;
const JUMP_STRENGTH = -8.2;
const PIPE_SPEED = 3.6; 
const PIPE_SPAWN_RATE = 85; 
const GAP_SIZE = 185; 

interface Particle {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
}

class FlappyAudioFX {
  private ctx: AudioContext | null = null;
  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}

const audiofx = new FlappyAudioFX();

export const FlappyDiskGame: React.FC<FlappyDiskGameProps> = ({ onExit, onGameEnd }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const gameRunningRef = useRef(false);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  const birdY = useRef(250);
  const birdVelocity = useRef(0);
  const birdRotation = useRef(0);
  const pipes = useRef<{ x: number, topHeight: number, passed: boolean }[]>([]);
  const trailParticles = useRef<Particle[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
      const stored = localStorage.getItem('flowify_flappy_hs');
      if (stored) setHighScore(parseInt(stored));
      
      audioRef.current = new Audio(GAME_MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;

      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
          cancelAnimationFrame(requestRef.current);
      }
  }, []);

  const spawnParticles = (x: number, y: number, color = '#1ed760', num = 3) => {
    for (let i = 0; i < num; i++) {
        trailParticles.current.push({
            id: `tp-${Math.random().toString()}`,
            x,
            y,
            size: 2 + Math.random() * 3,
            color,
            opacity: 0.9
        });
    }
  };

  const loop = useCallback(() => {
      if (!gameRunningRef.current) return;

      // 1. Bird gravity physics physics & rotation
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;
      birdRotation.current += 4.5 + Math.abs(birdVelocity.current) * 0.4;

      // Spawn faint spark particles behind player
      spawnParticles(70, birdY.current + 20, '#1ed760', 1);

      // 2. Spawn obstacle pipes
      frameCountRef.current++;
      if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
          const mHeight = 80;
          const height = Math.floor(mHeight + Math.random() * (window.innerHeight - GAP_SIZE - mHeight * 2));
          pipes.current.push({
              x: window.innerWidth,
              topHeight: height,
              passed: false
          });
      }

      // 3. Move obstacle pipes left
      for (let i = pipes.current.length - 1; i >= 0; i--) {
          const p = pipes.current[i];
          p.x -= PIPE_SPEED;
          
          if (p.x < -80) {
              pipes.current.splice(i, 1);
          }
      }

      // 4. Trail animations
      trailParticles.current.forEach(p => {
          p.x -= 2;
          p.y += (Math.random() - 0.5) * 1.5;
          p.opacity -= 0.025;
      });
      trailParticles.current = trailParticles.current.filter(p => p.opacity > 0);

      // 5. Collision checks
      const r = 16; 
      const bY = birdY.current + 20; 
      const bX = 70; 

      if (birdY.current < -30 || birdY.current > window.innerHeight - 15) {
          gameOver();
          return;
      }

      let collision = false;
      const pipeWidth = 60; 

      pipes.current.forEach(p => {
          if (bX + r > p.x && bX - r < p.x + pipeWidth) {
              if (bY - r < p.topHeight || bY + r > p.topHeight + GAP_SIZE) {
                  collision = true;
              }
          }

          if (!p.passed && bX > p.x + pipeWidth) {
              p.passed = true;
              setScore(s => s + 1);
          }
      });

      if (collision) {
          gameOver();
          return;
      }

      setTick(prev => prev + 1);
      requestRef.current = requestAnimationFrame(loop);
  }, []);

  const startGame = () => {
      birdY.current = window.innerHeight / 2 - 100;
      birdVelocity.current = 0;
      birdRotation.current = 0;
      pipes.current = [];
      trailParticles.current = [];
      frameCountRef.current = 0;
      
      setScore(0);
      setGameState('playing');
      gameRunningRef.current = true;
      
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
      }
      
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(loop);
  };

  const jump = () => {
      if (!gameRunningRef.current) return;
      audiofx.playJump();
      birdVelocity.current = JUMP_STRENGTH;
  };

  const gameOver = () => {
      gameRunningRef.current = false;
      playErrorSound();
      cancelAnimationFrame(requestRef.current);
      if (audioRef.current) audioRef.current.pause();
      
      if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('flowify_flappy_hs', score.toString());
      }
      setGameState('gameover');
  };

  // Keyboard and touch binds
  useEffect(() => {
      const handleInput = (e?: Event) => {
          if (e) {
             const target = e.target as HTMLElement;
             if (target.tagName === 'BUTTON') return;
             e.preventDefault();
          }

          if (gameState === 'playing') jump();
          else if (gameState === 'menu') startGame();
      };

      window.addEventListener('mousedown', handleInput);
      window.addEventListener('touchstart', handleInput, { passive: false });
      
      const handleSpace = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
              e.preventDefault();
              handleInput();
          }
      };
      window.addEventListener('keydown', handleSpace);

      return () => {
          window.removeEventListener('mousedown', handleInput);
          window.removeEventListener('touchstart', handleInput);
          window.removeEventListener('keydown', handleSpace);
      };
  }, [gameState]);

  return (
      <div className="h-full w-full bg-[#030303] relative overflow-hidden select-none touch-none cursor-pointer">
          
          {/* Parallax moving grid behind equalizers */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ 
              backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
              backgroundSize: '45px 45px',
              animation: 'fScroll 4s linear infinite',
          }} />
          <style>{`@keyframes fScroll { from { background-position: 0 0; } to { background-position: -45px 0; } }`}</style>

          {/* Spark trail */}
          {trailParticles.current.map(p => (
              <div 
                key={p.id}
                className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-15"
                style={{
                    left: p.x,
                    top: p.y,
                    backgroundColor: p.color,
                    opacity: p.opacity,
                    transform: 'translate(-50%, -50%) scale(' + (p.opacity * 1.5) + ')'
                }}
              />
          ))}

          {/* Pipes overlay */}
          {pipes.current.map((p, idx) => {
              const bottomHeight = window.innerHeight - p.topHeight - GAP_SIZE;
              return (
                <React.Fragment key={idx}>
                    {/* Top Pipe */}
                    <div 
                      className="absolute top-0 w-[60px] bg-neutral-950 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] rounded-b-xl z-20 flex flex-col justify-end"
                      style={{ left: p.x, height: p.topHeight, willChange: 'left' }}
                    >
                        <div className="w-full h-1 bg-[#1ed760] shadow-[0_0_12px_#1ed760] rounded-b-full h-[5px]" />
                        <div className="flex-1 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #1ed760 1px, transparent 1px)', backgroundSize: '10px 100%' }} />
                    </div>

                    {/* Bottom Pipe */}
                    <div 
                      className="absolute bottom-0 w-[60px] bg-neutral-950 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] rounded-t-xl z-20 flex flex-col justify-start"
                      style={{ left: p.x, height: bottomHeight, willChange: 'left' }}
                    >
                        <div className="w-full h-1 bg-[#1ed760] shadow-[0_0_12px_#1ed760] rounded-t-full h-[5px]" />
                        <div className="flex-1 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #1ed760 1px, transparent 1px)', backgroundSize: '10px 100%' }} />
                    </div>
                </React.Fragment>
              );
          })}

          {/* Record disk player */}
          <div 
            className="absolute left-[50px] w-10 h-10 z-30 flex items-center justify-center rounded-full bg-zinc-950 border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
            style={{ 
                top: birdY.current,
                transform: `rotate(${birdRotation.current}deg)`,
                willChange: 'top, transform' 
            }}
          >
              <div className="w-4 h-4 rounded-full bg-emerald-950 flex items-center justify-center font-black text-[5px] text-emerald-300">LP</div>
          </div>

          {/* Big display background score */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div className="text-[14rem] font-black text-emerald-500/[0.04] italic tracking-tighter cursor-none leading-none select-none">{score}</div>
          </div>

          {/* Display HUD */}
          {gameState === 'playing' && (
              <div className="absolute top-5 left-5 right-5 pointer-events-none z-40 flex justify-between tracking-tight lowercase font-sans items-center">
                  <span className="text-xl font-black text-white">{score}</span>
                  <span className="text-[10px] font-black tracking-tight text-[#1ed760] bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 rounded-full">uçan plak.</span>
              </div>
          )}

          {gameState === 'menu' && (
              <div className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans select-none z-50">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onExit(); }} 
                    className="absolute top-6 right-6 z-50 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                      ✕
                  </motion.button>

                  <div className="relative z-10 text-center max-w-sm px-6 flex flex-col items-center">
                      <div className="w-20 h-20 mb-8 rounded-3xl border border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-center animate-spin-slow">
                          <DiscIcon className="w-8 h-8 text-emerald-400" />
                      </div>
                      
                      <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase mb-1">RİTİM VE HIZ</span>
                      <h1 className="text-3xl font-black text-white tracking-tighter leading-none lowercase mb-3">flappy disk.</h1>
                      
                      <p className="text-[10px] text-neutral-500 font-medium tracking-tight mb-12 h-10 leading-relaxed lowercase max-w-[200px]">
                          plağı çarpmadan ne kadar döndürebilirsin? boşluk veya tıklamayla zıpla.
                      </p>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); startGame(); }} 
                        className="bg-[#1ed760] text-black font-black py-3.5 px-10 rounded-2xl hover:scale-103 active:scale-95 transition-all text-[11px] tracking-wide shadow-[0_4px_25px_rgba(16,185,129,0.2)] lowercase"
                      >
                          plağı fırlat
                      </button>

                      {highScore > 0 && (
                          <div className="mt-8 text-neutral-500 text-[10px] font-bold lowercase tracking-tight">
                              en yüksek skorun: <span className="text-emerald-400">{highScore}</span>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {gameState === 'gameover' && (
              <GameOverScreen 
                gameName="flappy disk"
                score={score}
                onContinue={() => { onGameEnd(score); onExit(); }}
                isWin={false}
              />
          )}

      </div>
  );
};
