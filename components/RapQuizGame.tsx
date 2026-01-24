
import React, { useState, useEffect, useRef } from 'react';
import { fetchSongs, searchSongs, generateTriviaQuestions } from '../services/musicService';
import { saveRapQuizScore, getRapQuizLeaderboard } from '../services/matchmakingService';
import { auth } from '../services/firebaseConfig';
import { TriviaQuestion, SongTrack, LeaderboardEntry } from '../types';
import { DiscIcon, TrophyIcon, ClockIcon, PlayIcon } from './Icons';
import { playClickSound, playCountdownTick, playGoSound, playCorrectSound, playWrongSound, playWinSound } from '../services/sfx';
import { GameOverScreen } from './GameOverScreen';
import { GAME_CATEGORIES } from '../constants';
import { AdModal } from './AdModal';

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
  
  // Revive State
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
        playCountdownTick(); // Added Tick Sound
        const timer = setTimeout(() => {
            if (startCountdown === 1) playGoSound();
            setStartCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (phase === 'playing' && startCountdown === 0 && !timerActive && questions.length > 0 && !showRevive) {
        if (currentQIndex === 0 && timeLeft === QUESTION_DURATION) {
            startQuestion(questions[0]);
        }
    }
  }, [startCountdown, phase, showRevive]);

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
    if (audioRef.current) audioRef.current.pause();
    if (q.correctSong.previewUrl) {
        const audio = new Audio(q.correctSong.previewUrl);
        audio.volume = 0.5;
        audioRef.current = audio;
        audio.play().catch(e => console.log("Autoplay blocked"));
    }
  };

  const handleTimeOut = () => {
      setTimerActive(false);
      playWrongSound(); // Updated
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
        playCorrectSound(); // Updated
        const timeBonus = Math.ceil(timeLeft * 100); 
        const points = Math.max(10, timeBonus);
        setScore(prev => prev + points);
        setFeedback('correct');
        setTimeout(nextQuestion, 1500);
    } else {
        playWrongSound(); // Updated
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

  // --- AD MODAL ---
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
          <div className="h-full bg-[#121212] flex flex-col relative animate-fade-in font-sans">
              
              {/* Header with Fade */}
              <div className="pt-safe-top px-6 pb-6 bg-gradient-to-b from-black/80 to-[#121212] z-20 shrink-0">
                  <div className="flex justify-between items-center mb-6 mt-4">
                      <button onClick={onExit} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors">✕</button>
                      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">SOLO MOD</div>
                  </div>
                  
                  <h1 className="text-4xl font-black italic text-white tracking-tighter mb-2">RAP QUIZ</h1>
                  <p className="text-neutral-400 text-xs font-medium">Bilgini konuştur, zamana karşı yarış.</p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
                  
                  {/* Leaderboard Mini Teaser */}
                  {leaderboard.length > 0 && (
                      <div className="mb-8">
                          <h3 className="text-white font-bold text-xs mb-3 flex items-center gap-2">
                              <TrophyIcon className="w-4 h-4 text-yellow-500" />
                              LİDER TABLOSU
                          </h3>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {leaderboard.slice(0, 5).map((entry, idx) => (
                                  <div key={idx} className="bg-[#181818] p-3 rounded-lg min-w-[100px] border border-white/5 flex flex-col items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mb-2 ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-[#333] text-white'}`}>#{idx + 1}</div>
                                      <div className="text-white text-[10px] font-bold truncate w-full text-center">{entry.name}</div>
                                      <div className="text-[#1ed760] text-[9px] font-mono">{entry.score}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <h3 className="text-white font-bold text-xs mb-4">KATEGORİLER</h3>
                  <div className="space-y-2">
                      {GAME_CATEGORIES.map((cat, idx) => {
                          // Generate a unique gradient based on index
                          const hue = (idx * 45) % 360;
                          const gradient = `linear-gradient(135deg, hsl(${hue}, 60%, 20%), hsl(${hue}, 60%, 5%))`;
                          
                          return (
                              <button
                                key={cat.id}
                                onClick={() => startGame(cat.id, cat.query)}
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
                                          Testi başlat • {cat.id === 'general' ? 'Karışık' : 'Sanatçı'}
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

  // ... rest of the component remains the same ...
  if (phase === 'loading') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black">
              <div className="w-12 h-12 border-4 border-[#1ed760] border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-neutral-400 font-bold animate-pulse tracking-widest text-xs uppercase">YÜKLENİYOR...</div>
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
      <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden font-sans">
          {startCountdown > 0 && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                 <div className="text-9xl font-black text-white animate-ping">{startCountdown}</div>
             </div>
        )}

          <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-green-900/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="p-4 bg-black/50 backdrop-blur-md flex justify-between items-center z-20 pt-[max(1rem,env(safe-area-inset-top))] border-b border-white/5 shrink-0">
              <button onClick={onExit} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm border border-white/5">✕</button>
              
              <div className="flex items-center gap-4">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full">
                      SORU: <span className="text-white">{currentQIndex + 1} / {questions.length}</span>
                  </div>
                  <div className="flex gap-1.5">
                      {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-sm transform rotate-45 ${i < lives ? 'bg-[#1ed760] shadow-[0_0_8px_green]' : 'bg-neutral-800'}`}></div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="w-full h-1 bg-neutral-900 relative z-20 shrink-0">
             <div 
                className={`h-full transition-all duration-100 linear ${timeLeft < 3 ? 'bg-red-500' : timeLeft < 6 ? 'bg-yellow-500' : 'bg-[#1ed760]'}`}
                style={{ width: `${(timeLeft / QUESTION_DURATION) * 100}%` }}
             ></div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start pt-4 px-6 relative z-10 min-h-0 overflow-y-auto">
               <div className="text-4xl font-black text-white mb-4 drop-shadow-2xl tracking-tighter shrink-0">{score}</div>

               <div className="mb-6 relative group shrink-0">
                   <div className="absolute inset-0 bg-[#1ed760] blur-3xl opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                   <div className={`w-36 h-36 md:w-56 md:h-56 rounded-full bg-black border-[6px] border-[#1a1a1a] flex items-center justify-center shadow-2xl relative z-10 animate-spin-slow`}>
                        <img 
                            src={q.correctSong.artworkUrl100 ? q.correctSong.artworkUrl100.replace('http:', 'https:') : ''} 
                            className="w-full h-full object-cover rounded-full opacity-50 blur-[1px] scale-105" 
                            alt="Song Art"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-full"></div>
                        <div className="absolute w-4 h-4 bg-black rounded-full border border-white/10 z-20"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center z-30">
                             <span className={`text-4xl font-black ${timeLeft < 3 ? 'text-red-500 animate-ping' : 'text-white/90'}`}>
                                 {Math.ceil(timeLeft)}
                             </span>
                        </div>
                   </div>
               </div>
               
               <h3 className="text-xs text-neutral-400 font-bold mb-4 text-center uppercase tracking-[0.3em] animate-pulse shrink-0">HANGİ ŞARKI?</h3>

               <div className="w-full space-y-3 pb-safe max-w-sm flex-1">
                   {q.options.map(opt => {
                       // NEW PREMIUM BUTTON STYLE
                       let btnClass = "bg-[#181818] border-white/5 text-neutral-200 hover:bg-[#282828] hover:border-white/10";
                       if (feedback) {
                           if (opt.trackId === q.correctSong.trackId) {
                               btnClass = "bg-[#1ed760] border-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.5)]";
                           } else if (opt.trackId === selectedOptionId) {
                               btnClass = "bg-red-600 border-red-500 text-white";
                           } else {
                               btnClass = "opacity-30 border-transparent";
                           }
                       }
                       
                       return (
                           <button
                             key={opt.trackId}
                             disabled={!!feedback || !timerActive || startCountdown > 0}
                             onClick={() => handleAnswer(opt.trackId)}
                             className={`w-full p-4 rounded-md text-center font-bold text-sm transition-all border active:scale-95 flex items-center justify-center min-h-[60px] relative overflow-hidden ${btnClass}`}
                           >
                               <span className="truncate w-full block relative z-10">{opt.trackName}</span>
                           </button>
                       )
                   })}
               </div>
          </div>
      </div>
  );
};
