
import React, { useState, useEffect, useMemo } from 'react';
import { PlayerStats, CityKey } from '../types';
import { CoinIcon, CheckIcon, MicIcon, TrophyIcon, PlayIcon, SwordIcon, RocketIcon, SpadeCardIcon } from './Icons';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { ECONOMY } from '../constants';
import { useGameUI } from '../context/UIContext';
import { IAPTab } from './IAPStore';
import { createPost } from '../services/socialService';
import { motion, AnimatePresence } from 'motion/react';

// --- SHARED PROPS ---
interface FeatureProps {
  player: PlayerStats;
  onClose: () => void;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  // Complex updates
  onVehicleBuy?: (vehicleId: string, cost: number) => void;
  onCityUnlock?: (city: CityKey) => void;
  onHitSong?: () => void;
  onManagerHire?: (tier: number, cost: number, name: string) => void;
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

                createPost(
                    player.uid, 
                    player.name, 
                    player.appearance.headIndex, 
                    `Yeni bir araç satın aldım: ${car.name}! 🚗💨`, 
                    'car', 
                    { name: car.name, carImg: car.img }
                ).catch(console.error);
            }
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black flex flex-col font-sans overflow-hidden"
        >
            {/* Elegant Subheadings & Balance banner instead of crowded double header */}
            <div className="bg-[#050505] border-b border-white/[0.03] px-6 py-3 flex items-center justify-between shrink-0 text-[10px] font-black text-neutral-400 tracking-tight lowercase">
                <div className="flex gap-2 items-center">
                    <div className="w-4 h-4 bg-[#ffe800] text-black font-black flex items-center justify-center rounded-[4px] text-[10px] italic shadow-[0_0_10px_rgba(255,232,0,0.3)]">S</div>
                    <span className="text-white font-bold">sahisinden vasıta</span>
                </div>
                <div className="flex items-center gap-1 bg-[#0a0a0a] px-3 py-1 rounded-full border border-white/5">
                    <span className="text-[9px] text-neutral-500 lowercase">bakiye:</span>
                    <span className="text-[#ffe800] font-mono font-extrabold">{player.careerCash.toLocaleString()} ₺</span>
                </div>
            </div>

            {/* Listings List */}
            <div className="flex-1 overflow-y-auto bg-black no-scrollbar pb-32">
                <div className="flex flex-col">
                    {listings.map((car, idx) => {
                        const isSold = player.inventory.vehicles.includes(car.uniqueId);
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                key={car.uniqueId} 
                                className={`border-b border-white/[0.02] p-4 flex gap-4 relative transition-all duration-300 select-none ${isSold ? 'opacity-30 grayscale' : 'active:bg-white/[0.03]'}`}
                                onClick={(e) => !isSold && handleBuy(e, car)}
                            >
                                {/* Left: Image placeholder */}
                                <div className="w-16 h-12 bg-[#0a0a0a] rounded-xl border border-white/5 flex items-center justify-center text-2xl shrink-0 shadow-lg relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-50" />
                                    <span className="relative z-10 transition-transform duration-300">{car.img}</span>
                                </div>

                                {/* Middle: Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[#ffe800] text-[8px] font-black lowercase tracking-tight">{car.year} model</span>
                                            <div className="w-1 h-px bg-white/10"></div>
                                            <span className="text-neutral-500 text-[8px] font-black lowercase tracking-tight">{car.km.toLocaleString()} km</span>
                                        </div>
                                        <h3 className="text-white font-extrabold text-sm tracking-tight lowercase leading-none mb-1 truncate">{car.name.toLowerCase()}</h3>
                                        <p className="text-neutral-500 text-[10px] leading-tight tracking-tight lowercase truncate">{car.title.toLowerCase()}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 bg-[#ffe800]/10 px-2 py-0.5 rounded-full border border-[#ffe800]/10">
                                            <RocketIcon className="w-2 h-2 text-[#ffe800]" />
                                            <span className="text-[8px] font-extrabold text-[#ffe800] lowercase tracking-tight">+{car.swag} swag</span>
                                        </div>
                                        <span className="text-neutral-500 text-[8px] font-medium lowercase tracking-tight">{car.location.toLowerCase()}</span>
                                    </div>
                                </div>

                                {/* Right: Price */}
                                <div className="text-right flex flex-col justify-center shrink-0 pl-2">
                                    <div className="text-white font-black text-sm tracking-tight leading-none mb-1">
                                        ₺{car.price.toLocaleString()}
                                    </div>
                                    <div className="text-[8px] text-neutral-600 lowercase tracking-tight">
                                        {car.date.toLowerCase()}
                                    </div>
                                </div>

                                {/* Sold Overlay */}
                                {isSold && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                        <div className="bg-red-500/10 text-red-500 text-[9px] font-black px-6 py-2.5 rounded-xl border border-red-500/20 tracking-widest lowercase shadow-xl backdrop-blur-md">
                                            satıldı
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
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
    const [songName, setSongName] = useState('');

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
                
                const hitSong = {
                    id: `hit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: songName,
                    quality: 100,
                    releasedAt: Date.now(),
                    popularityScore: 1000,
                    totalEarnings: 0
                };
                
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

                createPost(
                    player.uid, 
                    player.name, 
                    player.appearance.headIndex, 
                    `Yeni hit parçam "${songName}" yayında! 🎙️🔥`, 
                    'song', 
                    { name: songName }
                ).catch(console.error);

                onClose();
            } else {
                playErrorSound();
                showToast("Şarkı tutmadı... Biraz daha çalışmalısın.", 'info');
            }
            setIsRecording(false);
        }, 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 font-sans"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm glass-dark border border-white/5 rounded-[3rem] p-8 relative shadow-[0_30px_80px_rgba(0,0,0,0.8)] max-h-[85vh] overflow-y-auto no-scrollbar"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white glass w-10 h-10 rounded-2xl flex items-center justify-center transition-all border border-white/5">✕</button>
                
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_rgba(220,38,38,0.3)] border border-red-400/20 rotate-3">
                        <MicIcon className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">HIT MAKER</h2>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic">PROFESYONEL STÜDYO KAYDI</p>
                </div>
                
                <div className="mb-8">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-3 italic px-2">ŞARKI İSMİ</label>
                    <input 
                        type="text" 
                        value={songName}
                        onChange={(e) => setSongName(e.target.value)}
                        placeholder="Örn: Yalan Dünya"
                        className="w-full glass border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black focus:border-red-500/50 outline-none transition-all placeholder:text-white/10 italic"
                    />
                </div>

                <div className="glass rounded-[2rem] p-6 mb-8 border border-white/5">
                    <div className="flex justify-between text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mb-3 italic">
                        <span>BAŞARI ŞANSI</span>
                        <span className={successChance > 70 ? 'text-spotify-green' : successChance > 40 ? 'text-yellow-500' : 'text-red-500'}>%{successChance}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${successChance}%` }}
                            className={`h-full transition-all duration-500 ${successChance > 70 ? 'bg-spotify-green shadow-[0_0_10px_#1DB954]' : successChance > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        ></motion.div>
                    </div>
                    <p className="text-[8px] text-white/20 mt-3 text-center font-black uppercase tracking-widest leading-relaxed italic">Yeteneklerine göre hesaplanır.</p>
                </div>

                <div className="flex justify-between items-center mb-10 px-6 glass py-4 rounded-[2rem] border border-white/5">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] mb-1 italic">MALİYET</span>
                        <span className="text-red-500 font-black text-lg italic tracking-tighter">₺{COST.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-8 bg-white/5"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] mb-1 italic">ENERJİ</span>
                        <span className="text-yellow-500 font-black text-lg italic tracking-tighter">-{ENERGY_COST}</span>
                    </div>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRecord} 
                    disabled={isRecording} 
                    className="w-full bg-white text-black font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-3 italic active:scale-95"
                >
                    {isRecording ? 'KAYIT ALINIYOR...' : 'KAYDA GİR'}
                </motion.button>
            </motion.div>
        </motion.div>
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
        const name = type === 'local' ? 'Selo Dayı' : 'Baron Kerem';

        if (player.careerCash < cost) {
            playErrorSound();
            if (onOpenShop) onOpenShop('currency');
            else showToast("paran yetersiz!", 'error');
            return;
        }

        playClickSound();
        showConfirm(
            "menajer anlaşması",
            type === 'pro' ? `ünlü menajer ile ₺${cost.toLocaleString()} karşılığında el sıkışmak istiyor musun?` : `semt abisi ile ₺${cost.toLocaleString()} anlaşmak istiyor musun?`,
            () => {
                updateStat('careerCash', -cost);
                if (onManagerHire) onManagerHire(tier, cost, name);
                
                if (type === 'pro') {
                    if (onCityUnlock) onCityUnlock('istanbul');
                    showToast("anlaşma sağlandı! istanbul'un kapıları açıldı! 🤝", 'success');
                } else {
                    showToast("semt abisi arkanda. sokaklar artık senin.", 'success');
                }
                onClose();
            }
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-8 font-sans select-none"
        >
            <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-xl relative max-h-[85vh] overflow-y-auto no-scrollbar pb-6 bg-[#040404] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)]"
            >
                {/* Close absolute */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-90"
                >
                    ✕
                </button>

                <div className="text-left mb-8 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]"></span>
                        <span className="text-[10px] font-black text-neutral-500 lowercase tracking-tight">menajerlik ajansı.</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none lowercase">
                        menajer tut<span className="text-indigo-500">.</span>
                    </h2>
                    <p className="text-xs text-neutral-400 font-medium lowercase tracking-tight mt-2 leading-relaxed">
                        kariyerini profesyonel ellere teslim et, popülariteni ve konser kazancını katla.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {/* Local Manager Card */}
                    <div 
                        onClick={() => hire('local')} 
                        className="bg-[#090909] border border-white/5 hover:border-white/10 rounded-3xl p-5 text-left transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className="absolute top-5 right-5 opacity-5 group-hover:opacity-15 transition-all text-4xl">📿</div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-md sm:text-lg font-black text-white tracking-tight lowercase flex items-center gap-1.5">
                                semt abisi<span className="text-neutral-500 font-medium text-xs">• selo dayı</span>
                            </h3>
                            <p className="text-[11px] text-neutral-400 max-w-[85%] font-medium leading-relaxed lowercase">
                                mahallede sözü geçer, çevresi geniştir. konser gelirlerine %10 kalıcı nakit bonus sağlar.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.03]">
                            <span className="text-neutral-500 text-[10px] font-bold lowercase">anlaşma bedeli</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-black text-lg tracking-tight tabular-nums">₺{ECONOMY.MANAGER_TIER_1.toLocaleString()}</span>
                                <span className="text-[9px] bg-white/5 border border-white/5 text-neutral-300 px-2 py-0.5 rounded-full font-black">tier 1</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pro Manager Card */}
                    <div 
                        onClick={() => hire('pro')} 
                        className="bg-gradient-to-br from-indigo-900/10 to-[#090909] border border-indigo-500/20 hover:border-indigo-500/40 rounded-3xl p-5 text-left transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(99,102,241,0.05)]"
                    >
                        <div className="absolute top-5 right-5 opacity-20 text-4xl group-hover:scale-110 group-hover:opacity-30 transition-all drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">💼</div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-md sm:text-lg font-black text-white tracking-tight lowercase flex items-center gap-1.5">
                                vizyoner menajer<span className="text-indigo-400 font-medium text-xs">• baron kerem</span>
                            </h3>
                            <p className="text-[11px] text-neutral-300 max-w-[80%] font-medium leading-relaxed lowercase">
                                sektörün kurdu ve plak şirketi patronudur. konser kazançlarını %25 artırır ve <span className="text-indigo-400 font-bold">istanbul</span> bölgesi kilidini açar.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.03]">
                            <span className="text-neutral-500 text-[10px] font-bold lowercase">anlaşma bedeli</span>
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-400 font-black text-lg tracking-tight tabular-nums">₺{ECONOMY.MANAGER_TIER_2.toLocaleString()}</span>
                                <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-black">tier 2</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose} 
                    className="mt-6 text-neutral-400 text-xs font-bold lowercase hover:text-white w-full transition-all bg-[#0a0a0a] hover:bg-[#111] py-4 rounded-2xl border border-white/5 active:scale-95 text-center"
                >
                    vazgeç.
                </button>
            </motion.div>
        </motion.div>
    );
};
