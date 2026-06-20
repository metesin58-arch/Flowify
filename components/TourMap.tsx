
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, CityKey } from '../types';
import { CITIES, getAdjustedCities } from '../constants';
import { playClickSound, playErrorSound, playWinSound } from '../services/sfx';
import { canUnlockCity } from '../services/gameLogic';
import { LockIcon, GlobeIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  player: PlayerStats;
  onSelectCity: (city: CityKey) => void;
  onClose: () => void;
}

// --- CONFIGURATION ---

const CITY_DATA: Record<CityKey, { x: number; y: number; color: string; outline: string }> = {
  eskisehir: { x: 350, y: 320, color: "#fbbf24", outline: "/cities/eskisehir.png" },
  bursa: { x: 180, y: 280, color: "#22c55e", outline: "/cities/bursa.png" },
  ankara: { x: 550, y: 350, color: "#ef4444", outline: "/cities/ankara.png" },
  izmir: { x: 120, y: 500, color: "#00ccff", outline: "/cities/izmir.png" },
  istanbul: { x: 200, y: 150, color: "#a855f7", outline: "/cities/istanbul.png" }
};

// Connection Lines (Start -> End) based on center points
const CONNECTIONS = [
    { from: 'izmir', to: 'bursa' },
    { from: 'bursa', to: 'istanbul' },
    { from: 'bursa', to: 'eskisehir' },
    { from: 'eskisehir', to: 'ankara' }
];

