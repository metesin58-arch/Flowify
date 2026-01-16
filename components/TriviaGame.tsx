
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, resolveRespectDuel } from '../services/matchmakingService';
import { TriviaQuestion } from '../types';
import { GameLobby } from './GameLobby';
import { playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playWinSound } from '../services/sfx';
import { MatchResultScreen } from './MatchResultScreen';
import { AdModal } from './AdModal';

interface TriviaGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
}

type GamePhase = 'auth' | 'lobby' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen';

export const TriviaGame: React.FC<TriviaGameProps> = ({ playerName, onGameEnd, onExit }) => {
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
    const gameRef = ref(db, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;

        // 1. Load Questions
        if (phase === 'lobby' && val.questions) {
            setQuestions(val.questions);
            setPhase('playing');
            setStartCountdown(3);
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
          if (playerId && opId) resolveRespectDuel(playerId, opId);
      } else if (myFinalScore < opFinalScore) {
          res = 'loss';
          change = -34; // Updated from -30
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
      return <GameLobby gameType="trivia" gameName="RAPQUIZ BATTLE" playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1} onGameStart={handleGameStart} onExit={onExit} />;
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
              <h2 className="text-2xl font-black italic mb-2">SONUÇLAR BEKLENİYOR</h2>
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
    <div className="h-full flex flex-col bg-[#050505] p-4 relative overflow-hidden font-sans">
        
        {/* Ambient background */}
        <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        {startCountdown > 0 && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"><div className="text-9xl font-black text-white animate-ping">{startCountdown}</div></div>}
        
        {phase === 'gameover' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="text-3xl font-black text-white animate-bounce">SONUÇLAR GELDİ!</div>
            </div>
        )}

        <div className="flex justify-between items-center mb-4 pt-safe-top mt-safe z-20">
            <div className="bg-neutral-900/80 backdrop-blur rounded-xl p-3 flex items-center border border-white/5 shadow-lg">
                <div className="flex flex-col"><span className="text-xs font-bold text-neutral-300 uppercase">{opponentName}</span><span className="text-[10px] text-neutral-500">{opponentScore} pts</span></div>
            </div>
             <button onClick={onExit} className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center text-white border border-red-500/30 hover:bg-red-900 z-50">✕</button>
        </div>
        
        <div className="flex justify-between items-center mb-4 px-2 z-20">
            <div className="font-mono text-3xl font-black text-white drop-shadow-lg">{score}</div>
            <div className="flex gap-1">{[...Array(3)].map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-sm transform rotate-45 ${i < lives ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-neutral-800'}`}></div>)}</div>
        </div>
        
        <div className="w-full h-1 bg-neutral-800 rounded-full mb-4 overflow-hidden z-20"><div className={`h-full transition-all duration-1000 linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }}></div></div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0">
            {currentQ && (
                <>
                    <div className="mb-6 relative group shrink-0">
                       <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                       <div className={`w-36 h-36 md:w-56 md:h-56 rounded-full bg-black border-[6px] border-[#1a1a1a] flex items-center justify-center shadow-2xl relative z-10 ${canAnswer ? 'animate-spin-slow' : ''}`}>
                            <img 
                                src={currentQ.correctSong.artworkUrl100 ? currentQ.correctSong.artworkUrl100.replace('http:', 'https:') : ''} 
                                className="w-full h-full object-cover rounded-full opacity-50 blur-[1px] scale-105" 
                                alt="Song Art"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-full"></div>
                            <div className="absolute w-4 h-4 bg-black rounded-full border border-white/10 z-20"></div>
                       </div>
                   </div>
                    
                    <h2 className="text-xs font-bold text-center mb-6 text-neutral-400 uppercase tracking-[0.3em] shrink-0">HANGİ ŞARKI?</h2>
                    
                    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 pb-safe max-w-sm">
                        {currentQ.options.map((option) => {
                            let btnClass = "bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10 hover:border-white/20";
                            if (feedback) {
                                if (option.trackId === currentQ.correctSong.trackId) {
                                    btnClass = "bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]";
                                } else if (option.trackId === selectedOptionId) {
                                    btnClass = "bg-red-600 border-red-400 text-white";
                                } else {
                                    btnClass = "opacity-30 border-transparent";
                                }
                            }
                            return (
                                <button 
                                    key={option.trackId} 
                                    onClick={() => handleAnswer(option.trackId)} 
                                    disabled={!canAnswer || startCountdown > 0} 
                                    className={`w-full p-4 rounded-2xl text-center font-bold text-sm transition-all border-2 active:scale-95 flex items-center justify-center min-h-[60px] backdrop-blur-sm relative overflow-hidden ${btnClass}`}
                                >
                                    <span className="truncate w-full block relative z-10">{option.trackName}</span>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};
