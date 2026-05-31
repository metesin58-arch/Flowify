import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerStats, CharacterAppearance } from '../types';
import { playClickSound, playWinSound } from '../services/sfx';
import { Avatar } from './Avatar';
import { ArrowIcon } from './Icons';

interface RandevuAppProps {
    player: PlayerStats;
    updateMultipleStats: (updates: Partial<PlayerStats>) => void;
    onBack: () => void;
}

interface Profile {
    id: number;
    name: string;
    age: number;
    bio: string;
    appearance: CharacterAppearance;
    matchChance: number;
}

// Generate random female-looking appearances
const generateFemaleAppearance = (): CharacterAppearance => ({
    headIndex: 1, // Always use the female head (Irem)
    skinColor: ['#f1c27d', '#ffdbac', '#e0ac69', '#8d5524'][Math.floor(Math.random() * 4)],
    shirtColor: ['#ff69b4', '#ffffff', '#000000', '#800080', '#ff0000'][Math.floor(Math.random() * 5)],
    pantsColor: '#1a1a1a',
    shoesColor: '#ffffff',
    clothingStyle: Math.floor(Math.random() * 6),
    pantsStyle: Math.floor(Math.random() * 3),
    hatIndex: Math.random() > 0.5 ? Math.floor(Math.random() * 4) : 0,
    chainIndex: Math.random() > 0.7 ? Math.floor(Math.random() * 6) : 0,
    shoeStyle: Math.floor(Math.random() * 3)
});

const POTENTIAL_PARTNERS: Profile[] = [
    { id: 1, name: 'melis', age: 22, bio: 'müzik ve sanat aşığı. 🎨', appearance: generateFemaleAppearance(), matchChance: 0.3 },
    { id: 2, name: 'canan', age: 24, bio: 'gezmeyi ve yeni yerler keşfetmeyi severim. ✈️', appearance: generateFemaleAppearance(), matchChance: 0.25 },
    { id: 3, name: 'selin', age: 21, bio: 'dans etmek benim hayatım. 💃', appearance: generateFemaleAppearance(), matchChance: 0.4 },
    { id: 4, name: 'ece', age: 23, bio: 'kitaplar ve kahve... en sevdiğim ikili. ☕', appearance: generateFemaleAppearance(), matchChance: 0.2 },
    { id: 5, name: 'derya', age: 25, bio: 'spor ve sağlıklı yaşam. 💪', appearance: generateFemaleAppearance(), matchChance: 0.35 },
    { id: 6, name: 'buse', age: 22, bio: 'moda ve stil benim işim. ✨', appearance: generateFemaleAppearance(), matchChance: 0.3 },
    { id: 7, name: 'gizem', age: 24, bio: 'gizemli ve sessiz... 🌙', appearance: generateFemaleAppearance(), matchChance: 0.15 },
    { id: 8, name: 'ırmak', age: 21, bio: 'doğa ve huzur. 🌿', appearance: generateFemaleAppearance(), matchChance: 0.45 },
];

