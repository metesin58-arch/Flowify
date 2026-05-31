import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, updatePlayerRespect, sendTaunt, listenForTaunts } from '../services/matchmakingService';
import { GameLobby } from './GameLobby';
import { playClickSound, playWrongSound } from '../services/sfx';
import { MatchResultScreen } from './MatchResultScreen';
import { VsClashScreen } from './VsClashScreen';
import { PlayerStats } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// --- CONFIGURATION ---
const GAME_MUSIC_URL = "https://files.catbox.moe/ksaxm7.mp3"; 
const TARGET_Y = 82; // Sweet spot percentage down the column
const TOLERANCE = 11; // Alignment hit tolerance window (+/-) around TARGET_Y

const LANES = [
    { id: 0, dir: 'left',  color: '#a855f7', label: 'A', text: 'KICK', class: 'border-purple-500/30 text-purple-400 bg-purple-950/10' },   
    { id: 1, dir: 'down',  color: '#10b981', label: 'S', text: 'SNARE', class: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10' },   
    { id: 2, dir: 'up',    color: '#f59e0b', label: 'K', text: 'HI-HAT', class: 'border-amber-500/30 text-amber-400 bg-amber-950/10' },   
    { id: 3, dir: 'right', color: '#3b82f6', label: 'L', text: 'CLAP', class: 'border-blue-500/30 text-blue-400 bg-blue-950/10' }    
] as const;

const TAUNTS = ["Sesin kesildi!", "Bu kadar mı?", "Ritim kaçtı!", "Sahneyi terk et!"];

interface NoteItem {
    id: string;
    lane: number;
    y: number; 
    type: 'normal' | 'gold' | 'bomb';
    speed: number;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
    life: number;
}

// Low-latency Web Audio Synthesizer for Retro Nintendo-style game sound effects
class GameSoundFX {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playTick() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit(isGold: boolean = false) {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    const freq = isGold ? 1200 : 600;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPerfect() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      gain.gain.setValueAtTime(0.12, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.25);
    });
  }

  playMiss() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.22);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playBomb() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playFeverCharge() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start();
    osc.stop(now + 0.5);
  }
}

const sfx = new GameSoundFX();

interface FlowBattleGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  isSolo?: boolean; 
  isMiniGame?: boolean;
  initialDuration?: number; 
  updateStat?: (stat: any, amount: number) => void;
  player?: PlayerStats;
}

