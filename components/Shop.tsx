
import React from 'react';
import { PlayerStats, UpgradeItem } from '../types';
import { calculateUpgradeCost } from '../services/gameLogic';
import { CoinIcon } from './Icons';
import { useGameUI } from '../context/UIContext';

interface Props {
  player: PlayerStats;
  items: UpgradeItem[];
  owned: Record<string, number>;
  onBuy: (item: UpgradeItem) => void;
}

export const Shop: React.FC<Props> = ({ player, items, owned, onBuy }) => {
  const { showConfirm, showToast } = useGameUI();

  const handleItemClick = (item: UpgradeItem, cost: number) => {
      if (player.cash < cost) {
          showToast(`Yetersiz Bakiye! ₺${(cost - player.cash).toLocaleString()} gerekli.`, 'error');
          return;
      }

      // Consumables are instant, equipment/marketing needs confirm
      if (item.type === 'consumable') {
          onBuy(item);
      } else {
          showConfirm(
              "SATIN ALMA",
              `${item.name} ürününü ₺${cost.toLocaleString()} karşılığında satın almak istiyor musun?`,
              () => onBuy(item)
          );
      }
  };

  return (
    <div className="h-full bg-[#111] flex flex-col pt-24 pb-24">
        
        {/* Header & Balance */}
        <div className="px-6 mb-6 flex justify-between items-end border-b border-white/10 pb-4">
            <h1 className="text-3xl font-black text-white">MAĞAZA</h1>
            <div className="text-green-400 font-mono font-bold text-xl flex items-center gap-1">
                <CoinIcon className="w-5 h-5" />
                {player.cash.toLocaleString()}
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
            {items.map((item) => {
                const count = owned[item.id] || 0;
                const cost = calculateUpgradeCost(item.baseCost, item.costMultiplier, count);
                const canAfford = player.cash >= cost;
                
                const isConsumable = item.type === 'consumable';
                // Verified badge is one-time purchase
                const isOneTime = item.costMultiplier === 1 && !isConsumable;
                const isOwned = isOneTime && count > 0;

                return (
                    <div key={item.id} className="bg-[#181818] p-4 rounded-xl flex items-center justify-between border border-white/5 transition-transform active:scale-[0.99]">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-2xl relative overflow-hidden ${item.id === 'verified_badge' ? 'border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}>
                                {item.iconName === 'book' && '📓'}
                                {item.iconName === 'mic' && '🎤'}
                                {item.iconName === 'clock' && '⏰'}
                                {item.iconName === 'users' && '🤖'}
                                {item.iconName === 'energy' && '⚡'}
                                {item.iconName === 'verified' && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                                        <path d="M12 2L15 6H19V10L22 12L19 14V18H15L12 22L9 18H5V14L2 12L5 10V6H9L12 2Z" fill="#3b82f6"/>
                                        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${item.id === 'verified_badge' ? 'text-blue-400' : 'text-white'}`}>{item.name}</h3>
                                <p className="text-xs text-neutral-500">{item.description}</p>
                                {!isConsumable && !isOneTime && <div className="text-[10px] text-green-500 mt-1">Seviye: {count}</div>}
                            </div>
                        </div>

                        {isOwned ? (
                            <button disabled className="px-4 py-2 rounded-lg font-bold text-xs bg-[#222] text-green-500 flex items-center gap-1 opacity-50 border border-white/5">
                                ✓ ALINDI
                            </button>
                        ) : (
                            <button
                                onClick={() => handleItemClick(item, cost)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                                    canAfford 
                                    ? 'bg-white text-black hover:bg-neutral-200 active:scale-95' 
                                    : 'bg-[#222] text-neutral-600 cursor-not-allowed'
                                }`}
                            >
                                <span>₺{cost.toLocaleString()}</span>
                                <span className="text-[10px] uppercase ml-1">
                                    {isConsumable ? 'İÇ' : 'AL'}
                                </span>
                            </button>
                        )}
                    </div>
                );
            })}
            
            {items.length === 0 && (
                <div className="text-center text-neutral-500 text-sm py-10">Bu kategoride ürün yok.</div>
            )}
        </div>
    </div>
  );
};
