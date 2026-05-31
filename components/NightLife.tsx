
import React, { useEffect } from 'react';
import { PlayerStats } from '../types';
import { SpadeCardIcon, SwordIcon, PlayIcon, RocketIcon, GlobeIcon } from './Icons';
import { playClickSound, playMusic, playErrorSound } from '../services/sfx';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  player: PlayerStats;
  onSelectGame: (game: 'battlebet' | 'blackjack' | 'zeppelin') => void;
  onPartnerAcquire: () => void;
  onClose?: () => void;
}

interface GameCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accentColor: string;
    onClick: () => void;
}

const NightLifeCard: React.FC<GameCardProps> = ({ title, subtitle, icon, accentColor, onClick }) => (
    <button 
        onClick={onClick}
        className="flex-1 group relative overflow-hidden bg-black/40 border-r border-white/5 last:border-r-0 hover:bg-neutral-900/10 transition-colors duration-500 flex flex-col items-center justify-center p-8 gap-8 select-none"
    >
        {/* Subtle hover blur glow */}
        <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-[80px] rounded-full scale-150"
            style={{ backgroundColor: accentColor }}
        />
        
        <div className="flex flex-col items-center gap-4 z-10 w-full">
            <div 
                className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 group-hover:rotate-[6deg] transition-all duration-500 shadow-2xl"
                style={{ backgroundColor: `${accentColor}12` }}
            >
                {React.cloneElement(icon as React.ReactElement<{ className?: string, style?: any }>, { className: 'w-6 h-6', style: { color: accentColor } })}
            </div>

            <div className="flex flex-col items-center">
                <h2 className="text-md font-bold text-white tracking-tight leading-none mb-1.5 lowercase">
                    {title.toLowerCase()}.
                </h2>
                <p className="text-neutral-500 text-[10px] font-semibold lowercase tracking-tight group-hover:text-neutral-300 transition-colors">
                    {subtitle.toLowerCase()}
                </p>
            </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-all shadow-2xl group-hover:bg-white/10 group-hover:scale-105 z-10">
            <PlayIcon className="w-3 h-3 text-white ml-0.5 fill-current" />
        </div>
    </button>
);

export const NightLife: React.FC<Props> = ({ player, onSelectGame, onPartnerAcquire, onClose }) => {
  useEffect(() => {
      playMusic();
  }, []);

  return (
    <div 
        className="h-full bg-black flex flex-col font-sans text-white relative overflow-hidden animate-fade-in"
    >
        {/* Falling Money Effect - Aligned and Consistent */}
        <div className="absolute inset-0 pointer-events-none z-0">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute text-2xl drop-shadow-[0_0_10px_rgba(29,185,84,0.4)] animate-fade-in"
                    style={{
                        left: `${(i / 12) * 100}%`,
                        top: '-100px',
                        animation: `money-fall ${4 + Math.random() * 2}s linear infinite`,
                        animationDelay: `${Math.random() * 4}s`
                    }}
                >
                    💵
                </div>
            ))}
        </div>

        {onClose && (
            <div className="absolute top-8 left-8 z-50">
                <button 
                  onClick={() => { playClickSound(); onClose(); }} 
                  className="bg-[#0a0a0a] text-neutral-400 w-10 h-10 rounded-full flex items-center justify-center border border-white/5 hover:text-white hover:scale-105 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
            </div>
        )}

        {/* Floating Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-8 pt-20 pointer-events-none z-20 flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-1 animate-fade-in">
                <span className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">flowify casino.</span>
                <h1 className="text-4xl font-black tracking-tighter leading-none text-white lowercase">gece hayatı<span className="text-[#1DB954]">.</span></h1>
            </div>
        </div>

        {/* Content - Curtain Style Adjacent Cards */}
        <div className="flex-1 flex z-10 pt-16">
            <div className="flex-1 flex items-stretch">

                <div className="flex-1 flex">
                    <NightLifeCard 
                        title="BATTLE BET" 
                        subtitle="DÜELLO" 
                        accentColor="#ef4444" 
                        icon={<SwordIcon />} 
                        onClick={() => { playClickSound(); onSelectGame('battlebet'); }} 
                    />
                </div>
                
                <div className="flex-1 flex">
                    <NightLifeCard 
                        title="BLACKJACK" 
                        subtitle="21 OYUNU" 
                        accentColor="#1DB954" 
                        icon={<SpadeCardIcon />} 
                        onClick={() => { playClickSound(); onSelectGame('blackjack'); }} 
                    />
                </div>
                
                <div className="flex-1 flex">
                    <NightLifeCard 
                        title="ZEPPELIN" 
                        subtitle="YÜKSELEN" 
                        accentColor="#6366f1" 
                        icon={<RocketIcon />} 
                        onClick={() => { playClickSound(); onSelectGame('zeppelin'); }} 
                    />
                </div>
            </div>
        </div>

        {/* Bottom Ambient Glow */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
};
