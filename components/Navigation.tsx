
import React from 'react';
import { TabType } from '../types';
import { HomeIcon, UsersIcon, DollarIcon, GameControllerIcon, GlobeIcon } from './Icons';
import { playClickSound } from '../services/sfx';

interface Props {
  activeTab: TabType;
  setTab: (t: TabType) => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, setTab }) => {
  
  const navItems = [
      // Changed Logic: activeBg applies when active, default color is text-neutral-500
      { id: 'hub', label: 'PROFİL', Icon: HomeIcon, activeBg: 'bg-yellow-500', activeShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]' }, 
      { id: 'arcade', label: 'ARCADE', Icon: GameControllerIcon, activeBg: 'bg-purple-600', activeShadow: 'shadow-[0_0_20px_rgba(147,51,234,0.6)]' }, 
      { id: 'online', label: 'ONLINE', Icon: GlobeIcon, activeBg: 'bg-blue-600', activeShadow: 'shadow-[0_0_20px_rgba(37,99,235,0.6)]' }, 
      { id: 'nightlife', label: 'CASINO', Icon: DollarIcon, activeBg: 'bg-[#1ed760]', activeShadow: 'shadow-[0_0_20px_rgba(30,215,96,0.6)]' }, 
      { id: 'social', label: 'SOSYAL', Icon: UsersIcon, activeBg: 'bg-pink-600', activeShadow: 'shadow-[0_0_20px_rgba(219,39,119,0.6)]' } 
  ];

  const handleTabClick = (id: TabType) => {
      playClickSound();
      setTab(id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        {/* Lighter bg color, less blur (backdrop-blur-sm -> backdrop-blur-[2px] and slightly less opaque bg) */}
        <div className="pointer-events-auto bg-[#141414]/90 backdrop-blur-[2px] border border-white/5 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.8)] flex justify-between items-center px-4 py-2 mb-6 w-full max-w-md mx-2 transition-all duration-300 ring-1 ring-white/5">
            {navItems.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id as TabType)}
                        className="flex flex-col items-center justify-center flex-1 relative min-w-[3rem]"
                    >
                        <div className={`p-2.5 rounded-full transition-all duration-300 ease-out ${
                            isActive 
                            ? `${tab.activeBg} text-white -translate-y-3 scale-110 ${tab.activeShadow}` 
                            : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                        }`}>
                            <tab.Icon className={`w-5 h-5`} />
                        </div>
                        
                        <span className={`text-[8px] font-black tracking-wider transition-all duration-300 absolute -bottom-1 whitespace-nowrap ${
                            isActive ? 'text-white opacity-100 translate-y-0' : 'text-neutral-600 opacity-0 translate-y-2'
                        }`}>
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </div>
    </div>
  );
};
