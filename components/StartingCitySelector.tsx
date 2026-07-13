
import React, { useState, useEffect, useRef } from 'react';
import { CityKey } from '../types';
import { CITIES } from '../constants';
import { playClickSound, playWinSound } from '../services/sfx';
import { motion } from 'motion/react';

interface Props {
  onSelect: (city: CityKey) => void;
  onBack: () => void;
}

const CITY_DATA: Record<CityKey, { x: number; y: number; color: string; outline: string }> = {
  eskisehir: { x: 350, y: 320, color: "#fbbf24", outline: "/cities/eskisehir.png" },
  bursa: { x: 180, y: 280, color: "#22c55e", outline: "/cities/bursa.png" },
  ankara: { x: 550, y: 350, color: "#ef4444", outline: "/cities/ankara.png" },
  izmir: { x: 120, y: 500, color: "#00ccff", outline: "/cities/izmir.png" },
  istanbul: { x: 200, y: 150, color: "#a855f7", outline: "/cities/istanbul.png" }
};

const CONNECTIONS = [
    { from: 'izmir', to: 'bursa' },
    { from: 'bursa', to: 'istanbul' },
    { from: 'bursa', to: 'eskisehir' },
    { from: 'eskisehir', to: 'ankara' }
];

export const StartingCitySelector: React.FC<Props> = ({ onSelect, onBack }) => {
  const [selectedCity, setSelectedCity] = useState<CityKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Center on Ankara by default
    if (scrollRef.current) {
      const island = CITY_DATA['ankara'];
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 1.2 : 1.0; 
      const paddingLeft = isMobile ? 40 : 64;
      const paddingTop = isMobile ? 128 : 128;
      
      const cityPixelX = (island.x * scale) + paddingLeft;
      const cityPixelY = (island.y * scale) + paddingTop;
      
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      
      scrollRef.current.scrollTo({
        left: cityPixelX - (viewportW / 2),
        top: cityPixelY - (viewportH / 2),
        behavior: 'smooth'
      });
    }
  }, []);

  const handleCityClick = (cityId: CityKey) => {
    playClickSound();
    setSelectedCity(cityId);
  };

  const handleConfirm = () => {
    if (selectedCity) {
      playWinSound();
      onSelect(selectedCity);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1DB954_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[#1DB954]/5 rounded-full blur-[150px] opacity-50" />
      </div>

      <div className="absolute left-0 right-0 z-50 px-6 flex flex-col items-center pointer-events-none" style={{ top: 0, paddingTop: 'calc(var(--safe-top, 12px) + 8px)' }}>
        <div className="flex w-full justify-between items-center mb-4">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center pointer-events-auto shadow-2xl group"
            >
                <span className="group-hover:-translate-x-0.5 transition-transform duration-300 text-lg">←</span>
            </button>
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/20 pointer-events-auto">
                <span className="text-[10px] font-bold text-yellow-500 lowercase tracking-tight">başlangıç şehri.</span>
            </div>
            <div className="w-10 h-10" />
        </div>
        <p className="text-neutral-500 text-[10px] font-bold lowercase tracking-tight pointer-events-auto bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">kariyerine hangi şehirde başlamak istersin?</p>
      </div>

      {/* Map */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative custom-scrollbar touch-auto">
        <div className="relative min-w-[250vw] md:min-w-[150vw] min-h-[150vh] p-32">
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
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
                return (
                    <path
                        key={i}
                        d={`M ${start.x},${start.y} L ${end.x},${end.y}`}
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeDasharray="4,8"
                        fill="none"
                        opacity="0.1"
                    />
                );
            })}
          </svg>

          {Object.keys(CITY_DATA).map((key, index) => {
            const cityId = key as CityKey;
            const data = CITY_DATA[cityId];
            const isSelected = selectedCity === cityId;
            const cityConfig = CITIES[cityId];

            return (
              <motion.div 
                key={cityId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{ 
                  opacity: { duration: 0.6, delay: index * 0.05 },
                  scale: { duration: 0.6, delay: index * 0.05 },
                  y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }
                }}
                className="absolute z-10"
                style={{ left: data.x, top: data.y, transform: 'translate(-50%, -50%)' }}
              >
                <div onClick={() => handleCityClick(cityId)} className="relative flex flex-col items-center group cursor-pointer">
                  <div className={`absolute -inset-16 opacity-20 transition-all duration-700 pointer-events-none flex items-center justify-center ${isSelected ? 'opacity-80 scale-125' : 'scale-100'}`}>
                    <img 
                      src={data.outline} 
                      alt="" 
                      className="w-full h-full object-contain filter invert brightness-200"
                      style={{ filter: isSelected ? `invert(1) drop-shadow(0 0 20px #eab308)` : 'invert(1) opacity(0.4)' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 relative z-10 ${
                    isSelected ? 'bg-yellow-500 border-white shadow-[0_0_50px_rgba(234,179,8,0.9)] scale-110' : 'bg-black/80 backdrop-blur-md border-yellow-500/30 hover:border-yellow-500/80'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-yellow-500'}`} />
                  </div>

                  <div className={`mt-3 px-3 py-1 rounded-full border transition-all duration-500 relative z-10 flex items-center gap-2 ${
                    isSelected ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 border-white shadow-[0_10px_20px_rgba(234,179,8,0.4)]' : 'bg-black/80 backdrop-blur-md border-yellow-500/10 group-hover:border-yellow-500/40'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-yellow-500/40'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] font-mono ${isSelected ? 'text-white' : 'text-yellow-500/60 group-hover:text-yellow-500'}`}>
                      {cityConfig.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`fixed bottom-0 left-0 right-0 z-[250] bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/10 p-6 pb-8 transition-transform duration-500 ${selectedCity ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-xs mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white lowercase">
                        {selectedCity && CITIES[selectedCity].name.toLowerCase()}.
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-yellow-500 font-bold text-xs lowercase tracking-tight">seçildi.</div>
                </div>
            </div>
            <button 
                onClick={handleConfirm}
                className="w-full py-4 rounded-xl bg-white text-black font-semibold lowercase tracking-tight text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
                kariyerine başla.
            </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; }
      `}</style>
    </div>
  );
};
