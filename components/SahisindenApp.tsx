import React, { useState, useMemo } from 'react';
import { PlayerStats, CityKey } from '../types';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { RocketIcon, SparklesIcon } from './Icons';

// Local SVG icons for Sahisinden marketplace
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

const GaugeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
import { useGameUI } from '../context/UIContext';
import { createPost } from '../services/socialService';
import { motion, AnimatePresence } from 'motion/react';

interface SahisindenAppProps {
  player: PlayerStats;
  onClose?: () => void;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onVehicleBuy?: (vehicleId: string, cost: number) => void;
  onCityUnlock?: (city: CityKey) => void;
  onOpenShop?: (tab: 'currency' | 'energy') => void;
}

const CAR_TITLES = [
  "doktordan temiz hatasız boyasız lider paket",
  "acil satılık gelen rapçiyi üzmem pazarlık olur",
  "keyfe keder yapılı garajda muhafaza edilmiş",
  "nokta hatasız tr'de tek bu dolulukta yok",
  "hastasına özel setuplı proje canavarı",
  "full + full yapılı masrafsız bin git",
  "memurdan bakımlı lirik lobisine özel",
  "ilk sahibinden orjinal km garantili",
  "takas olmaz nakit ihtiyaçtan kupon araç",
  "ev alacağım salon projesi için acil satılık"
];

const LOCATIONS = [
  "eskisehir / odunpazari", "istanbul / bagcilar", "istanbul / etiler", "izmir / karsiyaka",
  "ankara / cankaya", "bursa / nilufer", "antalya / muratpasa", "adana / seyhan"
];

const CAR_MODELS = [
  { id: 'scooter', name: 'Mondial 50cc Scooter', basePrice: 35000, swag: 3, img: '🛵', category: 'motor' },
  { id: 'tofas', name: 'Tofaş Şahin 1.6 S', basePrice: 65000, swag: 12, img: '🚗', category: 'oto' },
  { id: 'doblo', name: 'Fiat Doblo 1.3 Multijet Enişte Edition', basePrice: 155000, swag: 7, img: '🚐', category: 'oto' },
  { id: 'honda', name: 'Honda Civic 1.6 i-VTEC VTEC-KOP', basePrice: 260000, swag: 28, img: '🚙', category: 'oto' },
  { id: 'bmw', name: 'BMW E30 325i M-Technic Yanlama Canavarı', basePrice: 420000, swag: 45, img: '🏎️', category: 'oto' },
  { id: 'passat', name: 'VW Passat 2.0 TDI BlueMotion', basePrice: 950000, swag: 65, img: '🚓', category: 'oto' },
  { id: 'range', name: 'Range Rover Sport Executive HSE V8', basePrice: 2100000, swag: 100, img: '🚜', category: 'oto' },
];

