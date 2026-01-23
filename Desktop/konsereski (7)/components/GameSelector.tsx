
import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { PlayerStats } from '../types';
import { MicIcon, UsersIcon, TrophyIcon } from './Icons';
import { playClickSound } from '../services/sfx';
import { logoutUser } from '../services/authService';
import { useGameUI } from '../context/UIContext';

interface Props {
  player: PlayerStats;
  onSelectMode: (mode: 'career' | 'hub') => void;
}

export const GameSelector: React.FC<Props> = ({ player, onSelectMode }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const { showConfirm } = useGameUI();

  // Fetch online users count
  useEffect(() => {
      const usersRef = ref(db, 'public_users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
          if (snapshot.exists()) {
              const data = snapshot.val();
              // Calculate users active in the last 2 minutes
              const now = Date.now();
              const activeCount = Object.values(data).filter((u: any) => now - u.lastActive < 120000).length;
              setOnlineCount(activeCount);
          } else {
              setOnlineCount(0);
          }
      });

      return () => unsubscribe();
  }, []);
  
  const handleSelect = (mode: 'career' | 'hub') => {
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
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
        
        {/* Header Info */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pt-safe-top flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-white font-bold shadow-lg">
                    {player.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-white font-bold text-sm leading-none drop-shadow-md">{player.name}</h2>
                    <p className="text-neutral-400 text-xs">Seviye {player.careerLevel || 1}</p>
                </div>
            </div>
        </div>

        {/* --- SPLIT SCREEN LAYOUT --- */}
        
        {/* TOP HALF: CAREER MODE (Abstract Purple/Blue Gradient) */}
        <button 
            onClick={() => handleSelect('career')}
            className="flex-1 relative w-full group overflow-hidden border-b border-white/5 active:brightness-110 transition-all duration-100"
        >
            {/* Premium Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] opacity-100 group-hover:scale-105 transition-transform duration-1000"></div>
            {/* Abstract Shapes */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] group-hover:bg-purple-500/30 transition-colors"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]"></div>
            
            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform duration-300">
                    <MicIcon className="w-10 h-10 text-purple-300" />
                </div>
                {/* Responsive Font Size - Added PR-4 to prevent cut-off */}
                <h1 className="text-4xl xs:text-5xl md:text-6xl font-black text-white italic tracking-tighter mb-2 drop-shadow-2xl pr-4">KARİYER</h1>
                <p className="text-purple-200 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-4 opacity-80">Dünya Turnesi & Albüm</p>
                <div className="bg-purple-500/20 border border-purple-500/30 text-purple-100 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg backdrop-blur-md">
                    {player.week}. Hafta
                </div>
            </div>
        </button>

        {/* BOTTOM HALF: ONLINE HUB (Abstract Green/Dark Gradient) */}
        <button 
            onClick={() => handleSelect('hub')}
            className="flex-1 relative w-full group overflow-hidden active:brightness-110 transition-all duration-100"
        >
            {/* Premium Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tl from-[#064e3b] via-[#022c22] to-[#0a0a0a] opacity-100 group-hover:scale-105 transition-transform duration-1000"></div>
            {/* Abstract Shapes */}
            <div className="absolute top-[20%] right-[-20%] w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[100px] group-hover:bg-green-500/20 transition-colors"></div>
            
            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                
                {/* BIG CIRCLE WITH LIVE COUNT */}
                <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 flex flex-col items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)] group-hover:scale-110 transition-transform duration-300 relative">
                    <UsersIcon className="w-8 h-8 text-[#1ed760] mb-1" />
                    
                    {/* Live Counter Badge inside Circle */}
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                        <span className="text-[9px] font-bold text-white">{onlineCount}</span>
                    </div>
                </div>

                {/* Responsive Font Size - Added PR-4 to prevent cut-off */}
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white italic tracking-tighter mb-2 drop-shadow-2xl pr-4">ONLINE HUB</h1>
                <p className="text-green-200 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-4 opacity-80">
                    SAVAŞLAR, ONLINE 1V1 VE DAHASI
                </p>
                
                <div className="flex gap-2">
                    <div className="bg-green-900/30 border border-green-500/30 text-green-100 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 backdrop-blur-md">
                        <TrophyIcon className="w-3 h-3" />
                        {player.respect} Respect
                    </div>
                </div>
            </div>
        </button>

        {/* Center Divider Visual with Logout Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2">
            <div className="bg-black border border-white/10 px-4 py-2 rounded-full text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] shadow-xl backdrop-blur-xl">
                MOD SEÇİMİ
            </div>
            <button 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-900/20 hover:border-red-500 transition-colors shadow-xl"
                title="Çıkış Yap"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </button>
        </div>

    </div>
  );
};
