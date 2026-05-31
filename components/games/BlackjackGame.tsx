
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { MicSuitIcon, ChainSuitIcon, RecordSuitIcon, SpraySuitIcon, CoinIcon } from '../Icons';
import { playClickSound, playWinSound, playErrorSound, playMoneySound } from '../../services/sfx';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Suit = 'mic' | 'chain' | 'record' | 'spray';
interface Card {
  suit: Suit;
  value: number; // 1 (Ace) - 13 (King)
  rank: string; // A, 2-10, J, Q, K
}

const SUITS: Suit[] = ['mic', 'chain', 'record', 'spray'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const BlackjackGame: React.FC<Props> = ({ player, updateStat, onExit, cashType, showToast }) => {
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
        playErrorSound();
        showToast("Yetersiz bakiye!", 'error');
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
          playErrorSound();
          showToast("Yetersiz bakiye!", 'error');
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
  }  // FULLSCREEN MODE: Uses h-full w-full within SafeAreaWrapper
  return (
    <div className="h-full w-full bg-[#030303] flex flex-col relative overflow-hidden font-sans select-none">
        
        {/* Table Texture - Dark Premium Felt */}
        <div className="absolute inset-0 bg-[#030303] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>
            {/* Ambient Neon Glow behind hands */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        </div>
        
        {/* Header */}
        <div className="relative z-[150] flex justify-between items-center px-6 pt-12 pb-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
            <button 
                onClick={onExit} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:scale-90"
            >
                ✕
            </button>
            
            <div className="flex flex-col items-center text-center">
                <div className="text-[10px] font-black text-neutral-500 lowercase tracking-tight mb-0.5">vip salonu.</div>
                <div className="text-xl font-black text-white tracking-tighter lowercase">
                    blackjack 21<span className="text-indigo-500">.</span>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-white/5 pl-2.5 pr-3.5 py-1.5 rounded-2xl shadow-md">
                <CoinIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-black text-xs tabular-nums leading-none">
                    {currentBalance.toLocaleString()}
                </span>
            </div>
        </div>

        {/* Game Table Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pb-48">
            
            {/* Dealer Zone */}
            <div className="w-full flex flex-col items-center justify-center mb-10 transform scale-95">
                <div className="text-[10px] text-neutral-500 font-black lowercase mb-4 tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></span> kasa.
                    {gameState === 'gameOver' && <span className="text-white font-bold ml-1">({calculateScore(dealerHand)})</span>}
                </div>
                
                <div className="flex -space-x-10 h-36 items-center justify-center">
                    {gameState === 'betting' ? (
                        <div className="w-24 h-32 rounded-2xl border border-white/10 bg-[#070707]/60 flex items-center justify-center shadow-inner">
                            <span className="text-3xl opacity-10 text-white">♠</span>
                        </div>
                    ) : (
                        dealerHand.map((card, i) => (
                            <CardView key={i} index={i} card={card} hidden={gameState === 'playing' && i === 0} />
                        ))
                    )}
                </div>
            </div>

            {/* Player Zone */}
            <div className="w-full flex flex-col items-center justify-center transform">
                 <div className="flex -space-x-10 h-36 items-center justify-center mb-6 relative">
                    {playerHand.map((card, i) => (
                        <CardView key={i} index={i} card={card} />
                    ))}
                 </div>
                 
                 {gameState !== 'betting' && (
                     <div className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-extrabold px-4.5 py-1.5 rounded-full text-xs shadow-xl backdrop-blur-3xl animate-pulse-subtle">
                         {calculateScore(playerHand)} puan
                     </div>
                 )}
            </div>

        </div>

        {/* RESULT MODAL (MINIMAL & CENTERED) */}
        {gameState === 'gameOver' && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl px-6 animate-fade-in">
                <div className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
                    
                    {/* Status Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl border border-white/5 ${result.includes('KAZANDIN') || result.includes('PATLADI') ? 'bg-indigo-500/10 text-indigo-400 font-black shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'bg-red-500/10 text-red-400 font-black'}`}>
                            {result.includes('KAZANDIN') || result.includes('PATLADI') ? '✓' : '✕'}
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-white tracking-tight mb-2 lowercase drop-shadow-md">
                        {result.toLowerCase()}<span className="text-neutral-500">.</span>
                    </h2>
                    
                    {result.includes('KAZANDIN') || result.includes('PATLADI') ? (
                        <div className="text-indigo-400 font-black text-2xl mb-8 tracking-tight tabular-nums">+₺{(bet * 2).toLocaleString()}</div>
                    ) : result.includes('BERABERE') ? (
                        <div className="text-yellow-500 font-black text-2xl mb-8 tracking-tight tabular-nums">iade: ₺{bet.toLocaleString()}</div>
                    ) : (
                        <div className="text-neutral-500 font-bold text-lg mb-8 tracking-tight tabular-nums">-₺{bet.toLocaleString()}</div>
                    )}

                    <button 
                        onClick={resetGame}
                        className="w-full bg-white text-black font-black py-4 rounded-2xl lowercase text-xs tracking-wide hover:scale-[1.01] active:scale-95 transition-all shadow-md"
                    >
                        tekrar oyna.
                    </button>
                </div>
            </div>
        )}

        {/* CONTROLS BAR (FIXED BOTTOM) */}
        {gameState !== 'gameOver' && (
            <div className="fixed bottom-0 left-0 right-0 z-[170] p-6 pb-safe bg-[#040404]/95 backdrop-blur-3xl border-t border-white/5">
                <div className="max-w-md mx-auto">
                    {gameState === 'betting' ? (
                        <div className="flex flex-col gap-4">
                            {/* Updated Betting UI - Removed Slider, Added Big Buttons */}
                            <div className="flex items-center gap-4 bg-[#0a0a0a] rounded-3xl p-2 border border-white/5 shadow-inner">
                                <button onClick={() => { playClickSound(); setBet(Math.max(10, bet - 50)); }} className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5">-</button>
                                
                                <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                                    <span className="text-[9px] text-neutral-500 font-extrabold lowercase tracking-tight mb-0.5">bahis miktarı.</span>
                                    <div className="text-2xl font-black text-white tracking-tight tabular-nums">₺{bet.toLocaleString()}</div>
                                </div>

                                <button onClick={() => { playClickSound(); setBet(Math.min(currentBalance, bet + 50)); }} className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5 shadow-md">+</button>
                            </div>
                            <button 
                                onClick={dealInitialCards}
                                className="w-full bg-indigo-500 text-white font-black py-4 rounded-[2rem] lowercase text-xs shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-95 transition-all"
                            >
                                dağıt.
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button 
                                onClick={handleHit}
                                disabled={gameState !== 'playing'}
                                className="flex-1 bg-[#090909] text-indigo-400 border border-indigo-500/20 font-black py-4 rounded-2xl lowercase active:scale-95 transition-all text-xs hover:bg-[#111]"
                            >
                                kart iste.
                            </button>
                            <button 
                                onClick={() => handleStand()}
                                disabled={gameState !== 'playing'}
                                className="flex-1 bg-[#090909] text-red-400 border border-red-500/20 font-black py-4 rounded-2xl lowercase active:scale-95 transition-all text-xs hover:bg-[#111]"
                            >
                                dur.
                            </button>
                            {playerHand.length === 2 && (
                                <button 
                                    onClick={handleDouble}
                                    disabled={gameState !== 'playing'}
                                    className="flex-1 bg-[#090909] text-indigo-300 border border-indigo-500/20 font-black py-4 rounded-2xl lowercase active:scale-95 transition-all text-xs hover:bg-[#111]"
                                >
                                    2x katla.
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

// --- REDESIGNED CARD VIEW (FUTURISTIC CYBER CARBON STYLE) ---
const CardView: React.FC<{ card: Card, hidden?: boolean, index: number }> = ({ card, hidden = false, index }) => {
    if (hidden) {
        return (
            <div 
            className="w-24 h-32 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden transition-transform transform hover:-translate-y-2 origin-bottom"
            style={{ 
                background: 'linear-gradient(135deg, #070707 0%, #121212 100%)',
                animation: 'dealCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                animationDelay: `${index * 0.1}s`,
                zIndex: index
            }}
            >
                {/* Micro Carbon grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 4px)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-neutral-500 font-black text-[9px] lowercase tracking-tighter">vip</div>
                </div>
            </div>
        );
    }
    
    // Carbon Dark Card Front
    const isRed = card.suit === 'mic' || card.suit === 'record';
    const SuitIcon = 
    card.suit === 'mic' ? MicSuitIcon : 
    card.suit === 'chain' ? ChainSuitIcon : 
    card.suit === 'record' ? RecordSuitIcon : SpraySuitIcon;

    return (
        <div 
        className="w-24 h-32 bg-[#090909] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.9)] relative flex flex-col items-center justify-between p-3 select-none transition-transform transform hover:-translate-y-4 origin-bottom border border-white/5"
        style={{ 
            animation: 'dealCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            animationDelay: `${index * 0.1}s`,
            zIndex: index
        }}
        >
            <div className={`self-start text-lg font-black leading-none flex flex-col items-center gap-0.5 ${isRed ? 'text-indigo-400' : 'text-neutral-400'}`}>
                {card.rank.toLowerCase()}
                <SuitIcon className="w-3 h-3 opacity-60" />
            </div>
            
            <SuitIcon className={`w-8 h-8 opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isRed ? 'text-indigo-500' : 'text-neutral-500'}`} />
            <SuitIcon className={`w-6 h-6 ${isRed ? 'text-indigo-400' : 'text-neutral-500'}`} />
            
            <div className={`self-end text-lg font-black leading-none flex flex-col items-center gap-0.5 transform rotate-180 ${isRed ? 'text-indigo-400' : 'text-neutral-400'}`}>
                {card.rank.toLowerCase()}
                <SuitIcon className="w-3 h-3 opacity-60" />
            </div>
        </div>
    );
};
