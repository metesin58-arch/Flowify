import React from 'react';
import { PlayerStats } from '../types';

interface Props {
  player: PlayerStats;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ player, children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase">Cash</span>
          <span className="font-mono text-green-400 font-bold">${player.cash.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center">
           <span className="text-xs font-bold text-slate-500 uppercase">Fans</span>
           <span className="font-mono text-purple-400 font-bold">{player.monthly_listeners.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-500 uppercase">Energy</span>
          <div className="w-16 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }} 
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};