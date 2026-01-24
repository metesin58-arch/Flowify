
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, resolveRespectDuel, sendTaunt, listenForTaunts } from '../services/matchmakingService';
import { GameLobby } from './GameLobby';
import { playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playClickSound } from '../services/sfx';
import { ArrowIcon, BoomboxIcon } from './Icons';
import { MatchResultScreen } from './MatchResultScreen';

// --- CONFIGURATION ---
const GAME_MUSIC_URL = "https://files.catbox.moe/ksaxm7.mp3"; 
const TARGET_PCT = 75; 
const HIT_WINDOW = 9; 
const BASE_SPEED = 35; 
const MAX_SPEED = 95; 
const SPEED_ACCELERATION = 0.8; 

const LANES = [
    { id: 0, dir: 'left',  color: '#1ed760', label: 'L' },   
    { id: 1, dir: 'down',  color: '#3b82f6', label: 'D' },   
    { id: 2, dir: 'up',    color: '#a855f7', label: 'U' },   
    { id: 3, dir: 'right', color: '#f59e0b', label: 'R' }    
] as const;

const TAUNTS = ["Sesin kesildi!", "Bu kadar mı?", "Ritim kaçtı!", "Sahneyi terk et!"];

interface NoteItem {
    id: number;
    lane: number;
    y: number; 
    hit: boolean;
    missed: boolean;
}

interface FlowBattleGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  isSolo?: boolean; 
  isMiniGame?: boolean;
  initialDuration?: number; // New Prop for custom duration
}

