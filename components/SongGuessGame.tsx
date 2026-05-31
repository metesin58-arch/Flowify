
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { searchSongs } from '../services/musicService';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { SongTrack } from '../types';
import { playClickSound, playCorrectSound, playWrongSound } from '../services/sfx';
import { GameOverScreen } from './GameOverScreen';
import { GAME_CATEGORIES } from '../constants';
import { MusicIcon, PlayIcon, LightbulbIcon } from './Icons';
import { saveSongGuessScore } from '../services/matchmakingService';

interface SongGuessGameProps {
  onExit: () => void;
  onGameEnd: (score: number) => void;
  playerName: string;
}

const PLAY_DURATIONS = [1, 2, 4, 7, 15, 30];

export const SongGuessGame: React.FC<SongGuessGameProps> = ({ onExit, onGameEnd, playerName }) => {
  const [phase, setPhase] = useState<'menu' | 'loading' | 'playing' | 'gameover'>('menu');
  const [songsPool, setSongsPool] = useState<SongTrack[]>([]);
  const [currentSong, setCurrentSong] = useState<SongTrack | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [guess, setGuess] = useState('');
  const [suggestions, setSuggestions] = useState<SongTrack[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, 'leaderboards', 'songguess', 'scores', auth.currentUser.uid)).then(snap => {
        if (snap.exists()) setHighScore(snap.data().score || 0);
      });
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (guess.length < 2 || feedback) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchSongs(guess, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guess, feedback]);

  const startGame = async (catId: string, query: string) => {
    playClickSound();
    setPhase('loading');
    try {
      const songs = await searchSongs(query, 50, true);
      if (songs.length < 5) {
        alert("Yetersiz veri. Başka kategori seç.");
        setPhase('menu');
        return;
      }
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setSongsPool(shuffled);
      setCurrentSong(shuffled[0]);
      setCurrentSongIndex(0);
      setScore(0);
      setHintLevel(0);
      setPhase('playing');
    } catch (error) {
      console.error(error);
      setPhase('menu');
    }
  };

  const playSnippet = () => {
    if (!currentSong || isPlaying) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    const audio = new Audio(currentSong.previewUrl);
    audio.volume = 0.5;
    audioRef.current = audio;
    setIsPlaying(true);
    
    audio.play().catch(console.error);
    
    const duration = PLAY_DURATIONS[hintLevel] * 1000;
    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, duration);
  };

  const handleNextHint = () => {
    if (hintLevel < PLAY_DURATIONS.length - 1) {
      setHintLevel(prev => prev + 1);
      playClickSound();
    }
  };

  const checkGuess = async () => {
    if (!currentSong || !guess.trim()) return;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedTarget = currentSong.trackName.toLowerCase();
    
    // Simple fuzzy match: if guess is contained in target or vice versa
    const isCorrect = normalizedTarget.includes(normalizedGuess) || normalizedGuess.includes(normalizedTarget);

    if (isCorrect) {
      playCorrectSound();
      setFeedback('correct');
      const points = Math.max(10, 100 - (hintLevel * 20));
      const newScore = score + points;
      setScore(newScore);
      
      setTimeout(() => {
        setFeedback(null);
        setGuess('');
        setHintLevel(0);
        if (currentSongIndex + 1 < songsPool.length) {
          const nextIdx = currentSongIndex + 1;
          setCurrentSongIndex(nextIdx);
          setCurrentSong(songsPool[nextIdx]);
        } else {
          endGame(newScore);
        }
      }, 1500);
    } else {
      playWrongSound();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const endGame = async (finalScore: number) => {
    setPhase('gameover');
    if (auth.currentUser && finalScore > highScore) {
      await saveSongGuessScore(auth.currentUser.uid, playerName, finalScore);
    }
  };

  const getHintText = () => {
    if (!currentSong) return "";
    switch(hintLevel) {
      case 0: return "İpucu: İlk 1 saniye dinle.";
      case 1: return `İpucu: Yayın Yılı: ${currentSong.releaseYear}`;
      case 2: return `İpucu: Şarkı isminde ${currentSong.trackName.length} karakter var.`;
      case 3: return "İpucu: Şarkıyı daha uzun dinle!";
      default: return "İpucu: Şarkıyı daha uzun dinle!";
    }
  };

  if (phase === 'menu') {
    return (
      <div className="h-full bg-black flex flex-col font-sans text-white overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1DB954]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="p-6 pt-safe flex justify-between items-center z-20">
          <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">✕</button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-neutral-500 font-bold lowercase tracking-tight mb-1">arcade</span>
            <span className="text-xl font-bold text-white lowercase tracking-tight leading-none">şarkı bilmece<span className="text-[#1DB954]">.</span></span>
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
      <div className="h-full flex flex-col items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-500 text-[10px] font-bold tracking-tight lowercase">yükleniyor...</div>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <GameOverScreen 
        gameName="ŞARKI BİLMECE"
        score={score}
        earnedListeners={score * 3}
        totalListeners={0}
        isWin={score > 0}
        onContinue={() => { onGameEnd(score); onExit(); }}
      />
    );
  }

  return (
    <div className="h-full bg-black flex flex-col font-sans relative overflow-hidden text-white">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-6 pt-safe flex justify-between items-center z-20">
        <button onClick={onExit} className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-neutral-400 active:scale-95 transition-all">✕</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-500 font-bold tracking-tight lowercase mb-1">skor</span>
          <span className="text-xl font-black text-[#1DB954] tabular-nums tracking-tighter">{score}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pb-32 space-y-12 z-10">
        <div className="relative">
          <motion.div 
            animate={isPlaying ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-48 h-48 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-700 ${isPlaying ? 'shadow-[0_0_80px_rgba(29,185,84,0.2)] border-spotify-green/30' : ''}`}
          >
            <MusicIcon className={`w-16 h-16 transition-colors duration-500 ${isPlaying ? 'text-spotify-green' : 'text-white/20'}`} />
          </motion.div>
          {isPlaying && (
            <div className="absolute -inset-8 border border-spotify-green/20 rounded-full animate-pulse-slow"></div>
          )}
        </div>

        <div className="w-full max-w-xs space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></div>
                <p className="text-[#1DB954] text-[10px] font-bold tracking-tight lowercase">
                  seviye {hintLevel + 1}
                </p>
            </div>
            <p className="text-neutral-400 text-xs font-medium leading-relaxed lowercase">{getHintText()}</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={playSnippet}
              disabled={isPlaying}
              className="flex-1 bg-white text-black font-extrabold py-4 px-6 rounded-[2rem] flex items-center justify-center gap-2 active:brightness-90 active:scale-[0.98] transition-all disabled:opacity-50 text-[11px] tracking-tight lowercase"
            >
              <PlayIcon className="w-3 h-3 fill-current" />
              dinle ({PLAY_DURATIONS[hintLevel]}s)
            </button>
            <button 
              onClick={handleNextHint}
              disabled={hintLevel >= PLAY_DURATIONS.length - 1 || isPlaying}
              className="px-6 bg-[#0a0a0a] text-white font-extrabold rounded-[2rem] border border-white/5 disabled:opacity-30 text-[11px] tracking-tight lowercase active:bg-white/5"
            >
              +ipucu
            </button>
          </div>

          <div className="space-y-4 relative">
            <div className="relative">
                <input 
                  type="text" 
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkGuess()}
                  onFocus={() => guess.length >= 2 && setShowSuggestions(true)}
                  placeholder="şarkı adı..."
                  className={`w-full bg-[#0a0a0a] border border-white/5 ${feedback === 'correct' ? 'border-[#1DB954]' : feedback === 'wrong' ? 'border-red-500' : 'border-white/5'} text-white text-center py-4 px-6 focus:outline-none focus:border-[#1DB954] transition-all font-bold text-xs tracking-tight lowercase placeholder:text-neutral-500 rounded-[2rem]`}
                />
                
                <AnimatePresence>
                     {showSuggestions && suggestions.length > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 10 }}
                         className="absolute bottom-full mb-4 left-0 right-0 glass-dark rounded-3xl overflow-hidden z-50 shadow-2xl border border-white/10"
                       >
                         {suggestions.map(s => (
                           <button
                             key={s.trackId}
                             onClick={() => {
                               setGuess(s.trackName);
                               setShowSuggestions(false);
                             }}
                             className="w-full p-4 text-left active:bg-white/5 text-[10px] text-white/40 border-b border-white/5 last:border-0 flex items-center gap-4 transition-colors"
                           >
                             <img src={s.artworkUrl100} className="w-12 h-12 rounded-xl shadow-lg" alt="" referrerPolicy="no-referrer" />
                             <div className="flex flex-col truncate">
                               <span className="font-black text-white truncate text-xs italic uppercase tracking-tight">{s.trackName}</span>
                               <span className="opacity-40 truncate mt-0.5 uppercase text-[9px] tracking-widest">{s.artistName}</span>
                             </div>
                           </button>
                         ))}
                       </motion.div>
                     )}
                 </AnimatePresence>
            </div>

            <button 
              onClick={checkGuess}
              disabled={!guess.trim() || isPlaying}
              className="w-full bg-[#1DB954] text-black font-extrabold py-4 px-6 rounded-[2rem] active:scale-[0.98] transition-all disabled:opacity-50 text-[11px] tracking-tight lowercase active:brightness-95"
            >
              tahmin et.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
