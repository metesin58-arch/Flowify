
import React from 'react';
import { PlayerStats, UpgradeItem } from '../../types';

interface Props {
  player: PlayerStats;
  items: UpgradeItem[];
  spendCash: (amount: number) => boolean;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
}

export const Shop: React.FC<Props> = ({ player, items, spendCash, updateStat }) => {
  
  const handleBuy = (item: UpgradeItem) => {
    if (spendCash(item.baseCost)) {
      if (item.skillAffected) {
        updateStat(item.skillAffected, item.effectBonus);
      }
      alert(`Bought ${item.name}!`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold uppercase text-slate-500 px-2">Equipment</h2>
      
      {items.map((item) => (
        <div key={item.id} className="bg-slate-900 p-4 rounded-xl flex justify-between items-center border border-slate-800">
          <div>
            <h3 className="font-bold text-white">{item.name}</h3>
            <p className="text-xs text-slate-400">{item.description}</p>
          </div>
          <button
            onClick={() => handleBuy(item)}
            disabled={player.cash < item.baseCost}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${
              player.cash >= item.baseCost 
                ? 'bg-green-600 text-white hover:bg-green-500' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            ${item.baseCost}
          </button>
        </div>
      ))}
    </div>
  );
};