export const FlowBattleGame: React.FC<FlowBattleGameProps> = ({ playerName, onGameEnd, onExit, isSolo = false, isMiniGame = false, initialDuration, updateStat, player }) => {
  const [phase, setPhase] = useState<'lobby' | 'vs_clash' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen'>('lobby');
  const [startCountdown, setStartCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(initialDuration || (isMiniGame ? 15 : 30));
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feverMeter, setFeverMeter] = useState(0); // 0 to 100
  const [isFever, setIsFever] = useState(false);

  // Graphics state
  const [activeNotes, setActiveNotes] = useState<NoteItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hitFeedback, setHitFeedback] = useState<{ id: string; text: string; padIdx: number; color: string } | null>(null);
  const [padPressStates, setPadPressStates] = useState<boolean[]>([false, false, false, false]);

  // Online / Bot Connection
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('Rakip');
  
  const opponentScoreRef = useRef(0);
  const [opponentScoreDisplay, setOpponentScoreDisplay] = useState(0); 
  const [resultData, setResultData] = useState<{result: 'win'|'loss'|'draw', change: number} | null>(null);
  const [receivedTaunt, setReceivedTaunt] = useState<string | null>(null);

  // Internal high frequency state refs
  const scoreRef = useRef(0);
  const notesRef = useRef<NoteItem[]>([]);
  const cueIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const feedbackTimeout = useRef<number | null>(null);
  
  const botIntervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (auth.currentUser) setPlayerId(auth.currentUser.uid);
    if (isSolo || isMiniGame) {
        setPhase('playing');
        setOpponentName(isMiniGame ? "" : "MC BOT"); 
    }
    return () => cleanup();
  }, []);

  // Sync to database
  useEffect(() => {
    if (isSolo || isMiniGame || !gameId || !playerId) return;

    const gameRef = doc(db, 'games', gameId);
    const unsubscribeGame = onSnapshot(gameRef, (snapshot) => {
        const val = snapshot.data();
        if (!val) return;

        if (phase === 'lobby' && val.bpm) {
            setPhase('vs_clash');
        }

        if (val.players) {
            const myData = val.players[playerId];
            const opId = Object.keys(val.players).find(k => k !== playerId);
            const opData = opId ? val.players[opId] : null;

            if (opData) {
                setOpponentId(opId);
                setOpponentName(opData.name);
                opponentScoreRef.current = opData.score || 0;
                setOpponentScoreDisplay(opData.score || 0);
            }

            if (myData?.status === 'finished' && opData?.status === 'finished' && phase !== 'gameover' && phase !== 'result_screen') {
                finalizeGame(myData.score, opData.score, opId!);
            }
        }
    });

    const unsubscribeTaunts = listenForTaunts(gameId, playerId, (msg) => {
        sfx.playMiss();
        setReceivedTaunt(msg);
        setTimeout(() => setReceivedTaunt(null), 2500);
    });

    return () => {
        unsubscribeGame();
        unsubscribeTaunts();
    };
  }, [gameId, playerId, phase, isSolo, isMiniGame]);

  // BOT AI scoring generator
  useEffect(() => {
    if (phase === 'playing' && startCountdown === 0 && isSolo && !isMiniGame) {
        opponentScoreRef.current = 0;
        botIntervalRef.current = setInterval(() => {
            const chance = Math.random();
            let add = 0;
            if (chance > 0.45) add = 150; 
            else if (chance > 0.15) add = 100;  
            
            if (add > 0) {
                opponentScoreRef.current += add;
                setOpponentScoreDisplay(opponentScoreRef.current);
            }
        }, 750); 
    } else {
        clearInterval(botIntervalRef.current);
    }
    return () => clearInterval(botIntervalRef.current);
  }, [phase, startCountdown, isSolo, isMiniGame]);

  // Prepare & Start
  const handleGameStart = (id: string) => { setGameId(id); };

  const startGame = () => {
      setPhase('playing');
      setStartCountdown(3);
      setScore(0);
      setCombo(0);
      setIsFever(false);
      setFeverMeter(0);
      scoreRef.current = 0;
      opponentScoreRef.current = 0;
      setOpponentScoreDisplay(0);
      notesRef.current = [];
      setActiveNotes([]);
  };

  // Keyboard controls for desktop mapping
  useEffect(() => {
    if (phase !== 'playing' || startCountdown > 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toUpperCase();
      let padIndex = -1;
      if (char === 'A') padIndex = 0;
      else if (char === 'S') padIndex = 1;
      else if (char === 'K') padIndex = 2;
      else if (char === 'L') padIndex = 3;

      if (padIndex !== -1) {
        handleInput(padIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, startCountdown, activeNotes, combo, feverMeter, isFever]);

  // Countdown timer handler
  useEffect(() => {
    if (phase !== 'playing') return;
    sfx.playTick();
    const timer = setInterval(() => {
      setStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Play background audio
          if (!audioRef.current && !isMiniGame) {
              audioRef.current = new Audio(GAME_MUSIC_URL);
              audioRef.current.volume = 0.45;
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => {});
          }
          lastTimeRef.current = performance.now();
          requestRef.current = requestAnimationFrame(gameLoop);
          startDurationTimer();
          return 0;
        }
        sfx.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const startDurationTimer = () => {
    const mainTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(mainTimer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cleanup = () => {
      cancelAnimationFrame(requestRef.current);
      clearInterval(botIntervalRef.current);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
  };

  const handleFinish = () => {
      cleanup();
      if (isMiniGame) {
          // If this is a minigame inside Concert (e.g., Breakdance), return percentage (0-100)
          const pct = Math.min(100, Math.floor((scoreRef.current / 3500) * 100));
          setTimeout(() => {
              onGameEnd(pct);
          }, 0);
          return;
      }

      setPhase('waiting_opponent');
      if (!isSolo && gameId && playerId) {
          setPlayerFinished(gameId, playerId, scoreRef.current);
      } else {
          finalizeGame(scoreRef.current, opponentScoreRef.current, 'bot');
      }
  };

  const finalizeGame = (myScore: number, opScore: number, opId: string) => {
      setPhase('gameover');
      let res: 'win' | 'loss' | 'draw' = 'draw';
      let change = 0;

      if (myScore > opScore) { res = 'win'; change = 35; } 
      else if (myScore < opScore) { res = 'loss'; change = -25; } 
      
      if (!isSolo && !isMiniGame && playerId) {
          if (res !== 'draw') {
              updatePlayerRespect(playerId, change);
          }
      }

      setResultData({ result: res, change });
      setTimeout(() => setPhase('result_screen'), 1200);
  };

  // UI float message trigger
  const triggerFeedback = (text: string, padIdx: number, color: string) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setHitFeedback({
      id: Math.random().toString(),
      text,
      padIdx,
      color,
    });
    feedbackTimeout.current = window.setTimeout(() => {
      setHitFeedback(null);
    }, 450);
  };

  // Emit sparkling particles
  const triggerParticles = (padIdx: number, num = 8, color = '#ffffff') => {
    const padX = 12.5 + padIdx * 25; 
    const newParticles: Particle[] = [];
    for (let i = 0; i < num; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: `fb-p-${particleIdCounter.current++}`,
        x: padX,
        y: TARGET_Y,
        color,
        vx: Math.cos(angle) * speed * 0.4,
        vy: Math.sin(angle) * speed * 0.4 - 1.5,
        life: 1.0,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Interactive gameplay tap trigger
  const handleInput = (laneIndex: number) => {
      if (phase !== 'playing' || startCountdown > 0) return;

      setPadPressStates(prev => {
          const next = [...prev];
          next[laneIndex] = true;
          return next;
      });
      setTimeout(() => {
          setPadPressStates(prev => {
              const next = [...prev];
              next[laneIndex] = false;
              return next;
          });
      }, 100);

      // Support Fever mode smash frenzy
      if (isFever) {
          sfx.playHit(true);
          scoreRef.current += 40;
          setScore(scoreRef.current);
          triggerParticles(laneIndex, 4, LANES[laneIndex].color);
          triggerFeedback("MASH! +40", laneIndex, "#ffffff");
          if (!isSolo && !isMiniGame && gameId && playerId) {
              updateScore(gameId, playerId, scoreRef.current);
          }
          return;
      }

      // Find aligning cues in this active layout
      const matchingNotes = notesRef.current.filter(n => n.lane === laneIndex);
      if (matchingNotes.length === 0) {
          // EMPTY SPAM PENALTY (Protects game integrity)
          sfx.playMiss();
          setCombo(0);
          scoreRef.current = Math.max(0, scoreRef.current - 15);
          setScore(scoreRef.current);
          setFeverMeter(prev => Math.max(0, prev - 6));
          triggerFeedback("ISKA! -15", laneIndex, "#ef4444");
          return;
      }

      // Get closest cue
      let closestNote = matchingNotes[0];
      let minDiff = Math.abs(closestNote.y - TARGET_Y);
      
      for (let i = 1; i < matchingNotes?.length; i++) {
          const diff = Math.abs(matchingNotes[i].y - TARGET_Y);
          if (diff < minDiff) {
              minDiff = diff;
              closestNote = matchingNotes[i];
          }
      }

      // Check alignment boundaries
      if (minDiff <= TOLERANCE) {
          // Splendid Hit!
          const isGold = closestNote.type === 'gold';
          const isBomb = closestNote.type === 'bomb';

          // Pop note
          notesRef.current = notesRef.current.filter(n => n.id !== closestNote.id);
          setActiveNotes([...notesRef.current]);

          if (isBomb) {
              sfx.playBomb();
              setCombo(0);
              scoreRef.current = Math.max(0, scoreRef.current - 250);
              setScore(scoreRef.current);
              setFeverMeter(prev => Math.max(0, prev - 25));
              triggerParticles(laneIndex, 15, '#ef4444');
              triggerFeedback("BOMBA! -250", laneIndex, '#ef4444');
              
              if (!isSolo && !isMiniGame && gameId && playerId) {
                  updateScore(gameId, playerId, scoreRef.current);
              }
              return;
          }

          let points = 100;
          let label = 'iyi!';
          let feedbackColor = LANES[laneIndex].color;

          if (minDiff <= TOLERANCE * 0.35) {
              points = 250;
              label = 'kusursuz!';
              feedbackColor = '#f59e0b';
              sfx.playPerfect();
          } else if (minDiff <= TOLERANCE * 0.65) {
              points = 150;
              label = 'harika!';
              feedbackColor = '#3b82f6';
              sfx.playHit(isGold);
          } else {
              sfx.playHit(isGold);
          }

          if (isGold) {
              points *= 2;
              label = `altın ${label}`;
              feedbackColor = '#f59e0b';
          }

          scoreRef.current += points;
          setScore(scoreRef.current);
          setCombo(prev => prev + 1);

          // Update Fever Meter State
          setFeverMeter(prev => {
              if (prev >= 100) return 100;
              const add = isGold ? 15 : 7;
              const next = prev + add;
              if (next >= 100) {
                  sfx.playFeverCharge();
                  setIsFever(true);
                  setTimeout(() => {
                      setIsFever(false);
                      setFeverMeter(0);
                  }, 6000);
                  return 100;
              }
              return next;
          });

          triggerParticles(laneIndex, isGold ? 12 : 6, feedbackColor);
          triggerFeedback(`${label.toUpperCase()} +${points}`, laneIndex, feedbackColor);

          // Sync online score
          if (!isSolo && !isMiniGame && gameId && playerId) {
              updateScore(gameId, playerId, scoreRef.current);
          }
      } else {
          // If tapped early but totally out of tolerance bounds, treat as spam/miskey
          sfx.playMiss();
          setCombo(0);
          scoreRef.current = Math.max(0, scoreRef.current - 15);
          setScore(scoreRef.current);
          setFeverMeter(prev => Math.max(0, prev - 4));
          triggerFeedback("ERKEN! -15", laneIndex, "#ef4444");
      }
  };

  // Game Loop physics tick (Smooth, fully playable and stable rate)
  const gameLoop = useCallback((timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 16.666;
      lastTimeRef.current = timestamp;

      // Move notes & clear old ones
      notesRef.current.forEach(note => {
          note.y += note.speed * delta;
      });

      // Handle Misses when passing the bottom screen boundary
      const misses = notesRef.current.filter(n => n.y > 96);
      if (misses.length > 0) {
          const missedAnyNormal = misses.some(n => n.type !== 'bomb');
          if (missedAnyNormal) {
              setCombo(0);
              sfx.playMiss();
              // Trigger feedback on columns
              misses.forEach(m => {
                  if (m.type !== 'bomb') triggerFeedback("KAÇTI!", m.lane, "#737373");
              });
          }
          notesRef.current = notesRef.current.filter(n => n.y <= 96);
      }

      // Handle random spawns under Fever constraint
      if (!isFever) {
          // Tuned spawn rate for natural flow and comfortable spacing
          const spawnChance = 0.02 + (scoreRef.current > 3000 ? 0.01 : 0);
          if (Math.random() < spawnChance) {
              const padIdx = Math.floor(Math.random() * 4);
              let type: 'normal' | 'gold' | 'bomb' = 'normal';
              const roll = Math.random();
              if (roll < 0.12) type = 'gold'; // Gold Record
              else if (roll < 0.22) type = 'bomb'; // Bomb

              // Highly optimized comfortable speed baseline
              const speedBonus = scoreRef.current > 3500 ? 0.4 : 0;
              const noteSpeed = 1.35 + speedBonus + Math.random() * 0.35;

              notesRef.current.push({
                  id: `n-${cueIdCounter.current++}`,
                  lane: padIdx,
                  y: 0,
                  type,
                  speed: noteSpeed
              });
          }
      }

      // Run spark animation updates
      setParticles(prev => 
          prev
            .map(p => ({
              ...p,
              x: p.x + p.vx * delta,
              y: p.y + p.vy * delta,
              life: p.life - 0.04 * delta,
            }))
            .filter(p => p.life > 0)
      );

      // Force view synced state
      setActiveNotes([...notesRef.current]);

      // Loop request
      requestRef.current = requestAnimationFrame(gameLoop);
  }, [isFever]);

  // Handle Send Taunt
  const handleSendTaunt = (msg: string) => {
      if (!gameId || !opponentId || isSolo || isMiniGame) return;
      playClickSound();
      sendTaunt(gameId, opponentId, msg);
  };

  // Calculate PvP bar progress values
  const totalBothScores = score + opponentScoreDisplay;
  const momentumPct = totalBothScores === 0 ? 50 : Math.min(100, Math.max(0, (score / totalBothScores) * 100));

  // --- RENDERS ---

  if (phase === 'lobby' && playerId && !isSolo && !isMiniGame) {
      return <GameLobby gameType="flowbattle" gameName="BEAT SMASH" playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1} onGameStart={handleGameStart} onExit={onExit} updateStat={updateStat} />;
  }

  if (phase === 'vs_clash') {
      return (
          <VsClashScreen 
              myName={player ? player.name : playerName}
              myAppearance={player ? player.appearance : {} as any}
              myGender={player ? player.gender : 'male'}
              opponentId={opponentId || ''}
              opponentName={opponentName || 'Rakip'}
              onComplete={() => {
                  startGame();
              }}
          />
      );
  }

  if (phase === 'result_screen' && resultData) {
      return <MatchResultScreen result={resultData.result} myScore={score} opponentScore={opponentScoreDisplay} opponentName={opponentName} respectChange={isSolo ? 0 : resultData.change} onContinue={() => { onGameEnd(score); onExit(); }} />;
  }

  if (phase === 'waiting_opponent') {
      return <div className="h-full bg-black flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div><h2 className="text-xl font-bold lowercase tracking-tighter">sonuçlar kontrol ediliyor...</h2></div>;
  }

  return (
    <div className={`h-full w-full bg-[#050505] relative overflow-hidden flex flex-col ${isMiniGame ? 'z-[100]' : ''} touch-none select-none font-sans`}>
        
        {/* Ambient background glows */}
        <div className={`absolute inset-0 transition-all duration-1000 ${isFever ? 'bg-purple-950/20' : 'bg-transparent'}`}></div>

        {/* Real-time split bar for PvP Matching */}
        {!isMiniGame && !isSolo && (
            <div className="absolute top-0 left-0 right-0 h-1.5 z-40 bg-neutral-900 flex">
                <div 
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${100 - momentumPct}%` }}
                />
                <div 
                    className="h-full bg-yellow-500 transition-all duration-300 shadow-[0_0_10px_#eab308]"
                    style={{ width: `${momentumPct}%` }}
                />
                <div className="absolute top-0 bottom-0 w-1 bg-white left-1/2 -translate-x-1/2"></div>
            </div>
        )}

        {/* HUD Header */}
        <div className="px-5 py-4 pt-safe flex items-center justify-between border-b border-white/[0.03] bg-black/40 backdrop-blur-md z-30">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-500 lowercase tracking-tighter">puan.</span>
                <span className="text-xl font-black text-white leading-none mt-1 tracking-tighter">{score}</span>
            </div>

            {/* Fever bar indicator */}
            <div className="flex-1 max-w-[120px] mx-4 flex flex-col items-center">
                <span className={`text-[9px] font-black lowercase tracking-tighter mb-1 transition-colors ${isFever ? 'text-purple-400 animate-pulse' : 'text-neutral-500'}`}>
                    {isFever ? 'fever aktif!' : 'fever yükleniyor'}
                </span>
                <div className="w-full h-1.5 rounded-full bg-neutral-950 border border-white/5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 ${isFever ? 'bg-purple-500 animate-pulse' : 'bg-gradient-to-r from-yellow-500 to-amber-500'}`}
                        style={{ width: `${isFever ? 100 : feverMeter}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {combo > 1 && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-neutral-500 tracking-tight uppercase">combo</span>
                        <span className="text-sm font-black text-yellow-500 leading-none tracking-tight">{combo}x</span>
                    </div>
                )}
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-neutral-500 lowercase tracking-tighter">süre.</span>
                    <span className={`text-xl font-black leading-none mt-1 tracking-tighter ${timeLeft < 8 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                </div>
            </div>
        </div>

        {/* Opponent score HUD */}
        {!isSolo && !isMiniGame && (
            <div className="h-6 bg-yellow-500/10 border-b border-yellow-500/10 px-5 flex items-center justify-between z-20 text-[10px] lowercase text-yellow-500 font-bold">
                <span>onlayn kapışma</span>
                <span>{opponentName}: {opponentScoreDisplay} puan</span>
            </div>
        )}

        {/* Gameplay Column Board */}
        <div className="flex-1 w-full max-w-sm mx-auto flex relative border-x border-dashed border-white/[0.03] z-20">
            
            {/* Target aligned line sweeper bar */}
            <div 
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10"
              style={{ top: `${TARGET_Y}%` }}
            />

            {/* Columns template */}
            {[0, 1, 2, 3].map(colIdx => {
                const config = LANES[colIdx];
                return (
                  <div 
                    key={`col-${colIdx}`} 
                    className="flex-1 h-full flex flex-col justify-end relative border-r border-dashed border-white/[0.02] last:border-r-0"
                  >
                    {/* Perfect Target alignment ring */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border border-neutral-800/80 flex items-center justify-center pointer-events-none z-10"
                      style={{ top: `${TARGET_Y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    </div>

                    {/* Flash key highlight feedback */}
                    <AnimatePresence>
                      {padPressStates[colIdx] && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.12 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-[1px] top-0 pointer-events-none z-0"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
            })}

            {/* Falling cues */}
            {activeNotes.map(cue => {
                const padInfo = LANES[cue.lane];
                const isGold = cue.type === 'gold';
                const isBomb = cue.type === 'bomb';

                return (
                  <div 
                    key={cue.id}
                    className="absolute z-25 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                    style={{ 
                      top: `${cue.y}%`, 
                      left: `${12.5 + cue.lane * 25}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        isGold 
                          ? 'bg-yellow-500 text-yellow-950 border-2 border-yellow-200 animate-pulse' 
                          : isBomb 
                          ? 'bg-red-600 text-white border-2 border-red-300' 
                          : 'border'
                      }`}
                      style={{ 
                        borderColor: !isGold && !isBomb ? padInfo.color : undefined,
                        backgroundColor: !isGold && !isBomb ? '#0a0a0a' : undefined,
                        boxShadow: `0 0 15px ${isGold ? '#eab308' : isBomb ? '#ef4444' : padInfo.color}20`
                      }}
                    >
                      {isGold ? (
                        <span className="text-xs font-black">★</span>
                      ) : isBomb ? (
                        <span className="text-xs">💣</span>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: padInfo.color }} />
                      )}
                    </div>
                  </div>
                );
            })}

            {/* Float text hit quality */}
            <AnimatePresence>
              {hitFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -25 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="absolute z-40 text-[11px] font-black tracking-tighter text-center w-28 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  style={{ 
                    left: `${12.5 + hitFeedback.padIdx * 25}%`, 
                    top: `${TARGET_Y - 8}%`, 
                    color: hitFeedback.color,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {hitFeedback.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sparks */}
            {particles.map(p => (
              <div 
                key={p.id}
                className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-20"
                style={{ 
                  left: `${p.x}%`, 
                  top: `${p.y}%`,
                  backgroundColor: p.color,
                  opacity: p.life,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}

            {/* Fever overlay */}
            {isFever && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-purple-950/20 pointer-events-none">
                <span className="text-xs font-black uppercase text-purple-400 tracking-widest animate-pulse">FEVER MODU!</span>
                <span className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">PEDLERİ EZ!</span>
                <span className="text-[10px] text-neutral-400 font-bold lowercase tracking-tight mt-1">kombo bozulmaz • her basış +40 puan</span>
              </div>
            )}
        </div>

        {/* Tactile pad triggers at footer */}
        <div className="w-full max-w-sm mx-auto px-4 pb-8 pt-4 z-30 bg-black/40 backdrop-blur-md">
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map(colIdx => {
                  const pad = LANES[colIdx];
                  const active = padPressStates[colIdx];
                  return (
                    <button 
                      key={`trigger-pad-${colIdx}`}
                      onMouseDown={() => handleInput(colIdx)}
                      onTouchStart={(e) => {
                          e.preventDefault();
                          handleInput(colIdx);
                      }}
                      className={`h-24 rounded-2xl border transition-all duration-75 flex flex-col justify-between items-center p-3 select-none active:scale-[0.88] ${
                        active 
                          ? 'border-white bg-[#ffffff20] scale-95 shadow-inner' 
                          : pad.class
                      }`}
                      style={{
                          touchAction: 'none'
                      }}
                    >
                      <span className="text-[10px] font-black tracking-tighter">{pad.label}</span>
                      <span className="text-[10px] font-extrabold lowercase leading-none">{pad.text}</span>
                    </button>
                  );
              })}
            </div>

            <div className="text-center mt-3 flex justify-center items-center gap-1.5">
                <span className="text-[9px] font-black text-neutral-600 lowercase tracking-tighter">klavye yardımı:</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] font-mono text-neutral-500">A</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] font-mono text-neutral-500">S</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] font-mono text-neutral-500">K</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] font-mono text-neutral-500">L</span>
            </div>
        </div>

        {/* Global Exit button */}
        {!isMiniGame && (
            <button onClick={onExit} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold hover:bg-white/20 pointer-events-auto">✕</button>
        )}

        {/* Live custom chat taunt triggers */}
        {!isSolo && !isMiniGame && (
            <div className="absolute bottom-40 left-0 right-0 z-50 flex justify-center gap-2 pointer-events-auto px-4 overflow-x-auto scrollbar-hide">
                {TAUNTS.map((t, i) => (
                    <button key={i} onClick={() => handleSendTaunt(t)} className="bg-[#222] border border-white/20 text-white text-[9px] font-bold px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors whitespace-nowrap shadow-lg">{t}</button>
                ))}
            </div>
        )}

        {/* Display received opponent taunts */}
        {receivedTaunt && (
            <div className="absolute top-1/3 left-0 right-0 z-50 flex justify-center pointer-events-none animate-bounce">
                <div className="bg-white text-black font-black text-sm px-5 py-3.5 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.4)] border-2 border-black">
                    {receivedTaunt} 🤬
                </div>
            </div>
        )}

    </div>
  );
};