export const RandevuApp: React.FC<RandevuAppProps> = ({ player, updateMultipleStats, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMatching, setIsMatching] = useState(false);
    const [matchResult, setMatchResult] = useState<'match' | 'no-match' | null>(null);
    const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
    const [showBreakUpConfirm, setShowBreakUpConfirm] = useState(false);

    const hasPartner = !!player.career.partnerName;

    const handleSwipe = (liked: boolean) => {
        if (isMatching || hasPartner) return;
        
        playClickSound();
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
                        setCurrentIndex((prev) => (prev + 1) % POTENTIAL_PARTNERS.length);
                    }, 1500);
                }
            }, 1200);
        } else {
            setCurrentIndex((prev) => (prev + 1) % POTENTIAL_PARTNERS.length);
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
        onBack();
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

    // View: User has a partner
    if (hasPartner) {
        return (
            <div className="h-full flex flex-col bg-[#050505] p-8 items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-spotify-green/5 blur-[120px] rounded-full"></div>
                </div>

                {!showBreakUpConfirm ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="z-10 w-full max-w-sm space-y-12"
                    >
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-3xl mx-auto border border-white/5">
                                ❤️
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tighter lowercase">
                                bir ilişkin var<span className="text-spotify-green">.</span>
                            </h2>
                            <p className="text-neutral-500 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
                                sadakat her şeydir rapçi. mevcut ilişkine odaklanıp kariyerinde yükselmeye çalış.
                            </p>
                        </div>
                        
                        <div className="space-y-3 pt-6">
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={onBack}
                                className="w-full py-4.5 bg-white text-black rounded-[2rem] font-black text-xs lowercase tracking-tight shadow-xl"
                            >
                                geri dön
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowBreakUpConfirm(true)}
                                className="w-full py-4 bg-[#0a0a0a] text-red-400 rounded-[2rem] font-bold text-xs lowercase tracking-tight border border-red-500/10 hover:border-red-500/20"
                            >
                                ilişkiyi sonlandır
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="z-10 w-full max-w-sm space-y-12"
                    >
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-red-950/20 rounded-[2rem] flex items-center justify-center text-3xl mx-auto border border-red-500/10">
                                💔
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tighter lowercase">
                                emin misin<span className="text-red-500">?</span>
                            </h2>
                            <p className="text-neutral-500 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
                                {player.career.partnerName.toLowerCase()} ile yollarını tamamen ayırmak istediğinden emin misin? bu işlem geri alınamaz.
                            </p>
                        </div>
                        
                        <div className="space-y-3 pt-6">
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={handleBreakUp}
                                className="w-full py-4.5 bg-red-600 text-white rounded-[2rem] font-black text-xs lowercase tracking-tight shadow-xl"
                            >
                                evet, ayrılmak istiyorum
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowBreakUpConfirm(false)}
                                className="w-full py-4 bg-[#0a0a0a] text-neutral-400 rounded-[2rem] font-bold text-xs lowercase tracking-tight border border-white/5"
                            >
                                vazgeç
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    // View: Matched profile
    if (matchResult === 'match' && matchedProfile) {
        return (
            <div className="h-full flex flex-col bg-[#050505] p-8 items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-spotify-green/10 blur-[150px] rounded-full"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-10 w-full max-w-sm space-y-12"
                >
                    <div className="relative mb-6 mx-auto w-40 h-40">
                        <div className="absolute inset-0 bg-spotify-green rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        <div className="relative w-full h-full rounded-[2.5rem] border border-spotify-green/20 overflow-hidden shadow-2xl bg-[#0a0a0a] flex items-center justify-center">
                            <Avatar appearance={matchedProfile.appearance} size={150} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-spotify-green text-black w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-2xl">❤️</div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-white tracking-tighter lowercase">
                            büyük eşleşme<span className="text-spotify-green">!</span>
                        </h2>
                        <p className="text-neutral-400 text-xs tracking-tight max-w-[280px] mx-auto lowercase leading-relaxed">
                            {matchedProfile.name.toLowerCase()} de senin profilini çok beğendi! hemen sohbete başla!
                        </p>
                    </div>
                    
                    <motion.button 
                        whileTap={{ scale: 0.97 }}
                        onClick={confirmMatch}
                        className="w-full py-4.5 bg-white text-black rounded-[2rem] font-black text-xs lowercase tracking-tight shadow-xl"
                    >
                        mesaj atmaya başla
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const currentProfile = POTENTIAL_PARTNERS[currentIndex];

    return (
        <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
            {/* Header - Only render if not embedded in NetworkHub (i.e. onBack is defined) */}
            {onBack && (
                <div className="h-20 shrink-0 flex items-center justify-between px-6 z-20 pt-4 border-b border-white/[0.03]">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black active:scale-95 transition-all shadow-md font-black text-[9px] tracking-tight lowercase"
                    >
                        <ArrowIcon dir="left" className="w-2.5 h-2.5 text-black" />
                        <span>geri</span>
                    </button>
                    <div className="flex items-center gap-1.5 bg-[#0a0a0a] px-3.5 py-1.5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse"></div>
                        <span className="text-[9px] font-black text-neutral-400 tracking-tight lowercase">minder</span>
                    </div>
                </div>
            )}

            {/* Profile Card Area */}
            <div className="flex-1 px-6 pb-24 relative flex flex-col items-center justify-center z-10">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.03, x: matchResult === 'match' ? 200 : -200 }}
                        className="w-full h-full max-h-[310px] bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/[0.04] flex flex-col relative"
                    >
                        {/* Display Female Avatar */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden pt-4">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />
                            <div className="z-10 translate-y-6 drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
                                <Avatar appearance={currentProfile.appearance} size={150} gender="female" />
                            </div>
                        </div>

                        {/* Profile Info block */}
                        <div className="p-4 pb-6 relative z-20 bg-gradient-to-t from-[#0c0c0c] to-transparent">
                            <div className="flex items-end justify-between mb-1">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-black text-white tracking-tight lowercase">
                                        {currentProfile.name}, {currentProfile.age}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-spotify-green"></div>
                                        <span className="text-[8px] font-bold text-spotify-green tracking-tight lowercase">yakınlarında</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-neutral-400 text-xs tracking-tight leading-relaxed lowercase line-clamp-2 italic">
                                "{currentProfile.bio.toLowerCase()}"
                            </p>
                        </div>

                        {/* Swiped visual feedback stamp */}
                        {matchResult === 'no-match' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center"
                            >
                                <div className="border-2 border-red-500/50 px-6 py-2.5 rounded-xl rotate-[-8deg] bg-black/60">
                                    <span className="text-red-500 font-extrabold text-2xl tracking-tight lowercase">pas geçildi</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Swipe Action Trigger Buttons */}
                <div className="absolute bottom-6 flex items-center justify-center gap-6 z-30">
                    <motion.button 
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleSwipe(false)}
                        disabled={isMatching}
                        className="w-12 h-12 rounded-full bg-[#141414] hover:bg-[#1a1a1a] flex items-center justify-center text-red-400 border border-white/5 shadow-xl transition-colors disabled:opacity-50"
                    >
                        ✕
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleSwipe(true)}
                        disabled={isMatching}
                        className="w-16 h-16 bg-spotify-green text-black rounded-full flex items-center justify-center text-3xl shadow-lg shadow-spotify-green/20 disabled:opacity-50"
                    >
                        ❤️
                    </motion.button>
                </div>
            </div>

            {/* Match Finding Spinner */}
            <AnimatePresence>
                {isMatching && matchResult === null && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <div className="relative mb-6">
                            <div className="w-14 h-14 border-2 border-spotify-green/15 rounded-full"></div>
                            <div className="absolute inset-0 w-14 h-14 border-t-2 border-spotify-green rounded-full animate-spin"></div>
                        </div>
                        <div className="text-neutral-400 font-black text-[10px] tracking-tight lowercase animate-pulse">eşleşme kontrol ediliyor...</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
