
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, PlayerStats } from '../types';
import { HomeIcon, UsersIcon, DollarIcon, GameControllerIcon, GlobeIcon } from './Icons';
import { Avatar } from './Avatar';
import { playClickSound } from '../services/sfx';

interface Props {
  activeTab: TabType;
  setTab: (t: TabType) => void;
  player?: PlayerStats | null;
}

export const Navigation: React.FC<Props> = ({ activeTab, setTab, player }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const navItems = [
      { id: 'hub', label: 'Profil', Icon: HomeIcon }, 
      { id: 'arcade', label: 'Arcade', Icon: GameControllerIcon }, 
      { id: 'online', label: 'Arena', Icon: GlobeIcon }, 
      { id: 'nightlife', label: 'Casino', Icon: DollarIcon }, 
      { id: 'social', label: 'Sosyal', Icon: UsersIcon } 
  ];

  const tabColors: Record<string, { bgGlow: string; borderGlow: string; activeColor: string }> = {
    hub: {
      bgGlow: 'rgba(250, 204, 21, 0.12)',
      borderGlow: 'rgba(250, 204, 21, 0.3)',
      activeColor: '#FACC15' // Profile yellow
    },
    arcade: {
      bgGlow: 'rgba(168, 85, 247, 0.12)',
      borderGlow: 'rgba(168, 85, 247, 0.3)',
      activeColor: '#A855F7' // Arcade purple
    },
    online: {
      bgGlow: 'rgba(59, 130, 246, 0.12)',
      borderGlow: 'rgba(59, 130, 246, 0.3)',
      activeColor: '#3B82F6' // Arena blue
    },
    nightlife: {
      bgGlow: 'rgba(29, 185, 84, 0.12)',
      borderGlow: 'rgba(29, 185, 84, 0.3)',
      activeColor: '#1DB954' // Casino green
    },
    social: {
      bgGlow: 'rgba(244, 63, 94, 0.12)',
      borderGlow: 'rgba(244, 63, 94, 0.3)',
      activeColor: '#F43F5E' // Social pink/rose
    }
  };

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
                const colors = tabColors[tab.id] || tabColors.hub;
                const isSocialAndHasAvatar = tab.id === 'social' && player?.appearance;

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
                                style={{
                                    backgroundColor: colors.bgGlow,
                                    borderColor: colors.borderGlow,
                                    boxShadow: `0 0 15px ${colors.bgGlow}, inset 0 1px 1px rgba(255,255,255,0.06)`
                                }}
                                className="absolute inset-y-1 inset-x-1 rounded-2xl z-0 border"
                                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            />
                        )}

                        <motion.div 
                            animate={{
                                scale: isActive ? (isDragging ? 1.08 : 1.03) : 1,
                            }}
                            className="relative z-10 flex flex-col items-center gap-0.5"
                        >
                            {isSocialAndHasAvatar ? (
                                <div 
                                    className="w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center bg-neutral-900/50 transition-all duration-300 relative"
                                    style={{ 
                                        borderColor: isActive ? colors.activeColor : 'rgba(255, 255, 255, 0.2)', 
                                        boxShadow: isActive ? `0 0 10px ${colors.bgGlow}` : 'none' 
                                    }}
                                >
                                    <div className="scale-[2.4] translate-y-[4.5px] pointer-events-none select-none">
                                        <Avatar 
                                            appearance={player.appearance} 
                                            gender={player.gender} 
                                            size={24} 
                                            headOnly={true} 
                                            className="pointer-events-none select-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <tab.Icon 
                                    className="w-5.2 h-5.2 transition-all duration-300" 
                                    style={{ color: isActive ? colors.activeColor : '#6b7280' }}
                                />
                            )}
                            <span 
                                className="text-[9px] font-bold tracking-tight transition-all duration-300 lowercase"
                                style={{ color: isActive ? colors.activeColor : '#6b7280' }}
                            >
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
