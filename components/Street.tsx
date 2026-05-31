
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { HEAD_OPTIONS } from '../constants';
import { PlayerStats } from '../types';
import { Avatar } from './Avatar';
import { 
    ArrowUpDownIcon, 
    TrophyIcon, 
    PlayIcon, 
    GlobeIcon,
    MicSuitIcon,
    UsersIcon,
    SpectrumIcon,
    BreakdanceIcon,
    ClockIcon,
    DiscIcon,
    HexagonIcon,
    SpadeCardIcon,
    QuestionMarkIcon,
    SearchIcon
} from './Icons';
import { playErrorSound, playClickSound } from '../services/sfx';
import { calculateLevel } from '../services/gameLogic';
import { listenForOnlineCount } from '../services/matchmakingService';

interface Props {
  player: PlayerStats;
  onSelectGame: (game: 'freestyle' | 'live-freestyle' | 'trivia' | 'higherlower' | 'rhythm' | 'rapquiz' | 'flowbattle' | 'covermatch' | 'higherlower-solo' | 'flowbattle-solo' | 'covermatch-solo' | 'flappydisk' | 'rhythmtwister' | 'hexagon' | 'coverguess-solo' | 'songguess-solo' | 'coverguess' | 'beatsmash') => void;
  mode: 'online' | 'arcade';
}

import { motion, AnimatePresence } from "motion/react";

const GAMES = [
    { id: 'rapquiz', title: 'rap quiz', subtitle: 'Kültür Yarışması', accentColor: '#1ed760', icon: QuestionMarkIcon, description: 'Kültüre hakim ol. En iyi hip-hop bilgi yarışmasında bilgini kanıtla.' },
    { id: 'higherlower-solo', title: 'yeni mi eski mi?', subtitle: 'Daha Az/Çok', accentColor: '#0077ff', icon: ArrowUpDownIcon, description: 'Sanatçının hangi parçasının daha eski veya yeni olduğunu tahmin et.' },
    { id: 'rhythmtwister', title: 'rhythm twister', subtitle: 'Ritim Ustası', accentColor: '#00f2ff', icon: SpectrumIcon, description: 'Viral TikTok oyunu! Ritimleri yakala ve rekor kır.' },
    { id: 'flappydisk', title: 'flappy disk', subtitle: 'Uçan Plak', accentColor: '#1ed760', icon: DiscIcon, description: 'Stüdyo engellerini aş. Plağı ne kadar süre döndürebilirsin?' },
    { id: 'hexagon', title: 'hexagon', subtitle: 'Akış Tuzağı', accentColor: '#a855f7', icon: HexagonIcon, description: 'Altıgen refleks hayatta kalma. Kapanan tuzaktan yüksek hızla kaç.' },
    { id: 'beatsmash', title: 'beat smash', subtitle: 'Ritim Ezme', accentColor: '#f59e0b', icon: SpectrumIcon, description: 'Nintendo çılgınlığı! Ritimleri topla, kombo patlat ve pedleri ez.' },
    { id: 'coverguess-solo', title: 'kapak bilmece', subtitle: 'Görsel Hafıza', accentColor: '#10b981', icon: SearchIcon, description: 'Bulanık albüm kapağını tanı. Ne kadar hızlı bilirsen o kadar puan!' },
    { id: 'songguess-solo', title: 'şarkı bilmece', subtitle: 'Müzik Kulağı', accentColor: '#3b82f6', icon: MicSuitIcon, description: 'Şarkı snippetlarını dinle ve ismini tahmin et. İpuçlarını kullan!' },
    { id: 'flowbattle', title: 'beat smash pvp', subtitle: 'Ritim Savaşı', accentColor: '#f59e0b', icon: SpectrumIcon },
    { id: 'higherlower', title: 'tahmin savaşları', subtitle: 'PVP Yarışma', accentColor: '#0077ff', icon: ArrowUpDownIcon },
    { id: 'trivia', title: 'bilgi savaşları', subtitle: 'PVP Quiz', accentColor: '#1ed760', icon: MicSuitIcon },
    { id: 'coverguess', title: 'kapak savaşları', subtitle: 'PVP Hafıza', accentColor: '#10b981', icon: DiscIcon },
    { id: 'freestyle', title: '1v1 freestyle', subtitle: 'Stil Savaşı', accentColor: '#f97316', icon: MicSuitIcon, description: 'Gerçek zamanlı freestyle düellosu. Akışını konuştur!' },
];

