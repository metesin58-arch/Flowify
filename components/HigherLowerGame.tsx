
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, auth } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, resolveRespectDuel } from '../services/matchmakingService';
import { SongTrack, GameSequence } from '../types';
import { GameLobby } from './GameLobby';
import { playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playClickSound } from '../services/sfx';
import { fetchSongs, generateGameSequence, searchSongs } from '../services/musicService';
import { MatchResultScreen } from './MatchResultScreen';
import { GAME_CATEGORIES } from '../constants';
import { AdModal } from './AdModal';
import { PlayIcon } from './Icons';

interface HigherLowerGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  isSolo?: boolean;
}

type GamePhase = 'auth' | 'menu' | 'loading' | 'lobby' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen';

export const HigherLowerGame: React.FC<HigherLowerGameProps> = ({ playerName, onGameEnd, onExit, isSolo = false }) => {
  const [phase, setPhase] = useState<GamePhase>('auth');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [sequence, setSequence] = useState<GameSequence | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [refSong, setRefSong] = useState<SongTrack | null>(null);
  const [targetSong, setTargetSong] = useState<SongTrack | null>(null);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [startCountdown, setStartCountdown] = useState(3);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showResultYear, setShowResultYear] = useState(false);

  // Revive
  const [showRevive, setShowRevive] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);

  // Opponent Data
  const [opponentName, setOpponentName] = useState('Rakip');
  const [opponentScore, setOpponentScore] = useState(0);
  
  // Results
  const [resultData, setResultData] = useState<{result: 'win'|'loss'|'draw', change: number} | null>(null);
  const [resultProcessed, setResultProcessed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const init = async () => {
        if (auth.currentUser) {
            setPlayerId(auth.currentUser.uid);
        }
        if (isSolo) {
            setPhase('menu'); // Show category menu for solo
        } else {
            setPhase('lobby');
        }
    };
    init();
    return () => stopAudio();
  }, []);

  const notify = (message: string, type: 'success' | 'error' | 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const startSoloGame = async (catId: string, query: string) => {
      setPhase('loading');
      setReviveUsed(false);
      setShowRevive(false);
      try {
          let songs: SongTrack[] = [];
          if (catId === 'general') {
              songs = await fetchSongs();
          } else {
              songs = await searchSongs(query, 60, true); // Strict mode
          }

          const seq = generateGameSequence(songs);
          if (seq) {
              setSequence(seq);
              setRefSong(seq.startSong);
              setTargetSong(seq.targetSongs[0]);
              setPhase('playing');
              setStartCountdown(3);
          } else { 
              throw new Error("Yetersiz veri"); 
          }
      } catch (e) { 
          console.error(e);
          notify("Bu kategoride yeterli şarkı bulunamadı.", 'error');
          setPhase('menu');
      }
  };

  // --- ONLINE GAME LOOP ---
  useEffect(() => {
    if (isSolo || !gameId || !playerId) return;
    const gameRef = ref(db, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;
        
        if (phase === 'lobby' && val.sequence) {
            const seq = val.sequence;
            const normalizedSeq: GameSequence = {
                startSong: seq.startSong,
                targetSongs: Array.isArray(seq.targetSongs) ? seq.targetSongs : Object.values(seq.targetSongs)
            };
            setSequence(normalizedSeq);
            setRefSong(normalizedSeq.startSong);
            setTargetSong(normalizedSeq.targetSongs[0]);
            setPhase('playing');
            setStartCountdown(3);
        }

        if (val.players) {
            const myData = val.players[playerId];
            const opId = Object.keys(val.players).find(k => k !== playerId);
            const opData = opId ? val.players[opId] : null;

            if (opData) {
                setOpponentId(opId);
                setOpponentName(opData.name);
                setOpponentScore(opData.score);
            }

            // --- IMMEDIATE END LOGIC ---
            // Detect if anyone died or finished.
            if (!resultProcessed && phase === 'playing') {
                const iAmDead = myData?.lives <= 0;
                const opponentIsDead = opData?.lives <= 0;
                const bothFinished = myData?.status === 'finished' && opData?.status === 'finished';

                if (iAmDead || opponentIsDead || bothFinished) {
                    setResultProcessed(true);
                    stopAudio();
                    finalizeGame(myData?.score || 0, opData?.score || 0, opId!);
                }
            }
        }
    });
    return () => unsubscribe();
  }, [gameId, playerId, phase, isSolo, resultProcessed]);

  useEffect(() => {
    if (phase === 'playing' && startCountdown > 0) {
        playCountdownTick(); // Tick sound added
        const timer = setTimeout(() => {
            if (startCountdown === 1) playGoSound();
            setStartCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [startCountdown, phase]);

  useEffect(() => {
    if (isSolo || !gameId || !playerId || phase !== 'playing') return;
    const roundRef = ref(db, `games/${gameId}/rounds/${currentIndex}`);
    const unsubscribe = onValue(roundRef, (snapshot) => {
        const moves = snapshot.val();
        const myMove = moves ? moves[playerId] : null;
        if (!myMove) return;
        if (!showResultYear && !feedback) setIsWaitingForOpponent(true);
        const opponentIdKey = Object.keys(moves || {}).find(k => k !== playerId);
        const opponentMove = opponentIdKey ? moves[opponentIdKey] : null;
        if (myMove && opponentMove && isWaitingForOpponent) resolveRound(myMove.guess);
    });
    return () => unsubscribe();
  }, [gameId, playerId, currentIndex, isWaitingForOpponent, phase, isSolo]);

  useEffect(() => {
    if (phase === 'playing' && targetSong && startCountdown === 0 && !showRevive) playAudio(targetSong.previewUrl);
  }, [targetSong, phase, startCountdown, showRevive]);

  const playAudio = (url: string) => {
    stopAudio();
    const audio = new Audio(url);
    audio.volume = 0.6;
    audioRef.current = audio;
    audio.play().catch(() => console.log("Autoplay blocked"));
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleGameStart = (id: string) => { setGameId(id); };

  const handleGuess = (guess: 'older' | 'newer') => {
    if (!targetSong || !refSong || isWaitingForOpponent || startCountdown > 0) return;
    playClickSound();
    if (isSolo) resolveRound(guess);
    else {
        if (!gameId || !playerId) return;
        setIsWaitingForOpponent(true);
        stopAudio();
        update(ref(db, `games/${gameId}/rounds/${currentIndex}/${playerId}`), { guess: guess, timestamp: Date.now() });
    }
  };

  const resolveRound = (myGuess: 'older' | 'newer') => {
      if (!targetSong || !refSong) return;
      setIsWaitingForOpponent(false);
      setShowResultYear(true);
      const isOlder = targetSong.releaseYear < refSong.releaseYear;
      const isNewer = targetSong.releaseYear > refSong.releaseYear;
      const isSame = targetSong.releaseYear === refSong.releaseYear;
      let isCorrect = false;
      if (myGuess === 'older' && (isOlder || isSame)) isCorrect = true;
      if (myGuess === 'newer' && (isNewer || isSame)) isCorrect = true;

      if (isCorrect) {
        playCorrectSound(); // Updated
        setFeedback('correct');
        const newScore = score + 1;
        setScore(newScore);
        if (!isSolo && gameId && playerId) updateScore(gameId, playerId, newScore, lives);
      } else {
        playWrongSound(); // Updated
        setFeedback('wrong');
        const newLives = lives - 1;
        setLives(newLives);
        if (!isSolo && gameId && playerId) updateScore(gameId, playerId, score, newLives);
      }
      
      // Delay before advancing or dying
      setTimeout(() => advanceRound(isCorrect ? lives : lives - 1), 2500);
  };

  const advanceRound = (currentLives: number) => {
    if (!sequence) return;
    
    // DEATH CHECK
    if (currentLives <= 0) { 
        if (isSolo && !reviveUsed) {
            stopAudio();
            setShowRevive(true);
        } else {
            handleFinish();
        }
        return; 
    }

    setFeedback(null);
    setShowResultYear(false);
    setIsWaitingForOpponent(false);
    setRefSong(targetSong);
    const nextIdx = currentIndex + 1;
    if (nextIdx < sequence.targetSongs.length) {
        setCurrentIndex(nextIdx);
        setTargetSong(sequence.targetSongs[nextIdx]);
    } else {
        handleFinish();
    }
  };

  const handleRevive = () => {
      setShowRevive(false);
      setReviveUsed(true);
      setLives(1);
      // Skip current round that killed us
      if (!sequence) return;
      setFeedback(null);
      setShowResultYear(false);
      setIsWaitingForOpponent(false);
      
      // Keep going
      setRefSong(targetSong);
      const nextIdx = currentIndex + 1;
      if (nextIdx < sequence.targetSongs.length) {
          setCurrentIndex(nextIdx);
          setTargetSong(sequence.targetSongs[nextIdx]);
      } else {
          handleFinish();
      }
  };

  // STEP 1: I FINISHED
  const handleFinish = () => {
      if (phase === 'waiting_opponent' || phase === 'gameover' || phase === 'result_screen') return;
      setShowRevive(false);
      stopAudio();

      if (!isSolo && gameId && playerId) {
          setPlayerFinished(gameId, playerId, score);
          // If lives > 0 (ran out of questions), wait.
          // If lives == 0, the listener will catch it instantly.
          if (lives > 0) {
              setPhase('waiting_opponent');
          }
      } else {
          // SOLO FINISH -> Send to App.tsx via onGameEnd
          finalizeGame(score, 0, '');
      }
  };

  // STEP 2: DECLARE WINNER
  const finalizeGame = (myFinalScore: number, opFinalScore: number, opId: string) => {
      setPhase('gameover');
      stopAudio();
      
      let res: 'win' | 'loss' | 'draw' = 'draw';
      let change = 0;

      if (!isSolo && gameId && playerId && opponentId) {
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
          setTimeout(() => setPhase('result_screen'), 1000);

      } else if (isSolo) {
          // Updated: Simply notify parent about score. No custom modal needed here.
          setTimeout(() => { onGameEnd(myFinalScore); onExit(); }, 2000);
      }
  };

  // --- REVIVE MODAL ---
  if (showRevive) {
      return (
          <AdModal 
            title="CANIN BİTTİ!" 
            rewardText="Reklam izleyerek +1 Can ile devam et." 
            onWatch={handleRevive} 
            onCancel={handleFinish}
            buttonText="DEVAM ET (+1 CAN)"
          />
      );
  }

  // --- MENU RENDER FOR SOLO ---
  if (phase === 'menu' && isSolo) {
      return (
          <div className="h-full bg-[#121212] flex flex-col relative animate-fade-in font-sans">
              
              {/* Header with Fade */}
              <div className="pt-safe-top px-6 pb-6 bg-gradient-to-b from-black/80 to-[#121212] z-20 shrink-0">
                  <div className="flex justify-between items-center mb-6 mt-4">
                      <button onClick={onExit} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors">✕</button>
                      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">SOLO MOD</div>
                  </div>
                  
                  <h1 className="text-4xl font-black italic text-white tracking-tighter mb-2">AŞAĞI YUKARI</h1>
                  <p className="text-neutral-400 text-xs font-medium">Hangi şarkı daha yeni? Kategorini seç.</p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
                  <h3 className="text-white font-bold text-xs mb-4">KATEGORİLER</h3>
                  <div className="space-y-2">
                      {GAME_CATEGORIES.map((cat, idx) => {
                          // Generate a unique gradient based on index
                          const hue = (idx * 45) % 360;
                          const gradient = `linear-gradient(135deg, hsl(${hue}, 60%, 20%), hsl(${hue}, 60%, 5%))`;
                          
                          return (
                              <button
                                key={cat.id}
                                onClick={() => startSoloGame(cat.id, cat.query)}
                                className="w-full bg-[#181818] hover:bg-[#282828] p-3 rounded-md flex items-center gap-4 group transition-all active:scale-[0.98] border border-transparent hover:border-[#1ed760]/20"
                              >
                                  {/* Left Cover Art Placeholder */}
                                  <div 
                                    className="w-12 h-12 rounded bg-[#333] shadow-lg flex items-center justify-center shrink-0 font-black text-white/20 text-lg"
                                    style={{ background: gradient }}
                                  >
                                      {cat.label.charAt(0)}
                                  </div>

                                  {/* Text Info */}
                                  <div className="flex-1 text-left min-w-0">
                                      <div className="text-white font-bold text-sm truncate group-hover:text-[#1ed760] transition-colors leading-tight">
                                          {cat.label}
                                      </div>
                                      <div className="text-neutral-500 text-[10px] font-medium mt-0.5 truncate">
                                          Oyunu başlat • {cat.id === 'general' ? 'Karışık' : 'Sanatçı'}
                                      </div>
                                  </div>

                                  {/* Play Icon */}
                                  <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      <PlayIcon className="w-3 h-3 ml-0.5" />
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'loading') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-neutral-400 font-bold animate-pulse tracking-widest text-xs uppercase">HAZIRLANIYOR...</div>
          </div>
      );
  }

  if (phase === 'lobby' && playerId && !isSolo) {
      return (
          <GameLobby 
            gameType="higherlower" gameName="AŞAĞI / YUKARI"
            playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1}
            onGameStart={handleGameStart} onExit={onExit}
          />
      );
  }

  // RESULT UI
  if (phase === 'result_screen' && resultData && !isSolo) {
      return (
          <MatchResultScreen 
            result={resultData.result}
            myScore={score}
            opponentScore={opponentScore}
            opponentName={opponentName}
            respectChange={resultData.change}
            onContinue={() => { onGameEnd(score); onExit(); }}
          />
      );
  }

  // WAITING UI
  if (phase === 'waiting_opponent' && !isSolo) {
      return (
          <div className="h-full bg-black flex flex-col items-center justify-center text-white relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h2 className="text-2xl font-black italic mb-2">SONUÇLAR BEKLENİYOR</h2>
              <p className="text-neutral-500 text-sm">Rakibin oyunu bitirmesi bekleniyor...</p>
              <div className="mt-8 bg-neutral-900 p-4 rounded-xl border border-white/10 w-64">
                  <div className="flex justify-between mb-2">
                      <span className="text-blue-500 font-bold">SEN</span>
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

  if (phase === 'auth') return <div className="h-full bg-black flex items-center justify-center text-white">Yükleniyor...</div>;

  return (
    <div className="h-full w-full bg-black relative flex flex-col overflow-hidden font-sans">
        {startCountdown > 0 && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                 <div className="text-9xl font-black text-white animate-ping">{startCountdown}</div>
             </div>
        )}

        {phase === 'gameover' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="text-3xl font-black text-white animate-bounce">SONUÇLAR GELDİ!</div>
            </div>
        )}

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-safe flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
            <div>
                 <div className="text-4xl font-black text-white drop-shadow-md">{score}</div>
                 <div className="flex gap-1 mt-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-[#1ed760]' : 'bg-neutral-800'}`}></div>
                    ))}
                </div>
            </div>
            {!isSolo && <div className="text-right"><div className="text-xs font-bold text-neutral-400 uppercase">{opponentName}</div><div className="text-xl font-bold text-white">{opponentScore}</div>{isWaitingForOpponent && <div className="text-[10px] text-yellow-400 animate-pulse">Rakip Bekleniyor...</div>}</div>}
        </div>

        {feedback && (
            <div className={`absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-pulse`}>
                <div className={`text-6xl font-black transform -rotate-6 ${feedback === 'correct' ? 'text-[#1ed760]' : 'text-red-500'}`}>
                    {feedback === 'correct' ? 'DOĞRU!' : 'YANLIŞ!'}
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row relative">
            <div className="flex-1 relative bg-neutral-900 border-b md:border-b-0 md:border-r border-black/50 overflow-hidden group">
                <img src={refSong?.artworkUrl100} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10"><h3 className="text-2xl font-bold text-white mb-2 leading-tight">{refSong?.trackName}</h3><p className="text-neutral-300 mb-6">{refSong?.artistName}</p><div className="text-5xl font-black text-yellow-500 drop-shadow-lg">{refSong?.releaseYear}</div><p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">Çıkış Yılı</p></div>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-black border-4 border-black shadow-xl">VS</div>
            <div className="flex-1 relative bg-neutral-800 overflow-hidden">
                <img src={targetSong?.artworkUrl100} className="absolute inset-0 w-full h-full object-cover opacity-40 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{targetSong?.trackName}</h3><p className="text-neutral-300 mb-8">{targetSong?.artistName}</p>
                    {showResultYear ? (
                        <div className="animate-bounce"><div className={`text-5xl font-black drop-shadow-lg ${feedback === 'correct' ? 'text-[#1ed760]' : 'text-red-500'}`}>{targetSong?.releaseYear}</div><p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">Çıkış Yılı</p></div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full max-w-[200px]">
                            <button onClick={() => handleGuess('newer')} disabled={isWaitingForOpponent || startCountdown > 0} className="bg-transparent border-2 border-white text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-50">DAHA YENİ ▲</button>
                            <div className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Veya</div>
                            <button onClick={() => handleGuess('older')} disabled={isWaitingForOpponent || startCountdown > 0} className="bg-transparent border-2 border-white text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-50">DAHA ESKİ ▼</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
