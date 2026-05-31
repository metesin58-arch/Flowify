import React, { useState, useEffect } from 'react';
import { PlayerStats, CharacterAppearance } from '../types';
import { Avatar } from './Avatar';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { IAPTab } from './IAPStore';
import { useGameUI } from '../context/UIContext';
import { ArrowLeftIcon, SparklesIcon } from './Icons';

// --- SHOP DATA ---
const CAREER_SHOP_ITEMS = [
  // --- CLOTHING (Upper Body) ---
  { id: 'cloth_2', name: 'Şişme Mont', price: 45000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 2, rarity: 'rare' },
  { id: 'cloth_3', name: 'Oduncu Gömlek', price: 35000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 3, rarity: 'common' },
  { id: 'cloth_4', name: 'Basket Forması', price: 60000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 4, rarity: 'epic' },
  { id: 'cloth_5', name: 'Deri Ceket', price: 120000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 5, rarity: 'legendary' },
  { id: 'cloth_6', name: 'Techwear Yelek', price: 90000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 6, rarity: 'epic' },
  { id: 'cloth_7', name: 'Sago Kapüşonlu', price: 110000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 7, rarity: 'legendary' },
  { id: 'cloth_8', name: 'Gümüş Puffer', price: 130000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 8, rarity: 'epic' },
  { id: 'cloth_9', name: '90lar Retro', price: 75000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 9, rarity: 'rare' },
  { id: 'cloth_10', name: 'Firavun Forma', price: 150000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 10, rarity: 'legendary' },

  // --- HATS ---
  { id: 'hat_2', name: 'Bucket Şapka', price: 15000, category: 'lifestyle', type: 'appearance', subType: 'hat', index: 2, rarity: 'common' },
  { id: 'hat_3', name: 'Pembe Toka', price: 2500, category: 'lifestyle', type: 'appearance', subType: 'hat', index: 3, rarity: 'common' },

  // --- CHAINS ---
  { id: 'chain_2', name: 'Kalın Zincir', price: 40000, category: 'lifestyle', type: 'appearance', subType: 'chain', index: 2, rarity: 'rare' },
  { id: 'chain_3', name: 'Buzlu Zincir', price: 150000, category: 'lifestyle', type: 'appearance', subType: 'chain', index: 3, rarity: 'legendary' },
  { id: 'chain_4', name: 'İnci Kolye', price: 80000, category: 'lifestyle', type: 'appearance', subType: 'chain', index: 4, rarity: 'epic' },
  { id: 'chain_5', name: 'Halat Zincir', price: 60000, category: 'lifestyle', type: 'appearance', subType: 'chain', index: 5, rarity: 'rare' },

  // --- HEADS ---
  { id: 'head_2', name: 'LVBEL C5', price: 50000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 2, rarity: 'epic' },
  { id: 'head_3', name: 'TRAP LORD', price: 50000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 3, rarity: 'epic' },
  { id: 'head_4', name: 'M0T1V3', price: 65000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 4, rarity: 'epic' },
  { id: 'head_5', name: 'K0L0', price: 65000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 5, rarity: 'epic' },
  { id: 'head_6', name: 'C3ZA', price: 80000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 6, rarity: 'legendary' },
  { id: 'head_7', name: 'SAGO K.', price: 100000, category: 'lifestyle', type: 'appearance', subType: 'head', index: 7, rarity: 'legendary' },
];

interface StyleShopProps {
    player: PlayerStats;
    updateMultipleStats: (updates: Partial<PlayerStats>) => void;
    onBack: () => void;
    onOpenShop: (tab: IAPTab) => void;
}