export const SahisindenApp: React.FC<SahisindenAppProps> = ({
  player,
  onClose,
  updateStat,
  onVehicleBuy,
  onCityUnlock,
  onOpenShop
}) => {
  const { showToast, showConfirm } = useGameUI();
  const [activeCategory, setActiveCategory] = useState<'all' | 'oto' | 'motor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState<any | null>(null);

  const listings = useMemo(() => {
    const seed = player.week * 23;
    return Array.from({ length: 10 }).map((_, i) => {
      const pseudoRandom = (seed + i * 1729) % 1000 / 1000;
      const modelIndex = (seed + i) % CAR_MODELS.length;
      const model = CAR_MODELS[modelIndex];
      const titleIndex = (seed + i * 4) % CAR_TITLES.length;
      const title = CAR_TITLES[titleIndex];
      const locIndex = (seed + i * 9) % LOCATIONS.length;
      const location = LOCATIONS[locIndex];

      const priceVariance = 0.88 + (pseudoRandom * 0.24);
      const price = Math.floor(model.basePrice * priceVariance);
      const uniqueId = `car_${model.id}_${player.week}_${i}`;
      const km = Math.floor(pseudoRandom * 220000) + 18000;
      const year = 2024 - Math.floor(pseudoRandom * 18);
      const daysAgo = Math.floor(pseudoRandom * 3);
      const date = daysAgo === 0 ? "Bugün" : daysAgo === 1 ? "Dün" : `${daysAgo} gün önce`;

      return {
        uniqueId,
        coreId: model.id,
        category: model.category,
        name: model.name,
        price,
        swag: model.swag,
        img: model.img,
        title,
        km,
        year,
        location,
        date
      };
    });
  }, [player.week]);

  const filteredListings = listings.filter(car => {
    const matchesCategory = activeCategory === 'all' || car.category === activeCategory;
    const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          car.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuy = (car: any) => {
    if (player.inventory.vehicles.includes(car.uniqueId)) {
      showToast("Bu araç zaten garajında bulunuyor!", 'info');
      return;
    }

    if (player.careerCash < car.price) {
      playErrorSound();
      if (onOpenShop) {
        onOpenShop('currency');
      } else {
        showToast(`Bakiye yetersiz! ₺${(car.price - player.careerCash).toLocaleString()} eksik.`, 'error');
      }
      return;
    }

    playClickSound();
    showConfirm(
      "araç satın alma",
      `${car.name} aracını ₺${car.price.toLocaleString()} fiyatından satın almak istediğine emin misin? garajına eklenecektir.`,
      () => {
        if (onVehicleBuy) {
          playWinSound();
          onVehicleBuy(car.uniqueId, car.price);
        }

        const isTofas = car.coreId === 'tofas';
        const bursaLocked = !player.unlockedCities.includes('bursa');

        if (bursaLocked && onCityUnlock) {
          setTimeout(() => {
            showToast("🚗💨 TOFAŞ ALDIN! BURSA BÖLGESİ KİLİDİ AÇILDI!", 'success');
            onCityUnlock('bursa');
          }, 600);
        } else {
          showToast(`${car.name} başarıyla satın alındı, garajına çekildi!`, 'success');
        }

        setSelectedCar(null);

        createPost(
          player.uid,
          player.name,
          player.appearance.headIndex,
          `yeni oyuncağımı çektim! sahisinden ${car.name.toLowerCase()} aldım, piyasadayız! 🚗🔥`,
          'car',
          { name: car.name, carImg: car.img }
        ).catch(console.error);
      }
    );
  };

  return (
    <div className="h-full w-full bg-[#0e0e0e] flex flex-col font-sans text-white select-none relative">
      
      {/* Yellow Iconic Header */}
      <div className="bg-[#ffe800] px-4 py-3.5 flex items-center justify-between shrink-0 shadow-lg text-black">
        <div className="flex items-center gap-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black hover:bg-black/20 transition-all active:scale-90"
            >
              <ArrowLeftIcon className="w-4 h-4 text-black" />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="bg-black text-[#ffe800] text-[10px] w-5 h-5 font-black flex items-center justify-center rounded-[4px] italic">S.</span>
            <span className="font-extrabold tracking-tight text-xs lowercase">sahisinden.com</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/5 px-2.5 py-1 rounded-full border border-black/10">
          <span className="text-[9px] text-black/60 font-medium">param:</span>
          <span className="text-black font-mono font-extrabold text-xs">₺{player.careerCash.toLocaleString()}</span>
        </div>
      </div>

      {/* Categories & Search Filter */}
      <div className="bg-[#121212] p-3 border-b border-white/[0.04] space-y-2.5 shrink-0 z-10">
        <div className="flex gap-1.5">
          <input 
            type="text"
            placeholder="kelime veya model ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-xs text-neutral-200 outline-none focus:border-[#ffe800]/50 placeholder:text-neutral-600 italic"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="px-3 bg-white/5 border border-white/5 rounded-xl text-neutral-400 text-xs text-center lowercase hover:text-white"
            >
              temizle
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'tüm ilanlar' },
            { id: 'oto', label: 'otomobiller' },
            { id: 'motor', label: 'motosikletler' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { playClickSound(); setActiveCategory(tab.id as any); }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold lowercase tracking-tight border transition-all ${
                activeCategory === tab.id
                ? 'bg-[#ffe800] text-black border-[#ffe800] font-black'
                : 'bg-white/[0.03] text-neutral-400 border-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vasıta Listings List */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] no-scrollbar pb-32">
        {filteredListings.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs lowercase italic">
            arama kriterlerine uygun ilan bulunamadı.
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredListings.map((car, idx) => {
              const isOwned = player.inventory.vehicles.includes(car.uniqueId);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={car.uniqueId} 
                  onClick={() => { playClickSound(); setSelectedCar(car); }}
                  className={`border-b border-white/[0.02] p-4 flex gap-4 items-center relative transition-all duration-200 cursor-pointer ${isOwned ? 'opacity-40 grayscale' : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Aspect Emoji Pic */}
                  <div className="w-18 h-14 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-center text-3xl shrink-0 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#ffe800]/5 to-transparent opacity-60" />
                    <span className="relative z-10">{car.img}</span>
                  </div>

                  {/* Body Specs */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[#ffe800] text-[8px] font-black lowercase tracking-wider">{car.year} model</span>
                        <div className="w-1 h-px bg-white/10" />
                        <span className="text-neutral-500 text-[8px] font-bold uppercase tracking-widest">{car.km.toLocaleString()} km</span>
                      </div>
                      <h3 className="text-neutral-100 font-extrabold text-sm tracking-tight leading-none mb-1 truncate lowercase">{car.name}</h3>
                      <p className="text-neutral-500 text-[10px] tracking-tight truncate lowercase italic">"{car.title}"</p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 bg-[#ffe800]/10 px-2 py-0.5 rounded-full border border-[#ffe800]/10 text-[#ffe800] text-[8px] font-black lowercase tracking-tight">
                        <RocketIcon className="w-2 h-2" />
                        <span>+{car.swag} karizma</span>
                      </div>
                      <span className="text-neutral-500 text-[8px] tracking-tight lowercase truncate max-w-[110px]">{car.location}</span>
                    </div>
                  </div>

                  {/* Pricing Column */}
                  <div className="text-right flex flex-col justify-center shrink-0 pl-2">
                    <div className="text-[#ffe800] font-mono font-black text-sm tracking-tight">
                      ₺{car.price.toLocaleString()}
                    </div>
                    <div className="text-[8px] text-neutral-600 mt-1 lowercase">
                      {car.date}
                    </div>
                  </div>

                  {/* Sold Ribbon Badge */}
                  {isOwned && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-[#ffe800]/10 text-[#ffe800] border border-[#ffe800]/20 text-[9px] font-black px-6 py-2 rounded-xl uppercase tracking-widest shadow-xl backdrop-blur-md">
                        garajında
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* SPECIFIC VEHICLE LISTING DETAIL MODAL */}
      <AnimatePresence>
        {selectedCar && (() => {
          const isOwned = player.inventory.vehicles.includes(selectedCar.uniqueId);
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end justify-center pt-10"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-sm bg-[#0c0c0c] border-t border-white/10 rounded-t-[2.5rem] flex flex-col max-h-[92vh] overflow-hidden"
              >
                {/* Yellow Strip Header */}
                <div className="bg-[#ffe805] px-6 py-4 flex items-center justify-between text-black font-black">
                  <span className="text-xs tracking-tight lowercase">ilan detayı • #{selectedCar.uniqueId.slice(-8)}</span>
                  <button 
                    onClick={() => { playClickSound(); setSelectedCar(null); }}
                    className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 text-black transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 progress-scrollbar no-scrollbar pb-32">
                  
                  {/* Image Presentation */}
                  <div className="w-full aspect-video bg-white/[0.02] rounded-[2rem] border border-white/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute -inset-10 bg-radial-gradient from-[#ffe800]/10 via-transparent to-transparent opacity-50 blur-xl pointer-events-none" />
                    <span className="text-7xl relative z-10 animate-float">{selectedCar.img}</span>
                  </div>

                  {/* Swag Spark */}
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h2 className="text-xl font-black text-white tracking-tight lowercase">{selectedCar.name}</h2>
                      <div className="text-neutral-500 text-[10px] font-bold lowercase">sahisinden vasıta ilanı</div>
                    </div>
                    <div className="text-[#ffe800] font-mono font-black text-xl">
                      ₺{selectedCar.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Structured Specifications block */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                      <GaugeIcon className="w-4 h-4 text-[#ffe800]" />
                      <div>
                        <div className="text-[8px] text-neutral-500 font-bold lowercase">kilometre</div>
                        <div className="text-[11px] font-bold text-white tabular-nums">{selectedCar.km.toLocaleString()} km</div>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-[#ffe800]" />
                      <div>
                        <div className="text-[8px] text-neutral-500 font-bold lowercase">model yılı</div>
                        <div className="text-[11px] font-bold text-white tabular-nums">{selectedCar.year} model</div>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                      <MapPinIcon className="w-4 h-4 text-[#ffe800]" />
                      <div>
                        <div className="text-[8px] text-neutral-500 font-bold lowercase">ilan yeri</div>
                        <div className="text-[11px] font-bold text-white truncate max-w-[110px]">{selectedCar.location}</div>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                      <RocketIcon className="w-4 h-4 text-[#ffe800]" />
                      <div>
                        <div className="text-[8px] text-neutral-500 font-bold lowercase">karizma etkisi</div>
                        <div className="text-[11px] font-bold text-[#ffe800]">+{selectedCar.swag} swag</div>
                      </div>
                    </div>
                  </div>

                  {/* Owner statement/Acıklama */}
                  <div className="space-y-2 bg-[#121212] p-4 rounded-2xl border border-white/[0.03]">
                    <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">satıcı açıklaması</div>
                    <p className="text-neutral-400 text-xs italic leading-relaxed lowercase font-medium">
                      "{selectedCar.title}. motor şanzıman kusursuzdur, tüm bakımları zamanında lirik lobisinde yapılmıştır. alıcısına şimdiden hayırlı uğurlu olsun, rap piyasasında yakıtı koyup gazlayacaksınız."
                    </p>
                  </div>
                  
                  {/* Swag boost value warning */}
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 lowercase italic justify-center text-center">
                    <SparklesIcon className="w-3.5 h-3.5 text-[#ffe800]" />
                    <span>bu vasıta sokak saygınlığını ve swag gücünü arttıracaktır.</span>
                  </div>

                </div>

                {/* Confirm/Accept footer */}
                <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex gap-3 shrink-0">
                  <button
                    onClick={() => { playClickSound(); setSelectedCar(null); }}
                    className="flex-1 py-4 bg-white/5 text-neutral-400 text-xs rounded-2xl font-bold lowercase border border-white/5 active:bg-white/10"
                  >
                    vazgeç
                  </button>
                  <button
                    onClick={() => handleBuy(selectedCar)}
                    disabled={isOwned}
                    className="flex-[2] py-4 bg-[#ffe800] text-black text-xs rounded-2xl font-black lowercase shadow-lg active:brightness-95 disabled:opacity-40"
                  >
                    {isOwned ? 'garajında bulunuyor' : 'satın al'}
                  </button>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