export const Street: React.FC<Props> = ({ player, onSelectGame, mode }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineAvatars, setOnlineAvatars] = useState<{id: string, name: string, avatar: string}[]>([]);

  useEffect(() => {
      const usersRef = collection(db, 'public_users');
      const twoMinutesAgo = new Date(Date.now() - 120000);
      const q = query(usersRef, where('lastActive', '>=', Timestamp.fromDate(twoMinutesAgo)));
      
      const unsub = onSnapshot(q, (snapshot) => {
          const activeUsers = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as any));
          
          setOnlineCount(activeUsers.length);
          const avatars = activeUsers
            .sort((a, b) => (b.monthly_listeners || 0) - (a.monthly_listeners || 0))
            .slice(0, 15)
            .map(u => ({
                id: u.id,
                name: u.name,
                avatar: HEAD_OPTIONS[u.appearance?.headIndex || 0]
            }));
          setOnlineAvatars(avatars);
      });
      return () => unsub();
  }, []);

  const musicGamesList = ['rapquiz', 'higherlower-solo', 'coverguess-solo', 'songguess-solo', 'freestyle'];
  const otherArcadeList = ['beatsmash', 'rhythmtwister', 'flappydisk', 'hexagon'];
  const onlineFilters = ['flowbattle', 'higherlower', 'trivia', 'coverguess', 'freestyle'];

  const ArcadeCard = ({ game }: { game: typeof GAMES[0] }) => {
    return (
      <motion.button 
          key={game.id}
          onClick={() => { playClickSound(); onSelectGame(game.id as any); }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full transition-all duration-200 flex items-center justify-between py-3.5 border-b border-white/[0.04] hover:border-white/[0.1] text-left group overflow-hidden select-none bg-transparent"
      >
          <div className="flex items-center gap-3 min-w-0">
              {/* Minimal Icon */}
              <game.icon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shrink-0" style={{ color: game.accentColor }} />

              {/* Title with colored dot */}
              <h3 className="text-white font-black text-sm sm:text-base tracking-tight lowercase transition-transform duration-300 group-hover:translate-x-1.5 flex items-center whitespace-nowrap">
                  <span>{game.title.toLowerCase()}</span><span style={{ color: game.accentColor }} className="text-lg leading-none select-none ml-0.5 shrink-0">.</span>
              </h3>
          </div>

          {/* Minimal Play Action Button */}
          <div className="flex items-center gap-1 shrink-0 pl-2 opacity-30 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black tracking-tight text-neutral-400 lowercase">oyna</span>
              <PlayIcon className="w-2.5 h-2.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
      </motion.button>
    );
  };

  const [inLobby, setInLobby] = useState(false);
  const [showOtherGames, setShowOtherGames] = useState(false);

  return (
    <div className="flex-1 h-full flex flex-col bg-black relative overflow-hidden font-sans">
        {mode === 'arcade' ? (
            <>
                {/* Header - Spotify Minimal */}
                <div className="px-6 pt-12 pb-6 flex justify-between items-center z-30 relative border-b border-white/5">
                    <div>
                         <span className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">flowify lobi.</span>
                         <h1 className="text-2.5xl font-black text-white tracking-tighter lowercase leading-none">
                             arcade salonu<span className="text-[#1DB954]">.</span>
                         </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-[#0a0a0a] px-3.5 py-1.5 rounded-2xl border border-white/5 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-purple-400 tracking-tight lowercase">{player.careerCash.toLocaleString()} ₺</span>
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/5">
                            <img 
                                src={HEAD_OPTIONS[player.appearance?.headIndex || 0]} 
                                className="w-full h-full object-cover scale-150 relative top-1" 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-64 z-10 px-6 pt-6">
                    {/* Arcade Mode */}
                    <div className="space-y-6 font-sans">
                        <div className="bg-[#070707] p-5 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1ed760]/5 blur-2xl rounded-full z-0 pointer-events-none"></div>
                            <div className="relative z-10 flex mb-4">
                                <div className="bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse" />
                                    <h2 className="text-[11px] font-black text-[#1ed760] uppercase tracking-wider leading-none">müzik bilgini test et.</h2>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col gap-1.5">
                                {GAMES.filter(g => musicGamesList.includes(g.id)).map(game => <ArcadeCard key={game.id} game={game} />)}
                            </div>
                        </div>
     
                        <div className="bg-[#070707] p-5 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full z-0 pointer-events-none"></div>
                            <div className="relative z-10 flex mb-4">
                                <div className="bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    <h2 className="text-[11px] font-black text-[#1ed760] uppercase tracking-wider leading-none">beceri ve refleks.</h2>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col gap-1.5">
                                {GAMES.filter(g => otherArcadeList.includes(g.id)).map(game => <ArcadeCard key={game.id} game={game} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            /* Immersive Grid-Inspired Mobile/Desktop Arena selection with two clear sections */
            <div className="absolute inset-0 z-20 bg-black flex flex-col font-sans select-none overflow-hidden pb-16">
                {/* TOP STATUS BAR */}
                <div className="px-5 pt-12 pb-4 flex items-center justify-between z-30 relative select-none bg-black/60 backdrop-blur-md border-b border-white/5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-500 lowercase tracking-tight">flowify arena.</span>
                            <div className="flex items-center gap-1 inline-flex shrink-0">
                                <span className="relative flex h-1.5 w-1.5 animate-pulse">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1DB954]"></span>
                                </span>
                                <span className="text-[8.5px] text-[#1DB954] font-black uppercase tracking-wider">{onlineCount} aktif mc</span>
                            </div>
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tighter lowercase leading-none mt-1">
                            arena meydanı<span className="text-[#1DB954]">.</span>
                        </h1>
                    </div>
                </div>

                {/* SCROLLABLE SECTIONS */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-24 space-y-6 relative">
                    
                    {/* SECTION 1: 1V1 CANLI FREESTYLE */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                            <h2 className="text-[10px] font-black text-[#1DB954] uppercase tracking-wider leading-none">canlı freestyle</h2>
                        </div>
                        
                        <motion.button
                            whileTap={{ scale: 0.99 }}
                            onClick={() => { playClickSound(); onSelectGame('live-freestyle'); }}
                            className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#021808] via-[#010602] to-black border border-emerald-500/15 p-6 hover:border-emerald-500/30 transition-all text-left group"
                        >
                            <div className="absolute -bottom-[12%] -left-[10%] w-[220px] h-[220px] bg-[#1DB954]/[0.08] rounded-full blur-[65px] pointer-events-none"></div>
                            
                            {/* Horizontal light band */}
                            <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent opacity-60"></div>

                            {/* Embedded Large Users Background Icon */}
                            <div className="absolute right-5 bottom-2 text-[#1DB954]/[0.04] pointer-events-none z-0">
                                <UsersIcon className="w-48 h-48 filter drop-shadow([0_0_60px_rgba(29,185,84,0.15)])" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="px-2.5 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 text-[8px] font-black tracking-widest text-[#1DB954] uppercase self-start">
                                    🎙️ webrtc canlı • sesli lobi
                                </div>
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none lowercase">
                                        1v1 canlı freestyle<span className="text-[#1DB954]">.</span>
                                    </h3>
                                    <p className="text-[11px] text-emerald-300/60 font-medium lowercase tracking-tight max-w-sm mt-2 leading-relaxed">
                                        odadaki diğer mc'lerle kesintisiz gecikmesiz canlı ses hattı kurup kapış veya dinleyici olarak oy ver!
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-[#1DB954] uppercase tracking-wider">
                                    <span>şimdi katıl</span>
                                    <span>🎤</span>
                                </div>
                            </div>
                        </motion.button>
                    </div>

                    {/* SECTION 2: OTHER PVP GAMES */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-wider leading-none">çevrimiçi pvp oyunları</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {GAMES.filter(g => onlineFilters.includes(g.id) && g.id !== 'freestyle').map(game => (
                                <motion.button
                                    key={`arena-pvp-${game.id}`}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { playClickSound(); onSelectGame(game.id as any); }}
                                    className="w-full flex items-center justify-between p-4 rounded-[1.8rem] bg-[#070707] border border-white/5 hover:border-white/10 hover:bg-neutral-900/40 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0">
                                            <game.icon className="w-5 h-5" style={{ color: game.accentColor }} />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-black text-white tracking-tight lowercase flex items-center gap-0.5">
                                                {game.title}<span style={{ color: game.accentColor }} className="text-sm">.</span>
                                            </h4>
                                            <p className="text-[10px] text-neutral-500 font-bold lowercase mt-0.5">
                                                {game.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl flex items-center gap-1 group-hover:bg-white/10 transition-colors">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-wider">meydan oku ⚔️</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};
