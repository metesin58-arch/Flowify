
import React, { useState, useEffect } from 'react';
import { PlayerStats, CharacterAppearance } from '../types';
import { Avatar } from './Avatar';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { IAPTab } from './IAPStore';
import { HEAD_OPTIONS, CLOTHING_STYLES, HAT_STYLES, CHAIN_STYLES } from '../constants';
import { useGameUI } from '../context/UIContext'; // Added for confirmation

// --- SHOP DATA ---
const CAREER_SHOP_ITEMS = [
  // --- CLOTHING (Upper Body) ---
  // 0: Tshirt (Free), 1: Hoodie (Free)
  { id: 'cloth_2', name: 'Şişme Mont', price: 45000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 2, rarity: 'rare' },
  { id: 'cloth_3', name: 'Oduncu Gömlek', price: 35000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 3, rarity: 'common' },
  { id: 'cloth_4', name: 'Basket Forması', price: 60000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 4, rarity: 'epic' },
  { id: 'cloth_5', name: 'Deri Ceket', price: 120000, category: 'lifestyle', type: 'appearance', subType: 'clothing', index: 5, rarity: 'legendary' },

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
    const [shopCategory, setShopCategory] = useState<'head' | 'gear'>('head');
    const [previewAppearance, setPreviewAppearance] = useState<CharacterAppearance>(player.appearance);
    const { showToast, showConfirm } = useGameUI(); // Use Confirmation

    // Sync preview when entering or when player appearance changes externally
    useEffect(() => {
        setPreviewAppearance(player.appearance);
    }, [player.appearance]);

    const getShopItem = (subType: string, index: number) => {
        return CAREER_SHOP_ITEMS.find(i => i.subType === subType && i.index === index);
    };

    const isItemOwned = (subType: string, index: number) => {
        // Basic free items
        if (index < 2 && subType !== 'head' && subType !== 'hat' && subType !== 'chain') return true; // Cloth 0,1 free
        if (index < 2 && subType === 'head') return true; // Head 0,1 free
        if (index === 0 && (subType === 'hat' || subType === 'chain')) return true; // Hat/Chain 0 free
        if (index === 1 && (subType === 'hat' || subType === 'chain')) return true; // Hat/Chain 1 free

        // Check purchase history
        const key = `${subType}_${index}`;
        return player.ownedUpgrades?.[key] > 0;
    };

    const handleHeadClick = (item: any) => {
        const owned = isItemOwned('head', item.index);
        
        // Always preview first
        setPreviewAppearance(prev => ({ ...prev, headIndex: item.index }));
        playClickSound();

        if (owned) {
            // If owned, equip immediately
            updateMultipleStats({ appearance: { ...player.appearance, headIndex: item.index } });
        } else {
            // If not owned, prompt to buy
            showConfirm(
                "SATIN ALMA",
                `${item.name} kafasını ₺${item.price.toLocaleString()} karşılığında satın almak istiyor musun?`,
                () => {
                    if (player.careerCash >= item.price) {
                        const upgradeKey = `head_${item.index}`;
                        updateMultipleStats({
                            careerCash: -item.price,
                            ownedUpgrades: { ...player.ownedUpgrades, [upgradeKey]: 1 },
                            appearance: { ...player.appearance, headIndex: item.index }
                        });
                        playWinSound();
                        showToast(`${item.name} satın alındı!`, 'success');
                    } else {
                        playErrorSound();
                        onOpenShop('currency');
                    }
                }
            );
        }
    };

    const cycleOption = (key: keyof CharacterAppearance, max: number, dir: 1 | -1) => {
        playClickSound();
        setPreviewAppearance(prev => {
            const current = prev[key] as number;
            const next = (current + dir + max) % max;
            return { ...prev, [key]: next };
        });
    };

    const handleApplyStyle = (subType: 'clothing' | 'head' | 'hat' | 'chain') => {
        const idxKey = subType === 'clothing' ? 'clothingStyle' : subType === 'head' ? 'headIndex' : `${subType}Index` as keyof CharacterAppearance;
        const currentIndex = previewAppearance[idxKey] as number;
        const shopItem = getShopItem(subType, currentIndex);
        const owned = isItemOwned(subType, currentIndex);

        if (owned) {
            // Equip
            updateMultipleStats({ appearance: previewAppearance });
            showToast("Stil güncellendi!", 'success');
        } else if (shopItem) {
            // Buy with confirmation
            showConfirm(
                "SATIN ALMA",
                `${shopItem.name} ürününü ₺${shopItem.price.toLocaleString()} karşılığında almak istiyor musun?`,
                () => {
                    if (player.careerCash >= shopItem.price) {
                        const upgradeKey = `${subType}_${currentIndex}`;
                        updateMultipleStats({
                            careerCash: -shopItem.price,
                            ownedUpgrades: { ...player.ownedUpgrades, [upgradeKey]: 1 },
                            appearance: previewAppearance
                        });
                        showToast(`${shopItem.name} satın alındı!`, 'success');
                        playWinSound();
                    } else {
                        onOpenShop('currency');
                    }
                }
            );
        }
    };

    const renderSelector = (label: string, key: keyof CharacterAppearance, max: number, subType: 'clothing' | 'hat' | 'chain') => {
        const currentIdx = previewAppearance[key] as number;
        const shopItem = getShopItem(subType, currentIdx);
        const owned = isItemOwned(subType, currentIdx);
        const labelName = shopItem ? shopItem.name : subType === 'clothing' ? CLOTHING_STYLES[currentIdx] : subType === 'hat' ? HAT_STYLES[currentIdx] : CHAIN_STYLES[currentIdx];

        return (
            <div className="bg-[#181818] p-3 rounded-xl border border-white/5 mb-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{label}</span>
                    {shopItem && !owned && <span className="text-yellow-400 text-xs font-mono font-bold">₺{shopItem.price.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between gap-4">
                    <button onClick={() => cycleOption(key, max, -1)} className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/20 active:scale-95">‹</button>
                    <div className="flex-1 text-center">
                        <span className={`text-xs font-bold uppercase ${shopItem && !owned ? 'text-neutral-300' : 'text-white'}`}>{labelName}</span>
                    </div>
                    <button onClick={() => cycleOption(key, max, 1)} className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/20 active:scale-95">›</button>
                </div>
                <button 
                  onClick={() => handleApplyStyle(subType)}
                  className={`w-full mt-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                      owned 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-[#1ed760] text-black hover:scale-[1.01] shadow-lg shadow-green-900/20'
                  }`}
                >
                    {owned ? 'GİYİLDİ' : 'SATIN AL'}
                </button>
            </div>
        );
    };

    return (
        <div className="h-full bg-[#050505] flex flex-col relative font-sans animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-30 pt-safe-top mt-4 px-6 flex justify-between items-start pointer-events-none">
                <button onClick={() => { playClickSound(); onBack(); }} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white flex items-center justify-center pointer-events-auto active:scale-95 transition-transform">←</button>
                <div className="flex flex-col items-end pointer-events-auto">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">BAKİYE</div>
                    <div className="text-[#1ed760] font-mono font-bold text-xl">₺{player.careerCash.toLocaleString()}</div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* HEADS SHOWCASE - REDESIGNED */}
                {shopCategory === 'head' && (
                    <div className="flex-1 overflow-y-auto px-6 pt-24 pb-32">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">PREMIUM KAFALAR</h2>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Karakterine efsane bir tarz kat</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {CAREER_SHOP_ITEMS.filter(i => i.subType === 'head').map(item => {
                                const owned = isItemOwned('head', item.index);
                                const isEquipped = player.appearance.headIndex === item.index;
                                
                                return (
                                    <button 
                                        key={item.id}
                                        onClick={() => handleHeadClick(item)}
                                        className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 flex flex-col ${isEquipped ? 'border-[#1ed760] bg-[#1ed760]/10 shadow-[0_0_20px_rgba(30,215,96,0.2)]' : 'border-white/10 bg-[#121212] hover:border-white/30'}`}
                                    >
                                        {/* Card Top: Image Area */}
                                        <div className="aspect-[4/5] relative p-2 flex items-center justify-center w-full bg-gradient-to-b from-white/5 to-transparent">
                                            {/* Rarity Glow */}
                                            <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${item.rarity === 'legendary' ? 'from-yellow-600 to-red-600' : 'from-purple-600 to-blue-600'}`}></div>
                                            
                                            <img src={HEAD_OPTIONS[item.index]} className="w-full h-full object-contain filter drop-shadow-xl relative z-10 transition-transform group-hover:scale-105" />
                                            
                                            {/* Badge */}
                                            <div className={`absolute top-3 right-3 text-[7px] font-black uppercase px-2 py-1 rounded-full border shadow-sm ${
                                                item.rarity === 'legendary' ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-purple-600 text-white border-purple-400'
                                            }`}>
                                                {item.rarity}
                                            </div>
                                        </div>
                                        
                                        {/* Card Bottom: Info Area */}
                                        <div className="p-4 w-full bg-black/60 backdrop-blur-md border-t border-white/5 flex flex-col items-center">
                                            <div className="text-white font-black text-sm italic uppercase tracking-wider mb-2 text-center truncate">{item.name}</div>
                                            
                                            {owned ? (
                                                <div className={`text-center font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg w-full ${isEquipped ? 'bg-[#1ed760] text-black' : 'bg-white/10 text-neutral-400'}`}>
                                                    {isEquipped ? 'GİYİLDİ' : 'SAHİPSİN'}
                                                </div>
                                            ) : (
                                                <div className="text-center font-mono font-bold text-sm text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 rounded-lg w-full">
                                                    ₺{item.price.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* GEAR TRY-ON ROOM */}
                {shopCategory === 'gear' && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        
                        {/* Avatar Display - Fixed portion of screen (40%) */}
                        <div className="h-[40vh] shrink-0 relative flex items-center justify-center bg-gradient-to-b from-[#111] via-[#050505] to-[#0a0a0a]">
                            <div className="absolute top-0 left-1/4 w-[150px] h-[300px] bg-blue-500/10 blur-[60px] pointer-events-none"></div>
                            <div className="absolute top-0 right-1/4 w-[150px] h-[300px] bg-purple-500/10 blur-[60px] pointer-events-none"></div>
                            
                            <div className="relative z-10 transform scale-90 translate-y-4">
                                <Avatar appearance={previewAppearance} gender={player.gender} size={280} />
                            </div>
                        </div>

                        {/* Controls Panel - Scrollable remaining space with Bottom Padding */}
                        <div className="flex-1 bg-[#0a0a0a] border-t border-white/10 p-4 overflow-y-auto custom-scrollbar z-40 relative shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-24">
                            <div className="grid grid-cols-1 gap-2 pb-4">
                                {renderSelector("KIYAFET", "clothingStyle", CLOTHING_STYLES.length, "clothing")}
                                <div className="grid grid-cols-2 gap-3">
                                    {renderSelector("ŞAPKA", "hatIndex", HAT_STYLES.length, "hat")}
                                    {renderSelector("ZİNCİR", "chainIndex", CHAIN_STYLES.length, "chain")}
                                </div>
                                {/* Extra space to ensure scrolling past bottom bar */}
                                <div className="h-12"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Bottom Navigation for Shop */}
            <div className="bg-black border-t border-white/10 p-2 pb-safe flex justify-center gap-4 z-50 fixed bottom-0 left-0 right-0">
                <button 
                    onClick={() => { playClickSound(); setShopCategory('head'); }}
                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${shopCategory === 'head' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                >
                    KAFALAR
                </button>
                <button 
                    onClick={() => { playClickSound(); setShopCategory('gear'); }}
                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${shopCategory === 'gear' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                >
                    TARZ
                </button>
            </div>
        </div>
    );
};
