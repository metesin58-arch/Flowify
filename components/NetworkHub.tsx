
import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { SocialHub } from './SocialHub';
import { MessagingApp } from './MessagingApp';
import { GlobeIcon, MicIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { HEAD_OPTIONS } from '../constants';

interface NetworkHubProps {
  player: PlayerStats;
  uid: string;
  updateMultipleStats: (updates: Partial<PlayerStats>) => void;
  updateStat: (key: keyof PlayerStats, val: any) => void;
  onOpenShop?: (tab: string) => void;
  onClose?: () => void;
}

type NetworkTab = 'artists' | 'messages';

export const NetworkHub: React.FC<NetworkHubProps> = ({
  player,
  uid,
  updateMultipleStats,
  updateStat,
  onOpenShop,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<NetworkTab>('artists');

  const tabs = [
    { id: 'artists', label: 'sanatçılar', icon: <GlobeIcon /> },
    { id: 'messages', label: 'mesajlar', icon: <MicIcon /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'artists':
        return <SocialHub player={player} uid={uid} />;
      case 'messages':
        return <MessagingApp player={player} updateMultipleStats={updateMultipleStats} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden font-sans pt-16 pb-safe">
      {/* Network Header */}
      <div className="shrink-0 pt-6 pb-4 px-6 bg-black border-b border-white/5 font-sans">
        <div className="flex flex-col gap-5">
          {onClose && (
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-neutral-500 tracking-tight lowercase">online hub lirik lobisi.</span>
              </div>
              <h1 className="text-3.5xl font-black text-white tracking-tighter lowercase leading-none">sosyal ağ<span className="text-purple-500">.</span></h1>
            </div>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NetworkTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition-all whitespace-nowrap flex items-center gap-1.5 border lowercase ${
                activeTab === tab.id 
                ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.15)] font-black' 
                : 'bg-[#0a0a0a] text-neutral-400 border-white/5 hover:text-white hover:bg-[#111]'
              }`}
            >
              <div className="w-3.5 h-3.5 opacity-80">
                {React.cloneElement(tab.icon as React.ReactElement, { className: "w-full h-full" })}
              </div>
              {tab.label}.
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