export const FlowBattleGame: React.FC<FlowBattleGameProps> = ({ playerName, onGameEnd, onExit, isSolo = false, isMiniGame = false, initialDuration }) => {
  // --- STATE ---
  const [phase, setPhase] = useState<'lobby' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen'>('lobby');
  const [startCountdown, setStartCountdown] = useState(3);
  
  // Duration logic: Use prop if available, otherwise default logic
  const [timeLeft, setTimeLeft] = useState(initialDuration || (isMiniGame ? 45 : 60));
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [health, setHealth] = useState(50); 
  
  // Visuals
  const [activeNotes, setActiveNotes] = useState<NoteItem[]>([]);
  const [feedback, setFeedback] = useState<{text: string, color: string, id: number} | null>(null);
  const [laneFlashes, setLaneFlashes] = useState<boolean[]>([false, false, false, false]);

  // Online / Bot Data
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('Rakip');
  
  // Ref for Opponent Score (CRITICAL FIX for Stale Closure)
  const opponentScoreRef = useRef(0);
  const [opponentScoreDisplay, setOpponentScoreDisplay] = useState(0); // Only for UI render

  const [resultData, setResultData] = useState<{result: 'win'|'loss'|'draw', change: number} | null>(null);
  const [receivedTaunt, setReceivedTaunt] = useState<string | null>(null);

  // --- REFS ---
  const notesRef = useRef<NoteItem[]>([]);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0); 
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameRunningRef = useRef(false);
  
  const botIntervalRef = useRef<any>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (auth.currentUser) setPlayerId(auth.currentUser.uid);
    
    if (isSolo || isMiniGame) {
        setPhase('playing');
        if (isMiniGame) {
            setOpponentName(""); 
        } else {
            setOpponentName("MC BOT"); 
        }
    }
    return () => cleanup();
  }, []);

  // --- ONLINE LISTENERS ---
  useEffect(() => {
    if (isSolo || isMiniGame || !gameId || !playerId) return;

    const gameRef = ref(db, `games/${gameId}`);
    const unsubscribeGame = onValue(gameRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;

        if (phase === 'lobby' && val.bpm) {
            startGame();
        }

        if (val.players) {
            const myData = val.players[playerId];
            const opId = Object.keys(val.players).find(k => k !== playerId);
            const opData = opId ? val.players[opId] : null;

            if (opData) {
                setOpponentId(opId);
                setOpponentName(opData.name);
                // Sync ref and state
                opponentScoreRef.current = opData.score;
                setOpponentScoreDisplay(opData.score);
            }

            if (myData?.status === 'finished' && opData?.status === 'finished' && phase !== 'gameover' && phase !== 'result_screen') {
                finalizeGame(myData.score, opData.score, opId!);
            }
        }
    });

    const unsubscribeTaunts = listenForTaunts(gameId, playerId, (msg) => {
        playWrongSound(); 
        setReceivedTaunt(msg);
        setTimeout(() => setReceivedTaunt(null), 2500);
    });

    return () => {
        unsubscribeGame();
        unsubscribeTaunts();
    };
  }, [gameId, playerId, phase, isSolo, isMiniGame]);

  // --- BOT LOGIC ---
  useEffect(() => {
      if (phase === 'playing' && isSolo && !isMiniGame) {
          opponentScoreRef.current = 0; // Reset
          botIntervalRef.current = setInterval(() => {
              const chance = Math.random();
              let add = 0;
              if (chance > 0.25) add = 150; 
              else if (chance > 0.1) add = 50;  
              
              if (add > 0) {
                  opponentScoreRef.current += add;
                  setOpponentScoreDisplay(opponentScoreRef.current);
              }
          }, 550); 
      } else {
          clearInterval(botIntervalRef.current);
      }
      return () => clearInterval(botIntervalRef.current);
  }, [phase, isSolo, isMiniGame]);


  // --- GAMEPLAY CONTROL ---

  const handleGameStart = (id: string) => { setGameId(id); };

  const startGame = () => {
      setPhase('playing');
      setStartCountdown(3);
      setScore(0);
      setCombo(0);
      setHealth(50);
      scoreRef.current = 0;
      comboRef.current = 0;
      opponentScoreRef.current = 0;
      setOpponentScoreDisplay(0);
      notesRef.current = [];
      setActiveNotes([]);
  };

  useEffect(() => {
      if (phase === 'playing' && startCountdown > 0) {
          playCountdownTick();
          const timer = setTimeout(() => {
              if (startCountdown === 1) playGoSound();
              setStartCountdown(prev => prev - 1);
          }, 1000);
          return () => clearTimeout(timer);
      } else if (phase === 'playing' && startCountdown === 0) {
          if (!audioRef.current && !isMiniGame) {
              audioRef.current = new Audio(GAME_MUSIC_URL);
              audioRef.current.volume = 0.4;
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => {});
          }
          
          gameRunningRef.current = true;
          lastTimeRef.current = performance.now();
          lastSpawnRef.current = performance.now();
          startTimeRef.current = performance.now(); 
          requestRef.current = requestAnimationFrame(gameLoop);

          const interval = setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      handleFinish();
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [startCountdown, phase]);

  const cleanup = () => {
      gameRunningRef.current = false;
      cancelAnimationFrame(requestRef.current);
      clearInterval(botIntervalRef.current);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
  };

  // --- ENGINE (60 FPS) ---
  const gameLoop = (time: number) => {
      if (!gameRunningRef.current) return;

      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // DYNAMIC SPEED
      // If it's a minigame (short duration), start faster
      const startSpeed = isMiniGame ? 60 : BASE_SPEED;
      const elapsedTime = (time - startTimeRef.current) / 1000;
      const currentSpeed = Math.min(MAX_SPEED, startSpeed + (elapsedTime * SPEED_ACCELERATION));

      // SPAWN LOGIC
      const baseSpawnRate = 600;
      const currentSpawnRate = Math.max(250, baseSpawnRate - (currentSpeed * 4)); 
      
      if (time - lastSpawnRef.current > currentSpawnRate) {
          spawnNote();
          lastSpawnRef.current = time;
      }

      // MOVE & CLEANUP
      const moveAmount = currentSpeed * deltaTime;
      const notesToRemove: number[] = [];

      notesRef.current.forEach(note => {
          if (!note.hit && !note.missed) {
              note.y += moveAmount;

              const el = document.getElementById(`note-${note.id}`);
              if (el) {
                  el.style.top = `${note.y}%`;
              }

              if (note.y > 90) {
                  note.missed = true;
                  notesToRemove.push(note.id);
                  handleMiss(note.lane);
              }
          }
      });

      if (notesToRemove.length > 0) {
          notesRef.current = notesRef.current.filter(n => !n.missed && !n.hit);
          setActiveNotes([...notesRef.current]);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnNote = () => {
      const lane = Math.floor(Math.random() * 4);
      const newNote: NoteItem = {
          id: Date.now() + Math.random(),
          lane,
          y: -15, 
          hit: false,
          missed: false
      };
      notesRef.current.push(newNote);
      setActiveNotes(prev => [...prev, newNote]);
  };

  // --- INPUT HANDLING ---

  const handleInput = (laneIndex: number) => {
      if (phase !== 'playing' || startCountdown > 0) return;

      triggerLaneFlash(laneIndex);

      const hitNoteIdx = notesRef.current.findIndex(n => 
          n.lane === laneIndex && 
          !n.hit && !n.missed &&
          Math.abs(n.y - TARGET_PCT) < HIT_WINDOW
      );

      if (hitNoteIdx !== -1) {
          const note = notesRef.current[hitNoteIdx];
          const distance = Math.abs(note.y - TARGET_PCT);
          
          let points = 50;
          let text = "İYİ";
          let color = "text-blue-400";

          if (distance < 4) {
              points = 150;
              text = "MÜKEMMEL!";
              color = "text-[#1ed760]";
              setHealth(h => Math.min(100, h + 4));
          } else if (distance < 7) {
              points = 100;
              text = "HARİKA";
              color = "text-yellow-400";
              setHealth(h => Math.min(100, h + 2));
          } else {
              setHealth(h => Math.min(100, h + 1));
          }

          scoreRef.current += points;
          comboRef.current += 1;
          setScore(scoreRef.current);
          setCombo(comboRef.current);

          playCorrectSound();
          showFeedback(text, color);

          note.hit = true;
          const el = document.getElementById(`note-${note.id}`);
          if (el) el.style.opacity = '0';

          if (!isSolo && !isMiniGame && gameId && playerId) {
              updateScore(gameId, playerId, scoreRef.current);
          }

      }
  };

  const handleMiss = (lane: number) => {
      comboRef.current = 0;
      setCombo(0);
      setHealth(h => Math.max(0, h - 8));
      showFeedback("KAÇIRDIN", "text-red-500");
  };

  const triggerLaneFlash = (laneIdx: number) => {
      setLaneFlashes(prev => { const n = [...prev]; n[laneIdx] = true; return n; });
      setTimeout(() => setLaneFlashes(prev => { const n = [...prev]; n[laneIdx] = false; return n; }), 100);
  };

  const showFeedback = (text: string, color: string) => {
      setFeedback({ text, color, id: Date.now() });
      setTimeout(() => setFeedback(null), 600);
  };

  const handleSendTaunt = (msg: string) => {
      if (!gameId || !opponentId || isSolo || isMiniGame) return;
      playClickSound();
      sendTaunt(gameId, opponentId, msg);
  };

  const handleFinish = () => {
      cleanup();
      if (isMiniGame) {
          // If this is a minigame inside Concert, return a percentage (0-100)
          const pct = Math.min(100, Math.floor((scoreRef.current / 5000) * 100));
          onGameEnd(pct);
          return;
      }

      setPhase('waiting_opponent');
      if (!isSolo && gameId && playerId) {
          setPlayerFinished(gameId, playerId, scoreRef.current);
      } else {
          // ARCADE/SOLO MODE: 
          // Just pass the score to App.tsx via onGameEnd.
          finalizeGame(scoreRef.current, opponentScoreRef.current, 'bot');
      }
  };

  const finalizeGame = (myScore: number, opScore: number, opId: string) => {
      setPhase('gameover');
      
      let res: 'win' | 'loss' | 'draw' = 'draw';
      let change = 0;

      if (myScore > opScore) { res = 'win'; change = 34; } 
      else if (myScore < opScore) { res = 'loss'; change = -34; } 
      
      if (!isSolo && !isMiniGame && playerId && opId) {
          if (res === 'win') resolveRespectDuel(playerId, opId);
      }

      setResultData({ result: res, change });
      setTimeout(() => setPhase('result_screen'), 1000);
  };

  // --- MOMENTUM CALCULATION ---
  const calculateMomentum = () => {
      const totalScore = score + opponentScoreDisplay;
      if (totalScore === 0) return 50; 
      return Math.min(100, Math.max(0, (score / totalScore) * 100));
  };
  const momentumPct = calculateMomentum();

  // --- RENDERS ---

  if (phase === 'lobby' && playerId && !isSolo && !isMiniGame) {
      return <GameLobby gameType="flowbattle" gameName="BREAKDANCE BATTLE" playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1} onGameStart={handleGameStart} onExit={onExit} />;
  }

  if (phase === 'result_screen' && resultData) {
      return <MatchResultScreen result={resultData.result} myScore={score} opponentScore={opponentScoreDisplay} opponentName={opponentName} respectChange={isSolo ? 0 : resultData.change} onContinue={() => { onGameEnd(score); onExit(); }} />;
  }

  if (phase === 'waiting_opponent') {
      return <div className="h-full bg-black flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1ed760] mb-4"></div><h2 className="text-xl font-bold">SONUÇLAR BEKLENİYOR</h2></div>;
  }

  return (
    <div className={`h-full w-full bg-[#000000] relative overflow-hidden flex flex-col ${isMiniGame ? 'z-[100]' : ''} touch-none select-none font-sans`}>
        
        {/* --- 1. BACKGROUND --- */}
        <div className="absolute inset-0 z-0 bg-[#000000]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1ed760]/5 to-black"></div>
            {/* Subtle Grid */}
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', 
                backgroundSize: '40px 40px'
            }}></div>
        </div>

        {/* --- 2. MOMENTUM BAR --- */}
        {!isMiniGame && (
            <div className="absolute top-0 left-0 right-0 h-2 z-40 bg-[#333] flex">
                <div 
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${100 - momentumPct}%` }}
                ></div>
                <div 
                    className="h-full bg-[#1ed760] transition-all duration-300 shadow-[0_0_10px_#1ed760]"
                    style={{ width: `${momentumPct}%` }}
                ></div>
                <div className="absolute top-0 bottom-0 w-1 bg-white left-1/2 -translate-x-1/2"></div>
            </div>
        )}

        {/* --- 3. HUD --- */}
        <div className="absolute top-4 left-0 right-0 p-4 pt-safe z-30 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <BoomboxIcon className="w-5 h-5 text-white" />
                    <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{score.toLocaleString()}</span>
                </div>
                {/* Hype Meter */}
                <div className="w-32 h-1.5 bg-[#222] rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${health > 50 ? 'bg-[#1ed760]' : 'bg-red-500'}`} style={{ width: `${health}%` }}></div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <div className="text-white font-mono font-bold text-xl">{timeLeft}s</div>
                {!isMiniGame && <div className="text-[10px] text-neutral-500 font-bold uppercase">{opponentName}: {opponentScoreDisplay}</div>}
            </div>
        </div>

        {/* --- 4. COMBO & FEEDBACK --- */}
        {combo > 2 && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center pointer-events-none">
                <div className="text-5xl font-black text-white/10 italic tracking-tighter animate-pulse scale-150">
                    {combo}x
                </div>
            </div>
        )}
        
        {feedback && (
            <div key={feedback.id} className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-3xl font-black italic tracking-tighter ${feedback.color} animate-[ping_0.3s_ease-out_forwards] whitespace-nowrap drop-shadow-md`}>
                {feedback.text}
            </div>
        )}

        {/* --- 5. COUNTDOWN --- */}
        {startCountdown > 0 && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                 <div className="text-[120px] font-black text-[#1ed760] animate-ping">{startCountdown}</div>
             </div>
        )}

        {/* --- 6. GAME TRACK --- */}
        <div className="absolute inset-0 z-10 flex flex-col">
            <div className="flex-1 relative flex">
                <div className="w-full max-w-md mx-auto h-full relative flex border-x border-white/5">
                    
                    {/* TARGET ZONE */}
                    <div className="absolute w-full z-10 flex px-2 pointer-events-none" style={{ top: `${TARGET_PCT}%`, transform: 'translateY(-50%)' }}>
                        {LANES.map((lane, i) => (
                            <div key={i} className="flex-1 flex justify-center">
                                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-75 shadow-lg ${laneFlashes[i] ? 'scale-110 bg-white/20 border-white' : 'border-white/20 bg-black/40'}`}>
                                    <ArrowIcon dir={lane.dir} className={`w-8 h-8 ${laneFlashes[i] ? 'text-white' : 'text-white/30'}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Lanes */}
                    {LANES.map((lane, i) => (
                        <div key={i} className="flex-1 relative border-r border-white/5 last:border-r-0">
                            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-${lane.color} opacity-0 transition-opacity duration-100 ${laneFlashes[i] ? '!opacity-30' : ''}`} style={{ backgroundColor: laneFlashes[i] ? lane.color : 'transparent' }}></div>
                        </div>
                    ))}

                    {/* Notes */}
                    {activeNotes.map(note => {
                        const cfg = LANES[note.lane];
                        return (
                            <div
                                key={note.id}
                                id={`note-${note.id}`}
                                className="absolute w-[25%] flex items-center justify-center will-change-transform z-20 pointer-events-none"
                                style={{
                                    left: `${note.lane * 25}%`,
                                    top: 0, 
                                    transform: 'translateY(-50%)' 
                                }}
                            >
                                <div className="w-14 h-14 rounded-full bg-[#121212] border-2 border-white flex items-center justify-center shadow-lg relative overflow-hidden" style={{ borderColor: cfg.color }}>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: cfg.color }}></div>
                                    <ArrowIcon dir={cfg.dir} className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                            </div>
                        );
                    })}

                </div>
            </div>

            {/* Controls */}
            <div className="h-40 bg-gradient-to-t from-black via-black to-transparent pb-safe relative z-30 px-4 flex items-center">
                <div className="w-full max-w-md mx-auto h-full flex justify-between items-center px-4 gap-4">
                    {LANES.map((lane, i) => (
                        <button
                            key={i}
                            onPointerDown={(e) => { e.preventDefault(); handleInput(i); }}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#181818] border-2 flex items-center justify-center group active:scale-95 transition-all shadow-lg active:shadow-none relative overflow-hidden`}
                            style={{ borderColor: lane.color, boxShadow: `0 0 15px ${lane.color}40` }}
                        >
                            <div className="absolute inset-0 opacity-0 group-active:opacity-30 transition-opacity" style={{ backgroundColor: lane.color }}></div>
                            <ArrowIcon 
                                dir={lane.dir} 
                                className={`w-8 h-8 opacity-80 group-active:scale-110 transition-transform text-white drop-shadow-md`} 
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Exit */}
        {!isMiniGame && (
            <button onClick={onExit} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold hover:bg-white/20 pointer-events-auto">✕</button>
        )}

        {/* Taunts */}
        {!isSolo && !isMiniGame && (
            <div className="absolute bottom-40 left-0 right-0 z-50 flex justify-center gap-2 pointer-events-auto px-4 overflow-x-auto scrollbar-hide">
                {TAUNTS.map((t, i) => (
                    <button key={i} onClick={() => handleSendTaunt(t)} className="bg-[#222] border border-white/20 text-white text-[9px] font-bold px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors whitespace-nowrap shadow-lg">{t}</button>
                ))}
            </div>
        )}

        {receivedTaunt && (
            <div className="absolute top-1/3 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <div className="bg-white text-black font-black text-xl px-6 py-4 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.5)] transform -rotate-3 animate-bounce border-4 border-black">
                    {receivedTaunt} 🤬
                </div>
            </div>
        )}

    </div>
  );
};
