
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DiscIcon } from '../Icons';
import { playClickSound, playErrorSound } from '../../services/sfx';
import { GameOverScreen } from '../GameOverScreen';

interface FlappyDiskGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
}

// !!! MÜZİK LİNKİ BURAYA !!!
const GAME_MUSIC_URL = "https://files.catbox.moe/buq95f.mp3"; 

// Physics Constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = -9;
const PIPE_SPEED = 4; // Slightly faster for smoother feel
const PIPE_SPAWN_RATE = 80; 
const GAP_SIZE = 190; 

export const FlappyDiskGame: React.FC<FlappyDiskGameProps> = ({ onExit, onGameEnd }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // --- GAME ENGINE REFS (Mutable state for 60FPS loop) ---
  const gameRunningRef = useRef(false);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  const birdY = useRef(300);
  const birdVelocity = useRef(0);
  const birdRotation = useRef(0);
  const pipes = useRef<{ x: number, topHeight: number, passed: boolean, type: number }[]>([]);
  
  // Music Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Force Render Trigger
  const [, setTick] = useState(0);

  // Init High Score & Music
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

  // --- GAME LOOP ---
  const loop = useCallback(() => {
      if (!gameRunningRef.current) return;

      // 1. Update Bird Physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;
      birdRotation.current += 5; // Spin constantly

      // 2. Spawn Pipes
      frameCountRef.current++;
      if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
          const minHeight = 100;
          const maxHeight = window.innerHeight - GAP_SIZE - 100;
          const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          
          pipes.current.push({
              x: window.innerWidth,
              topHeight: height,
              passed: false,
              type: Math.floor(Math.random() * 3) 
          });
      }

      // 3. Move Pipes
      for (let i = pipes.current.length - 1; i >= 0; i--) {
          const p = pipes.current[i];
          p.x -= PIPE_SPEED;
          
          // Cleanup off-screen pipes
          if (p.x < -80) {
              pipes.current.splice(i, 1);
          }
      }

      // 4. Collision Detection
      // Hitbox tuning (Circle approximation)
      const birdRadius = 18; 
      const birdCenterY = birdY.current + 20; // 40px height / 2
      const birdCenterX = 50 + 20; // 50px left + 20px radius

      // Floor/Ceiling
      if (birdY.current < -50 || birdY.current > window.innerHeight - 20) {
          gameOver();
          return;
      }

      // Pipe Collision
      let collision = false;
      const pipeWidth = 60; // Slightly narrower for cleaner look

      pipes.current.forEach(p => {
          // Horizontal Hit
          if (birdCenterX + birdRadius > p.x && birdCenterX - birdRadius < p.x + pipeWidth) {
              // Vertical Hit
              if (birdCenterY - birdRadius < p.topHeight || birdCenterY + birdRadius > p.topHeight + GAP_SIZE) {
                  collision = true;
              }
          }

          // Scoring
          if (!p.passed && birdCenterX > p.x + pipeWidth) {
              p.passed = true;
              setScore(s => s + 1);
          }
      });

      if (collision) {
          gameOver();
          return;
      }

      // 5. Render Update
      setTick(prev => prev + 1);
      requestRef.current = requestAnimationFrame(loop);
  }, []);

  // --- ACTIONS ---

  const startGame = () => {
      birdY.current = window.innerHeight / 2;
      birdVelocity.current = 0;
      birdRotation.current = 0;
      pipes.current = [];
      frameCountRef.current = 0;
      
      setScore(0);
      setGameState('playing');
      gameRunningRef.current = true;
      
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Music blocked", e));
      }
      
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(loop);
  };

  const jump = () => {
      if (!gameRunningRef.current) return;
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

  // Input Listener
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
      window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') handleInput();
      });

      return () => {
          window.removeEventListener('mousedown', handleInput);
          window.removeEventListener('touchstart', handleInput);
      };
  }, [gameState]);

  // --- RENDER HELPERS ---

  // New Equalizer Bar Render
  const renderPipe = (height: number, isTop: boolean) => {
      return (
          <div className={`w-full h-full flex flex-col ${isTop ? 'justify-end' : 'justify-start'}`}>
              {/* Neon Edge */}
              <div className={`w-full h-full bg-[#121212] border-x border-[#1ed760]/30 relative overflow-hidden`}>
                  {/* Bars pattern */}
                  <div className="absolute inset-0 opacity-20" style={{ 
                      backgroundImage: 'linear-gradient(0deg, #1ed760 1px, transparent 1px)',
                      backgroundSize: '100% 10px'
                  }}></div>
                  
                  {/* Glowing Cap */}
                  <div className={`absolute left-0 right-0 h-1.5 bg-[#1ed760] shadow-[0_0_10px_#1ed760] ${isTop ? 'bottom-0' : 'top-0'}`}></div>
              </div>
          </div>
      );
  };

  if (gameState === 'menu') {
      return (
          <div className="h-full w-full bg-[#000] flex flex-col items-center justify-center relative overflow-hidden font-sans">
              
              {/* Background Particles */}
              <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onExit(); }} 
                className="absolute top-6 right-6 z-50 text-white font-bold w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 pointer-events-auto"
              >
                  ✕
              </button>

              <div className="relative z-10 text-center animate-fade-in">
                  <div className="w-32 h-32 mx-auto mb-8 relative">
                      <div className="absolute inset-0 bg-[#1ed760] rounded-full blur-[40px] opacity-20 animate-pulse"></div>
                      <div className="w-full h-full rounded-full border-4 border-[#1ed760] flex items-center justify-center bg-black shadow-[0_0_30px_rgba(30,215,96,0.2)] animate-spin-slow">
                          <DiscIcon className="w-16 h-16 text-[#1ed760]" />
                      </div>
                  </div>
                  
                  <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2 drop-shadow-lg">FLAPPY DISC</h1>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em] mb-12">Ritim kaçırma</p>
                  
                  <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-[#1ed760] text-black font-black py-4 px-12 rounded-full hover:scale-105 transition-transform pointer-events-auto shadow-[0_0_20px_rgba(30,215,96,0.4)] text-sm tracking-widest">
                      BAŞLAT
                  </button>
              </div>
          </div>
      );
  }

  if (gameState === 'gameover') {
      return (
          <GameOverScreen 
            gameName="FLAPPY DISC"
            score={score}
            onContinue={() => { onGameEnd(score); onExit(); }}
          />
      );
  }

  return (
      <div className="h-full w-full bg-[#000] relative overflow-hidden select-none touch-none cursor-pointer">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
              backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              animation: 'gridScroll 2s linear infinite',
          }}></div>
          <style>{`@keyframes gridScroll { from { background-position: 0 0; } to { background-position: -40px 0; } }`}</style>

          {/* PIPES */}
          {pipes.current.map((p, i) => (
              <React.Fragment key={i}>
                  <div 
                    className="absolute top-0 w-[60px] z-10"
                    style={{ left: p.x, height: p.topHeight, willChange: 'left' }}
                  >
                      {renderPipe(p.topHeight, true)}
                  </div>

                  <div 
                    className="absolute bottom-0 w-[60px] z-10"
                    style={{ left: p.x, height: window.innerHeight - p.topHeight - GAP_SIZE, willChange: 'left' }}
                  >
                      {renderPipe(window.innerHeight - p.topHeight - GAP_SIZE, false)}
                  </div>
              </React.Fragment>
          ))}

          {/* BIRD (Glowing Disc) */}
          <div 
            className="absolute left-[50px] w-[40px] h-[40px] z-30"
            style={{ 
                top: birdY.current,
                transform: `rotate(${birdRotation.current}deg)`,
                willChange: 'top, transform' 
            }}
          >
              <div className="w-full h-full rounded-full bg-[#111] border-2 border-[#1ed760] shadow-[0_0_15px_#1ed760] flex items-center justify-center relative">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  {/* Trail Effect (Simulated via blurred duplicate behind) */}
                  <div className="absolute inset-0 bg-[#1ed760] rounded-full blur-md opacity-40 -z-10 animate-pulse"></div>
              </div>
          </div>

          {/* SCORE (Big Background Text) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div className="text-[10rem] font-black text-[#1ed760]/10 italic tracking-tighter leading-none">{score}</div>
          </div>
      </div>
  );
};
