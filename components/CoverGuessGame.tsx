
import React, { useState, useEffect, useRef } from 'react';
import { searchSongs, generateTriviaQuestions } from '../services/musicService';
import { auth, db } from '../services/firebaseConfig';
import { doc, setDoc, onSnapshot, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { TriviaQuestion, SongTrack, PlayerStats } from '../types';
import { playClickSound, playCorrectSound, playWrongSound, playWinSound, playCountdownTick, playGoSound } from '../services/sfx';
import { GameOverScreen } from './GameOverScreen';
import { GameLobby } from './GameLobby';
import { MatchResultScreen } from './MatchResultScreen';
import { GAME_CATEGORIES } from '../constants';
import { TrophyIcon, ClockIcon, PlayIcon, HeartIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { updateScore, setPlayerFinished, updatePlayerRespect } from '../services/matchmakingService';
import { VsClashScreen } from './VsClashScreen';

interface CoverGuessGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
  playerName: string;
  isOnline?: boolean;
  player?: PlayerStats;
}

const GAME_DURATION = 120; // 2 minutes for online
const ARCADE_DURATION = 60; // 1 minute for arcade

type GamePhase = 'menu' | 'loading' | 'lobby' | 'vs_clash' | 'playing' | 'waiting_opponent' | 'gameover' | 'result_screen';

export const CoverGuessGame: React.FC<CoverGuessGameProps> = ({ onExit, onGameEnd, playerName, isOnline, player }) => {
  const [phase, setPhase] = useState<GamePhase>(isOnline ? 'lobby' : 'menu');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [blurAmount, setBlurAmount] = useState(40);
  const [timeLeft, setTimeLeft] = useState(isOnline ? GAME_DURATION : ARCADE_DURATION);
  const [timerActive, setTimerActive] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('Rakip');
  const [resultData, setResultData] = useState<{result: 'win'|'loss'|'draw', change: number} | null>(null);
  const [resultProcessed, setResultProcessed] = useState(false);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setPlayerId(auth.currentUser.uid);
    }
  }, []);

  useEffect(() => {
    if (!isOnline || !gameId || !playerId) return;
    
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
        const val = snapshot.data();
        if (!val) return;

        if (phase === 'lobby' && val.questions) {
            setQuestions(val.questions);
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

            if (!resultProcessed && phase === 'playing') {
                const bothFinished = myData?.status === 'finished' && opData?.status === 'finished';
                if (bothFinished) {
                    setResultProcessed(true);
                    finalizeGame(myData?.score || 0, opData?.score || 0);
                }
            }
        }
    });
    return () => unsubscribe();
  }, [gameId, playerId, phase, resultProcessed, isOnline]);

  useEffect(() => {
    if (phase === 'playing' && timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, timerActive]);

  const handleGameStart = (id: string) => { setGameId(id); };

  const handleFinish = async () => {
    if (isOnline && gameId && playerId) {
      await setPlayerFinished(gameId, playerId, score);
      setPhase('waiting_opponent');
    } else {
      setPhase('gameover');
    }
  };

  const finalizeGame = (myFinalScore: number, opFinalScore: number) => {
    setPhase('gameover');
    let res: 'win' | 'loss' | 'draw' = 'draw';
    let change = 0;

    if (myFinalScore > opFinalScore) {
        res = 'win';
        change = 40;
        if (playerId) updatePlayerRespect(playerId, change);
    } else if (myFinalScore < opFinalScore) {
        res = 'loss';
        change = -30;
        if (playerId) updatePlayerRespect(playerId, change);
    }

    setResultData({ result: res, change });
    setTimeout(() => setPhase('result_screen'), 1500);
  };

  const startGame = async (catId: string, query: string) => {
    playClickSound();
    setPhase('loading');
    
    try {
      const songs = await searchSongs(query, 100, true);
      if (songs.length < 10) {
        alert("Yetersiz veri. Başka kategori seç.");
        setPhase('menu');
        return;
      }
      
      const qs = generateTriviaQuestions(songs, 50);
      setQuestions(qs);
      setScore(0);
      setLives(3);
      setBlurAmount(40);
      setCurrentQIndex(0);
      setTimeLeft(isOnline ? GAME_DURATION : ARCADE_DURATION);
      setPhase('playing');
      setTimerActive(true);
    } catch (error) {
      console.error(error);
      setPhase('menu');
    }
  };

  const handleAnswer = async (trackId: number) => {
    if (feedback || !timerActive) return;
    
    const q = questions[currentQIndex];
    const isCorrect = trackId === q.correctSong.trackId;
    setSelectedOptionId(trackId);

    if (isCorrect) {
      playCorrectSound();
      setFeedback('correct');
      const points = lives * 10;
      const newScore = score + points;
      setScore(newScore);
      
      if (isOnline && gameId && playerId) {
        await updateScore(gameId, playerId, newScore, 3);
      }

      setTimeout(() => {
        setFeedback(null);
        setSelectedOptionId(null);
        setBlurAmount(40);
        setLives(3);
        setCurrentQIndex(prev => (prev + 1) % questions.length);
      }, 1000);
    } else {
      playWrongSound();
      setFeedback('wrong');
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives > 0) {
        setBlurAmount(prev => Math.max(0, prev - 15));
        setTimeout(() => setFeedback(null), 800);
      } else {
        // Skip to next question if lives are gone for this one
        setTimeout(() => {
          setFeedback(null);
          setSelectedOptionId(null);
          setBlurAmount(40);
          setLives(3);
          setCurrentQIndex(prev => (prev + 1) % questions.length);
        }, 1000);
      }
    }
  };

  const endGame = async () => {
    setTimerActive(false);
    setPhase('gameover');
    if (isOnline && gameId && auth.currentUser) {
       await updateDoc(doc(db, 'games', gameId), {
         status: 'finished'
       });
    }
  };

  if (isOnline && phase === 'lobby') {
    if (!playerId) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-neutral-400 text-xs font-bold tracking-widest">OTURUM HAZIRLANIYOR...</div>
        </div>
      );
    }
    return <GameLobby gameType="coverguess" gameName="KAPAK BİLMECE BATTLE" playerId={playerId} playerName={playerName} playerFans={0} playerLevel={1} onGameStart={handleGameStart} onExit={onExit} />;
  }

  if (isOnline && phase === 'vs_clash') {
    return (
        <VsClashScreen 
            myName={player ? player.name : playerName}
            myAppearance={player ? player.appearance : {} as any}
            myGender={player ? player.gender : 'male'}
            opponentId={opponentId || ''}
            opponentName={opponentName || 'Rakip'}
            onComplete={() => {
                setPhase('playing');
                setTimerActive(true);
            }}
        />
    );
  }

  if (phase === 'result_screen' && resultData) {
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

  if (phase === 'waiting_opponent') {
    return (
        <div className="h-full bg-black flex flex-col items-center justify-center text-white relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
            <h2 className="text-2xl font-black italic mb-2 uppercase tracking-tighter">SONUÇLAR BEKLENİYOR</h2>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Rakibin oyunu bitirmesi bekleniyor...</p>
        </div>
    );
  }

  if (phase === 'menu') {
    return (
      <div className="h-full bg-black flex flex-col font-sans text-white overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1DB954]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="p-6 pt-safe flex justify-between items-center z-20">
          <button onClick={onExit} className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-neutral-400 active:scale-95 transition-all">✕</button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-neutral-500 font-bold lowercase tracking-tight mb-1">arcade</span>
            <span className="text-xl font-bold text-white lowercase tracking-tight leading-none">kapak bilmece<span className="text-[#1DB954]">.</span></span>
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
                onClick={() => startGame(cat.id, cat.query)}
                className="w-full bg-[#0a0a0a] p-5 rounded-[2rem] flex items-center gap-5 group transition-all border border-white/5 active:border-[#1DB954]/20"
              >
                <div 
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 font-extrabold text-[#1DB954] text-base group-active:bg-[#1DB954]/10 transition-all"
                >
                  {cat.label.charAt(0).toLowerCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-extrabold text-sm lowercase tracking-tight group-active:text-[#1DB954] transition-colors leading-tight">
                    {cat.label.toLowerCase()}
                  </div>
                  <div className="text-neutral-500 text-[9px] font-bold lowercase tracking-tight mt-1">
                    oyunu başlat.
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 active:text-black active:bg-[#1DB954] transition-all">
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
        <div className="text-neutral-500 text-[10px] font-bold tracking-tight lowercase">kapaklar yükleniyor...</div>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <GameOverScreen 
        gameName={isOnline ? "kapak bilmece (online)" : "kapak bilmece (arcade)"}
        score={score}
        earnedListeners={score * 2}
        totalListeners={0}
        isWin={isOnline ? score >= opponentScore : score > 0}
        onContinue={() => { onGameEnd(score); onExit(); }}
      />
    );
  }

  if (phase !== 'playing') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black animate-fade-in">
        <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-500 text-[10px] font-bold tracking-tight lowercase">yükleniyor...</div>
      </div>
    );
  }

  const q = questions[currentQIndex];

  if (!q) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-400 text-xs font-bold tracking-widest">SORULAR HAZIRLANIYOR...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col font-sans relative overflow-hidden text-white">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="p-6 pt-safe flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight mb-1">süre</span>
          <span className={`text-xl font-black tabular-nums tracking-tighter ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight mb-1">skor</span>
          <span className="text-xl font-black text-[#1DB954] tabular-nums tracking-tighter">{score}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight mb-1">can</span>
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <HeartIcon key={i} className={`w-3.5 h-3.5 ${i < lives ? 'text-[#1DB954] fill-[#1DB954]' : 'text-[#1DB954]/10'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Online Score Bar */}
      {isOnline && (
        <div className="px-6 py-2 flex justify-between items-center z-20">
          <span className="text-[8px] text-spotify-green font-black uppercase tracking-widest italic">{playerName}</span>
          <div className="h-1 flex-1 mx-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(score / (score + opponentScore || 1)) * 100}%` }}
               className="h-full bg-spotify-green shadow-[0_0_10px_#1DB954]" 
             ></motion.div>
          </div>
          <span className="text-[8px] text-white/40 font-black uppercase tracking-widest italic">{opponentName}</span>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pb-32 space-y-12 z-10">
        <div className="relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-56 h-56 md:w-72 md:h-72 bg-white/5 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 border border-white/10"
          >
            <img 
              src={q.correctSong.artworkUrl100} 
              alt="Album Cover"
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              style={{ filter: `blur(${blurAmount}px)` }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-spotify-green rounded-2xl flex items-center justify-center shadow-2xl z-20 rotate-12 border border-white/20">
            <TrophyIcon className="w-6 h-6 text-black" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></div>
              <p className="text-[#1DB954] text-[10px] font-bold tracking-tight lowercase">albümü tahmin et...</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {q.options.map(opt => {
              let btnClass = "bg-[#0a0a0a] border border-white/5 text-neutral-300";
              if (feedback === 'correct') {
                if (opt.trackId === q.correctSong.trackId) btnClass = "bg-[#1DB954] text-[#000000] font-extrabold border-[#1DB954]";
                else btnClass = "opacity-10 scale-95 border-transparent";
              } else if (feedback === 'wrong') {
                if (opt.trackId === selectedOptionId) btnClass = "bg-red-500 text-[#ffffff] border-red-500 font-extrabold";
                else btnClass = "opacity-10 scale-95 border-transparent";
              }
              return (
                <motion.button
                  key={opt.trackId}
                  whileTap={{ scale: 0.98 }}
                  disabled={!!feedback || !timerActive}
                  onClick={() => handleAnswer(opt.trackId)}
                  className={`py-3 px-4 rounded-[1.25rem] text-xs font-bold lowercase tracking-tight transition-all duration-300 flex items-center justify-center min-h-[50px] ${btnClass}`}
                >
                  <span className="truncate w-full block text-center">{(opt.collectionName || opt.trackName || '').toLowerCase()}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
