import React, { useMemo } from 'react';
import { PlayerStats, UpgradeItem } from '../types';
import { UPGRADES } from '../constants';
import { calculateUpgradeCost } from '../services/gameLogic';
import { SwordIcon, CoinIcon } from './Icons';

interface UpgradesProps {
  player: PlayerStats;
  ownedUpgrades: Record<string, number>;
  onBuy: (item: UpgradeItem, cost: number) => void;
}

export const Upgrades: React.FC<UpgradesProps> = ({ player, ownedUpgrades, onBuy }) => {
  
  return (
    <div className="bg-slate-900 border-t border-slate-700 h-1/2 overflow-y-auto pb-safe">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center mb-4 sticky top-0 bg-slate-900 z-10 py-2 border-b border-slate-800">
          <SwordIcon className="mr-2 text-emerald-500" /> 
          Equipment & Allies
        </h2>

        {UPGRADES.map((item) => {
          const count = ownedUpgrades[item.id] || 0;
          const cost = calculateUpgradeCost(item.baseCost, item.costMultiplier, count);
          const canAfford = player.cash >= cost;

          return (
            <button
              key={item.id}
              onClick={() => canAfford && onBuy(item, cost)}
              disabled={!canAfford}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                canAfford 
                  ? 'bg-slate-800 border-slate-600 active:scale-[0.98] hover:bg-slate-700' 
                  : 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-slate-200">{item.name} <span className="text-slate-500 text-xs ml-1">Lvl {count}</span></span>
                <span className="text-xs text-slate-400">{item.description} (+{item.effectBonus})</span>
              </div>
              
              <div className="flex flex-col items-end">
                <div className={`flex items-center font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                  <CoinIcon className="w-4 h-4 mr-1" />
                  {cost.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-400 font-mono">
                  +{item.effectBonus * (count + 1)} Effect
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="h-12"></div> {/* Spacer for safe area */}
      </div>
    </div>
  );
};