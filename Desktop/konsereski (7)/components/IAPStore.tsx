
import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { useGameUI } from '../context/UIContext';
import { playClickSound, playWinSound } from '../services/sfx';
import { CrownIcon, CheckIcon, CoinIcon, StarIcon, PlayIcon } from './Icons';
import { PaymentManager } from '../services/paymentService';
import { adMobService } from '../services/adMobService';
import { ECONOMY } from '../constants';

export type IAPTab = 'vip' | 'currency' | 'energy';

interface IAPStoreProps {
    player: PlayerStats;
    updateMultipleStats: (updates: Partial<PlayerStats>) => void;
    onClose: () => void;
    initialTab?: IAPTab;
}

const PRODUCTS = {
    vip: [
        { 
            id: 'vip_sub', 
            name: 'FLOWIFY PRO', 
            price: '199.99 ₺', 
            originalPrice: '249.99 ₺',
            discount: '%20',
            perks: [
                { text: 'Reklamsız Deneyim' },
                { text: 'Günlük +50 Enerji Bonusu' },
                { text: 'Profilinde PRO Rozeti' }
            ], 
            popular: true,
            theme: 'gold'
        },
        { 
            id: 'verified_tick', 
            name: 'MAVİ TİK', 
            price: '89.99 ₺', 
            originalPrice: '129.99 ₺',
            discount: 'KALICI',
            perks: [
                { text: 'Resmi Onaylı Hesap' },
                { text: 'Listelerde Mavi Tik İkonu' },
                { text: 'Güvenilirlik Prestiji' }
            ], 
            popular: false,
            theme: 'blue'
        }
    ],
    currency: [
        { id: 'gold_mini', name: 'Cep Harçlığı', amount: 25000, price: '9.99 ₺', originalPrice: '14.99 ₺' },
        { id: 'gold_100', name: 'Kasa Başlangıcı', amount: 100000, price: '29.99 ₺', originalPrice: '39.99 ₺', popular: true },
        { id: 'gold_bag', name: 'Büyük Vurgun', amount: 300000, price: '69.99 ₺', originalPrice: '89.99 ₺' },
        { id: 'gold_500', name: 'Milyoner', amount: 1000000, price: '149.99 ₺', originalPrice: '199.99 ₺' },
        { id: 'gold_vault', name: 'Banka Kasası', amount: 5000000, price: '499.99 ₺', originalPrice: '699.99 ₺', badge: 'BEST' }
    ],
    energy: [
        { id: 'energy_coffee', name: 'Espresso', amount: 25, price: '4.99 ₺', originalPrice: '9.99 ₺', icon: '☕' },
        { id: 'energy_refill', name: 'Full Depo', amount: 100, price: '19.99 ₺', originalPrice: '29.99 ₺', icon: '⚡', popular: true },
        { id: 'energy_bulk', name: 'Stok', amount: 500, price: '79.99 ₺', originalPrice: '119.99 ₺', icon: '🔋' }
    ]
};

