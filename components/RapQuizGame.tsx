
import React, { useState, useEffect, useRef } from 'react';
import { fetchSongs, searchSongs, generateTriviaQuestions } from '../services/musicService';
import { saveRapQuizScore, getRapQuizLeaderboard } from '../services/matchmakingService';
import { auth } from '../services/firebaseConfig';
import { TriviaQuestion, SongTrack, LeaderboardEntry } from '../types';
import { DiscIcon, TrophyIcon, ClockIcon, PlayIcon, HeartIcon } from './Icons';
import { playClickSound, playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playWinSound } from '../services/sfx';
import { GameOverScreen } from './GameOverScreen';
import { GAME_CATEGORIES } from '../constants';
import { AdModal } from './AdModal';
import { motion, AnimatePresence } from 'motion/react';

interface RapQuizGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
  playerName: string;
}

const QUESTION_DURATION = 10;
const TOTAL_QUESTIONS = 25;

export const RapQuizGame: React.FC<RapQuizGameProps> = ({ onExit, onGameEnd, playerName }) => {
  const [phase, setPhase] = useState<'menu' | 'loading' | 'playing' | 'gameover'>('menu');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [showRevive, setShowRevive] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(false);

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startCountdown, setStartCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getRapQuizLeaderboard().then(setLeaderboard);
    return () => {
      if (audioRef.current) audioRef.current.pause();
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'playing' && startCountdown > 0) {
        playCountdownTick();
        const timer = setTimeout(() => {
            if (startCountdown === 1) playGoSound();
            setStartCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (phase === 'playing' && startCountdown === 0 && !timerActive && questions.length > 0 && !showRevive) {
        if (currentQIndex === 0 && !selectedOptionId && !feedback) {
            startQuestion(questions[0]);
        }
    }
  }, [startCountdown, phase, showRevive, questions, currentQIndex, timerActive, selectedOptionId, feedback]);

  useEffect(() => {
    if (phase === 'playing' && timerActive && startCountdown === 0) {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    handleTimeOut();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100); 
    } else {
        clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, timerActive, startCountdown]);

  const notify = (message: string, type: 'success' | 'error' | 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const startGame = async (catId: string, query: string) => {
    playClickSound();
    setPhase('loading');
    setSelectedCategory(GAME_CATEGORIES.find(c => c.id === catId)?.label || '');
    setReviveUsed(false);
    setShowRevive(false);
    
    let songs: SongTrack[] = [];
    
    try {
        if (catId === 'general') {
            songs = await fetchSongs();
        } else {
            songs = await searchSongs(query, 60, true);
        }

        if (songs.length < 10) {
            notify("Yetersiz şarkı bulundu. Lütfen başka kategori dene.", 'error');
            setPhase('menu');
            return;
        }

        const qs = generateTriviaQuestions(songs, TOTAL_QUESTIONS);
        setQuestions(qs);
        setScore(0);
        setLives(3);
        setCurrentQIndex(0);
        setStartCountdown(3); 
        setPhase('playing');
    } catch (error) {
        console.error("Game Start Error", error);
        notify("Bağlantı hatası.", 'error');
        setPhase('menu');
    }
  };

  const startQuestion = (q: TriviaQuestion) => {
      playQuestionAudio(q);
      setTimeLeft(QUESTION_DURATION);
      setTimerActive(true);
      setSelectedOptionId(null);
  };

  const playQuestionAudio = (q: TriviaQuestion) => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }
    if (q.correctSong.previewUrl) {
        const audio = new Audio();
        audio.src = q.correctSong.previewUrl;
        audio.volume = 0.5;
        audioRef.current = audio;
        
        setTimeout(() => {
            audio.play().catch(e => {
                console.log("Autoplay blocked, retrying on next interaction", e);
            });
        }, 50);
    }
  };

  const handleTimeOut = () => {
      setTimerActive(false);
      playWrongSound();
      setLives(prev => {
          const newLives = prev - 1;
          if(newLives <= 0 && !reviveUsed) {
              setTimeout(() => setShowRevive(true), 1000);
          } else if (newLives <= 0) {
              setTimeout(endGame, 1000);
          } else {
              setTimeout(nextQuestion, 1500);
          }
          return newLives;
      });
      setFeedback('wrong');
  };

  const handleAnswer = (trackId: number) => {
    if (feedback || !timerActive) return;
    setTimerActive(false);
    setSelectedOptionId(trackId);

    const q = questions[currentQIndex];
    const isCorrect = trackId === q.correctSong.trackId;

    if (isCorrect) {
        playCorrectSound();
        const timeBonus = Math.ceil(timeLeft * 100); 
        const points = Math.max(10, timeBonus);
        setScore(prev => prev + points);
        setFeedback('correct');
        setTimeout(nextQuestion, 1500);
    } else {
        playWrongSound();
        setFeedback('wrong');
        setLives(prev => {
            const newLives = prev - 1;
            if(newLives <= 0 && !reviveUsed) {
                setTimeout(() => setShowRevive(true), 1500);
            } else if (newLives <= 0) {
                setTimeout(endGame, 1500);
            } else {
                setTimeout(nextQuestion, 1500);
            }
            return newLives;
        });
    }
  };

  const handleRevive = () => {
      setShowRevive(false);
      setReviveUsed(true);
      setLives(1);
      nextQuestion();
  };

  const nextQuestion = () => {
      setFeedback(null);
      if (currentQIndex + 1 >= questions.length) {
          endGame();
      } else {
          const nextIdx = currentQIndex + 1;
          setCurrentQIndex(nextIdx);
          startQuestion(questions[nextIdx]);
      }
  };

  const endGame = () => {
      setShowRevive(false);
      if (audioRef.current) audioRef.current.pause();
      setPhase('gameover');
      if (auth.currentUser) {
          saveRapQuizScore(auth.currentUser.uid, playerName || "MC", score);
      }
  };

  if (showRevive) {
      return (
          <AdModal 
            title="CANIN BİTTİ!" 
            rewardText="Reklam izleyerek +1 Can ile devam et." 
            onWatch={handleRevive} 
            onCancel={endGame}
            buttonText="DEVAM ET (+1 CAN)"
          />
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
            <span className="text-xl font-bold text-white lowercase tracking-tight leading-none">rap quiz<span className="text-[#1DB954]">.</span></span>
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
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 font-extrabold text-[#1DB954] text-base group-hover:bg-[#1DB954]/10 group-hover:border-[#1DB954]/20 transition-all"
                >
                  {cat.label.charAt(0).toLowerCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-extrabold text-sm lowercase tracking-tight group-hover:text-[#1DB954] transition-colors leading-tight">
                    {cat.label.toLowerCase()}
                  </div>
                  <div className="text-neutral-500 text-[9px] font-bold lowercase tracking-tight mt-1">
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
              <div className="text-neutral-500 tracking-tight text-[10px] font-bold lowercase">yükleniyor...</div>
          </div>
      );
  }

  if (phase === 'gameover') {
      return (
          <GameOverScreen 
            gameName="RAP QUIZ (SOLO)"
            score={score}
            earnedListeners={0} 
            totalListeners={0}
            isWin={score > 0} 
            onContinue={() => { playClickSound(); onGameEnd(score); onExit(); }}
          />
      );
  }

  const q = questions[currentQIndex];

  return (
      <div className="h-full flex flex-col bg-black relative overflow-hidden font-sans text-white">
          <AnimatePresence>
            {startCountdown > 0 && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 z-[900] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center font-sans"
               >
                   <div className="relative flex items-center justify-center w-32 h-32">
                       <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 animate-pulse"></div>
                       <div className="text-6xl font-black text-white tracking-tighter select-none">{startCountdown}</div>
                   </div>
                   <span className="text-[10px] font-black text-neutral-500 tracking-wider lowercase mt-6">hazırlan...</span>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="p-6 pt-safe flex justify-between items-center z-20 shrink-0">
              <button onClick={onExit} className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center active:scale-95 transition-all text-neutral-400">✕</button>
              
              <div className="flex items-center gap-8">
                  <div className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                      soru <span className="text-white ml-1.5 font-bold">{currentQIndex + 1} / {questions.length}</span>
                  </div>
                  <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                          <HeartIcon key={i} className={`w-4 h-4 transition-all duration-500 ${i < lives ? 'text-[#1DB954] fill-[#1DB954]' : 'text-neutral-800 scale-75'}`} />
                      ))}
                  </div>
              </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-[2px] bg-white/5 relative z-20 shrink-0">
             <motion.div 
                className={`h-full ${timeLeft < 3 ? 'bg-red-500' : 'bg-[#1DB954]'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / QUESTION_DURATION) * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
             ></motion.div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 py-8 pb-32">
               <motion.div 
                key={score}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black text-[#1DB954] mb-8 tabular-nums italic tracking-tighter"
               >
                {score}
               </motion.div>

               <div className="mb-8 relative group shrink-0">
                   <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-white/5 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative z-10 border border-white/10">
                        <img 
                            src={q.correctSong.artworkUrl100 ? q.correctSong.artworkUrl100.replace('http:', 'https:') : ''} 
                            className="w-full h-full object-cover opacity-20 blur-[4px] scale-110" 
                            alt="Song Art"
                        />
                        <div className="absolute inset-0 flex items-center justify-center z-30">
                             <span className="text-4xl font-black tabular-nums tracking-tighter text-white">
                                 {Math.ceil(timeLeft)}
                             </span>
                        </div>
                   </div>
               </div>
               
               <p className="text-[10px] text-neutral-500 font-bold mb-6 text-center lowercase tracking-tight">şarkıyı tahmin et...</p>

               <div className="w-full grid grid-cols-2 gap-2.5 max-w-sm">
                   {q.options.map(opt => {
                       let btnClass = "bg-[#0a0a0a] border-white/5 text-neutral-300";
                       if (feedback) {
                           if (opt.trackId === q.correctSong.trackId) {
                               btnClass = "bg-[#1DB954] text-black font-extrabold scale-[1.02] border-[#1DB954]";
                           } else if (opt.trackId === selectedOptionId) {
                               btnClass = "bg-red-500 text-white border-red-500 scale-[0.98]";
                           } else {
                               btnClass = "opacity-20 scale-95";
                           }
                       }
                       
                       return (
                           <button
                             key={opt.trackId}
                             disabled={!!feedback || !timerActive || startCountdown > 0}
                             onClick={() => handleAnswer(opt.trackId)}
                             className={`py-3 px-3 rounded-2xl flex items-center justify-center min-h-[50px] text-center font-bold text-xs transition-all duration-300 active:scale-[0.98] border lowercase tracking-tight ${btnClass}`}
                           >
                               <span className="truncate w-full block">{opt.trackName.toLowerCase()}</span>
                           </button>
                       )
                   })}
               </div>
          </div>
      </div>
  );
};