export const TourMap: React.FC<Props> = ({ player, onSelectCity, onClose }) => {
  const citiesConfig = getAdjustedCities(player.startingCity);
  const [selectedPreview, setSelectedPreview] = useState<CityKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-select current city and CENTER CAMERA
  useEffect(() => {
      const currentCityKey = player.currentCity || 'eskisehir';
      setSelectedPreview(currentCityKey);
      
      // Auto-Center Logic
      if (scrollRef.current) {
          const island = CITY_DATA[currentCityKey];
          const isMobile = window.innerWidth < 768;
          
          // These values mimic the scale and padding applied in the JSX
          const scale = isMobile ? 1.2 : 1.0; 
          const paddingLeft = isMobile ? 40 : 64; // px
          const paddingTop = isMobile ? 128 : 128; // px
          
          // Calculate where the city is in the scaled scrollable area
          const cityPixelX = (island.x * scale) + paddingLeft;
          const cityPixelY = (island.y * scale) + paddingTop;
          
          // Calculate center of viewport
          const viewportW = window.innerWidth;
          const viewportH = window.innerHeight;
          
          // Scroll to center the city
          scrollRef.current.scrollTo({
              left: cityPixelX - (viewportW / 2),
              top: cityPixelY - (viewportH / 2),
              behavior: 'smooth'
          });
      }
  }, []);

  const handleCityClick = (cityId: CityKey) => {
    const isUnlocked = player.unlockedCities.includes(cityId);
    const canUnlock = canUnlockCity(cityId, player);
    
    if (isUnlocked || canUnlock) {
      playClickSound();
      setSelectedPreview(cityId);
    } else {
      playErrorSound();
      setSelectedPreview(cityId); // Show requirements
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020408] flex flex-col overflow-hidden font-sans">
        
        {/* --- BACKGROUND SPACE (Fixed) --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[#050505]" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Luxury Ambiance Glows */}
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#1DB954]/5 rounded-full blur-[130px] opacity-40" />
            <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[130px] opacity-30" />
        </div>

        {/* --- HEADER / CONTROLS --- */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center pointer-events-auto shadow-2xl group"
            >
                <span className="group-hover:-translate-x-0.5 transition-transform duration-300 text-xl">←</span>
            </button>
            
            {/* Large Decorative Map Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[#1DB954]/5 rounded-full blur-[150px] opacity-50" />
            
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-[#1DB954]/20 pointer-events-auto">
                <span className="text-[10px] font-black text-[#1DB954]/60 uppercase tracking-[0.3em]">Türkiye Turnesi</span>
            </div>
            
            <div className="w-12 h-12" /> {/* Spacer */}
        </div>

        {/* --- SCROLLABLE MAP CONTAINER --- */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative custom-scrollbar touch-auto">
            
            {/* The Map Plane */}
            <div 
                className="relative min-w-[250vw] md:min-w-[150vw] min-h-[150vh] p-32"
            >
                {/* Connection Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <defs>
                        <filter id="line-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1DB954" stopOpacity="0" />
                            <stop offset="50%" stopColor="#1DB954" stopOpacity="1" />
                            <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
                        </linearGradient>
                    </defs>
 
                    {/* Main Turkey Map Outline (Subtle & Detailed) */}
                    <g opacity="0.05">
                        <path 
                            d="M150,250 C180,230 220,220 250,210 C300,200 350,210 400,200 C450,190 500,180 550,190 C600,180 650,190 700,180 C750,190 800,200 850,210 C900,230 950,260 980,320 C1000,400 980,500 920,550 C850,600 750,620 650,630 C550,640 450,650 350,640 C250,630 150,610 100,580 C50,540 30,450 40,350 C50,280 100,260 150,250 Z" 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="2"
                            strokeDasharray="10,10"
                        />
                    </g>

                    {CONNECTIONS.map((conn, i) => {
                        const start = CITY_DATA[conn.from as CityKey];
                        const end = CITY_DATA[conn.to as CityKey];
                        const isUnlocked = player.unlockedCities.includes(conn.to as CityKey) && player.unlockedCities.includes(conn.from as CityKey);
                        
                        return (
                            <g key={i}>
                                {/* Core Connection Line */}
                                <path
                                    d={`M ${start.x},${start.y} L ${end.x},${end.y}`}
                                    stroke={isUnlocked ? '#1DB954' : '#ffffff'}
                                    strokeWidth="1"
                                    strokeDasharray={isUnlocked ? "none" : "4,8"}
                                    fill="none"
                                    opacity={isUnlocked ? 0.4 : 0.1}
                                />
                                {isUnlocked && (
                                    <motion.path
                                        d={`M ${start.x},${start.y} L ${end.x},${end.y}`}
                                        stroke="url(#line-grad)"
                                        strokeWidth="2"
                                        fill="none"
                                        initial={{ strokeDasharray: "0, 1000", strokeDashoffset: 0 }}
                                        animate={{ strokeDasharray: "100, 1000", strokeDashoffset: -1000 }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: i * 0.5
                                        }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* City Nodes */}
                {Object.keys(CITY_DATA).map((key, index) => {
                    const cityId = key as CityKey;
                    const data = CITY_DATA[cityId];
                    const isUnlocked = player.unlockedCities.includes(cityId);
                    const isSelected = selectedPreview === cityId;
                    const isCurrent = player.currentCity === cityId;
                    const cityConfig = citiesConfig[cityId];

                    return (
                        <motion.div 
                            key={cityId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                y: [0, -8, 0]
                            }}
                            transition={{ 
                                opacity: { duration: 0.6, delay: index * 0.05 },
                                scale: { duration: 0.6, delay: index * 0.05 },
                                y: { 
                                    duration: 3 + Math.random() * 2, 
                                    repeat: Infinity, 
                                    ease: "easeInOut",
                                    delay: index * 0.2
                                }
                            }}
                            className="absolute z-10"
                            style={{ 
                                left: data.x, 
                                top: data.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div 
                                onClick={() => handleCityClick(cityId)}
                                className="relative flex flex-col items-center group cursor-pointer"
                            >
                                {/* City Shape Outline (Actual PNG) */}
                                <div className={`absolute -inset-16 opacity-20 transition-all duration-700 pointer-events-none flex items-center justify-center ${isSelected ? 'opacity-80 scale-125' : 'scale-100'}`}>
                                    <img 
                                        src={data.outline} 
                                        alt="" 
                                        className="w-full h-full object-contain filter invert brightness-200"
                                        style={{ 
                                            filter: isSelected 
                                                ? `invert(1) drop-shadow(0 0 20px #1DB954)` 
                                                : 'invert(1) opacity(0.4)' 
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                        referrerPolicy="no-referrer"
                                    />
                                </div>

                                {/* City Node Circle */}
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 relative z-10 ${
                                    isSelected 
                                    ? 'bg-[#1DB954] border-white shadow-[0_0_50px_rgba(29,185,84,0.9)] scale-110' 
                                    : isUnlocked 
                                        ? `bg-black/80 backdrop-blur-md border-[#1DB954]/30 hover:border-[#1DB954]/80` 
                                        : 'bg-black/40 border-white/5 opacity-40 grayscale'
                                }`}>
                                    {isUnlocked ? (
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#1DB954]'}`} />
                                    ) : (
                                        <LockIcon className="w-3 h-3 text-white/20" />
                                    )}
                                    
                                    {isCurrent && !isSelected && (
                                        <div className="absolute -inset-2 rounded-full border border-[#1DB954]/40 animate-ping" />
                                    )}
                                </div>

                                {/* City Name Box (Modern Gold Design) */}
                                <div className={`mt-3 px-3 py-1 rounded-full border transition-all duration-500 relative z-10 flex items-center gap-2 ${
                                    isSelected 
                                    ? 'bg-gradient-to-r from-[#1DB954] to-[#1ed760] border-white shadow-[0_10px_20px_rgba(29,185,84,0.4)]' 
                                    : 'bg-black/80 backdrop-blur-md border-[#1DB954]/10 group-hover:border-[#1DB954]/40'
                                }`}>
                                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#1DB954]/40'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] font-mono ${
                                        isSelected ? 'text-white' : 'text-[#1DB954]/60 group-hover:text-[#1DB954]'
                                    }`}>
                                        {cityConfig.name}
                                    </span>
                                </div>

                                {isCurrent && (
                                    <div className="absolute -top-10 bg-[#1DB954] text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-[#1DB954]/20">
                                        AKTİF
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>

        {/* --- BOTTOM FLOATING BENTO WIDGET --- */}
        <div 
            className={`fixed bottom-6 left-4 right-4 z-[250] bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] max-w-sm mx-auto ${selectedPreview ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-32 scale-95 opacity-0 pointer-events-none'}`}
        >
            {selectedPreview && (() => {
                const config = citiesConfig[selectedPreview];
                const isUnlocked = player.unlockedCities.includes(selectedPreview);
                const canUnlock = !isUnlocked && canUnlockCity(selectedPreview, player);
                const isCurrent = player.currentCity === selectedPreview;
                const color = CITY_DATA[selectedPreview].color;

                let btnText = "gereksinimleri karşıla";
                let btnDisabled = true;
                let statusBadge = <span className="text-red-500 font-black border border-red-500/20 px-2 py-0.5 rounded-lg text-[8px] tracking-tight">kilitli</span>;

                if (isCurrent) {
                    btnText = "konser ver";
                    btnDisabled = false;
                    statusBadge = <span className="text-[#1DB954] font-black bg-[#1DB954]/10 border border-[#1DB954]/20 px-2 py-0.5 rounded-lg text-[8px] tracking-tight">konser ver</span>;
                } else if (isUnlocked) {
                    btnText = "seyahat et";
                    btnDisabled = false;
                    statusBadge = <span className="text-purple-400 font-black bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-[8px] tracking-tight">unlocked</span>;
                } else if (canUnlock) {
                    btnText = "bölgeyi aç";
                    btnDisabled = false;
                    statusBadge = <span className="text-emerald-400 font-black border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[8px] tracking-tight animate-pulse">açılabilir</span>;
                }

                return (
                    <div className="w-full flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5 animate-fade-in">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none" style={{ textShadow: `0 0 15px ${color}33` }}>
                                        {config.name.toLowerCase()}
                                    </h2>
                                    {statusBadge}
                                </div>
                                <div className="text-neutral-500 text-[8px] font-bold uppercase tracking-widest">çarpanı: <span className="text-[#1DB954]">{config.multiplier}x</span> • {config.name.toLowerCase()} bölgesi</div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {!isUnlocked && !canUnlock && (
                            <div className="bg-red-950/20 border border-red-500/10 p-2.5 rounded-2xl flex items-center gap-2">
                                <span className="text-xs">⚠️</span>
                                <div>
                                    <div className="text-red-500 font-extrabold text-[8px] uppercase tracking-wider leading-none mb-0.5">erişim kilitli</div>
                                    <div className="text-neutral-400 text-[10px] font-medium leading-none">{config.unlockRequirements.description.toLowerCase()}</div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => !btnDisabled && onSelectCity(selectedPreview)}
                            disabled={btnDisabled}
                            className={`w-full py-3 rounded-2xl font-black uppercase tracking-wider text-xs transition-all duration-300 ${
                                btnDisabled 
                                ? 'bg-white/5 text-neutral-600 cursor-not-allowed border border-white/5' 
                                : isCurrent
                                    ? 'bg-[#1DB954] text-black hover:scale-[1.02] active:scale-95 shadow-[0_8px_24px_rgba(29,185,84,0.35)]'
                                    : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-xl'
                            }`}
                        >
                            {btnText}
                        </button>
                    </div>
                );
            })()}
        </div>

        <style>{`
            @keyframes dashFlow {
                to { stroke-dashoffset: -30; }
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 0px;
                height: 0px;
            }
        `}</style>

    </div>
  );
};
