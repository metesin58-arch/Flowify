import React, { useState } from 'react';
import { PlayerStats } from '../../types';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  spendEnergy: (amount: number) => boolean;
}

export const Studio: React.FC<Props> = ({ player, updateStat, spendEnergy }) => {
  const [isProducing, setIsProducing] = useState(false);

  const handleTrain = (stat: keyof PlayerStats) => {
    if (spendEnergy(5)) {
      updateStat(stat, 1);
    }
  };

  const handleReleaseSong = () => {
    if (player.energy < 20) return;
    
    setIsProducing(true);
    // Simulate production time
    setTimeout(() => {
      if (spendEnergy(20)) {
        // Calculate earnings based on stats
        const quality = (player.flow + player.lyrics + player.rhythm) / 3;
        const cashEarned = Math.floor(quality * 5) + 50;
        const listenersEarned = Math.floor(player.charisma / 2) + 5;
        
        updateStat('songsReleased', 1);
        updateStat('cash', cashEarned);
        updateStat('monthly_listeners', listenersEarned);
        
        alert(`Song Released!\n💰 +$${cashEarned}\n🔥 +${listenersEarned} Listeners`);
      }
      setIsProducing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <h2 className="text-xl font-black italic relative z-10">THE BOOTH</h2>
        <p className="text-slate-400 text-sm mb-4 relative z-10">Train your skills to release better tracks.</p>
        
        <div className="grid grid-cols-3 gap-2 relative z-10">
          <TrainButton label="Flow" onClick={() => handleTrain('flow')} />
          <TrainButton label="Lyrics" onClick={() => handleTrain('lyrics')} />
          <TrainButton label="Rhythm" onClick={() => handleTrain('rhythm')} />
        </div>
      </div>

      <div className="border-t border-slate-800 pt-6">
        <h3 className="font-bold text-slate-300 mb-4">Production</h3>
        <button
          onClick={handleReleaseSong}
          disabled={isProducing || player.energy < 20}
          className={`w-full py-6 rounded-xl font-black text-xl uppercase tracking-widest transition-all ${
            isProducing 
              ? 'bg-slate-800 text-slate-500' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] shadow-lg shadow-purple-900/20'
          }`}
        >
          {isProducing ? 'Recording...' : 'Release Song'}
        </button>
        <p className="text-center text-xs text-slate-500 mt-2">Cost: 20 Energy</p>
      </div>
    </div>
  );
};

const TrainButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-xs uppercase tracking-wide border border-slate-700 active:scale-95 transition-transform"
  >
    Train {label}
    <span className="block text-[10px] text-slate-500 mt-1">-5 NRG</span>
  </button>
);