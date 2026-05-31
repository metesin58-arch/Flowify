
import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { updateScore, setPlayerFinished, updatePlayerRespect } from '../services/matchmakingService';
import { SongTrack, GameSequence, PlayerStats } from '../types';
import { GameLobby } from './GameLobby';
import { playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playClickSound } from '../services/sfx';
import { fetchSongs, generateGameSequence, searchSongs } from '../services/musicService';
import { MatchResultScreen } from './MatchResultScreen';
import { GAME_CATEGORIES } from '../constants';
import { AdModal } from './AdModal';
import { PlayIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { VsClashScreen } from './VsClashScreen';

interface HigherLowerGameProps {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  isSolo?: boolean;
  updateStat?: (stat: any, amount: number) => void;
  player?: PlayerStats;
}

type GamePhase = 'auth' | 'menu' | 'loading' | 'lobby' | 'vs_clash' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen';

export const HigherLowerGame: React.FC<HigherLowerGameProps> = ({ playerName, onGameEnd, onExit, isSolo = false, updateStat, player }) => {
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
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
        const val = snapshot.data();
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
            setPhase('vs_clash');
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
    const roundRef = doc(db, 'games', gameId, 'rounds', currentIndex.toString());
    const unsubscribe = onSnapshot(roundRef, (snapshot) => {
        const moves = snapshot.data();
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
        const roundRef = doc(db, 'games', gameId, 'rounds', currentIndex.toString());
        updateDoc(roundRef, { [playerId]: { guess: guess, timestamp: Date.now() } });
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
      <div className="h-full bg-black flex flex-col font-sans text-white overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1DB954]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="p-6 pt-safe flex justify-between items-center z-20">
          <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">✕</button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-neutral-500 font-bold lowercase tracking-tight mb-1">arcade</span>
            <span className="text-xl font-bold text-white lowercase tracking-tight leading-none">eski mi yeni mi<span className="text-[#1DB954]">.</span></span>
          </div>
          <div className="w-10"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-safe no-scrollbar z-10 font-sans">
          <p className="text-neutral-500 text-[10px] font-bold lowercase tracking-tight mb-6 text-center">kategori seç ve başla.</p>
          {GAME_CATEGORIES.map((cat, idx) => {
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => startSoloGame(cat.id, cat.query)}
                className="w-full bg-[#050505] p-5 rounded-[2rem] flex items-center gap-5 group transition-all border border-white/5 hover:border-[#1DB954]/20"
              >
                <div 
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 font-extrabold text-[#1DB954] text-base group-hover:bg-[#1DB954]/10 group-hover:border-[#1DB954]/20 transition-all"
                >
                  {cat.label.charAt(0).toLowerCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-extrabold text-sm lowercase tracking-tight group-hover:text-[#1DB954] transition-colors leading-tight">
                    {cat.label.toLowerCase()}
                  </div>
                  <div className="text-neutral-500 text-[9px] font-bold lowercase tracking-tight mt-1 font-sans">
                    oyunu başlat.
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-black group-hover:bg-[#1DB954] transition-all">
                  <PlayIcon className="w-3 h-3 ml-0.5 fill-current" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black animate-fade-in">
              <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-neutral-500 tracking-tight text-[10px] font-bold lowercase">hazırlanıyor...</div>
          </div>
      );
  }

  if (phase === 'lobby' && playerId && !isSolo) {
      return (
          <GameLobby 
            gameType="higherlower" gameName="HIGHER LOWER"
            playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1}
            onGameStart={handleGameStart} onExit={onExit} updateStat={updateStat}
          />
      );
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
    <div className="h-full w-full bg-black relative flex flex-col overflow-hidden font-sans text-white">
        {/* Ambient background glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>

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

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 p-6 pt-safe flex justify-between items-start">
            <div className="flex flex-col gap-2">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.3em] mb-1">SKOR</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">{score}</span>
                 </div>
                 <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-spotify-green shadow-[0_0_10px_#1DB954]' : 'bg-white/10'}`}></div>
                    ))}
                </div>
            </div>
            
            {!isSolo && (
                <div className="glass px-4 py-2 rounded-2xl flex items-center border border-white/5 shadow-lg">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{opponentName}</span>
                        <span className="text-xs font-black text-white italic">{opponentScore} PTS</span>
                        {isWaitingForOpponent && <div className="text-[8px] text-yellow-500 font-black animate-pulse mt-1">BEKLENİYOR...</div>}
                    </div>
                </div>
            )}
            
            {isSolo && (
                <button onClick={onExit} className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-white/40 active:scale-95 transition-all">✕</button>
            )}
        </div>

        {feedback && (
            <div className={`absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm`}>
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: -6 }}
                    className={`text-6xl font-black italic tracking-tighter ${feedback === 'correct' ? 'text-spotify-green' : 'text-red-500'}`}
                >
                    {feedback === 'correct' ? 'DOĞRU!' : 'YANLIŞ!'}
                </motion.div>
            </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row relative">
            {/* Reference Song */}
            <div className="flex-1 relative bg-black border-b md:border-b-0 md:border-r border-white/5 overflow-hidden group">
                <img 
                    src={refSong?.artworkUrl100} 
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" 
                    referrerPolicy="no-referrer"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-4"
                    >
                        <h3 className="text-2xl font-bold text-white tracking-tighter leading-tight lowercase">{refSong?.trackName?.toLowerCase()}</h3>
                        <p className="text-neutral-500 text-xs font-bold lowercase tracking-tight">{refSong?.artistName?.toLowerCase()}</p>
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-[#1DB954] blur-2xl opacity-10"></div>
                            <div className="text-6xl font-black text-white tracking-tighter relative z-10">{refSong?.releaseYear}</div>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight">çıkış yılı</p>
                    </motion.div>
                </div>
            </div>

            {/* VS Divider */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black rounded-full flex items-center justify-center font-bold text-white lowercase border border-white/5 shadow-2xl">vs</div>

            {/* Target Song */}
            <div className="flex-1 relative bg-black overflow-hidden">
                <img 
                    src={targetSong?.artworkUrl100} 
                    className="absolute inset-0 w-full h-full object-cover opacity-30 animate-pulse-slow" 
                    referrerPolicy="no-referrer"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pb-32 text-center z-10">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-4 w-full max-w-xs"
                    >
                        <h3 className="text-2xl font-bold text-white tracking-tighter leading-tight lowercase">{targetSong?.trackName?.toLowerCase()}</h3>
                        <p className="text-neutral-500 text-xs font-bold lowercase tracking-tight mb-8">{targetSong?.artistName?.toLowerCase()}</p>
                        
                        {showResultYear ? (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-2"
                            >
                                <div className={`text-6xl font-black tracking-tighter drop-shadow-lg ${feedback === 'correct' ? 'text-[#1DB954]' : 'text-red-500'}`}>
                                    {targetSong?.releaseYear}
                                </div>
                                <p className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight">çıkış yılı</p>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-3 w-full">
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleGuess('newer')} 
                                    disabled={isWaitingForOpponent || startCountdown > 0} 
                                    className="bg-[#0a0a0a] text-white py-4 px-6 rounded-[2rem] font-bold lowercase tracking-tight active:bg-white/5 transition-all border border-white/5 disabled:opacity-50 text-xs"
                                >
                                    daha yeni ▲
                                </motion.button>
                                <div className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight">veya</div>
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleGuess('older')} 
                                    disabled={isWaitingForOpponent || startCountdown > 0} 
                                    className="bg-[#0a0a0a] text-white py-4 px-6 rounded-[2rem] font-bold lowercase tracking-tight active:bg-white/5 transition-all border border-white/5 disabled:opacity-50 text-xs"
                                >
                                    daha eski ▼
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    </div>
  );
};
