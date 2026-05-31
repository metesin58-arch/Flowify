import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerStats, CharacterAppearance } from '../types';
import { playClickSound, playWinSound } from '../services/sfx';
import { Avatar } from './Avatar';
import { HeartIcon, SparklesIcon, ZapIcon } from './Icons';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

interface MinderAppProps {
  player: PlayerStats;
  updateMultipleStats: (updates: Partial<PlayerStats>) => void;
  onBack?: () => void;
}

interface Profile {
  id: number;
  name: string;
  age: number;
  bio: string;
  appearance: CharacterAppearance;
  matchChance: number;
}

// Generate female avatar appearances with premium accessories.
// Striktly hardcoded to headIndex: 1 (kafairem) per user requirement.
const generateFemaleAppearance = (index: number): CharacterAppearance => ({
  headIndex: 1, // Only female head for all profiles
  skinColor: ['#ffdbac', '#f1c27d', '#e0ac69'][index % 3],
  shirtColor: ['#ff3b30', '#ffffff', '#e21d51', '#a855f7', '#10b981', '#1e1b4b'][index % 6],
  pantsColor: '#0a0a0a',
  shoesColor: '#ffffff',
  clothingStyle: (index * 2) % 6,
  pantsStyle: index % 3,
  hatIndex: index % 3 === 0 ? 3 : index % 3 === 1 ? 2 : 0, // 3 is Pembe Toka, 2 is Bucket
  chainIndex: index % 2 === 0 ? 2 : 1, // Premium chains
  shoeStyle: 1
});

const POTENTIAL_PARTNERS: Profile[] = [
  { id: 1, name: 'melis', age: 22, bio: 'müzik ve sanat aşığı. konserleri asla kaçırmam! 🎨🎧', appearance: generateFemaleAppearance(1), matchChance: 0.38 },
  { id: 2, name: 'canan', age: 24, bio: 'gezmeyi ve festivalleri, yeni flowlar keşfetmeyi severim. ✈️🗺️', appearance: generateFemaleAppearance(2), matchChance: 0.35 },
  { id: 3, name: 'selin', age: 21, bio: 'dans etmeyi severim, ritmi yakalarım. sen de liriklerini yaz! 💃🔥', appearance: generateFemaleAppearance(3), matchChance: 0.48 },
  { id: 4, name: 'ece', age: 23, bio: 'kitaplar, filtre kahve ve lirik felsefesi... mumble rapçiler yazmasın ☕📚', appearance: generateFemaleAppearance(4), matchChance: 0.28 },
  { id: 5, name: 'derya', age: 25, bio: 'fitness, pilates ve sağlıklı yaşam tarzı. konserine davet edersin? 💪🥗', appearance: generateFemaleAppearance(5), matchChance: 0.42 },
  { id: 6, name: 'buse', age: 22, bio: 'gardırop stilleri ve moda benlik. swag durumuna özellikle bakarım! ✨🛍️', appearance: generateFemaleAppearance(6), matchChance: 0.4 },
  { id: 7, name: 'gizem', age: 24, bio: 'sessiz geceler, derin vokaller. drill/trap severim... 🌙🖤', appearance: generateFemaleAppearance(7), matchChance: 0.25 },
  { id: 8, name: 'ırmak', age: 21, bio: 'doğayla iç içe, akustik melodiler. benimle her yola gelen? 🌿🏕️', appearance: generateFemaleAppearance(8), matchChance: 0.52 },
];

