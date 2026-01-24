
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, CityKey } from '../types';
import { CITIES } from '../constants';
import { playClickSound, playErrorSound, playWinSound } from '../services/sfx';
import { canUnlockCity } from '../services/gameLogic';

interface Props {
  player: PlayerStats;
  onSelectCity: (city: CityKey) => void;
  onClose: () => void;
}

// --- CONFIGURATION ---

const ISLANDS: Record<CityKey, { path: string; color: string; cx: number; cy: number; labelY: number }> = {
  eskisehir: { 
    // Small, sharp shard
    path: "M 100,400 L 140,390 L 150,420 L 110,440 L 90,420 Z", 
    color: "#fbbf24", // Yellow
    cx: 120, cy: 415, labelY: 460
  },
  bursa: { 
    // Triangular, wider
    path: "M 180,300 L 240,280 L 270,320 L 230,350 L 170,330 Z", 
    color: "#22c55e", // Green
    cx: 220, cy: 315, labelY: 360
  },
  ankara: { 
    // Blocky, central fortress
    path: "M 350,250 L 420,230 L 460,260 L 440,310 L 370,320 L 340,280 Z", 
    color: "#ef4444", // Red
    cx: 400, cy: 275, labelY: 330
  },
  izmir: { 
    // Long coastal strip style
    path: "M 550,350 L 620,330 L 670,360 L 650,400 L 580,410 L 540,380 Z", 
    color: "#00ccff", // Blue
    cx: 605, cy: 370, labelY: 425
  },
  istanbul: { 
    // Complex, grand shape
    path: "M 420,100 L 480,40 L 540,60 L 560,110 L 520,150 L 440,140 Z", 
    color: "#a855f7", // Purple/Gold
    cx: 490, cy: 100, labelY: 160 
  }
};

// Connection Lines (Start -> End) based on center points
const CONNECTIONS = [
    { from: 'eskisehir', to: 'bursa' },
    { from: 'bursa', to: 'ankara' },
    { from: 'ankara', to: 'izmir' },
    { from: 'izmir', to: 'istanbul' }
];

