
import React, { useState, useEffect, useRef } from 'react';
import { AdModal } from './AdModal'; // Import AdModal
import { GameOverScreen } from './GameOverScreen';

const GAME_MUSIC_URL = "https://files.catbox.moe/rrsuo4.mp3"; 

interface Note {
  id: number;
  lane: 0 | 1 | 2;
  y: number;
  hit: boolean;
}

interface RhythmGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
  musicUrl?: string;
  musicBase64?: string;
}

export const RhythmGame: React.FC<RhythmGameProps> = ({ onExit, onGameEnd, musicUrl, musicBase64 }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [message, setMessage] = useState<{text: string, color: string} | null>(null);
  
  // Revive State
  const [showRevive, setShowRevive] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);

  // Game Loop Refs
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  
  // Game Logic Refs
  const notesRef = useRef<Note[]>([]); // Mutable ref for high frequency updates
  const speedRef = useRef<number>(300); // Pixels per second
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State Refs for the Loop to avoid closure staleness
  const stateRef = useRef({
      lives: 3,
      score: 0,
      playing: false
  });

  const LANE_COUNT = 3;
  const GAME_HEIGHT = 600; 
  const HIT_ZONE_Y = 500;
  const HIT_WINDOW = 60;

  useEffect(() => {
    let finalUrl = musicUrl || GAME_MUSIC_URL;
    if (musicBase64) {
        finalUrl = `data:audio/wav;base64,${musicBase64}`;
    }
    audioRef.current = new Audio(finalUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      cancelAnimationFrame(requestRef.current);
      if(audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
    };
  }, []);

  const startGame = () => {
    if(audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Music blocked", e));
    }
    
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setLives(3);
    setNotes([]);
    setReviveUsed(false);
    notesRef.current = [];
    
    stateRef.current = {
        lives: 3,
        score: 0,
        playing: true
    };
    
    // Randomize Speed
    speedRef.current = Math.floor(Math.random() * 200) + 250; // 250-450 px/s
    
    lastTimeRef.current = performance.now();
    lastSpawnRef.current = performance.now();

    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time: number) => {
    if (!stateRef.current.playing || stateRef.current.lives <= 0) return;

    const deltaTime = (time - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = time;

    // 1. Spawn Notes
    const currentScore = stateRef.current.score;
    // Spawn rate speeds up slightly
    const spawnRate = Math.max(300, 1000 - (currentScore * 2));
    
    if (time - lastSpawnRef.current > spawnRate) {
        const lane = Math.floor(Math.random() * LANE_COUNT) as 0 | 1 | 2;
        const newNote: Note = {
            id: time,
            lane,
            y: -50,
            hit: false
        };
        notesRef.current.push(newNote);
        lastSpawnRef.current = time;
    }

    // 2. Move Notes (Pixel based on Delta Time)
    let lifeLost = false;
    const moveAmount = speedRef.current * deltaTime;

    // Update positions in Ref
    notesRef.current.forEach(note => {
        if (!note.hit) {
            note.y += moveAmount;
            if (note.y > GAME_HEIGHT) {
                lifeLost = true;
                note.hit = true; // Mark as processed/missed
            }
        }
    });

    // Clean up hit/missed notes
    notesRef.current = notesRef.current.filter(n => n.y <= GAME_HEIGHT);

    // Sync to State for React Render
    setNotes([...notesRef.current]);

    if (lifeLost) {
        handleLifeLoss();
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleLifeLoss = () => {
      stateRef.current.lives -= 1;
      setLives(stateRef.current.lives);
      setCombo(0);
      showMessage("KAÇIRDIN!", "text-red-500");

      if (stateRef.current.lives <= 0) {
          handlePossibleGameOver();
      }
  };

  const handlePossibleGameOver = () => {
      stateRef.current.playing = false;
      cancelAnimationFrame(requestRef.current);
      if(audioRef.current) audioRef.current.pause();

      if (!reviveUsed) {
          setShowRevive(true);
      } else {
          setGameState('gameover');
      }
  };

  const handleRevive = () => {
      setShowRevive(false);
      setReviveUsed(true);
      setLives(1);
      stateRef.current.lives = 1;
      stateRef.current.playing = true;
      if (audioRef.current) audioRef.current.play().catch(() => {});
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = () => {
      setShowRevive(false);
      setGameState('gameover');
  };

  const handleHit = (lane: number) => {
      if (!stateRef.current.playing) return;

      const noteIndex = notesRef.current.findIndex(n => 
          n.lane === lane && 
          !n.hit && 
          Math.abs(n.y - HIT_ZONE_Y) < HIT_WINDOW
      );

      if (noteIndex !== -1) {
          const note = notesRef.current[noteIndex];
          const distance = Math.abs(note.y - HIT_ZONE_Y);
          
          let points = 10;
          if (distance < 20) {
              points = 50;
              showMessage("MÜKEMMEL!", "text-cyan-400");
          } else if (distance < 40) {
              points = 25;
              showMessage("İYİ!", "text-pink-400");
          } else {
              showMessage("NORMAL", "text-purple-400");
          }

          stateRef.current.score += points;
          setScore(stateRef.current.score);
          setCombo(c => c + 1);

          // Remove note immediately from ref to prevent double hits
          notesRef.current.splice(noteIndex, 1);
          setNotes([...notesRef.current]);
      } else {
          setCombo(0);
      }
  };

  const showMessage = (text: string, color: string) => {
      setMessage({ text, color });
      setTimeout(() => setMessage(null), 500);
  };

  // --- RENDER ---

  if (showRevive) {
      return (
          <AdModal 
            title="OYUN BİTTİ!" 
            rewardText="Reklam izle ve +1 Can ile kaldığın yerden devam et." 
            onWatch={handleRevive} 
            onCancel={handleGameOver}
            buttonText="DEVAM ET (+1 CAN)"
          />
      );
  }

  if (gameState === 'menu') {
      return (
          <div className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
              
              {/* Close Button */}
              <button 
                onClick={onExit} 
                className="absolute top-6 right-6 z-50 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white active:scale-95 transition-all text-sm"
              >
                  ✕
              </button>
              
              <div className="relative z-10 text-center max-w-sm px-6 animate-fade-in flex flex-col items-center">
                  
                  {/* Album Cover Style Logo */}
                  <div className="w-28 h-28 bg-[#0a0a0a] rounded-3xl shadow-[0_20px_50px_rgba(255,0,140,0.15)] mb-8 flex items-center justify-center border border-white/[0.08] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#ff008c]/10 to-transparent"></div>
                      <div className="text-3xl font-black italic text-white select-none">rhythm.</div>
                  </div>
                  
                  <span className="text-[10px] font-bold text-[#ff008c] tracking-widest uppercase mb-1">
                      beceri • refleks
                  </span>

                  <h1 className="text-4xl font-black text-white tracking-tighter leading-none lowercase mb-4">
                      rhythm<span className="text-[#ff008c]">.</span>
                  </h1>
                  
                  <p className="text-[11px] text-neutral-400 font-medium tracking-tight h-12 leading-relaxed max-w-[240px] lowercase mb-12">
                      ekstrem zamanlama mücadelesi. dönen notaları tam zamanında cerrahi hassasiyetle yakala.
                  </p>

                  <button 
                    onClick={startGame}
                    className="w-full max-w-[180px] h-12 bg-white text-black font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all lowercase shadow-xl"
                  >
                      oyuna başla.
                  </button>
              </div>
          </div>
      );
  }

  if (gameState === 'gameover') {
    return (
        <GameOverScreen 
            gameName="rhythm"
            score={score}
            onContinue={() => { onGameEnd(score); onExit(); }}
            isWin={false}
        />
    );
  }

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col font-sans touch-none select-none">
        
        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pb-20">
            <div>
                <div className="text-5xl font-black text-white italic tracking-tighter drop-shadow-md">{score}</div>
                <div className={`text-sm font-bold uppercase tracking-widest mt-1 ${combo > 5 ? 'text-cyan-400 animate-pulse' : 'text-neutral-500'}`}>
                    {combo > 0 ? `${combo}x COMBO` : 'RHYTHM'}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-8 h-2 rounded-full transform -skew-x-12 transition-all duration-300 ${i < lives ? 'bg-[#ff008c] shadow-[0_0_10px_#ff008c]' : 'bg-[#333]'}`}></div>
                    ))}
                </div>
                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">CAN</div>
            </div>
        </div>

        {message && (
            <div className={`absolute top-40 left-1/2 transform -translate-x-1/2 text-4xl font-black ${message.color} animate-bounce whitespace-nowrap drop-shadow-lg z-30 tracking-tight italic`}>
                {message.text}
            </div>
        )}

        <button onClick={onExit} className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">✕</button>

        {/* GAME BOARD */}
        <div className="flex-1 relative flex justify-center perspective-1000 overflow-hidden">
            {/* The Track */}
            <div className="w-full max-w-md h-full relative flex transform-style-3d rotate-x-20 border-x border-white/5 shadow-[0_0_80px_rgba(255,0,140,0.1)]">
                {/* Lanes */}
                <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-white/5 bg-gradient-to-b from-transparent via-[#ff008c]/5 to-[#ff008c]/20"></div>
                    <div className="flex-1 border-r border-white/5 bg-gradient-to-b from-transparent via-cyan-400/5 to-cyan-400/20"></div>
                    <div className="flex-1 bg-gradient-to-b from-transparent via-[#ff008c]/5 to-[#ff008c]/20"></div>
                </div>

                {/* Hit Zone Line */}
                <div 
                    className="absolute w-full h-1 bg-white/50 blur-[2px] z-10" 
                    style={{ top: `${(HIT_ZONE_Y / GAME_HEIGHT) * 100}%` }}
                ></div>

                {/* Notes using Transform */}
                {notes.map(note => (
                     <div 
                        key={note.id}
                        className={`absolute w-[30%] h-4 rounded-full shadow-[0_0_15px_currentColor] z-20 will-change-transform ${note.lane === 1 ? 'bg-cyan-400 text-cyan-400' : 'bg-[#ff008c] text-[#ff008c]'}`}
                        style={{
                            left: `${note.lane * 33.3 + 1.65}%`,
                            top: 0, // Reset top
                            transform: `translate3d(0, ${(note.y / GAME_HEIGHT) * 100 * 6}px, 0) scale(${0.5 + (note.y / GAME_HEIGHT)})`, // Use transform for movement and scale
                            opacity: note.y > GAME_HEIGHT ? 0 : 1,
                        }}
                     ></div>
                ))}
            </div>
        </div>

        {/* CONTROLS */}
        <div className="h-36 bg-black/90 backdrop-blur-md border-t border-white/10 p-6 grid grid-cols-3 gap-4 z-30 pb-safe">
            {[0, 1, 2].map(lane => (
                <button 
                    key={lane}
                    onClick={() => handleHit(lane)} 
                    className={`rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center group relative overflow-hidden ${
                        lane === 1 
                        ? 'bg-[#1a1a1a] border-cyan-900 active:bg-cyan-900/50' 
                        : 'bg-[#1a1a1a] border-pink-900 active:bg-pink-900/50'
                    }`}
                >
                    <div className={`w-16 h-16 rounded-full border-2 opacity-20 group-active:opacity-100 group-active:scale-110 transition-all ${lane === 1 ? 'border-cyan-400 bg-cyan-400/20' : 'border-[#ff008c] bg-[#ff008c]/20'}`}></div>
                </button>
            ))}
        </div>
    </div>
  );
};
