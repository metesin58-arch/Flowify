
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { MicSuitIcon, ChainSuitIcon, RecordSuitIcon, SpraySuitIcon, CoinIcon } from '../Icons';
import { playClickSound, playWinSound, playErrorSound, playMoneySound } from '../../services/sfx';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash'; // SEPARATION
}

type Suit = 'mic' | 'chain' | 'record' | 'spray';
interface Card {
  suit: Suit;
  value: number; // 1 (Ace) - 13 (King)
  rank: string; // A, 2-10, J, Q, K
}

const SUITS: Suit[] = ['mic', 'chain', 'record', 'spray'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const BlackjackGame: React.FC<Props> = ({ player, updateStat, onExit, cashType }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState(100);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [result, setResult] = useState<string>('');
  
  // Helper
  const currentBalance = player[cashType];

  const createDeck = () => {
    const newDeck: Card[] = [];
    SUITS.forEach(suit => {
      RANKS.forEach((rank, index) => {
        newDeck.push({ suit, rank, value: index + 1 });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: Card[]) => {
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
      if (card.value === 1) {
        aces += 1;
        score += 11;
      } else if (card.value >= 10) {
        score += 10;
      } else {
        score += card.value;
      }
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const resetGame = () => {
      playClickSound();
      setGameState('betting');
      setDealerHand([]);
      setPlayerHand([]);
      // Keep previous bet
  };

  const dealInitialCards = () => {
    playClickSound();
    if (currentBalance < bet) {
        alert("Yetersiz bakiye!");
        return;
    }
    
    updateStat(cashType, -bet);
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');

    // Blackjack Check
    const pScore = calculateScore(pHand);
    if (pScore === 21) {
        handleStand(pHand, dHand, newDeck);
    }
  };

  const handleHit = () => {
    playClickSound();
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      setGameState('gameOver');
      setResult('BUST! KAYBETTİN');
      playErrorSound();
    }
  };

  const handleStand = (pHand = playerHand, dHand = dealerHand, currentDeck = deck) => {
    playClickSound();
    setGameState('dealerTurn');
    
    let currentDealerHand = [...dHand];
    let deckCopy = [...currentDeck];
    
    // Dealer AI: Stand on 17
    const playDealer = async () => {
        while (calculateScore(currentDealerHand) < 17) {
            await new Promise(r => setTimeout(r, 800)); // Delay for dramatic effect
            const card = deckCopy.pop()!;
            currentDealerHand = [...currentDealerHand, card];
            setDealerHand(currentDealerHand);
        }
        setDeck(deckCopy);
        determineWinner(pHand, currentDealerHand);
    };
    playDealer();
  };

  const handleDouble = () => {
      playClickSound();
      if (currentBalance < bet) {
          alert("Yetersiz bakiye!");
          return;
      }
      updateStat(cashType, -bet);
      setBet(prev => prev * 2);
      
      const newDeck = [...deck];
      const card = newDeck.pop()!;
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      setDeck(newDeck);
      
      if (calculateScore(newHand) > 21) {
          setGameState('gameOver');
          setResult('BUST! KAYBETTİN');
          playErrorSound();
      } else {
          handleStand(newHand, dealerHand, newDeck);
      }
  };

  const determineWinner = (pHand: Card[], dHand: Card[]) => {
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    
    setGameState('gameOver');

    if (dScore > 21) {
        setResult('KASA PATLADI!');
        updateStat(cashType, bet * 2);
        playWinSound();
    } else if (pScore > dScore) {
        setResult('KAZANDIN');
        updateStat(cashType, bet * 2);
        playWinSound();
    } else if (pScore === dScore) {
        setResult('BERABERE');
        updateStat(cashType, bet);
        playMoneySound();
    } else {
        setResult('KAYBETTİN');
        playErrorSound();
    }
  };

  // FULLSCREEN MODE: Uses h-full w-full within SafeAreaWrapper
  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
        
        {/* Table Texture - Dark Premium Felt */}
        <div className="absolute inset-0 bg-[#0a0a0a] pointer-events-none">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_90%)]"></div>
            {/* Neon Border */}
            <div className="absolute inset-4 rounded-[40px] border border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.05)]"></div>
        </div>
        
        {/* Header */}
        <div className="relative z-[150] flex justify-between items-center px-6 pt-6 pb-4">
            <button onClick={onExit} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">✕</button>
            
            <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-[#1ed760] uppercase tracking-[0.3em] drop-shadow-sm mb-1">VIP ROOM</div>
                <div className="text-xl font-black italic text-white tracking-tighter">BLACKJACK 21</div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] pl-2 pr-3 py-1.5 rounded-full border border-white/5 shadow-lg">
                <CoinIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-mono font-bold text-xs">{currentBalance.toLocaleString()}</span>
            </div>
        </div>

        {/* Game Table Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 pb-48">
            
            {/* Dealer Zone */}
            <div className="w-full flex flex-col items-center justify-center mb-12 transform scale-90">
                <div className="text-[9px] text-neutral-500 font-bold uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> KASA 
                    {gameState === 'gameOver' && <span className="text-white ml-1">({calculateScore(dealerHand)})</span>}
                </div>
                
                <div className="flex -space-x-12 h-36 items-center justify-center">
                    {gameState === 'betting' ? (
                        <div className="w-24 h-36 rounded-xl border-2 border-white/5 bg-[#111] flex items-center justify-center shadow-inner">
                            <span className="text-[40px] opacity-10">♠</span>
                        </div>
                    ) : (
                        dealerHand.map((card, i) => (
                            <CardView key={i} index={i} card={card} hidden={gameState === 'playing' && i === 0} />
                        ))
                    )}
                </div>
            </div>

            {/* Player Zone */}
            <div className="w-full flex flex-col items-center justify-center transform scale-95">
                 <div className="flex -space-x-12 h-36 items-center justify-center mb-4 relative">
                    {playerHand.map((card, i) => (
                        <CardView key={i} index={i} card={card} />
                    ))}
                 </div>
                 
                 {gameState !== 'betting' && (
                     <div className="bg-[#1ed760] text-black px-4 py-1.5 rounded-full text-sm font-black shadow-[0_0_20px_rgba(30,215,96,0.4)] animate-bounce-subtle">
                         {calculateScore(playerHand)}
                     </div>
                 )}
            </div>

        </div>

        {/* RESULT MODAL (MINIMAL & CENTERED) */}
        {gameState === 'gameOver' && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-fade-in">
                <div className="bg-[#181818] border border-white/10 p-6 rounded-3xl w-full max-w-xs text-center shadow-2xl relative overflow-hidden transform transition-all scale-100">
                    
                    {/* Status Icon */}
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-[#181818] ${result.includes('KAZANDIN') || result.includes('PATLADI') ? 'bg-[#1ed760] text-black' : 'bg-red-500 text-white'}`}>
                            {result.includes('KAZANDIN') || result.includes('PATLADI') ? '✓' : '✕'}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase">{result}</h2>
                    
                    {result.includes('KAZANDIN') || result.includes('PATLADI') ? (
                        <div className="text-[#1ed760] font-mono font-bold text-lg mb-6">+₺{bet * 2}</div>
                    ) : result.includes('BERABERE') ? (
                        <div className="text-yellow-500 font-mono font-bold text-lg mb-6">İADE: ₺{bet}</div>
                    ) : (
                        <div className="text-neutral-500 font-mono font-bold text-sm mb-6">-₺{bet}</div>
                    )}

                    <button 
                        onClick={resetGame}
                        className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                    >
                        TEKRAR OYNA
                    </button>
                </div>
            </div>
        )}

        {/* CONTROLS BAR (FIXED BOTTOM) */}
        {gameState !== 'gameOver' && (
            <div className="fixed bottom-0 left-0 right-0 z-[170] p-4 pb-safe bg-[#121212] border-t border-white/10">
                <div className="max-w-md mx-auto">
                    {gameState === 'betting' ? (
                        <div className="flex flex-col gap-3">
                            {/* Updated Betting UI - Removed Slider, Added Big Buttons */}
                            <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/5">
                                <button onClick={() => { playClickSound(); setBet(Math.max(10, bet - 50)); }} className="w-12 h-12 rounded-lg bg-[#222] text-white font-black text-xl hover:bg-[#333] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5">-</button>
                                
                                <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                                    <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-widest">BAHİS</span>
                                    <div className="text-2xl font-mono font-black text-white tracking-widest">₺{bet}</div>
                                </div>

                                <button onClick={() => { playClickSound(); setBet(Math.min(currentBalance, bet + 50)); }} className="w-12 h-12 rounded-lg bg-[#222] text-white font-black text-xl hover:bg-[#333] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5">+</button>
                            </div>
                            <button 
                                onClick={dealInitialCards}
                                className="w-full bg-[#1ed760] text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] text-sm shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
                            >
                                DAĞIT
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleHit}
                                disabled={gameState !== 'playing'}
                                className="flex-1 bg-[#222] text-blue-400 border border-blue-500/30 font-black py-4 rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs hover:bg-blue-900/20"
                            >
                                KART İSTE
                            </button>
                            <button 
                                onClick={() => handleStand()}
                                disabled={gameState !== 'playing'}
                                className="flex-1 bg-[#222] text-red-400 border border-red-500/30 font-black py-4 rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs hover:bg-red-900/20"
                            >
                                DUR
                            </button>
                            {playerHand.length === 2 && (
                                <button 
                                    onClick={handleDouble}
                                    disabled={gameState !== 'playing'}
                                    className="flex-1 bg-[#222] text-yellow-400 border border-yellow-500/30 font-black py-4 rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs hover:bg-yellow-900/20"
                                >
                                    2X KATLA
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
        
        <style>{`
            @keyframes dealCard {
                from { transform: translateY(-100px) scale(0.8); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
        `}</style>
    </div>
  );
};

// --- REDESIGNED CARD VIEW ---
const CardView: React.FC<{ card: Card, hidden?: boolean, index: number }> = ({ card, hidden = false, index }) => {
    if (hidden) {
        return (
            <div 
            className="w-24 h-36 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden transition-transform transform hover:-translate-y-2 origin-bottom"
            style={{ 
                background: 'linear-gradient(135deg, #111 0%, #222 100%)',
                animation: 'dealCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                animationDelay: `${index * 0.1}s`,
                zIndex: index
            }}
            >
                {/* Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 10px)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white/30 font-black text-xs">F</div>
                </div>
            </div>
        );
    }
    
    const isRed = card.suit === 'mic' || card.suit === 'record';
    const SuitIcon = 
    card.suit === 'mic' ? MicSuitIcon : 
    card.suit === 'chain' ? ChainSuitIcon : 
    card.suit === 'record' ? RecordSuitIcon : SpraySuitIcon;

    return (
        <div 
        className="w-24 h-36 bg-white rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-between p-3 select-none transition-transform transform hover:-translate-y-4 origin-bottom border border-gray-300"
        style={{ 
            animation: 'dealCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            animationDelay: `${index * 0.1}s`,
            zIndex: index
        }}
        >
            <div className={`self-start text-xl font-black leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
                {card.rank}
                <div className="text-[10px] opacity-50 mt-0.5">
                    <SuitIcon className="w-3 h-3" />
                </div>
            </div>
            
            <SuitIcon className={`w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 ${isRed ? 'text-red-600' : 'text-black'}`} />
            <SuitIcon className={`w-8 h-8 ${isRed ? 'text-red-600' : 'text-black'}`} />
            
            <div className={`self-end text-xl font-black leading-none transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
                {card.rank}
                <div className="text-[10px] opacity-50 mt-0.5">
                    <SuitIcon className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
};
