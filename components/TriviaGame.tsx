
import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, updatePlayerRespect } from '../services/matchmakingService';
import { TriviaQuestion, PlayerStats } from '../types';
import { GameLobby } from './GameLobby';
import { playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playWinSound } from '../services/sfx';
import { MatchResultScreen } from './MatchResultScreen';
import { AdModal } from './AdModal';
import { motion, AnimatePresence } from 'motion/react';
import { VsClashScreen } from './VsClashScreen';

interface TriviaGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  updateStat?: (stat: any, amount: number) => void;
  player?: PlayerStats;
}

type GamePhase = 'auth' | 'lobby' | 'vs_clash' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen';

export const TriviaGame: React.FC<TriviaGameProps> = ({ playerName, onGameEnd, onExit, updateStat, player }) => {
  const [phase, setPhase] = useState<GamePhase>('auth');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  
  // Revive
  const [showRevive, setShowRevive] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);

  // Opponent Stats
  const [opponentName, setOpponentName] = useState('Rakip');
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentLives, setOpponentLives] = useState(3);
  
  // Result State
  const [resultData, setResultData] = useState<{result: 'win'|'loss'|'draw', change: number} | null>(null);
  const [resultProcessed, setResultProcessed] = useState(false);

  const [startCountdown, setStartCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [canAnswer, setCanAnswer] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
          setPlayerId(auth.currentUser.uid);
      }
      setPhase('lobby');
    };
    init();
    return () => stopAudio();
  }, []);

  // --- MAIN GAME LOOP LISTENER ---
  useEffect(() => {
    if (!gameId || !playerId) return;
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
        const val = snapshot.data();
        if (!val) return;

        // 1. Load Questions
        if (phase === 'lobby' && val.questions) {
            setQuestions(val.questions);
            setPhase('vs_clash');
        }

        // 2. Sync Players & Check End Conditions
        if (val.players) {
            const myData = val.players[playerId];
            const opId = Object.keys(val.players).find(k => k !== playerId);
            const opData = opId ? val.players[opId] : null;

            if (opData) {
                setOpponentId(opId);
                setOpponentName(opData.name);
                setOpponentScore(opData.score);
                setOpponentLives(opData.lives);
            }

            // --- IMMEDIATE END LOGIC ---
            // If anyone finishes OR anyone dies (lives <= 0), end the game immediately.
            // We don't wait for 'finished' status if someone is dead.
            if (!resultProcessed && phase === 'playing') {
                const iAmDead = myData?.lives <= 0;
                const opponentIsDead = opData?.lives <= 0;
                const bothFinished = myData?.status === 'finished' && opData?.status === 'finished';

                if (iAmDead || opponentIsDead || bothFinished) {
                    setResultProcessed(true);
                    stopAudio();
                    // Use the latest scores from Firebase to be sure
                    finalizeGame(myData?.score || 0, opData?.score || 0, opId!);
                }
            }
        }
    });
    return () => unsubscribe();
  }, [gameId, playerId, phase, resultProcessed]); 

  // Countdown Logic
  useEffect(() => {
    if (phase === 'playing' && startCountdown > 0) {
        playCountdownTick(); // Added Tick Sound
        const timer = setTimeout(() => {
            if (startCountdown === 1) playGoSound();
            setStartCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (phase === 'playing' && startCountdown === 0 && !canAnswer && currentQIndex === 0) {
        startRound(0, questions);
    }
  }, [startCountdown, phase]);

  // Timer Logic
  useEffect(() => {
    if (phase === 'playing' && canAnswer && timeLeft > 0 && !showRevive) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && canAnswer) {
       handleAnswer(-1);
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, phase, canAnswer, showRevive]);

  const handleGameStart = (id: string) => { setGameId(id); };

  const startRound = (qIndex: number, qList: TriviaQuestion[]) => {
      if (qIndex >= qList.length) { handleFinish(); return; }
      
      setFeedback(null);
      setSelectedOptionId(null);
      setCurrentQIndex(qIndex);
      setTimeLeft(15);
      setCanAnswer(true);
      playPreview(qList[qIndex].correctSong.previewUrl);
  };

  const stopAudio = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };
  const playPreview = (url: string) => { stopAudio(); if(url) { audioRef.current = new Audio(url); audioRef.current.volume = 0.5; audioRef.current.play().catch(e => {}); }};

  const handleAnswer = (trackId: number) => {
    if (!canAnswer) return;
    setCanAnswer(false);
    stopAudio();
    setSelectedOptionId(trackId);

    const currentQ = questions[currentQIndex];
    let newLives = lives;
    let newScore = score;

    let isCorrect = false;
    if (currentQ && trackId === currentQ.correctSong.trackId) {
        isCorrect = true;
        playCorrectSound(); // Updated
        newScore += (100 + timeLeft * 10);
        setScore(newScore);
        setFeedback('correct');
    } else {
        playWrongSound(); // Updated
        newLives -= 1;
        setLives(newLives);
        setFeedback('wrong');
    }

    if (gameId && playerId) updateScore(gameId, playerId, newScore, newLives);

    setTimeout(() => {
        if (newLives <= 0) {
            // DEATH - Game ends via listener now, but we can trigger finish locally too
            handleFinish(newScore); 
        }
        else startRound(currentQIndex + 1, questions);
    }, 1500);
  };

  // STEP 1: I FINISHED
  const handleFinish = (finalScore?: number) => {
      if(phase === 'waiting_opponent' || phase === 'gameover' || phase === 'result_screen') return;
      
      const fs = finalScore !== undefined ? finalScore : score;
      // We don't set 'waiting_opponent' anymore because game ends instantly if lives=0
      // But if we ran out of questions, we still wait.
      setScore(fs);
      stopAudio();

      if (gameId && playerId) {
          setPlayerFinished(gameId, playerId, fs);
      }
      
      // If I finished because I died, the useEffect will pick it up instantly.
      // If I finished because questions ended, I might wait.
      if (lives > 0) {
          setPhase('waiting_opponent');
      }
  };

  // STEP 2: BOTH FINISHED OR DEATH DETECTED
  const finalizeGame = (myFinalScore: number, opFinalScore: number, opId: string) => {
      setPhase('gameover'); // Freeze inputs
      stopAudio();
      
      let res: 'win' | 'loss' | 'draw' = 'draw';
      let change = 0;

      // New Win Logic: High Score Wins.
      if (myFinalScore > opFinalScore) {
          res = 'win';
          change = 34; // Updated from 30
          if (playerId) updatePlayerRespect(playerId, change);
      } else if (myFinalScore < opFinalScore) {
          res = 'loss';
          change = -34; // Updated from -30
          if (playerId) updatePlayerRespect(playerId, change);
      } else {
          res = 'draw';
          change = 0;
      }

      setResultData({ result: res, change });
      
      setTimeout(() => {
          setPhase('result_screen');
      }, 1000);
  };

  if (phase === 'lobby' && playerId) {
      return <GameLobby gameType="trivia" gameName="RAPQUIZ BATTLE" playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1} onGameStart={handleGameStart} onExit={onExit} updateStat={updateStat} />;
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
                  setPhase('playing');
                  setStartCountdown(3);
              }}
          />
      );
  }

  // RESULT SCREEN
  if (phase === 'result_screen' && resultData) {
      return (
          <MatchResultScreen 
            result={resultData.result}
            myScore={score}
            opponentScore={opponentScore}
            opponentName={opponentName}
            respectChange={resultData.change}
            onContinue={() => {
                onGameEnd(score);
                onExit();
            }}
          />
      );
  }

  // WAITING UI
  if (phase === 'waiting_opponent') {
      return (
          <div className="h-full bg-black flex flex-col items-center justify-center text-white relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <h2 className="text-xl font-black italic mb-2">SONUÇLAR BEKLENİYOR</h2>
              <p className="text-neutral-500 text-sm">Rakibin oyunu bitirmesi bekleniyor...</p>
              <div className="mt-8 bg-neutral-900 p-4 rounded-xl border border-white/10 w-64">
                  <div className="flex justify-between mb-2">
                      <span className="text-green-500 font-bold">SEN</span>
                      <span className="text-white font-mono">{score}</span>
                  </div>
                  <div className="flex justify-between opacity-50">
                      <span className="text-red-500 font-bold">{opponentName}</span>
                      <span className="text-white font-mono">???</span>
                  </div>
              </div>
          </div>
      );
  }

  const currentQ = questions[currentQIndex];
  if (!currentQ && phase !== 'gameover' && phase !== 'result_screen') return <div className="h-full bg-black flex items-center justify-center text-white">Yükleniyor...</div>;

  return (
    <div className="h-full flex flex-col bg-black p-3 relative overflow-hidden font-sans">
        
        {/* Ambient background glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>

        {startCountdown > 0 && (
             <div className="absolute inset-0 z-[900] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center font-sans">
                 <div className="relative flex items-center justify-center w-32 h-32">
                     <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 animate-pulse"></div>
                     <div className="text-6xl font-black text-white tracking-tighter select-none">{startCountdown}</div>
                 </div>
                 <span className="text-[10px] font-black text-neutral-500 tracking-wider lowercase mt-6">hazırlan...</span>
             </div>
        )}
        
        {phase === 'gameover' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="text-3xl font-black text-white italic animate-bounce uppercase tracking-tighter">SONUÇLAR GELDİ!</div>
            </div>
        )}

        <div className="flex justify-between items-center mb-2 pt-safe-top mt-safe z-20 px-3">
            <div className="glass px-4 py-2 rounded-2xl flex items-center border border-white/5 shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{opponentName}</span>
                    <span className="text-xs font-black text-white italic">{opponentScore} PTS</span>
                </div>
            </div>
             <button onClick={onExit} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="flex justify-between items-center mb-2 px-4 z-20">
            <div className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">{score}</div>
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-spotify-green shadow-[0_0_10px_#1DB954]' : 'bg-white/10'}`}></div>
                ))}
            </div>
        </div>
        
        <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden z-20 border border-white/5">
            <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                className={`h-full transition-colors duration-300 ${timeLeft < 5 ? 'bg-red-500' : 'bg-spotify-green'}`}
            ></motion.div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 px-4">
            {currentQ && (
                <>
                    <div className="mb-8 relative group shrink-0">
                       <div className="absolute inset-0 bg-spotify-green blur-[60px] opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                       <motion.div 
                         animate={canAnswer ? { rotate: 360 } : {}}
                         transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                         className={`w-40 h-40 md:w-56 md:h-56 rounded-full bg-black border-[8px] border-white/5 flex items-center justify-center shadow-2xl relative z-10 ${canAnswer ? 'border-spotify-green/20' : ''}`}
                       >
                            <img 
                                src={currentQ.correctSong.artworkUrl100 ? currentQ.correctSong.artworkUrl100.replace('http:', 'https:') : ''} 
                                className="w-full h-full object-cover rounded-full opacity-40 blur-[2px] scale-105" 
                                alt="Song Art"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/20 rounded-full"></div>
                            <div className="absolute w-6 h-6 bg-black rounded-full border border-white/10 z-20"></div>
                       </motion.div>
                   </div>
                    
                    <div className="flex items-center justify-center gap-2 mb-6 shrink-0">
                        <div className="w-1 h-3 bg-spotify-green rounded-full shadow-[0_0_10px_#1DB954]"></div>
                        <h2 className="text-[10px] font-black text-spotify-green uppercase tracking-[0.4em] italic">HANGİ ŞARKI?</h2>
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-2.5 pb-safe max-w-sm">
                        {currentQ.options.map((option) => {
                            let btnClass = "glass text-white/60 border-white/5 hover:bg-white/10 hover:text-white";
                            if (feedback) {
                                if (option.trackId === currentQ.correctSong.trackId) {
                                    btnClass = "bg-spotify-green text-black font-black border-spotify-green shadow-[0_0_20px_rgba(29,185,84,0.4)]";
                                } else if (option.trackId === selectedOptionId) {
                                    btnClass = "bg-red-600 border-red-500 text-white font-black";
                                } else {
                                    btnClass = "opacity-10 border-transparent";
                                }
                            }
                            return (
                                <motion.button 
                                    key={option.trackId} 
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAnswer(option.trackId)} 
                                    disabled={!canAnswer || startCountdown > 0} 
                                    className={`py-3 px-3 rounded-xl text-center font-black text-[9px] uppercase tracking-widest transition-all border italic flex items-center justify-center min-h-[48px] backdrop-blur-sm relative overflow-hidden ${btnClass}`}
                                >
                                    <span className="truncate w-full block relative z-10">{option.trackName}</span>
                                </motion.button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};
