
import React, { useState, useEffect, useMemo } from 'react';
import { PlayerStats, CityKey } from '../types';
import { CoinIcon, CheckIcon, MicIcon, TrophyIcon } from './Icons';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { ECONOMY } from '../constants';
import { useGameUI } from '../context/UIContext';
import { IAPTab } from './IAPStore';

// --- SHARED PROPS ---
interface FeatureProps {
  player: PlayerStats;
  onClose: () => void;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  // Complex updates
  onVehicleBuy?: (vehicleId: string, cost: number) => void;
  onCityUnlock?: (city: CityKey) => void;
  onHitSong?: () => void;
  onManagerHire?: (tier: number, cost: number) => void;
  // New Prop for Smart Upsell
  onOpenShop?: (tab: IAPTab) => void;
}

// ============================================================================
// 1. SAHISINDEN MARKET (OTO PAZARI) - REDESIGNED
// ============================================================================

const CAR_TITLES = [
    "DOKTORDAN TEMİZ HATASIZ", "ACİL SATILIK GELENİ ÜZMEM", "KEYFE KEDER SATILIK", 
    "GARAJ ARABASI NOKTA HATA YOK", "HASTASINA ÖZEL PROJE", "FULL + FULL YAPILI", 
    "TR'DE TEK BU TEMİZLİKTE YOK", "İLK SAHİBİNDEN ORJİNAL", "MEMURDAN BAKIMLI AİLE ARACI", 
    "TAKAS OLMAZ NAKİT İHTİYAÇTAN", "KUPON ARAÇ KAÇMAZ", "EV ALACAĞIM İÇİN SATILIK"
];

const LOCATIONS = [
    "İstanbul / Kadıköy", "İstanbul / Bağcılar", "İstanbul / Esenyurt", "İstanbul / Etiler",
    "Ankara / Çankaya", "Ankara / Mamak", "İzmir / Bornova", "İzmir / Karşıyaka",
    "Bursa / Nilüfer", "Antalya / Muratpaşa", "Adana / Seyhan", "Eskişehir / Odunpazarı"
];

const CAR_MODELS = [
    { id: 'scooter', name: 'Mondial 50cc', basePrice: 35000, swag: 2, img: '🛵' },
    { id: 'tofas', name: 'Tofaş Şahin S', basePrice: 60000, swag: 10, img: '🚗' },
    { id: 'doblo', name: 'Fiat Doblo 1.3 Multijet', basePrice: 150000, swag: 5, img: '🚐' },
    { id: 'honda', name: 'Honda Civic 1.6 i-VTEC', basePrice: 250000, swag: 25, img: '🚙' },
    { id: 'bmw', name: 'BMW E30 M-Technic', basePrice: 400000, swag: 40, img: '🏎️' },
    { id: 'passat', name: 'VW Passat 1.6 TDI Highline', basePrice: 900000, swag: 60, img: '🚓' },
    { id: 'range', name: 'Range Rover Sport 3.0 SDV6', basePrice: 2000000, swag: 95, img: '🚜' },
];

