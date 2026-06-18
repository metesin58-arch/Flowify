import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { PlayerStats } from '../types';
import { MicIcon, UsersIcon } from './Icons';
import { playClickSound } from '../services/sfx';
import { logoutUser } from '../services/authService';
import { useGameUI } from '../context/UIContext';

interface Props {
  player: PlayerStats;
  onSelectMode: (mode: 'career' | 'hub' | 'test_area') => void;
}

export const GameSelector: React.FC<Props> = ({ player, onSelectMode }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const { showConfirm } = useGameUI();

  // Fetch online users count
  useEffect(() => {
    const usersRef = collection(db, 'public_users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const now = Date.now();
      const activeCount = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const lastActive = data.lastActive instanceof Timestamp ? data.lastActive.toMillis() : data.lastActive;
        return now - lastActive < 120000;
      }).length;
      setOnlineCount(activeCount);
    });

    return () => unsubscribe();
  }, []);
  
  const handleSelect = (mode: 'career' | 'hub' | 'test_area') => {
    playClickSound();
    onSelectMode(mode);
  };

  const handleLogout = () => {
    playClickSound();
    showConfirm("ÇIKIŞ YAP", "Hesabından çıkış yapmak istediğine emin misin?", async () => {
      await logoutUser();
      window.location.reload();
    });
  };

  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden font-sans select-none max-h-[100dvh]">
      
      {/* MINIMAL DEVELOPER BUTTON */}
      <div className="absolute top-3 right-3 z-[60] flex items-center">
        <button 
          onClick={() => handleSelect('test_area')}
          className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 active:scale-95 transition-all text-white/30 hover:text-white/60 select-none text-[7px] tracking-widest font-black uppercase"
        >
          🛠 DEV_ROOM
        </button>
      </div>

      {/* SPLIT PANELS WRAPPER */}
      <div className="flex-1 flex flex-col h-full w-full bg-black overflow-hidden relative">
        
        {/* TOP HALF: CAREER MODE */}
        <div 
          onClick={() => handleSelect('career')}
          className="flex-1 relative w-full flex flex-col justify-center items-center py-4 cursor-pointer select-none transition-all duration-500 bg-gradient-to-b from-[#252055] via-[#151235] to-[#0A081C] hover:brightness-[1.12]"
        >
          {/* PROFILE CARD (Top Left Absolute) - Styled compactly */}
          <div className="absolute top-3 left-3 z-[45] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* COMPACT INITIAL AVATAR */}
            <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center font-[900] text-sm text-white tracking-tighter shadow-lg">
              {player.name ? player.name.charAt(0).toUpperCase() : 'R'}
            </div>
            {/* NAME & LEVEL BLOCK */}
            <div className="flex flex-col">
              <span className="text-white text-[11px] font-[900] tracking-tight leading-none">
                {player.name}
              </span>
              <span className="text-white/45 text-[9px] font-bold leading-none mt-0.5">
                seviye {player.careerLevel || 1}
              </span>
            </div>
          </div>

          <div className="max-w-md w-full flex flex-col items-center gap-1 relative z-10 px-4 text-center mt-3">
            {/* STREAMLINED COMPACT MIC CIRCLE */}
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mb-2 shadow-[inset_0_0_8px_rgba(255,255,255,0.01)] transition-transform duration-500 hover:scale-105">
              <MicIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white/85" />
            </div>

            {/* OPEN SAUCE COMPACT TITLE */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl font-[900] tracking-[-0.08em] leading-none text-white select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] lowercase">
              kariyer<span className="text-[#a594fd]/90">.</span>
            </h1>
            
            {/* SUBTITLE */}
            <p className="tracking-tight text-[10px] sm:text-xs font-bold text-[#A594FD]/70 mt-0.5 lowercase">
              dünya turnesi & albüm
            </p>

            {/* WEEK BUTTON / PILL */}
            <div className="px-4 py-1 rounded-full bg-[#3B2D7F]/40 border border-[#7C63FF]/15 text-[9px] font-bold tracking-tight text-[#B2A2FF] lowercase mt-3 backdrop-blur-md shadow-md min-w-[90px] text-center">
              {player.week}. hafta
            </div>
          </div>
        </div>
 
        {/* BOTTOM HALF: ONLINE HUB */}
        <div 
          onClick={() => handleSelect('hub')}
          className="flex-1 relative w-full flex flex-col justify-center items-center py-4 cursor-pointer select-none transition-all duration-500 bg-gradient-to-b from-[#113B1F] via-[#072110] to-[#030E07] hover:brightness-[1.12] border-t border-black/45"
        >
          <div className="max-w-md w-full flex flex-col items-center gap-1 relative z-10 px-4 text-center">
            {/* STREAMLINED COMPACT USERS CONTAINER */}
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mb-2 relative shadow-[inset_0_0_8px_rgba(255,255,255,0.01)]">
              <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white/85" />
              
              {/* Floating count badge directly connected at bottom */}
              <div className="absolute -bottom-1 bg-black/95 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-md">
                <span className="w-1 h-1 rounded-full bg-[#1DB954] animate-pulse"></span>
                <span className="text-[8px] font-black tracking-tight text-white/80 tabular-nums">
                  {onlineCount}
                </span>
              </div>
            </div>

            {/* OPEN SAUCE COMPACT TITLE */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl font-[900] tracking-[-0.08em] leading-none text-white select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] lowercase">
              online hub<span className="text-[#1DB954]/90">.</span>
            </h1>

            {/* SUBTITLE */}
            <p className="tracking-tight text-[10px] sm:text-xs font-bold text-[#1DB954]/70 mt-0.5 lowercase">
              savaşlar, online 1v1 ve dahası
            </p>

            {/* RESPECT TROPHY BOX / PILL */}
            <div className="px-4 py-1 rounded-full border border-emerald-500/15 bg-[#113B1F]/30 flex items-center justify-center gap-1 text-[9px] font-bold text-emerald-400 tracking-tight mt-3 shadow-md backdrop-blur-md lowercase">
              <span className="text-[10px]">🏆</span>
              <span>{(player.respect || 0).toLocaleString()} respect</span>
            </div>
          </div>
        </div>
 
      </div>

      {/* FLOATING MID-SCREEN SPLIT CONTROLS CONTAINER */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center gap-2">
        {/* MOD SEÇİMİ PILL */}
        <div className="bg-white px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.85)] flex items-center justify-center border border-white/90">
          <span className="text-black text-[10.5px] font-[900] tracking-[-0.03em] lowercase select-none leading-none">
            mod seçimi
          </span>
        </div>

        {/* RED SIGN_OUT ICON BUTTON */}
        <button 
          onClick={handleLogout}
          className="w-8 h-8 rounded-full bg-[#09090C] border border-red-500/20 hover:border-red-500/35 active:scale-90 transition-all flex items-center justify-center text-red-500/90 hover:text-red-400 shadow-[0_8px_24px_rgba(0,0,0,0.9)] z-50 cursor-pointer"
          title="Çıkış Yap"
        >
          {/* Custom vector logout icon pointing right */}
          <svg className="w-4 h-4 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

    </div>
  );
};
