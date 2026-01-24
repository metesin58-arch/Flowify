
import React, { useEffect } from 'react';
import { PlayerStats } from '../types';
import { SpadeCardIcon, SwordIcon, PlayIcon, RocketIcon } from './Icons';
import { playClickSound, playMusic, playErrorSound } from '../services/sfx';
import { calculateLevel } from '../services/gameLogic';

interface Props {
    player: PlayerStats;
    onSelectGame: (game: 'battlebet' | 'blackjack' | 'zeppelin') => void;
}

interface GameCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    bgIcon: React.ReactNode;
    accentColor: string;
    badge?: string;
    onClick: () => void;
    disabled?: boolean;
}

const NightLifeCard: React.FC<GameCardProps> = ({ title, subtitle, description, icon, bgIcon, accentColor, badge, onClick, disabled }) => (
    <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`w-full group relative h-36 rounded-2xl overflow-hidden text-left transition-all duration-300 mb-4 border border-white/5 shadow-lg ${disabled ? 'cursor-default' : 'active:scale-[0.96] cursor-pointer'}`}
    >
        {/* Main Gradient Background */}
        <div
            className="absolute inset-0 z-0"
            style={{
                background: `linear-gradient(90deg, #050505 0%, #050505 30%, ${accentColor}25 100%)`
            }}
        ></div>

        {/* Decorative Large Background Icon */}
        <div className="absolute right-6 bottom-[-20px] opacity-[0.05] transform rotate-[10deg] scale-[2.8] z-10 transition-transform duration-700 group-hover:scale-[3.2] group-hover:rotate-[5deg]">
            {bgIcon}
        </div>

        {/* Main Content */}
        <div className="relative z-30 p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">

                    {/* Icon Container - Premium Black Gradient */}
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0 border border-white/10"
                        style={{ background: 'linear-gradient(135deg, #222 0%, #0a0a0a 100%)' }}
                    >
                        <div style={{ color: accentColor }}>
                            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7 filter drop-shadow-md' })}
                        </div>
                    </div>

                    <div className="min-w-0">
                        {badge && (
                            <div className="flex mb-1">
                                <span
                                    className="text-[7px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border"
                                    style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30`, color: accentColor }}
                                >
                                    {badge}
                                </span>
                            </div>
                        )}
                        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">
                            {title}
                        </h2>
                        <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.15em] group-hover:text-white transition-colors">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Play Action */}
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
                    <PlayIcon className="w-3 h-3 text-white group-hover:text-black transition-colors ml-0.5" />
                </div>
            </div>

            <p className="text-neutral-400 text-[10px] font-medium leading-relaxed max-w-[85%] line-clamp-2 mt-1">
                {description}
            </p>
        </div>
    </button>
);

export const NightLife: React.FC<Props> = ({ player, onSelectGame }) => {
    const currentLevel = calculateLevel(player.monthly_listeners);
    // Casino Unlocks at Level 5
    const isLocked = currentLevel < 5;

    useEffect(() => {
        playMusic();
    }, []);

    const handleLockedClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        playErrorSound();
    };

    return (
        <div className="h-full w-full bg-black relative flex flex-col">

            {/* Background Atmosphere */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] bg-green-900/10 rounded-full blur-[180px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-emerald-900/10 rounded-full blur-[150px]"></div>
            </div>

            {/* Header Section - Fixed */}
            <div
                className="px-6 mb-4 relative z-30 shrink-0 pb-4 border-b border-white/5 bg-gradient-to-b from-black via-black/95 to-transparent"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.5em]">
                        HIGH STAKES ONLY
                    </span>
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
                    CASINO
                </h1>
            </div>

            {/* Game List - Internal Scrolling */}
            <div className="flex-1 overflow-y-auto px-6 relative z-20 pb-32 pt-2 custom-scrollbar">

                {/* LOCKED OVERLAY */}
                {isLocked && (
                    <div
                        onClick={handleLockedClick}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in"
                    >
                        <div className="bg-[#121212]/90 border border-emerald-500/20 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden max-w-sm w-full">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

                            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 border-2 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                <div className="text-4xl">🔒</div>
                            </div>

                            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2 uppercase">VIP GİRİŞİ</h2>
                            <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Sadece profesyonel oyuncular</p>

                            <div className="bg-emerald-600 text-white font-black px-6 py-3 rounded-xl uppercase tracking-[0.2em] text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                                SEVİYE 5 GEREKLİ
                            </div>

                            <div className="mt-6 text-[9px] text-neutral-500 font-bold leading-relaxed uppercase">
                                Fan kitleni büyüt ve<br />
                                <span className="text-emerald-400">SEVİYE ATLA</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className={isLocked ? 'opacity-20 pointer-events-none filter blur-sm select-none' : ''}>
                    <NightLifeCard
                        title="BATTLE BET"
                        subtitle="DÜELLO TAHMİNİ"
                        description="İki underground MC kapışır, sen kazananı tahmin edersin. Oranları takip et, doğru tarafa oyna."
                        accentColor="#f97316" // Orange
                        badge="POPÜLER"
                        icon={<SwordIcon />}
                        bgIcon={<div className="text-[120px] font-black italic text-white/5 select-none -rotate-12">VS</div>}
                        onClick={() => { playClickSound(); onSelectGame('battlebet'); }}
                        disabled={isLocked}
                    />

                    <NightLifeCard
                        title="ZEPPELIN"
                        subtitle="CRASH OYUNU"
                        description="Çarpan yükselirken, patlamadan önce paranı çek. Ne kadar yükseğe çıkarsan o kadar çok kazanırsın."
                        accentColor="#3b82f6" // Blue
                        badge="YENİ"
                        icon={<RocketIcon />}
                        bgIcon={<RocketIcon className="w-32 h-32" />}
                        onClick={() => { playClickSound(); onSelectGame('zeppelin'); }}
                        disabled={isLocked}
                    />

                    <NightLifeCard
                        title="BLACKJACK"
                        subtitle="KASAYA KARŞI"
                        description="Klasik 21 oyunu rap tarzıyla yenilendi. Kartları çek, 21'e yaklaş ve kasayı batır."
                        accentColor="#00ff95" // Neon Emerald
                        badge="CASINO"
                        icon={<SpadeCardIcon />}
                        bgIcon={<SpadeCardIcon className="w-32 h-32" />}
                        onClick={() => { playClickSound(); onSelectGame('blackjack'); }}
                        disabled={isLocked}
                    />
                </div>

            </div>
        </div>
    );
};