export const MinderApp: React.FC<MinderAppProps> = ({
  player,
  updateMultipleStats,
  onBack
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMatching, setIsMatching] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'right' | 'left' | null>(null);
  const [matchResult, setMatchResult] = useState<'match' | 'no-match' | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showBreakUpConfirm, setShowBreakUpConfirm] = useState(false);

  const hasPartner = !!player.career.partnerName;

  const handleSwipe = (liked: boolean) => {
    if (isMatching || hasPartner) return;

    playClickSound();
    setSwipeDirection(liked ? 'right' : 'left');

    const profile = POTENTIAL_PARTNERS[currentIndex];

    if (liked) {
      setIsMatching(true);
      setTimeout(() => {
        const isMatch = Math.random() < profile.matchChance;
        if (isMatch) {
          playWinSound();
          setMatchResult('match');
          setMatchedProfile(profile);
        } else {
          setMatchResult('no-match');
          setTimeout(() => {
            setMatchResult(null);
            setIsMatching(false);
            setSwipeDirection(null);
            setCurrentIndex((prev) => (prev + 1) % POTENTIAL_PARTNERS.length);
          }, 1400);
        }
      }, 1000);
    } else {
      setTimeout(() => {
        setSwipeDirection(null);
        setCurrentIndex((prev) => (prev + 1) % POTENTIAL_PARTNERS.length);
      }, 300);
    }
  };

  const confirmMatch = () => {
    if (!matchedProfile) return;
    playClickSound();

    updateMultipleStats({
      career: {
        ...player.career,
        partnerName: matchedProfile.name,
        chatHistory: {
          ...player.career.chatHistory,
          partner: [{ role: 'model', text: `Selam! Eşleştiğimize çok sevindim. Ben ${matchedProfile.name}. 😊` }]
        }
      }
    });
    if (onBack) onBack();
  };

  const handleBreakUp = () => {
    playClickSound();
    updateMultipleStats({
      career: {
        ...player.career,
        partnerName: '',
        chatHistory: {
          ...player.career.chatHistory,
          partner: []
        }
      }
    });
    setShowBreakUpConfirm(false);
  };

  // View: Current Relationship Active
  if (hasPartner) {
    return (
      <div className="h-full flex flex-col bg-[#050505] p-6 items-center justify-center text-center relative overflow-hidden select-none font-sans">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-pink-500/5 blur-[120px] rounded-full"></div>
        </div>

        {!showBreakUpConfirm ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 w-full max-w-sm space-y-8"
          >
            <div className="space-y-4">
              <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto border border-pink-400/20 shadow-[0_15px_30px_rgba(244,63,94,0.3)]">
                ❤️
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter lowercase">
                başarılı bir ilişkin var<span className="text-pink-500">.</span>
              </h2>
              <div className="bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl inline-block text-xs font-black text-pink-400 lowercase">
                sevgilin: {player.career.partnerName.toLowerCase()}
              </div>
              <p className="text-neutral-400 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
                rap sahnesinde sadakat her şeydir. karizmayı koru, sevgilinle aranı menajer ve konserler ile sıcak tut.
              </p>
            </div>
            
            <div className="space-y-3 pt-6">
              {onBack && (
                <motion.button 
                  whileTap={{ scale: 0.97 }}
                  onClick={onBack}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-pink-600 text-white rounded-2xl font-black text-xs lowercase tracking-tight shadow-xl"
                >
                  geri dön
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowBreakUpConfirm(true)}
                className="w-full py-4 bg-white/5 text-red-400 rounded-2xl font-bold text-xs lowercase tracking-tight border border-red-500/10 hover:bg-red-500/5 transition-all"
              >
                ilişkiyi sonlandır (ayrıl)
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 w-full max-w-sm space-y-8"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-950/20 rounded-[2rem] flex items-center justify-center text-3xl mx-auto border border-red-500/10">
                💔
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter lowercase">
                ayrılmak istediğine emin misin<span className="text-red-500">?</span>
              </h2>
              <p className="text-neutral-500 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
                {player.career.partnerName.toLowerCase()} ile yollarınızı tamamen ayıracaksınız. mesaj geçmişi temizlenecek ve bu işlem geri alınamaz.
              </p>
            </div>
            
            <div className="space-y-3 pt-6">
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={handleBreakUp}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs lowercase tracking-tight shadow-xl"
              >
                evet, ayrılmak istiyorum
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowBreakUpConfirm(false)}
                className="w-full py-4 bg-[#0a0a0a] text-neutral-400 rounded-2xl font-bold text-xs lowercase tracking-tight border border-white/5"
              >
                vazgeç
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // View: Match Result Celebration
  if (matchResult === 'match' && matchedProfile) {
    return (
      <div className="h-full flex flex-col bg-black p-6 items-center justify-center text-center relative overflow-hidden font-sans select-none">
        <div className="absolute inset-0 z-0 bg-radial-gradient from-pink-900/10 to-transparent"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-w-sm space-y-8"
        >
          {/* Double hearts glowing rings */}
          <div className="relative mb-6 mx-auto w-48 h-48">
            <div className="absolute inset-0 bg-pink-500 rounded-full blur-3xl opacity-35 animate-pulse"></div>
            <div className="relative w-full h-full rounded-[3rem] border border-pink-500/30 overflow-hidden shadow-2xl bg-[#0d0d0d] flex items-center justify-center">
              {/* Massive Avatar for match screen */}
              <Avatar appearance={matchedProfile.appearance} size={240} gender="female" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-pink-500 to-rose-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-pink-400/20 animate-bounce">
              💖
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white tracking-tighter lowercase">
              it's a match! 💖
            </h2>
            <p className="text-neutral-300 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
              tebrikler! {matchedProfile.name.toLowerCase()} de senin liriklerine bayılıyor. artık birbiriniz için özelsiniz!
            </p>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={confirmMatch}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-black text-xs lowercase tracking-tight shadow-xl"
          >
            mesaj atmaya başla
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const currentProfile = POTENTIAL_PARTNERS[currentIndex];

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden font-sans select-none">
      
      {/* Translucent Premium Header */}
      <div className="h-16 shrink-0 bg-[#080808]/80 backdrop-blur-md px-6 flex items-center justify-between z-20 border-b border-white/[0.03]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 border border-white/5 active:scale-90 transition-all hover:bg-white/10"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-pink-500 font-black text-base animate-pulse">🔥</span>
            <span className="font-black text-white tracking-tighter text-sm lowercase">minder<span className="text-pink-500">.</span></span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></div>
          <span className="text-[9px] font-black text-pink-400 tracking-tight lowercase">aktif eşleşme lobisi</span>
        </div>
      </div>

      {/* Main Flex-1 Container which houses both Card & Control Panel cleanly in flow */}
      <div className="flex-1 flex flex-col items-center justify-between py-6 px-5 relative z-10 max-w-sm mx-auto w-full">
        
        {/* Dynamic Card Area - Generous Height but safe! */}
        <div className="w-full flex-1 flex items-center justify-center min-h-[380px] relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 1.05, 
                x: swipeDirection === 'right' ? 320 : swipeDirection === 'left' ? -320 : 0,
                rotate: swipeDirection === 'right' ? 14 : swipeDirection === 'left' ? -14 : 0
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full h-full bg-[#0d0d11] rounded-[2.5rem] overflow-hidden border border-white/[0.04] flex flex-col shadow-2xl relative"
            >
              {/* Hot pink ambient glow inside the card */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-pink-500/5 to-transparent pointer-events-none z-0"></div>

              {/* Profile Image & Avatar - MASSIVE AVATAR SCALE per user feedback! */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Vignette behind model to pop the hair and styles */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#111116]/0 via-[#0d0d11]/40 to-[#0d0d11] z-10 pointer-events-none" />
                
                {/* LARGE Scale avatar container for high details */}
                <div className="z-10 translate-y-6 drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] scale-[1.3] filter brightness-[1.05]">
                  <Avatar appearance={currentProfile.appearance} size={240} gender="female" />
                </div>

                {/* LIKE stamp on Swipe Direction RIGHT */}
                {swipeDirection === 'right' && (
                  <div className="absolute top-6 left-6 border-2 border-emerald-500 px-4 py-1.5 rounded-2xl rotate-[-12deg] z-20 bg-emerald-950/90 backdrop-blur-md shadow-lg flex items-center gap-1">
                    <span className="text-emerald-400 font-black text-xs tracking-wide uppercase">beğen</span>
                  </div>
                )}
                {/* NOPE stamp on Swipe Direction LEFT */}
                {swipeDirection === 'left' && (
                  <div className="absolute top-6 right-6 border-2 border-rose-500 px-4 py-1.5 rounded-2xl rotate-[12deg] z-20 bg-rose-950/90 backdrop-blur-md shadow-lg flex items-center gap-1">
                    <span className="text-rose-400 font-black text-xs tracking-wide uppercase">pas geç</span>
                  </div>
                )}
              </div>

              {/* Information Overlay Content Panel */}
              <div className="p-5 bg-gradient-to-t from-[#09090c] to-[#0d0d11] relative z-20 border-t border-white/[0.03]">
                <div className="flex items-end justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white tracking-tighter leading-none lowercase">
                      {currentProfile.name}<span className="text-pink-500 font-black">,</span> <span className="font-bold text-neutral-400 text-sm font-mono">{currentProfile.age}</span>
                    </h3>
                    <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded-lg w-max">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                      <span className="text-[8px] font-bold text-pink-400 tracking-tight lowercase">1 km yakınında dumanı üstünde</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-neutral-400 text-xs tracking-tight leading-relaxed lowercase italic py-2 px-3 bg-white/[0.01] rounded-xl border border-white/[0.03] mt-2">
                  "{currentProfile.bio.toLowerCase()}"
                </p>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe Control Buttons panel - raised up, and perfectly in flex flow to guarantee perfect visibility! */}
        <div className="w-full flex items-center justify-center gap-6 mt-4 pt-1 shrink-0">
          
          {/* Reject/Nope Button */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleSwipe(false)}
            disabled={isMatching}
            className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xl transition-all disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Accept/Like Heart Button */}
          <motion.button 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe(true)}
            disabled={isMatching}
            className="w-16 h-16 bg-gradient-to-tr from-rose-500 via-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(244,63,94,0.4)] hover:brightness-105 hover:shadow-[0_12px_30px_rgba(244,63,94,0.55)] transition-all disabled:opacity-40"
          >
            <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.button>

        </div>

      </div>

      {/* Matching Overlay Loading screen */}
      <AnimatePresence>
        {isMatching && matchResult === null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="relative mb-6">
              <div className="w-14 h-14 border-4 border-pink-500/10 rounded-full" />
              <div className="absolute inset-0 w-14 h-14 border-t-4 border-pink-500 rounded-full animate-spin" />
            </div>
            <div className="text-pink-400 font-extrabold text-xs tracking-tight lowercase animate-pulse">aşk algoritması tarıyor...</div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