export const StyleShop: React.FC<StyleShopProps> = ({ player, updateMultipleStats, onBack, onOpenShop }) => {
    const [shopCategory, setShopCategory] = useState<'head' | 'clothing' | 'hat' | 'chain'>('head');
    const [previewAppearance, setPreviewAppearance] = useState<CharacterAppearance>(player.appearance);
    const { showToast, showConfirm } = useGameUI();

    useEffect(() => {
        setPreviewAppearance(player.appearance);
    }, [player.appearance]);

    // Helper map function to resolve property name mapping
    const getAppearanceKey = (subType: string): keyof CharacterAppearance => {
        if (subType === 'clothing') return 'clothingStyle';
        return `${subType}Index` as keyof CharacterAppearance;
    };

    const isItemOwned = (subType: string, index: number) => {
        if (index < 2 && subType !== 'head' && subType !== 'hat' && subType !== 'chain') return true;
        if (index < 2 && subType === 'head') return true;
        if (index === 0 && (subType === 'hat' || subType === 'chain')) return true;
        if (index === 1 && (subType === 'hat' || subType === 'chain')) return true;
        const key = `${subType}_${index}`;
        return player.ownedUpgrades?.[key] > 0;
    };

    const handleItemClick = (item: any) => {
        const owned = isItemOwned(item.subType, item.index);
        const appearanceKey = getAppearanceKey(item.subType);
        
        setPreviewAppearance(prev => ({ ...prev, [appearanceKey]: item.index }));
        playClickSound();

        if (owned) {
            updateMultipleStats({ 
                appearance: { 
                    ...player.appearance, 
                    [appearanceKey]: item.index 
                } 
            });
            showToast(`${item.name.toLowerCase()} kuşanıldı.`, 'info');
        } else {
            showConfirm(
                "satın al.",
                `${item.name.toLowerCase()} eşyasını ₺${item.price.toLocaleString()} karşılığında satın almak istiyor musun?`,
                () => {
                    if (player.careerCash >= item.price) {
                        const upgradeKey = `${item.subType}_${item.index}`;
                        updateMultipleStats({
                            careerCash: -item.price,
                            ownedUpgrades: { ...player.ownedUpgrades, [upgradeKey]: 1 },
                            appearance: { ...player.appearance, [appearanceKey]: item.index }
                        });
                        playWinSound();
                        showToast(`${item.name.toLowerCase()} gardırobuna eklendi!`, 'success');
                    } else {
                        playErrorSound();
                        showToast(`yetersiz bakiye. markete yönlendiriliyorsunuz.`, 'error');
                        onOpenShop('currency');
                    }
                }
            );
        }
    };

    const categories = [
        { id: 'head', label: 'tüm kafalar.', icon: '👤' },
        { id: 'clothing', label: 'giyim.', icon: '👕' },
        { id: 'hat', label: 'şapka.', icon: '🧢' },
        { id: 'chain', label: 'zincir.', icon: '⛓️' },
    ];

    const getRarityBadgeStyle = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'epic': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'rare': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const getCardStyle = (rarity: string, isEquipped: boolean) => {
        let base = 'relative p-3.5 rounded-3xl border transition-all text-left flex flex-col justify-between items-center h-[230px] group ';
        if (isEquipped) {
            base += 'bg-gradient-to-b from-[#1DB954]/5 to-black border-[#1DB954] shadow-[0_0_20px_rgba(29,185,84,0.15)] ';
        } else {
            base += 'bg-[#0a0a0a]/80 border-white/[0.04] hover:bg-neutral-900/60 hover:border-white/[0.08] ';
        }

        switch (rarity) {
            case 'legendary': base += 'hover:shadow-[0_0_20px_rgba(234,179,8,0.08)]'; break;
            case 'epic': base += 'hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]'; break;
            case 'rare': base += 'hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]'; break;
            default: base += 'hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]'; break;
        }

        return base;
    };

    return (
        <div className="h-full bg-[#030303] flex flex-col font-sans text-white animate-fade-in relative overflow-hidden">
            {/* Header / Interactive Stage Area */}
            <div className="relative shrink-0 h-[290px] flex flex-col items-center justify-center p-6 border-b border-white/5 bg-[#030303]">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_60%)] animate-pulse-slow"></div>
                </div>
                
                {/* Visual Showroom Pedestal */}
                <div className="absolute bottom-[20px] w-36 h-4 bg-indigo-500/10 rounded-full blur-[3px] filter border border-indigo-500/20"></div>

                <div className="relative z-10 scale-[1.35] transform origin-bottom translate-y-[-10px] drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)]">
                    <Avatar appearance={previewAppearance} gender={player.gender} size={180} />
                </div>

                {/* Back button */}
                <button 
                    onClick={onBack}
                    className="absolute top-6 left-6 w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all z-20"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                </button>

                {/* Cash Balance */}
                <div className="absolute top-6 right-6 bg-[#0a0a0a] border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-2xl z-20">
                    <span className="text-indigo-400 font-black text-xs">₺</span>
                    <span className="text-xs font-black tracking-tight tabular-nums text-white">{player.careerCash.toLocaleString()}</span>
                </div>

                <div className="absolute bottom-4 left-6 flex items-center gap-1.5 text-neutral-500 text-[9px] font-extrabold lowercase">
                    <SparklesIcon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>gardırobun.</span>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto px-6 py-4 gap-2.5 no-scrollbar border-b border-white/5 scroll-smooth shrink-0 bg-[#030303] backdrop-blur-md">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { playClickSound(); setShopCategory(cat.id as any); }}
                        className={`px-4.5 py-2.5 rounded-2xl text-[11px] font-black lowercase tracking-tight transition-all shrink-0 border duration-150 ${
                            shopCategory === cat.id 
                            ? 'bg-white text-black border-white font-black shadow-lg scale-[1.01]' 
                            : 'bg-[#0a0a0a] text-neutral-400 border-white/5 hover:text-white'
                        }`}
                    >
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-48 custom-scrollbar bg-[#030303]">
                {CAREER_SHOP_ITEMS.filter(i => i.subType === shopCategory).map(item => {
                    const owned = isItemOwned(item.subType, item.index);
                    const appearanceKey = getAppearanceKey(item.subType);
                    const isEquipped = player.appearance[appearanceKey] === item.index;

                    // Compute dynamic model appearance variables to render properly in the small card
                    const customPreviewAppearance = (() => {
                        const baseObj = { ...player.appearance };
                        if (item.subType === 'head') baseObj.headIndex = item.index;
                        else if (item.subType === 'clothing') baseObj.clothingStyle = item.index;
                        else if (item.subType === 'hat') baseObj.hatIndex = item.index;
                        else if (item.subType === 'chain') baseObj.chainIndex = item.index;
                        return baseObj;
                    })();

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`relative p-4 rounded-[2rem] border transition-all text-left flex flex-col justify-between items-center h-[260px] group overflow-hidden ${
                                isEquipped 
                                ? 'bg-indigo-500/[0.04] border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]' 
                                : 'bg-[#0a0a0a]/50 border-white/5 hover:bg-[#111111]/80 hover:border-white/10 shadow-sm'
                            }`}
                        >
                            {/* Card Header Info */}
                            <div className="w-full flex items-center justify-between z-10">
                                <span className={`text-[8px] font-black tracking-widest uppercase border px-2 py-0.5 rounded-full ${getRarityBadgeStyle(item.rarity)}`}>
                                    {item.rarity}
                                </span>
                                {isEquipped && (
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
                                )}
                            </div>

                            {/* Crisp Portrait View with Spotlight circle for maximum head visibility */}
                            <div className="flex-1 w-full flex items-center justify-center relative my-2 min-h-0">
                                <div className="absolute inset-0 bg-[#0d0d0d] rounded-[1.5rem] border border-white/5 opacity-80 z-0"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_65%)] group-hover:scale-110 transition-transform duration-300 z-0"></div>
                                
                                <div className={`origin-center z-10 transition-transform duration-300 ${
                                    item.subType === 'head' 
                                    ? 'scale-[1.5] translate-y-2 group-hover:scale-[1.6]' 
                                    : 'scale-[1.1] translate-y-2 group-hover:scale-[1.15]'
                                }`}>
                                    <Avatar 
                                        headOnly={item.subType !== 'clothing'} 
                                        appearance={customPreviewAppearance} 
                                        gender={player.gender} 
                                        size={item.subType === 'head' ? 120 : 130} 
                                    />
                                </div>
                            </div>

                            {/* Card Footer Details */}
                            <div className="w-full flex flex-col items-center justify-center mt-3 text-center z-10 shrink-0">
                                <h4 className="text-[11px] font-extrabold text-white tracking-tight leading-none lowercase truncate w-full max-w-[120px] mb-2.5 group-hover:text-indigo-400 transition-colors">
                                    {item.name}
                                </h4>
                                
                                <div className="flex items-center justify-center">
                                    {owned ? (
                                        <span className={`text-[9px] font-black tracking-tight leading-none lowercase ${isEquipped ? 'text-indigo-400 font-extrabold' : 'text-neutral-500'}`}>
                                            {isEquipped ? 'kuşanıldı.' : 'gardıropta.'}
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1 font-semibold leading-none shadow-sm">
                                            <span className="text-indigo-400 text-[9px] font-black">₺</span>
                                            <span className="text-[10px] font-black tracking-tight tabular-nums text-white">{item.price.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
