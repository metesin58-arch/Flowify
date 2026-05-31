import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
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
  
  const handleSelect = (mode: 'career' | 'hub') => {
    playClickSound();
    onSelectMode(mode);
  };

  const handleLogout = () => {
    playClickSound();
    showConfirm("çıkış yap", "hesabından çıkış yapmak istediğine emin misin?", async () => {
      await logoutUser();
      window.location.reload();
    });
  };

  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden font-sans select-none">
      
      {/* BRANDING LOGO (Top Left Absolute) */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <span className="text-white text-xl font-black tracking-tighter lowercase leading-none select-none">
          flowify<span className="text-[#1DB954]">.</span>
        </span>
        <div className="text-[9px] text-neutral-400 font-bold lowercase tracking-tight mt-0.5">
          {player.name}
        </div>
      </div>

      {/* LOGOUT & DEV BUTTONS (Top Right Absolute) */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-2">
        <button 
          onClick={() => handleSelect('test_area')}
          className="px-3 py-1.5 rounded-2xl bg-purple-950/45 border border-purple-500/20 active:scale-95 transition-all text-purple-400 flex items-center gap-1.5 backdrop-blur-md hover:bg-purple-900/30 font-black text-[9px] uppercase tracking-tight"
        >
          <span>🛠</span>
          <span>test alanı</span>
        </button>
        <button 
          onClick={handleLogout}
          className="px-3.5 py-1.5 rounded-2xl bg-[#0a0a0a]/80 border border-white/5 active:scale-95 transition-all text-neutral-400 flex items-center gap-1 backdrop-blur-md hover:text-white"
        >
          <span className="text-[9px] font-bold tracking-tight lowercase text-neutral-500">çıkış yap</span>
        </button>
      </div>

      {/* PREMIUM DIGITAL BACKGROUND GRID */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* SPLIT PANELS WRAPPER */}
      <div className="flex-1 flex flex-col h-full w-full bg-black">
        
        {/* TOP HALF: CAREER MODE */}
        <button 
          onClick={() => handleSelect('career')}
          className="flex-1 relative w-full flex flex-col justify-center items-center p-8 py-16 transition-all duration-500 bg-gradient-to-br from-[#12042c] via-[#080214] to-black hover:from-[#1b0542] hover:via-[#0c031f] active:scale-[0.99] group overflow-hidden border-b border-purple-500/10 text-center select-none"
        >
          {/* Glowing Ambient backdrop (Consistent fixed diameter for identical color on all orientations) */}
          <div className="absolute -top-[12%] -right-[10%] w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] bg-purple-500/[0.14] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none transition-all duration-700 group-hover:bg-purple-500/[0.22] group-hover:scale-110"></div>
          
          {/* Subtle horizontal light band */}
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
 
          {/* Giant background-embedded MicIcon - styled with beautiful vector glow */}
          <div className="absolute right-[5%] top-[10%] text-purple-500/[0.04] transition-all duration-700 select-none pointer-events-none z-0 group-hover:text-purple-500/[0.06] group-hover:scale-105 group-hover:-rotate-3">
            <MicIcon className="w-80 h-80 sm:w-[480px] sm:h-[480px] filter drop-shadow([0_0_80px_rgba(168,85,247,0.25)])" />
          </div>
 
          <div className="max-w-md w-full flex flex-col items-center gap-4 relative z-10">
            {/* Premium Badge */}
            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-black tracking-widest text-purple-300 uppercase shadow-[0_0_15px_rgba(168,85,247,0.1)] h-6 flex items-center justify-center">
              {player.week}. hafta • kariyer serüveni
            </div>
 
            {/* Title */}
            <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none lowercase mt-1 transition-transform group-hover:scale-[1.01] duration-500">
              kariyer<span className="text-purple-500 text-6xl sm:text-8xl drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">.</span>
            </h2>
            
            {/* Elegant tiny tagline */}
            <p className="text-[10px] text-purple-200/60 font-medium lowercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity duration-300">
              konser ver, kendini türkiye'ye tanıt.
            </p>
          </div>
        </button>
 
        {/* BOTTOM HALF: ONLINE HUB */}
        <button 
          onClick={() => handleSelect('hub')}
          className="flex-1 relative w-full flex flex-col justify-center items-center p-8 py-16 transition-all duration-500 bg-gradient-to-br from-[#021d0a] via-[#010d05] to-black hover:from-[#032d10] hover:via-[#011407] active:scale-[0.99] group overflow-hidden text-center select-none"
        >
          {/* Glowing Ambient backdrop (Consistent fixed diameter) */}
          <div className="absolute -bottom-[12%] -left-[10%] w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] bg-[#1DB954]/[0.14] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none transition-all duration-700 group-hover:bg-[#1DB954]/[0.22] group-hover:scale-110"></div>
          
          {/* Subtle horizontal light band */}
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
 
          {/* Giant background-embedded icon */}
          <div className="absolute left-[5%] bottom-[10%] text-[#1DB954]/[0.04] transition-all duration-700 select-none pointer-events-none z-0 group-hover:text-[#1DB954]/[0.06] group-hover:scale-105 group-hover:rotate-3">
            <UsersIcon className="w-80 h-80 sm:w-[480px] sm:h-[480px] filter drop-shadow([0_0_80px_rgba(29,185,84,0.25)])" />
          </div>
 
          <div className="max-w-md w-full flex flex-col items-center gap-4 relative z-10">
            {/* Symmetrical stats badge */}
            <div className="flex items-center justify-center gap-2.5 px-3 py-1 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-full text-[9px] font-black tracking-widest text-[#1DB954] uppercase shadow-[0_0_15px_rgba(29,185,84,0.1)] select-none h-6">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1DB954]"></span>
                </span>
                <span>{onlineCount} aktif</span>
              </div>
              <span className="text-white/10 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="drop-shadow-[0_0_8px_rgba(234,179,8,0.7)] text-[10px] select-none">🏆</span>
                <span>{(player.respect || 0).toLocaleString()} saygınlık</span>
              </div>
            </div>
 
            {/* Title */}
            <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none lowercase mt-1 transition-transform group-hover:scale-[1.01] duration-500">
              online hub<span className="text-[#1DB954] text-6xl sm:text-8xl drop-shadow-[0_0_15px_rgba(29,185,84,0.5)]">.</span>
            </h2>
 
            {/* Elegant tiny tagline */}
            <p className="text-[10px] text-emerald-300/60 font-medium lowercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity duration-300">
              savaşlar, online 1v1 ve dahası.
            </p>
          </div>
        </button>
 
      </div>

      {/* MID-SCREEN HORIZONTAL DIVIDER - AUDIO SPECTRUM (z-40 for visibility over buttons) */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[48px] z-40 pointer-events-none flex items-center justify-between px-4 sm:px-12">
        {/* Faint connecting line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10 z-0"></div>
        
        {/* Style tag for GPU-accelerated audio bars */}
        <style>{`
          @keyframes soundBar {
            0%, 100% { transform: scaleY(0.15); }
            50% { transform: scaleY(1.0); }
          }
          .sound-bar {
            animation: soundBar 1s ease-in-out infinite;
            transform-origin: center;
          }
        `}</style>

        {/* Left Spectrum Bars */}
        <div className="flex-1 flex justify-end items-center gap-[3px] h-[32px] overflow-hidden pr-8 z-10">
          {[...Array(24)].map((_, i) => {
            const baseHeights = [16, 8, 24, 12, 28, 14, 20, 10, 32, 16, 24, 8, 14, 20, 12, 28, 8, 16, 12, 24, 10, 18, 14, 8];
            const height = baseHeights[i % baseHeights.length];
            const delay = (i * 0.05).toFixed(2);
            const duration = (0.5 + (i % 4) * 0.15).toFixed(2);
            return (
              <div 
                key={`left-bar-${i}`}
                className="w-[2px] bg-white/80 rounded-full sound-bar"
                style={{
                  height: `${height}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`
                }}
              />
            );
          })}
        </div>

        {/* Center Badge Spacer */}
        <div className="w-[180px] shrink-0" />

        {/* Right Spectrum Bars */}
        <div className="flex-1 flex justify-start items-center gap-[3px] h-[32px] overflow-hidden pl-8 z-10">
          {[...Array(24)].map((_, i) => {
            const baseHeights = [8, 14, 18, 10, 24, 12, 16, 8, 28, 12, 20, 14, 8, 24, 16, 32, 10, 20, 14, 28, 12, 24, 8, 16];
            const height = baseHeights[i % baseHeights.length];
            const delay = ((24 - i) * 0.05).toFixed(2);
            const duration = (0.5 + (i % 4) * 0.15).toFixed(2);
            return (
              <div 
                key={`right-bar-${i}`}
                className="w-[2px] bg-white/80 rounded-full sound-bar"
                style={{
                  height: `${height}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`
                }}
              />
            );
          })}
        </div>
      </div>

      {/* MID-SCREEN HORIZONTAL DIVIDER BADGE (z-50 for visibility on top of spectrum and buttons) */}
      <div className="absolute top-1/2 left-0 w-full flex justify-center -translate-y-1/2 z-50 pointer-events-none">
        <div className="bg-white px-6 py-2.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.95)] flex items-center justify-center border border-white/20 backdrop-blur-md">
          <span className="text-black text-[10px] font-black tracking-[0.15em] uppercase select-none leading-none">
            mod seçimi
          </span>
        </div>
      </div>

    </div>
  );
};
