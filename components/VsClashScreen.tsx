import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { CharacterAppearance, Gender } from '../types';
import { HEAD_OPTIONS } from '../constants';
import { playWinSound, playWrongSound } from '../services/sfx';

interface VsClashScreenProps {
  myName: string;
  myAppearance: CharacterAppearance;
  myGender: Gender;
  opponentId: string;
  opponentName: string;
  onComplete: () => void;
}

export const VsClashScreen: React.FC<VsClashScreenProps> = ({
  myName,
  myAppearance,
  myGender,
  opponentId,
  opponentName,
  onComplete
}) => {
  const [oppAppearance, setOppAppearance] = useState<CharacterAppearance | null>(null);
  const [step, setStep] = useState<'slide' | 'crash' | 'fadeout'>('slide');

  // Use a stable ref for onComplete to prevent inline callbacks from resetting the timing effect
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Play matchmaking trigger sound
    try {
      playWinSound();
    } catch (e) {}

    // Fetch Opponent Profile for real customization
    const fetchOpponent = async () => {
      if (!opponentId) return;
      try {
        const docRef = doc(db, 'public_users', opponentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appearance) {
            setOppAppearance(data.appearance);
          }
        }
      } catch (e) {
        console.error("Error fetching opponent appearance:", e);
      }
    };
    fetchOpponent();

    // Steps timing
    // 1. Slide & ready
    const crashTimer = setTimeout(() => {
      setStep('crash');
      try {
        playWrongSound(); // Explosion/clash sound feel
      } catch (e) {}
    }, 1400);

    // 2. Clear / Fadeout
    const fadeTimer = setTimeout(() => {
      setStep('fadeout');
    }, 3200);

    // 3. Complete
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 3800);

    return () => {
      clearTimeout(crashTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [opponentId]);

  // Fallback defaults for opponent if not loaded in time
  const oppHeadIndex = oppAppearance?.headIndex ?? 0;
  const oppHeadSrc = HEAD_OPTIONS[oppHeadIndex];

  const myHeadIndex = myAppearance?.headIndex ?? 0;
  const myHeadSrc = HEAD_OPTIONS[myHeadIndex];

  // Modern minimal backdrop class matching the overall aesthetic
  const containerClass = `fixed inset-0 z-[99999] bg-black/95 backdrop-blur-3xl overflow-hidden font-sans flex flex-col items-center justify-center transition-all duration-300 ${
    step === 'crash' ? 'animate-[shake_0.4s_ease-in-out]' : ''
  } ${step === 'fadeout' ? 'opacity-0 scale-95' : 'opacity-100'}`;

  return (
    <div id="vs-clash" className={containerClass}>
      {/* Abstract elegant particle glow background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-white/5 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-neutral-800/20 blur-[100px] animate-[pulse_6s_infinite]"></div>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      </div>

      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-between px-6 py-16 z-10">
        
        {/* Top Header Label */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2 select-none"
        >
          <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-black tracking-[0.2em] text-neutral-300 uppercase leading-none">CANLI DÜELLO</span>
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">KAPIŞMA BAŞLIYOR</h1>
        </motion.div>

        {/* Central Vs Grid Area */}
        <div className="relative w-full flex-1 flex items-center justify-between py-12 select-none">
          
          {/* Left Side: Sen */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-[42%] flex flex-col items-center"
          >
            {/* Elegant Circle Frame under avatar */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-neutral-900 border border-white/10 p-1 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-neutral-800 to-transparent opacity-60"></div>
              {/* Head display */}
              <img 
                src={myHeadSrc} 
                className="w-16 h-16 md:w-20 md:h-20 object-cover scale-150 translate-y-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter grayscale" 
                alt="My Head" 
              />
            </div>

            {/* Micro Details */}
            <div className="mt-4 text-center">
              <div className="text-xs font-black tracking-tight text-white uppercase max-w-[110px] truncate">
                {myName}
              </div>
              <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5 font-mono">SEN</div>
            </div>
          </motion.div>

          {/* VS Divider Graphic */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
            {step === 'crash' && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute w-12 h-12 rounded-full border border-white/40"
              />
            )}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-t border-b border-white/20 bg-neutral-900/90 text-white shadow-xl`}
            >
              <span className="font-black text-sm tracking-tighter">VS</span>
            </motion.div>
          </div>

          {/* Right Side: Rakip */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-[42%] flex flex-col items-center"
          >
            {/* Elegant Circle Frame under avatar */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-neutral-900 border border-white/10 p-1 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-neutral-800 to-transparent opacity-60"></div>
              {/* Head display */}
              <img 
                src={oppHeadSrc} 
                className="w-16 h-16 md:w-20 md:h-20 object-cover scale-150 translate-y-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter grayscale" 
                alt="Opponent Head" 
              />
            </div>

            {/* Micro Details */}
            <div className="mt-4 text-center">
              <div className="text-xs font-black tracking-tight text-white uppercase max-w-[110px] truncate">
                {opponentName}
              </div>
              <div className="text-[8px] font-bold text-[#1ed760] uppercase tracking-widest mt-0.5 font-mono">RAKİP</div>
            </div>
          </motion.div>

        </div>

        {/* Lower countdown status / information display */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center font-bold h-6 flex items-center justify-center w-full"
        >
          {step === 'slide' && (
            <div className="text-neutral-500 text-[10px] tracking-widest uppercase animate-pulse">RAKİP DETAYLARI AKTARILIYOR...</div>
          )}
          {step === 'crash' && (
            <div className="text-white text-[10px] tracking-[0.1em] font-black uppercase leading-none">VURUŞ BAŞLIYOR...</div>
          )}
        </motion.div>

      </div>

      {/* Styled inline animation tricks for screen shake */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
};
