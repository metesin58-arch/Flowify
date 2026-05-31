import React, { useState } from 'react';
import { PlayerStats } from '../../types';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  spendEnergy: (amount: number) => boolean;
}

export const Street: React.FC<Props> = ({ player, updateStat, spendEnergy }) => {
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isBattling, setIsBattling] = useState(false);

  const startBattle = () => {
    if (player.energy < 15) return;
    if (!spendEnergy(15)) return;

    setIsBattling(true);
    setBattleLog(["Looking for opponent..."]);

    setTimeout(() => {
      setBattleLog(prev => [...prev, "Found MC Rat! Battle starting..."]);
      
      setTimeout(() => {
        setBattleLog(prev => [...prev, "You dropped some bars..."]);
        
        setTimeout(() => {
          // Simple win logic
          const playerPower = player.flow + player.lyrics + (Math.random() * 10);
          const enemyPower = 10 + (player.battlesWon * 2) + (Math.random() * 10);
          
          if (playerPower > enemyPower) {
             setBattleLog(prev => [...prev, "🔥 CROWD GOES WILD! YOU WON!"]);
             updateStat('battlesWon', 1);
             updateStat('monthly_listeners', 20);
             updateStat('cash', 15);
             updateStat('charisma', 1);
          } else {
             setBattleLog(prev => [...prev, "💀 You choked... You lost."]);
             updateStat('monthly_listeners', -5);
          }
          setIsBattling(false);
        }, 1500);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-slate-900 rounded-xl p-6 mb-4 border border-slate-800 text-center">
        <h2 className="text-2xl font-black text-white mb-2">STREET BATTLES</h2>
        <div className="text-4xl mb-4">🎤 vs 🐀</div>
        <button
          onClick={startBattle}
          disabled={isBattling || player.energy < 15}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 disabled:grayscale transition-all"
        >
          {isBattling ? 'Battling...' : 'Find Battle (-15 NRG)'}
        </button>
      </div>

      <div className="flex-1 bg-black rounded-xl p-4 font-mono text-sm text-green-400 overflow-y-auto border border-slate-800 min-h-[200px]">
        {battleLog.length === 0 ? (
          <span className="text-slate-600">Battle logs will appear here...</span>
        ) : (
          battleLog.map((log, i) => (
            <div key={i} className="mb-2 animate-pulse">{`> ${log}`}</div>
          ))
        )}
      </div>
    </div>
  );
};