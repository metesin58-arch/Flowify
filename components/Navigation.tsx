
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from '../types';
import { HomeIcon, UsersIcon, DollarIcon, GameControllerIcon, GlobeIcon } from './Icons';
import { playClickSound } from '../services/sfx';

interface Props {
  activeTab: TabType;
  setTab: (t: TabType) => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, setTab }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const navItems = [
      { id: 'hub', label: 'Profil', Icon: HomeIcon }, 
      { id: 'arcade', label: 'Arcade', Icon: GameControllerIcon }, 
      { id: 'online', label: 'Arena', Icon: GlobeIcon }, 
      { id: 'nightlife', label: 'Casino', Icon: DollarIcon }, 
      { id: 'social', label: 'Sosyal', Icon: UsersIcon } 
  ];

  const handleTabClick = (id: TabType) => {
      playClickSound();
      setTab(id);
  };

  const handleDragUpdate = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const width = rect.width;
      
      if (width > 0 && relativeX >= 0 && relativeX <= width) {
          const itemWidth = width / navItems.length;
          const index = Math.floor(relativeX / itemWidth);
          const safeIndex = Math.max(0, Math.min(navItems.length - 1, index));
          const targetTab = navItems[safeIndex].id as TabType;
          
          if (targetTab !== activeTab) {
              setTab(targetTab);
              playClickSound();
          }
      }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true);
      handleDragUpdate(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleDragUpdate(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
  };

  // Pointer/Mouse handlers for desktop simulation
  const handlePointerDown = (e: React.PointerEvent) => {
      if (e.button === 0) { // Primary click only
          e.currentTarget.setPointerCapture(e.pointerId);
          setIsDragging(true);
          handleDragUpdate(e.clientX);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      handleDragUpdate(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (isDragging) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setIsDragging(false);
      }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none flex justify-center px-4 pb-[calc(1.2rem+env(safe-area-inset-bottom))] pt-10 bg-gradient-to-t from-black via-black/30 to-transparent">
        {/* iOS Liquid Glass Pill Navigation Bar */}
        <div 
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto flex justify-around items-center px-2 py-1.5 w-full max-w-sm mx-auto rounded-[2rem] bg-neutral-950/75 backdrop-blur-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.85),_inset_0_1px_1px_rgba(255,255,255,0.1)] relative select-none"
        >
            {navItems.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id as TabType)}
                        className="flex flex-col items-center justify-center flex-1 relative py-2.5 h-14 rounded-2xl select-none outline-none"
                    >
                        {/* Smooth active glass/glow bubble backdrop */}
                        {isActive && (
                            <motion.div 
                                layoutId="nav-active-bubble"
                                className={`absolute inset-y-1 inset-x-1 rounded-2xl z-0 transition-colors duration-200 ${
                                    isDragging 
                                    ? 'bg-[#1ed760]/12 border border-[#1ed760]/30 shadow-[0_0_15px_rgba(30,215,96,0.2)]' 
                                    : 'bg-white/[0.08] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),_0_8px_20px_rgba(0,0,0,0.4)]'
                                }`}
                                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            />
                        )}

                        <motion.div 
                            animate={{
                                scale: isActive ? (isDragging ? 1.08 : 1.03) : 1,
                                color: isActive ? '#FFFFFF' : '#8a8a8a'
                            }}
                            className="relative z-10 flex flex-col items-center gap-0.5"
                        >
                            <tab.Icon className={`w-5.5 h-5.5 transition-all duration-300 ${isActive ? (isDragging ? 'text-[#1ed760]' : 'text-white') : 'text-neutral-500'}`} />
                            <span className={`text-[9px] font-bold tracking-tight transition-all duration-300 lowercase ${
                                isActive ? (isDragging ? 'text-[#1ed760]' : 'text-white') : 'text-neutral-500'
                            }`}>
                                {tab.label}
                            </span>
                        </motion.div>
                    </button>
                )
            })}
        </div>
    </div>
  );
};
