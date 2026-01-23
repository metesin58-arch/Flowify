
import React from 'react';
import { PlayerStats } from '../types';
import { 
    MicIcon, 
    DiscIcon, 
    ArrowUpDownIcon, 
    TrophyIcon, 
    PlayIcon, 
    SpectrumIcon, 
    BreakdanceIcon, 
    QuestionMarkIcon,
    CrownIcon,
    HexagonIcon,
    GlobeIcon
} from './Icons';
import { playErrorSound } from '../services/sfx';
import { calculateLevel } from '../services/gameLogic';

interface Props {
  player: PlayerStats;
  onSelectGame: (game: 'freestyle' | 'trivia' | 'higherlower' | 'rhythm' | 'rapquiz' | 'flowbattle' | 'covermatch' | 'higherlower-solo' | 'flowbattle-solo' | 'covermatch-solo' | 'flappydisk' | 'rhythmtwister' | 'hexagon') => void;
  mode: 'online' | 'arcade';
}

interface GameCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    bgIcon: React.ReactNode;
    accentColor: string;
    badge?: string;
    badgeIcon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ title, subtitle, icon, bgIcon, accentColor, badge, badgeIcon, onClick, disabled }) => (
    <button 
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`w-full group relative h-24 rounded-2xl overflow-hidden text-left transition-transform duration-200 mb-3 touch-manipulation border border-white/5 shadow-lg ${disabled ? 'cursor-default' : 'active:scale-[0.98] cursor-pointer'}`}
    >
        {/* Main Gradient Background: Left (Black) -> Right (Theme Color) */}
        <div 
            className="absolute inset-0 z-0"
            style={{ 
                background: `linear-gradient(90deg, #050505 0%, #050505 40%, ${accentColor}20 100%)`
            }}
        ></div>
        
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }}></div>

        {/* Decorative Large Background Icon (Faded) */}
        <div className="absolute -right-4 -bottom-8 opacity-[0.07] transform rotate-[15deg] scale-[2.0] z-10 pointer-events-none transition-transform duration-500 group-hover:rotate-[5deg] group-hover:scale-[2.2]" style={{ color: accentColor }}>
            {bgIcon}
        </div>

        {/* Main Content */}
        <div className="relative z-30 px-5 flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
                
                {/* Icon Container - Premium Black Gradient */}
                <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0 border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #222 0%, #0a0a0a 100%)' }}
                >
                    <div style={{ color: accentColor }} className="relative z-10 filter drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7' })}
                    </div>
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                    {badge && (
                        <div className="flex mb-1 items-center gap-1">
                            <span 
                                className="text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border flex items-center gap-1 leading-none"
                                style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30`, color: accentColor }}
                            >
                                {badge}
                                {badgeIcon && badgeIcon}
                            </span>
                        </div>
                    )}
                    <h2 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none mb-0.5 drop-shadow-md">
                        {title}
                    </h2>
                    <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.2em] truncate group-hover:text-white transition-colors">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Play Action */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <PlayIcon className="w-3 h-3 text-white group-hover:text-black ml-0.5 transition-colors" />
            </div>
        </div>
    </button>
);

export const Street: React.FC<Props> = ({ player, onSelectGame, mode }) => {
  const currentLevel = calculateLevel(player.monthly_listeners);
  // Online Arena Unlocks at Level 2
  const isOnlineLocked = mode === 'online' && currentLevel < 2;

  const handleLockedClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      playErrorSound();
  };

  return (
    <div className="h-full w-full bg-black relative flex flex-col">
        
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <div className={`absolute top-[-20%] ${mode === 'online' ? 'left-[-20%] bg-blue-900/10' : 'right-[-20%] bg-purple-900/10'} w-[120vw] h-[120vw] rounded-full blur-[120px]`}></div>
        </div>

        {/* Header Section - Fixed */}
        <div className="px-6 mb-2 relative z-10 shrink-0 pt-24 pb-4 border-b border-white/5 bg-gradient-to-b from-black via-black/95 to-transparent">
            <div className="flex items-center gap-3 mb-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'online' ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-purple-500 shadow-[0_0_15px_#a855f7]'}`}></div>
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.5em]">
                    {mode === 'online' ? 'GLOBAL ARENA' : 'ARCADE CENTER'}
                </span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none drop-shadow-xl">
                {mode === 'online' ? 'ONLINE ARENA' : (
                    <>
                        ARCADE <span className="text-xl text-purple-500 italic align-top ml-1">(SOLO)</span>
                    </>
                )}
            </h1>
            {mode === 'online' && (
                <p className="text-[10px] text-neutral-400 font-medium max-w-[80%] mt-2 leading-tight">
                    Kupaları kazan ve liderlik koltuğunda en tepeye otur.
                </p>
            )}
        </div>

        {/* Game List Container - Internal Scrolling */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 relative z-10 custom-scrollbar">
            
            {/* ONLINE LOCKED OVERLAY */}
            {isOnlineLocked && (
                <div 
                    onClick={handleLockedClick}
                    className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in"
                >
                    <div className="bg-[#121212]/90 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden max-w-sm w-full">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                        
                        <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 border-2 border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                            <div className="text-4xl">🔒</div>
                        </div>
                        
                        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2">ERİŞİM YASAK</h2>
                        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Online Arena'ya girmek için</p>
                        
                        <div className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl uppercase tracking-[0.2em] text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse">
                            SEVİYE 2 GEREKLİ
                        </div>
                        
                        <div className="mt-6 text-[9px] text-neutral-500 font-bold leading-relaxed">
                            Kariyer Modunda veya Arcade Oyunlarında<br/>
                            <span className="text-white uppercase">FAN KAZANARAK SEVİYE ATLA</span>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'arcade' && (
                <>
                    <GameCard 
                        title="FLOW TRAP"
                        subtitle="Refleks Testi"
                        accentColor="#a855f7" // Purple
                        badge="YENİ"
                        icon={<HexagonIcon />}
                        bgIcon={<HexagonIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('hexagon')}
                    />
                    <GameCard 
                        title="AŞAĞI / YUKARI"
                        subtitle="Eski mi Yeni mi?"
                        accentColor="#0077ff" // Bright Blue
                        badge="BİLGİ"
                        icon={<ArrowUpDownIcon />}
                        bgIcon={<ArrowUpDownIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('higherlower-solo')}
                    />
                    <GameCard 
                        title="RİTİM OYUNU"
                        subtitle="Kelimeleri yakala"
                        accentColor="#00f2ff" // Neon Cyan
                        badge="VİRAL OYUN"
                        icon={<SpectrumIcon />}
                        bgIcon={<SpectrumIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('rhythmtwister')}
                    />
                    <GameCard 
                        title="BREAKDANCE"
                        subtitle="Flow'unu göster"
                        accentColor="#ff6b00" // Vibrant Orange
                        icon={<BreakdanceIcon />}
                        bgIcon={<BreakdanceIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('flowbattle-solo')}
                    />
                    <GameCard 
                        title="RAP QUIZ"
                        subtitle="Kültür testi"
                        accentColor="#00ff66" // Spotify Green
                        badge="SIRALAMA MEVCUT"
                        badgeIcon={<CrownIcon className="w-3 h-3" />}
                        icon={<QuestionMarkIcon />}
                        bgIcon={<QuestionMarkIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('rapquiz')}
                    />
                    <GameCard 
                        title="REFLEX"
                        subtitle="Zamanlama testi"
                        accentColor="#ff008c" // Neon Pink
                        icon={<DiscIcon />}
                        bgIcon={<DiscIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('rhythm')}
                    />
                    <GameCard 
                        title="FREESTYLE"
                        subtitle="Çevrimdışı Kapışma"
                        accentColor="#a855f7" // Purple
                        badge="1V1"
                        icon={<MicIcon />}
                        bgIcon={<MicIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('freestyle')}
                    />
                    <GameCard 
                        title="FLAPPY DISC"
                        subtitle="Engelleri aş"
                        accentColor="#1ed760" // Original Spotify
                        icon={<DiscIcon />}
                        bgIcon={<DiscIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('flappydisk')}
                    />
                </>
            )}

            {mode === 'online' && (
                <div className={isOnlineLocked ? 'opacity-20 pointer-events-none filter blur-sm select-none' : ''}>
                    <GameCard 
                        title="BREAKDANCE BATTLE"
                        subtitle="Gerçek oyuncular"
                        accentColor="#ff4d00" // Fire Orange
                        badge="PVP"
                        icon={<BreakdanceIcon />}
                        bgIcon={<BreakdanceIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('flowbattle')}
                        disabled={isOnlineLocked}
                    />
                    <GameCard 
                        title="AŞAĞI / YUKARI"
                        subtitle="Tarihleri tahmin et"
                        accentColor="#0077ff" // Deep Blue
                        badge="PVP"
                        icon={<ArrowUpDownIcon />}
                        bgIcon={<ArrowUpDownIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('higherlower')}
                        disabled={isOnlineLocked}
                    />
                    <GameCard 
                        title="RAPQUIZ BATTLE"
                        subtitle="Bilgi yarışı"
                        accentColor="#bf00ff" // Electric Purple
                        badge="PVP"
                        icon={<TrophyIcon />}
                        bgIcon={<TrophyIcon className="w-32 h-32" />}
                        onClick={() => onSelectGame('trivia')}
                        disabled={isOnlineLocked}
                    />
                </div>
            )}
        </div>
        
    </div>
  );
};