export const TourMap: React.FC<Props> = ({ player, onSelectCity, onClose }) => {
  const [selectedPreview, setSelectedPreview] = useState<CityKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-select current city and CENTER CAMERA
  useEffect(() => {
      const currentCityKey = player.currentCity || 'eskisehir';
      setSelectedPreview(currentCityKey);
      
      // Auto-Center Logic
      if (scrollRef.current) {
          const island = ISLANDS[currentCityKey];
          const isMobile = window.innerWidth < 768;
          
          // These values mimic the scale and padding applied in the JSX
          const scale = isMobile ? 1.4 : 1.0; 
          const paddingLeft = isMobile ? 40 : 64; // px
          const paddingTop = isMobile ? 128 : 128; // px
          
          // Calculate where the city is in the scaled scrollable area
          const cityPixelX = (island.cx * scale) + paddingLeft;
          const cityPixelY = (island.cy * scale) + paddingTop;
          
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
      if (selectedPreview === cityId && isUnlocked) {
        playWinSound();
        onSelectCity(cityId);
      } else {
        setSelectedPreview(cityId);
      }
    } else {
      playErrorSound();
      setSelectedPreview(cityId); // Show requirements
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col overflow-hidden font-sans">
        
        {/* --- BACKGROUND SPACE (Fixed) --- */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000_100%)] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

        {/* --- HEADER --- */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none bg-gradient-to-b from-black/90 to-transparent">
            <div className="pointer-events-auto max-w-[80%]">
                <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] leading-tight">
                    KONSERİ HANGİ ŞEHİRDE VERECEKSİN?
                </h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.3em]">Uydu Bağlantısı</span>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center pointer-events-auto shadow-lg"
            >
                ✕
            </button>
        </div>

        {/* --- SCROLLABLE MAP CONTAINER --- */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative custom-scrollbar touch-auto">
            
            {/* The Map Plane - Updated Scale (1.4) and Width (200vw) */}
            <div 
                className="relative min-w-[200vw] md:min-w-[130vw] min-h-[120vh] origin-top-left p-10 pt-32 pb-48 pl-16 transition-transform duration-300"
            >
                <svg 
                    viewBox="0 0 1000 600" 
                    className="w-full h-full overflow-visible pointer-events-auto drop-shadow-2xl transform scale-[1.4] md:scale-100 origin-top-left"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* 1. GRID LINES */}
                    <g className="opacity-30 pointer-events-none">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={600} stroke="#333" strokeWidth="1" />
                        ))}
                        {Array.from({ length: 15 }).map((_, i) => (
                            <line key={`h-${i}`} x1={0} y1={i * 40} x2={1000} y2={i * 40} stroke="#333" strokeWidth="1" />
                        ))}
                    </g>

                    {/* 2. CABLES */}
                    <g>
                        {CONNECTIONS.map((conn, i) => {
                            const start = ISLANDS[conn.from as CityKey];
                            const end = ISLANDS[conn.to as CityKey];
                            const isUnlocked = player.unlockedCities.includes(conn.to as CityKey);
                            
                            return (
                                <path
                                    key={i}
                                    d={`M ${start.cx},${start.cy} L ${end.cx},${end.cy}`}
                                    stroke={isUnlocked ? end.color : '#333'}
                                    strokeWidth="4"
                                    strokeDasharray="15,10"
                                    fill="none"
                                    className={isUnlocked ? 'animate-[dashFlow_2s_linear_infinite]' : ''}
                                    opacity={isUnlocked ? 0.8 : 0.2}
                                />
                            );
                        })}
                    </g>

                    {/* 3. ISLANDS */}
                    {Object.keys(ISLANDS).map((key, index) => {
                        const cityId = key as CityKey;
                        const data = ISLANDS[cityId];
                        const isUnlocked = player.unlockedCities.includes(cityId);
                        const isSelected = selectedPreview === cityId;
                        const isCurrent = player.currentCity === cityId;
                        const canUnlock = !isUnlocked && canUnlockCity(cityId, player);

                        // Visual State
                        let fillColor = "rgba(20,20,20,0.9)";
                        let strokeColor = "#444";
                        let strokeWidth = "3";
                        let filter = "";
                        let animationClass = index % 2 === 0 ? "animate-[float_6s_ease-in-out_infinite]" : "animate-[float_8s_ease-in-out_infinite]";

                        if (isCurrent) {
                            strokeColor = "#fff";
                            fillColor = `${data.color}44`; 
                            filter = "url(#neon-glow)";
                            strokeWidth = "6";
                        } else if (isUnlocked) {
                            strokeColor = data.color;
                            fillColor = "rgba(20,20,20,0.95)";
                            if (isSelected) fillColor = `${data.color}33`;
                        } else if (canUnlock) {
                            strokeColor = data.color;
                            animationClass = "animate-[pulse_1.5s_infinite]";
                            filter = "url(#neon-glow)";
                        }

                        return (
                            <g 
                                key={cityId} 
                                onClick={(e) => { e.stopPropagation(); handleCityClick(cityId); }}
                                className={`cursor-pointer group transition-all duration-300 ${animationClass}`}
                                style={{ 
                                    animationDelay: `${index * 0.5}s`,
                                    transformOrigin: `${data.cx}px ${data.cy}px`
                                }}
                            >
                                {/* Glow */}
                                {isSelected && (
                                    <circle cx={data.cx} cy={data.cy} r="80" fill={data.color} opacity="0.2" filter="url(#neon-glow)" />
                                )}

                                {/* Shape */}
                                <path
                                    d={data.path}
                                    fill={fillColor}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    filter={filter}
                                    className="transition-all duration-300 group-hover:fill-white/10 group-active:scale-95"
                                />

                                {/* Icon / Label Group */}
                                <g transform={`translate(${data.cx}, ${data.cy})`}>
                                    
                                    {/* Marker */}
                                    {isCurrent && (
                                        <g>
                                            <circle r="15" fill={data.color} opacity="0.3" className="animate-ping" />
                                            <circle r="6" fill="#fff" />
                                        </g>
                                    )}
                                    
                                    {!isUnlocked && !canUnlock && (
                                        <text x="-12" y="8" fontSize="24" fill="#555">🔒</text>
                                    )}

                                    {/* Styled Cyber Label (Small Tag) */}
                                    <g 
                                        transform={`translate(0, ${data.labelY - data.cy})`} 
                                        className={`transition-all duration-300`}
                                    >
                                        {/* Cyber Tag Shape (Chamfered Rectangle) */}
                                        <path 
                                            d="M -45,-12 L 35,-12 L 45,0 L 35,12 L -45,12 L -55,0 Z" 
                                            fill="#000" 
                                            stroke={strokeColor} 
                                            strokeWidth="1.5"
                                            className={`${isSelected ? 'fill-white/10' : ''}`}
                                        />
                                        
                                        <text 
                                            x="-5" y="4" 
                                            textAnchor="middle" 
                                            fill={isUnlocked || canUnlock ? "white" : "#777"} 
                                            fontSize="10" 
                                            fontWeight="bold" 
                                            fontFamily="monospace"
                                            className="uppercase tracking-widest pointer-events-none select-none"
                                        >
                                            {CITIES[cityId].name}
                                        </text>
                                    </g>
                                </g>
                            </g>
                        );
                    })}

                </svg>
            </div>
        </div>

        {/* --- BOTTOM INFO PANEL --- */}
        <div 
            className={`fixed bottom-0 left-0 right-0 z-[250] bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 p-6 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${selectedPreview ? 'translate-y-0' : 'translate-y-full'}`}
        >
            {selectedPreview && (() => {
                const config = CITIES[selectedPreview];
                const isUnlocked = player.unlockedCities.includes(selectedPreview);
                const canUnlock = !isUnlocked && canUnlockCity(selectedPreview, player);
                const isCurrent = player.currentCity === selectedPreview;
                const color = ISLANDS[selectedPreview].color;

                let btnText = "GEREKSİNİMLERİ KARŞILA";
                let btnDisabled = true;
                let statusBadge = <span className="text-red-500 font-bold border border-red-500/30 px-2 py-0.5 rounded text-[10px]">KİLİTLİ</span>;

                if (isCurrent) {
                    btnText = "BURADASIN";
                    statusBadge = <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-[10px]">MEVCUT KONUM</span>;
                } else if (isUnlocked) {
                    btnText = "SEYAHAT ET";
                    btnDisabled = false;
                    statusBadge = <span className="text-yellow-500 font-bold border border-yellow-500/30 px-2 py-0.5 rounded text-[10px]">AÇIK</span>;
                } else if (canUnlock) {
                    btnText = "BÖLGEYİ AÇ";
                    btnDisabled = false;
                    statusBadge = <span className="text-[#1ed760] font-bold border border-[#1ed760]/30 px-2 py-0.5 rounded text-[10px] animate-pulse">AÇILABİLİR</span>;
                }

                return (
                    <div className="max-w-md mx-auto flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none" style={{ textShadow: `0 0 20px ${color}` }}>
                                        {config.name}
                                    </h2>
                                    {statusBadge}
                                </div>
                                <div className="text-neutral-400 text-xs font-medium">{config.name} Bölgesi Yeraltı Ağı</div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-black text-xl">x{config.multiplier} <span className="text-[10px] font-medium text-neutral-500 uppercase">Gelir</span></div>
                                <div className="text-red-400 font-bold text-xs">-₺{config.weeklyCost.toLocaleString()} <span className="text-[9px] text-neutral-500">/Hafta</span></div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {!isUnlocked && !canUnlock && (
                            <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3">
                                <div className="text-xl">🛑</div>
                                <div>
                                    <div className="text-red-500 font-bold text-[10px] uppercase tracking-wider mb-0.5">Gereksinim</div>
                                    <div className="text-neutral-300 text-xs">{config.unlockRequirements.description}</div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => !btnDisabled && onSelectCity(selectedPreview)}
                            disabled={btnDisabled}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg transition-all ${
                                btnDisabled 
                                ? 'bg-[#222] text-neutral-600 cursor-not-allowed border border-white/5' 
                                : canUnlock 
                                    ? 'bg-[#1ed760] text-black hover:scale-[1.02] animate-pulse'
                                    : 'bg-white text-black hover:scale-[1.02]'
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
                to { stroke-dashoffset: -25; }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
            }
        `}</style>

    </div>
  );
};