export const SahisindenMarket: React.FC<FeatureProps> = ({ player, onClose, onVehicleBuy, onCityUnlock, onOpenShop }) => {
    const { showToast, showConfirm } = useGameUI();
    
    // Generate listings deterministically
    const listings = useMemo(() => {
        const seed = player.week * 17;
        return Array.from({ length: 8 }).map((_, i) => {
            const pseudoRandom = (seed + i * 1337) % 1000 / 1000;
            const modelIndex = Math.floor(((seed + i) % CAR_MODELS.length));
            const model = CAR_MODELS[modelIndex];
            const titleIndex = (seed + i * 3) % CAR_TITLES.length;
            const title = CAR_TITLES[titleIndex];
            const locIndex = (seed + i * 7) % LOCATIONS.length;
            const location = LOCATIONS[locIndex];
            
            const priceVariance = 0.9 + (pseudoRandom * 0.2); 
            const price = Math.floor(model.basePrice * priceVariance);
            const uniqueId = `${model.id}_${player.week}_${i}`; 
            const km = Math.floor(pseudoRandom * 250000) + 20000;
            const year = 2023 - Math.floor(pseudoRandom * 20);
            
            // Random Date (Today or Yesterday)
            const date = pseudoRandom > 0.5 ? "Bugün" : "Dün";

            return { uniqueId, coreId: model.id, ...model, title, price, km, year, location, date };
        });
    }, [player.week]);

    const handleBuy = (e: React.MouseEvent, car: any) => {
        e.stopPropagation();
        e.preventDefault();

        if (player.inventory.vehicles.includes(car.uniqueId)) {
            showToast("Bu aracı zaten garajında!", 'info');
            return;
        }

        if (player.careerCash < car.price) {
            playErrorSound();
            // SMART UPSELL
            if (onOpenShop) onOpenShop('currency');
            else showToast(`Bakiye yetersiz! ₺${(car.price - player.careerCash).toLocaleString()} eksik.`, 'error');
            return;
        }
        
        playClickSound();
        showConfirm(
            "SATIN ALMA",
            `${car.name} aracını ₺${car.price.toLocaleString()} karşılığında almak istiyor musun?`,
            () => {
                if (onVehicleBuy) {
                    playWinSound(); 
                    onVehicleBuy(car.uniqueId, car.price);
                }
                
                const isTofas = car.coreId === 'tofas';
                const bursaLocked = !player.unlockedCities.includes('bursa');

                if (bursaLocked && onCityUnlock) {
                    setTimeout(() => {
                        showToast("BURSA KİLİDİ AÇILDI! 🚗💨", 'success');
                        onCityUnlock('bursa');
                    }, 600);
                } else {
                    showToast(`${car.name} artık senin! Hayırlı olsun.`, 'success');
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-zoom-in font-sans">
            <div className="w-full max-w-md bg-[#f2f2f2] h-full md:h-[85vh] flex flex-col md:rounded-xl overflow-hidden shadow-2xl relative border border-gray-400">
                
                {/* Header (Classic Yellow) */}
                <div className="bg-[#FFD000] px-4 py-3 flex justify-between items-center shadow-sm z-10 shrink-0 border-b border-[#e6bb00] pt-safe-top">
                    <div className="flex flex-col">
                        <span className="text-xl font-black italic tracking-tighter text-black">sahisinden.com</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full text-black font-bold hover:bg-black/20">✕</button>
                </div>

                {/* Sub-Header / Filter Bar Simulation */}
                <div className="bg-[#f8f8f8] border-b border-gray-300 px-4 py-3 flex items-center justify-between text-xs text-blue-600 font-bold shrink-0 shadow-sm relative z-10">
                    <div className="flex gap-6">
                        <span className="flex items-center gap-1">Sıralama <span className="text-[9px]">▼</span></span>
                        <span className="flex items-center gap-1">Filtrele <span className="text-[9px]">▼</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 font-normal">
                        <span className="font-bold text-black">{listings.length}</span> ilan
                    </div>
                </div>

                {/* Balance Info (Game Specific) */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center text-xs shrink-0">
                    <span className="text-gray-500 font-bold">Cüzdanım:</span>
                    <span className="text-green-600 font-black font-mono text-sm">₺{player.careerCash.toLocaleString()}</span>
                </div>

                {/* Listings List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {listings.map((car) => {
                        const isSold = player.inventory.vehicles.includes(car.uniqueId);
                        return (
                            <div 
                                key={car.uniqueId} 
                                className={`border-b border-gray-200 p-3 flex gap-3 relative hover:bg-gray-50 transition-colors active:bg-blue-50 cursor-pointer ${isSold ? 'opacity-60 grayscale' : ''}`}
                                onClick={(e) => !isSold && handleBuy(e, car)}
                            >
                                {/* Thumbnail */}
                                <div className="w-32 h-24 bg-gray-200 border border-gray-300 relative flex items-center justify-center text-5xl shrink-0 rounded-sm overflow-hidden">
                                    {car.img}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 text-center font-bold">
                                        +{car.swag} SWAG
                                    </div>
                                    {isSold && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 transform -rotate-12 rounded shadow-sm border border-white/20">SATILDI</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h3 className="text-[#3b55a8] font-bold text-[13px] truncate leading-tight mb-1">{car.title}</h3>
                                        <div className="text-gray-900 text-xs font-semibold truncate">{car.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            {car.year} • {car.km.toLocaleString()} KM • Beyaz
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="text-[10px] text-gray-500 font-medium leading-tight">
                                            {car.location}
                                            <div className="text-[9px] text-gray-400 mt-0.5">{car.date}</div>
                                        </div>
                                        <div className="text-[#d91a1a] font-bold text-sm tracking-tight">
                                            {car.price.toLocaleString()} TL
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Pagination Simulation */}
                    <div className="p-6 flex justify-center gap-2 pb-safe">
                        <span className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-blue-600 text-sm font-bold text-white shadow-sm">1</span>
                        <span className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white text-sm text-blue-600">2</span>
                        <span className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white text-sm text-blue-600">3</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 2. HIT MAKER STUDIO (İZMİR UNLOCK)
// ============================================================================

export const HitMakerStudio: React.FC<FeatureProps> = ({ player, onClose, updateStat, onHitSong, onCityUnlock, onOpenShop }) => {
    const { showToast } = useGameUI();
    const COST = ECONOMY.STUDIO_RENT;
    const ENERGY_COST = ECONOMY.COST.STUDIO;
    const successChance = Math.min(100, Math.floor((player.flow + player.lyrics) / 2));
    const [isRecording, setIsRecording] = useState(false);
    const [songName, setSongName] = useState(''); // NEW

    const handleRecord = () => {
        if (!songName.trim()) {
            showToast("Şarkı ismi girmelisin!", 'error');
            return;
        }
        if (player.careerCash < COST) { 
            playErrorSound();
            if (onOpenShop) onOpenShop('currency');
            else showToast(`Stüdyo için ₺${COST.toLocaleString()} gerekiyor!`, 'error');
            return; 
        }
        if (player.energy < ENERGY_COST) { 
            playErrorSound();
            if (onOpenShop) onOpenShop('energy');
            else showToast(`Çok yorgunsun! (${ENERGY_COST} Enerji lazım)`, 'error');
            return; 
        }

        setIsRecording(true);
        playClickSound();

        setTimeout(() => {
            updateStat('careerCash', -COST);
            updateStat('energy', -ENERGY_COST);
            const roll = Math.random() * 100;
            const isHit = roll <= successChance;

            if (isHit) {
                playWinSound();
                if (onHitSong) onHitSong();
                
                // --- NEW: Add to Discography logic ---
                const hitSong = {
                    id: Date.now().toString(),
                    name: songName,
                    quality: 100, // It's a hit!
                    releasedAt: Date.now(),
                    popularityScore: 1000,
                    totalEarnings: 0
                };
                
                // Dispatch event so Dashboard updates
                window.dispatchEvent(new CustomEvent('songReleased', { 
                    detail: { 
                        song: hitSong, 
                        listenersGained: 50000, 
                        initialCash: 10000 
                    } 
                }));

                if (onCityUnlock && !player.unlockedCities.includes('izmir')) {
                    onCityUnlock('izmir');
                }
                showToast("TEBRİKLER! Şarkı patladı! İZMİR KİLİDİ AÇILDI! 🔥", 'success');
                onClose();
            } else {
                playErrorSound();
                showToast("Şarkı tutmadı... Biraz daha çalışmalısın.", 'info');
            }
            setIsRecording(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
                <div className="text-center mb-8"><div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse"><MicIcon className="w-10 h-10 text-white" /></div><h2 className="text-3xl font-black text-white italic tracking-tighter">HIT MAKER</h2><p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-2">Profesyonel Kayıt</p></div>
                
                {/* NEW SONG NAME INPUT */}
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-2">ŞARKI İSMİ</label>
                    <input 
                        type="text" 
                        value={songName}
                        onChange={(e) => setSongName(e.target.value)}
                        placeholder="Örn: Yalan Dünya"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-colors"
                    />
                </div>

                <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5"><div className="flex justify-between text-xs text-neutral-400 font-bold mb-2"><span>BAŞARI ŞANSI</span><span>%{successChance}</span></div><div className="w-full h-2 bg-[#333] rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${successChance > 70 ? 'bg-green-500' : successChance > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${successChance}%` }}></div></div><p className="text-[10px] text-neutral-500 mt-2 text-center">Flow ve Lirik yeteneğine göre hesaplanır.</p></div>
                <div className="flex justify-between items-center mb-6 px-2"><div className="flex flex-col items-center"><span className="text-[10px] text-neutral-500 font-bold">MALİYET</span><span className="text-red-400 font-mono font-bold">₺{COST.toLocaleString()}</span></div><div className="flex flex-col items-center"><span className="text-[10px] text-neutral-500 font-bold">ENERJİ</span><span className="text-yellow-400 font-mono font-bold">-{ENERGY_COST}</span></div></div>
                <button onClick={handleRecord} disabled={isRecording} className="w-full bg-white text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">{isRecording ? 'KAYIT ALINIYOR...' : 'KAYDA GİR'}</button>
            </div>
        </div>
    );
};

// ============================================================================
// 3. MANAGER AGENCY (ISTANBUL UNLOCK)
// ============================================================================

export const ManagerAgency: React.FC<FeatureProps> = ({ player, onClose, updateStat, onManagerHire, onCityUnlock, onOpenShop }) => {
    const { showToast, showConfirm } = useGameUI();
    
    const hire = (type: 'local' | 'pro') => {
        const cost = type === 'local' ? ECONOMY.MANAGER_TIER_1 : ECONOMY.MANAGER_TIER_2;
        const tier = type === 'local' ? 1 : 2;

        if (player.careerCash < cost) {
            playErrorSound();
            if (onOpenShop) onOpenShop('currency');
            else showToast("Paran yetersiz!", 'error');
            return;
        }

        playClickSound();
        showConfirm(
            "MENAJERLİK",
            type === 'pro' ? `Ünlü Menajer ile ₺${cost.toLocaleString()} karşılığında anlaşmak istiyor musun?` : `Semt Abisi ile ₺${cost.toLocaleString()} anlaşmak istiyor musun?`,
            () => {
                updateStat('careerCash', -cost);
                if (onManagerHire) onManagerHire(tier, cost);
                if (type === 'pro') {
                    if (onCityUnlock) onCityUnlock('istanbul');
                    showToast("ANLAŞMA SAĞLANDI! İSTANBUL KİLİDİ AÇILDI! 🤝", 'success');
                } else {
                    showToast("Semt abisi arkanda. İşler hızlanacak.", 'success');
                }
                onClose();
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-zoom-in font-sans">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8"><h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">MENAJERLİK AJANSI</h2><p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Kariyerini kim yönetecek?</p></div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => hire('local')} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 text-left hover:border-white/30 transition-all group relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-20 grayscale group-hover:grayscale-0 transition-all text-4xl">📿</div><h3 className="text-xl font-bold text-white mb-1">SEMT ABİSİ</h3><div className="text-xs text-neutral-400 mb-4 h-10">Mahallede sözü geçer. Ufak işleri bağlar.</div><div className="text-green-400 font-mono font-bold text-lg mb-2">₺{ECONOMY.MANAGER_TIER_1.toLocaleString()}</div><div className="text-[10px] bg-white/5 px-2 py-1 rounded inline-block text-neutral-500">Tier 1 • Yerel İşler</div></button>
                    <button onClick={() => hire('pro')} className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/50 rounded-2xl p-6 text-left hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all group relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-100 text-4xl group-hover:scale-110 transition-transform">💼</div><h3 className="text-xl font-black text-white mb-1 italic">ÜNLÜ MENAJER</h3><div className="text-xs text-purple-200 mb-4 h-10">Sektörün kurdu. İstanbul kapılarını açar.</div><div className="text-yellow-400 font-mono font-bold text-lg mb-2">₺{ECONOMY.MANAGER_TIER_2.toLocaleString()}</div><div className="text-[10px] bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded inline-block text-purple-300 font-bold animate-pulse">Tier 2 • İSTANBUL KİLİDİ</div></button>
                </div>
                <button onClick={onClose} className="mt-8 text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white w-full">Vazgeç</button>
            </div>
        </div>
    );
};