export const IAPStore: React.FC<IAPStoreProps> = ({ player, updateMultipleStats, onClose, initialTab = 'vip' }) => {
    const [activeTab, setActiveTab] = useState<IAPTab>(initialTab);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { showToast } = useGameUI();

    const handlePurchase = async (item: any, type: IAPTab) => {
        if (processingId) return;
        playClickSound();
        setProcessingId(item.id);
        const result = await PaymentManager.performPurchase(item.id);
        setProcessingId(null);
        if (!result.success) {
            showToast("İşlem iptal edildi.", 'error');
        } else {
            console.log("Purchase signal sent.");
        }
    };

    const handleWatchAd = async () => {
        if (processingId) return;
        playClickSound();
        setProcessingId('ad_watch');
        
        const success = await adMobService.reklami_baslat();
        setProcessingId(null);

        if (success) {
            playWinSound();
            updateMultipleStats({ energy: Math.min(player.maxEnergy, player.energy + 20) });
            showToast("+20 Enerji Eklendi!", 'success');
        } else {
            showToast("Reklam yüklenemedi. Lütfen internetini kontrol et.", 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-[#090909] flex flex-col font-sans animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-4 bg-black/80 backdrop-blur-md border-b border-white/5 shrink-0 z-20">
                <h1 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                    MAĞAZA 
                    {activeTab === 'vip' && <span className="bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded font-black">PRO</span>}
                </h1>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white/50 hover:text-white flex items-center justify-center transition-colors">✕</button>
            </div>

            <div className="px-6 py-4 shrink-0 bg-black z-10 border-b border-white/5">
                <div className="flex bg-[#111] p-1 rounded-lg border border-white/5">
                    {(['vip', 'currency', 'energy'] as IAPTab[]).map(tab => {
                        const isActive = activeTab === tab;
                        return (
                            <button 
                                key={tab}
                                onClick={() => { playClickSound(); setActiveTab(tab); }} 
                                className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                {tab === 'vip' ? 'PREMIUM' : tab === 'currency' ? 'NAKİT' : 'ENERJİ'}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-safe space-y-4 custom-scrollbar bg-[#090909]">
                <div className="h-4"></div>

                {/* VIP TAB - Redesigned Price UI */}
                {activeTab === 'vip' && (
                    <div className="space-y-6">
                        {PRODUCTS.vip.map(item => {
                            const isGold = item.theme === 'gold';
                            return (
                                <div key={item.id} className="relative group">
                                    <div className={`absolute inset-0 rounded-2xl opacity-20 blur-md transition-opacity duration-500 group-hover:opacity-40 ${isGold ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isGold ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {isGold ? <CrownIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm tracking-wide">{item.name}</h3>
                                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${isGold ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>{item.discount}</div>
                                                </div>
                                            </div>
                                            {/* Price Container - Fixed visibility */}
                                            <div className="text-right">
                                                <div className="text-xs text-neutral-500 line-through decoration-red-500">{item.originalPrice}</div>
                                                <div className={`text-lg font-black tracking-tight px-3 py-1 rounded-lg mt-1 shadow-sm ${isGold ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                                                    {item.price}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mb-5">
                                            {item.perks.map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] text-neutral-300 font-medium">
                                                    <div className={`w-1 h-1 rounded-full ${isGold ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                                    {p.text}
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => handlePurchase(item, 'vip')}
                                            disabled={!!processingId}
                                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-transform active:scale-[0.98] ${isGold ? 'bg-white text-black' : 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-[#222]'}`}
                                        >
                                            {processingId === item.id ? '...' : 'SATIN AL'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(activeTab === 'currency' || activeTab === 'energy') && (
                    <div className="flex flex-col gap-3">
                        {PRODUCTS[activeTab].map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between bg-[#111] p-3 rounded-xl border border-white/5 active:bg-[#1a1a1a] transition-colors relative overflow-hidden group">
                                {item.popular && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg z-10"></div>}
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${activeTab === 'currency' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {activeTab === 'currency' ? <CoinIcon className="w-5 h-5" /> : item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-sm leading-tight">{item.name}</span>
                                            {item.popular && <span className="text-[8px] font-black bg-red-500 text-white px-1.5 rounded-sm">HOT</span>}
                                        </div>
                                        <div className={`text-xs font-bold mt-0.5 ${activeTab === 'currency' ? 'text-green-400' : 'text-blue-400'}`}>
                                            +{item.amount.toLocaleString()} {activeTab === 'currency' ? '' : 'Enerji'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handlePurchase(item, activeTab)} disabled={!!processingId} className="flex flex-col items-end bg-[#222] hover:bg-[#333] border border-white/10 px-4 py-2 rounded-lg transition-colors group-active:scale-95">
                                    <span className="text-[9px] text-neutral-500 line-through decoration-red-500">{item.originalPrice}</span>
                                    <span className="text-white font-bold text-sm">{item.price}</span>
                                </button>
                            </div>
                        ))}

                        {/* WATCH AD BUTTON FOR ENERGY TAB */}
                        {activeTab === 'energy' && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-blue-800/20 p-3 rounded-xl border border-blue-500/30 active:scale-[0.99] transition-transform relative overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 bg-blue-500/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <PlayIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-sm leading-tight">REKLAM İZLE</span>
                                            <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 rounded-sm">FREE</span>
                                        </div>
                                        <div className="text-xs font-bold mt-0.5 text-blue-300">
                                            +{ECONOMY.AD_REWARD_ENERGY} Enerji
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleWatchAd} 
                                    disabled={!!processingId} 
                                    className="bg-blue-600 hover:bg-blue-500 text-white border border-white/10 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg transition-colors"
                                >
                                    {processingId === 'ad_watch' ? '...' : 'İZLE'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="h-20"></div>
                <div className="text-center pb-safe">
                    <button onClick={() => { playClickSound(); PaymentManager.restorePurchases().then(() => showToast("İşlem tamamlandı.", "info")); }} className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest hover:text-neutral-400 transition-colors">
                        Satın Alımları Geri Yükle
                    </button>
                </div>
            </div>
        </div>
    );
};
