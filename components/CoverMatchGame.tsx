
import React, { useState, useEffect, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { auth, db } from '../services/firebaseConfig';
import { addMonthlyListeners } from '../services/matchmakingService';
import { playClickSound, playWinSound, playErrorSound, playGoSound, playCountdownTick, playCorrectSound, playWrongSound } from '../services/sfx';
import { fetchSongs } from '../services/musicService'; 
import { GameOverScreen } from './GameOverScreen';

interface Props {
  playerName: string;
  onGameEnd: (score: number) => void;
  onExit: () => void;
  isSolo?: boolean; 
}

interface Card {
    id: number;
    songId: number;
    artwork: string;
    previewUrl: string;
    status: 'closed' | 'open' | 'matched';
}

export const CoverMatchGame: React.FC<Props> = ({ playerName, onGameEnd, onExit }) => {
  const [phase, setPhase] = useState<'auth' | 'playing' | 'gameover'>('auth');
  const [grid, setGrid] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [score, setScore] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);
  
  // Results
  const [earnedListeners, setEarnedListeners] = useState(0);
  const [totalListeners, setTotalListeners] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Init
  useEffect(() => {
    const init = async () => {
        if (auth.currentUser) {
            const userRef = ref(db, `users/${auth.currentUser.uid}/stats/monthly_listeners`);
            get(userRef).then(snap => {
                if(snap.exists()) setTotalListeners(snap.val());
            });
        }
        await startSoloGame();
    };
    init();
    return () => { 
        if(audioRef.current) audioRef.current.pause(); 
        clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startSoloGame = async () => {
      setPhase('auth');
      try {
          const songs = await fetchSongs();
          const uniqueSongs = songs.slice(0, 6); // 6 pairs = 12 cards
          let cards: any[] = [];
          
          uniqueSongs.forEach((song) => {
              cards.push({ songId: song.trackId, artwork: song.artworkUrl100, previewUrl: song.previewUrl, status: 'closed' });
              cards.push({ songId: song.trackId, artwork: song.artworkUrl100, previewUrl: song.previewUrl, status: 'closed' });
          });
          cards = cards.sort(() => Math.random() - 0.5);
          cards = cards.map((c, i) => ({ ...c, id: i }));
          
          setGrid(cards);
          setPhase('playing');
          setStartCountdown(3);
      } catch (e) {
          console.error("Solo start failed", e);
          onExit();
      }
  };

  // Countdown
  useEffect(() => {
    if (phase === 'playing' && startCountdown > 0) {
        playCountdownTick(); // Added Tick Sound
        const timer = setTimeout(() => {
            if (startCountdown === 1) playGoSound();
            setStartCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (phase === 'playing' && startCountdown === 0) {
        // Start Game Timer
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
  }, [startCountdown, phase]);

  // Check Win Condition
  useEffect(() => {
      if(phase === 'playing' && grid.length > 0) {
          const allMatched = grid.every(c => c.status === 'matched');
          if(allMatched) {
              endGame(true); // Time bonus applied
          }
      }
  }, [grid, phase]);

  const handleCardClick = (cardIndex: number) => {
      if (startCountdown > 0 || phase !== 'playing' || isProcessing) return;
      if (selectedCards.length >= 2) return;
      
      const card = grid[cardIndex];
      if (card.status !== 'closed') return;

      playClickSound();
      
      // Flip
      const newGrid = [...grid];
      newGrid[cardIndex].status = 'open';
      setGrid(newGrid);

      const newSelection = [...selectedCards, cardIndex];
      setSelectedCards(newSelection);

      if (newSelection.length === 2) {
          setIsProcessing(true);
          checkForMatch(newSelection[0], newSelection[1]);
      }
  };

  const checkForMatch = (idx1: number, idx2: number) => {
      const card1 = grid[idx1];
      const card2 = grid[idx2];

      if (card1.songId === card2.songId) {
          // MATCH!
          if(audioRef.current) audioRef.current.pause();
          const audio = new Audio(card1.previewUrl);
          audio.volume = 0.5;
          audioRef.current = audio;
          audio.play().catch(e => {});
          playCorrectSound(); // Updated

          setGrid(prev => {
              const g = [...prev];
              g[idx1].status = 'matched';
              g[idx2].status = 'matched';
              return g;
          });
          setScore(s => s + 100);
          setSelectedCards([]);
          setIsProcessing(false);
      } else {
          // NO MATCH
          setTimeout(() => {
              setGrid(prev => {
                  const g = [...prev];
                  g[idx1].status = 'closed';
                  g[idx2].status = 'closed';
                  return g;
              });
              playWrongSound(); // Updated
              setSelectedCards([]);
              setIsProcessing(false);
          }, 800);
      }
  };

  const endGame = async (finishedEarly: boolean = false) => {
      clearInterval(timerIntervalRef.current);
      if(audioRef.current) audioRef.current.pause();

      // Bonus for finishing early
      const timeBonus = finishedEarly ? timeLeft * 20 : 0;
      const finalScore = score + timeBonus;
      setScore(finalScore);

      // Listeners reward
      const gained = Math.floor(finalScore * 0.5);
      setEarnedListeners(gained);

      if (auth.currentUser && gained > 0) {
          await addMonthlyListeners(auth.currentUser.uid, gained);
          setTotalListeners(prev => prev + gained);
          window.dispatchEvent(new CustomEvent('updateListeners', { detail: gained }));
      }

      setPhase('gameover');
  };

  if (phase === 'auth') return <div className="h-full bg-black flex items-center justify-center text-white font-bold">Yükleniyor...</div>;

  if(phase === 'gameover') {
      return (
          <GameOverScreen 
            gameName="KAPAK AVCISI"
            score={score}
            earnedListeners={earnedListeners}
            totalListeners={totalListeners}
            onContinue={() => { playClickSound(); onGameEnd(score); onExit(); }}
          />
      );
  }

  return (
    <div className="h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {startCountdown > 0 && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                 <div className="text-9xl font-black text-white animate-ping">{startCountdown}</div>
             </div>
        )}

        {/* HUD */}
        <div className="p-4 pt-safe flex justify-between items-center border-b border-white/10 bg-black/80 backdrop-blur-md z-20">
            <div>
                <div className="text-[10px] text-neutral-500 font-bold uppercase">SKOR</div>
                <div className="text-3xl font-black text-white">{score}</div>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-[10px] text-neutral-500 font-bold uppercase">SÜRE</div>
                <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</div>
            </div>
        </div>

        {/* GRID */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm aspect-[3/4]">
                {grid.map((card, idx) => (
                    <CardView 
                        key={idx} 
                        card={card} 
                        onClick={() => handleCardClick(idx)}
                    />
                ))}
            </div>
        </div>

    </div>
  );
};

const CardView: React.FC<{ card: Card, onClick: () => void }> = ({ card, onClick }) => {
    const isFlipped = card.status === 'open' || card.status === 'matched';
    const isMatched = card.status === 'matched';

    return (
        <div 
            onClick={onClick}
            className="group w-full h-full perspective-1000 cursor-pointer active:scale-95 transition-transform duration-200"
        >
            <div 
                className="relative w-full h-full transform-style-3d transition-all duration-500"
                style={{
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* BACK */}
                <div 
                    className="absolute inset-0 backface-hidden bg-[#1a1a1a] border-2 border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:border-cyan-500/50 z-[2]"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="text-2xl font-black text-white/20 group-hover:text-cyan-500/50">?</div>
                </div>

                {/* FRONT */}
                <div 
                    className={`absolute inset-0 backface-hidden rounded-xl overflow-hidden border-2 bg-black z-[1] ${isMatched ? 'border-green-500 shadow-[0_0_15px_green]' : 'border-white'}`}
                    style={{ 
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    <img src={card.artwork} className="w-full h-full object-cover" />
                    {isMatched && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-black text-xl text-green-500">
                            ✓
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
