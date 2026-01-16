
import React, { useEffect, useState } from 'react';
import { PlayerStats, CityKey, CharacterAppearance } from '../types';
import { Avatar } from './Avatar';
import { formatListeners } from '../services/gameLogic';
import { MicIcon, PlayIcon, CoinIcon, SpadeCardIcon, PlusIcon, DiamondIcon, ArrowUpDownIcon, CheckIcon, RocketIcon, SwordIcon } from './Icons';
import { CareerTutorial } from './CareerTutorial';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { BattleBetGame } from './games/BattleBetGame';
import { BlackjackGame } from './games/BlackjackGame';
import { ZeppelinGame } from './games/ZeppelinGame';
import { CITIES, ECONOMY, HEAD_OPTIONS, CLOTHING_STYLES, HAT_STYLES, CHAIN_STYLES } from '../constants';

// New Features
import { SahisindenMarket, HitMakerStudio, ManagerAgency } from './CityFeatures';
import { TourMap } from './TourMap';
import { IAPStore, IAPTab } from './IAPStore';
import { StyleShop } from './StyleShop';

interface Props {
  player: PlayerStats;
  onStartSetup: () => void;
  onExit: () => void;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  updateMultipleStats: (updates: Partial<PlayerStats>) => void;
  onEditCharacter?: () => void;
  onOpenShop?: (tab: IAPTab) => void; // Optional here to support legacy props if needed
}

// Reusable Card Component for Casino (Matched with NightLife.tsx)
const CasinoCard = ({ title, subtitle, description, icon, bgIcon, accentColor, badge, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full group relative h-36 rounded-2xl overflow-hidden text-left transition-all duration-300 active:scale-[0.96] mb-4 border border-white/5 shadow-lg"
    >
        <div 
            className="absolute inset-0 z-0"
            style={{ 
                background: `linear-gradient(90deg, #050505 0%, #050505 30%, ${accentColor}25 100%)`
            }}
        ></div>
        
        <div className="absolute right-6 bottom-[-20px] opacity-[0.05] transform rotate-[10deg] scale-[2.8] z-10 transition-transform duration-700 group-hover:scale-[3.2] group-hover:rotate-[5deg]">
            {bgIcon}
        </div>

        <div className="relative z-30 p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0 border border-white/10"
                        style={{ background: 'linear-gradient(135deg, #222 0%, #0a0a0a 100%)' }}
                    >
                        <div style={{ color: accentColor }}>
                            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7 filter drop-shadow-md' })}
                        </div>
                    </div>

                    <div className="min-w-0">
                        {badge && (
                            <div className="flex mb-1">
                                <span 
                                    className="text-[7px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border"
                                    style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30`, color: accentColor }}
                                >
                                    {badge}
                                </span>
                            </div>
                        )}
                        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">
                            {title}
                        </h2>
                        <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.15em] group-hover:text-white transition-colors">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
                    <PlayIcon className="w-3 h-3 text-white group-hover:text-black transition-colors ml-0.5" />
                </div>
            </div>

            <p className="text-neutral-400 text-[10px] font-medium leading-relaxed max-w-[85%] line-clamp-2 mt-1">
                {description}
            </p>
        </div>
    </button>
);

export const CareerHub: React.FC<Props> = ({ player, onStartSetup, onExit, updateStat, updateMultipleStats, onEditCharacter, onOpenShop }) => {
  
  // Animation state
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'hub' | 'shop' | 'casino_menu' | 'battlebet' | 'blackjack' | 'zeppelin'>('hub');
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  // --- NEW MODAL STATES ---
  const [activeModal, setActiveModal] = useState<'none' | 'map' | 'market' | 'studio' | 'agency'>('none');

  const isVerified = player.ownedUpgrades?.['verified_badge'] > 0;

  useEffect(() => {
      setMounted(true);
      const seen = localStorage.getItem('flowify_career_intro_seen');
      if (!seen) {
          setShowTutorial(true);
      }
  }, []);

  const closeTutorial = () => {
      playClickSound();
      localStorage.setItem('flowify_career_intro_seen', 'true');
      setShowTutorial(false);
  };

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const handleNav = (target: 'hub' | 'shop' | 'casino_menu') => {
      playClickSound();
      setView(target);
  };

  const handleOpenShopSafe = (tab: IAPTab) => {
      if (onOpenShop) {
          onOpenShop(tab);
      } else {
          console.warn("IAP Store not connected via props");
      }
  };

  // --- FEATURE ACTIONS ---
  const handleVehicleBuy = (vehicleId: string, cost: number) => {
      updateMultipleStats({
          careerCash: -cost, 
          inventory: { ...player.inventory, vehicles: [...player.inventory.vehicles, vehicleId] }
      });
  };

  const handleCityUnlock = (cityId: CityKey) => {
      if (!player.unlockedCities.includes(cityId)) {
          updateMultipleStats({ unlockedCities: [...player.unlockedCities, cityId] });
      }
  };

  const handleCitySelect = (cityId: CityKey) => {
      updateMultipleStats({ currentCity: cityId });
      setActiveModal('none');
  };

  const handleHitSong = () => {
      updateMultipleStats({ career: { ...player.career, hasHitSong: true } });
  };

  const handleManagerHire = (tier: number, cost: number) => {
      updateMultipleStats({ career: { ...player.career, managerTier: tier } });
  };

  const handleTrain = (skill: 'flow' | 'lyrics' | 'rhythm' | 'charisma') => {
      playClickSound();
      if (player.energy < ECONOMY.COST.TRAINING) { handleOpenShopSafe('energy'); return; }
      if (player.careerCash < ECONOMY.TRAINING_PRICE) { handleOpenShopSafe('currency'); return; }

      updateMultipleStats({
          energy: -ECONOMY.COST.TRAINING,
          careerCash: -ECONOMY.TRAINING_PRICE,
          [skill]: 1
      });
      notify("Antrenman tamamlandı! Yeteneklerin gelişti.", 'success');
  };

  const handleFixRel = (rel: 'rel_manager' | 'rel_team' | 'rel_fans' | 'rel_partner') => {
      playClickSound();
      const cost = ECONOMY.TRAINING_PRICE;
      if (player.energy < ECONOMY.COST.RELATIONSHIP) { handleOpenShopSafe('energy'); return; }
      if (player.careerCash < cost) { handleOpenShopSafe('currency'); return; }
      if ((player[rel] as number) >= 100) { notify("İlişkin zaten mükemmel!", 'info'); return; }
      
      updateMultipleStats({
          energy: -ECONOMY.COST.RELATIONSHIP,
          careerCash: -cost,
          [rel]: 5
      });
      notify("İlişkiler düzeliyor...", 'success');
  };

  // --- SUB-COMPONENTS ---

  const MinimalSkillCard = ({ label, val, colorClass }: { label: string, val: number, colorClass: string }) => (
      <div className="bg-[#111] border border-white/5 rounded-lg p-2 flex flex-col items-center justify-center">
          <div className={`text-sm font-black ${colorClass}`}>{val}</div>
          <div className="text-[7px] text-neutral-500 uppercase font-bold tracking-wider">{label}</div>
      </div>
  );

  const MinimalRelCard = ({ label, val }: { label: string, val: number }) => (
      <div className="w-full">
          <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] font-bold text-neutral-400 uppercase">{label}</span>
              <span className={`text-[8px] font-bold ${val < 30 ? 'text-red-500' : 'text-white'}`}>{val}%</span>
          </div>
          <div className="h-1 bg-[#222] rounded-full overflow-hidden w-full">
              <div className={`h-full rounded-full transition-all duration-500 ${val < 30 ? 'bg-red-500' : val < 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, val)}%` }}></div>
          </div>
      </div>
  );

  const ActionCard = ({ title, subtitle, icon, action, cost, energyCost, color }: any) => (
      <button 
        onClick={action}
        className={`w-full flex items-center gap-4 p-3 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 rounded-xl group transition-all active:scale-[0.98] shadow-sm relative overflow-hidden`}
      >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-lg shrink-0 ${color}`}>
              {icon}
          </div>
          <div className="flex-1 text-left min-w-0">
              <div className="text-white font-bold text-xs truncate group-hover:text-[#1ed760] transition-colors">{title}</div>
              <div className="text-[9px] text-neutral-400 font-medium truncate">{subtitle}</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
              <div className="text-[9px] font-bold bg-black/40 px-2 py-0.5 rounded text-red-400 whitespace-nowrap border border-white/5">
                  -{energyCost} Enerji
              </div>
              <div className="text-[9px] font-bold bg-black/40 px-2 py-0.5 rounded text-yellow-400 whitespace-nowrap border border-white/5">
                  {cost}
              </div>
          </div>
      </button>
  );

  // --- VIEWS ---

  if (view === 'battlebet') return <BattleBetGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;
  if (view === 'blackjack') return <BlackjackGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;
  if (view === 'zeppelin') return <ZeppelinGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;

  if (view === 'casino_menu') {
      return (
        <div className="h-full bg-[#050505] relative flex flex-col">
            
            {/* Background Atmosphere */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] bg-green-900/10 rounded-full blur-[180px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-emerald-900/10 rounded-full blur-[150px]"></div>
            </div>

            {/* Header Section */}
            <div className="px-6 mb-4 relative z-30 shrink-0 pt-24 pb-4 border-b border-white/5 bg-gradient-to-b from-black via-black/95 to-transparent">
                <div className="absolute top-6 left-6 z-50">
                    <button onClick={() => setView('hub')} className="bg-[#222] text-white w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:bg-[#333] transition-colors">&larr;</button>
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.5em]">
                        HIGH STAKES ONLY
                    </span>
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
                    GECE HAYATI
                </h1>
            </div>

            {/* Game List */}
            <div className="flex-1 overflow-y-auto px-6 relative z-20 pb-32 pt-2 custom-scrollbar">
                <CasinoCard 
                    title="BATTLE BET"
                    subtitle="DÜELLO TAHMİNİ"
                    description="İki underground MC kapışır, sen kazananı tahmin edersin. Oranları takip et, doğru tarafa oyna."
                    accentColor="#f97316" // Orange
                    badge="POPÜLER"
                    icon={<SwordIcon />}
                    bgIcon={<div className="text-[120px] font-black italic text-white/5 select-none -rotate-12">VS</div>}
                    onClick={() => { playClickSound(); setView('battlebet'); }}
                />

                <CasinoCard 
                    title="ZEPPELIN"
                    subtitle="CRASH OYUNU"
                    description="Çarpan yükselirken, patlamadan önce paranı çek. Ne kadar yükseğe çıkarsan o kadar çok kazanırsın."
                    accentColor="#3b82f6" // Blue
                    badge="YENİ"
                    icon={<RocketIcon />}
                    bgIcon={<RocketIcon className="w-32 h-32" />}
                    onClick={() => { playClickSound(); setView('zeppelin'); }}
                />

                <CasinoCard 
                    title="BLACKJACK"
                    subtitle="KASAYA KARŞI"
                    description="Klasik 21 oyunu rap tarzıyla yenilendi. Kartları çek, 21'e yaklaş ve kasayı batır."
                    accentColor="#00ff95" // Neon Emerald
                    badge="CASINO"
                    icon={<SpadeCardIcon />}
                    bgIcon={<SpadeCardIcon className="w-32 h-32" />}
                    onClick={() => { playClickSound(); setView('blackjack'); }}
                />
            </div>
        </div>
      );
  }

  // --- STYLE SHOP (Integrated Component) ---
  if (view === 'shop') {
      return (
          <StyleShop 
            player={player} 
            updateMultipleStats={updateMultipleStats} 
            onBack={() => handleNav('hub')}
            onOpenShop={handleOpenShopSafe}
          />
      );
  }

  const currentCityConfig = CITIES[player.currentCity || 'eskisehir'];

  return (
    <div className={`h-full bg-[#090909] flex flex-col relative overflow-hidden font-sans ${mounted ? 'animate-slide-in-left' : 'opacity-0'}`}>
        
        {/* --- DAILY ACTIVITIES MODAL --- */}
        {showActivities && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-slide-in-up">
                <div className="p-6 pt-12 flex justify-between items-center border-b border-white/10">
                    <h2 className="text-2xl font-black text-white italic tracking-tighter">ANTRENMAN & GELİŞİM</h2>
                    <button onClick={() => setShowActivities(false)} className="bg-white/10 w-10 h-10 rounded-full text-white font-bold">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <h3 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Kişisel Gelişim</h3>
                    <div className="grid gap-3">
                        <ActionCard title="Stüdyo Antrenmanı" subtitle="+1 Flow Yeteneği" icon="🎙️" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-blue-400 bg-blue-500/10" action={() => handleTrain('flow')} delay={0} />
                        <ActionCard title="Kitap Oku" subtitle="+1 Lirik Yeteneği" icon="📚" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-green-400 bg-green-500/10" action={() => handleTrain('lyrics')} delay={50} />
                        <ActionCard title="Stil Danışmanı" subtitle="+1 Karizma (Swag)" icon="✨" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-purple-400 bg-purple-500/10" action={() => handleTrain('charisma')} delay={100} />
                    </div>
                    
                    <h3 className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-6">Sosyal İlişkiler</h3>
                    <div className="grid gap-3">
                        <ActionCard title="Menajer Toplantısı" subtitle="+5 Menajer İlişkisi" icon="🤝" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-blue-400 bg-blue-500/10" action={() => handleFixRel('rel_manager')} delay={150} />
                        <ActionCard title="Ekip Yemeği" subtitle="+5 Ekip İlişkisi" icon="🍕" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-purple-400 bg-purple-500/10" action={() => handleFixRel('rel_team')} delay={200} />
                        <ActionCard title="Fan Buluşması" subtitle="+5 Fan İlişkisi" icon="❤️" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-red-400 bg-red-500/10" action={() => handleFixRel('rel_fans')} delay={250} />
                        <ActionCard title="Romantik Yemek" subtitle="+5 Aşk (Partner İlişkisi)" icon="🌹" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-pink-400 bg-pink-500/10" action={() => handleFixRel('rel_partner')} delay={300} />
                    </div>
                </div>
            </div>
        )}

        {showTutorial && <CareerTutorial onClose={closeTutorial} />}
        
        {/* MODALS */}
        {activeModal === 'market' && <SahisindenMarket player={player} onClose={() => setActiveModal('none')} updateStat={updateStat} onVehicleBuy={handleVehicleBuy} onCityUnlock={handleCityUnlock} onOpenShop={handleOpenShopSafe} />}
        {activeModal === 'studio' && <HitMakerStudio player={player} onClose={() => setActiveModal('none')} updateStat={updateStat} onHitSong={handleHitSong} onCityUnlock={handleCityUnlock} onOpenShop={handleOpenShopSafe} />}
        {activeModal === 'agency' && <ManagerAgency player={player} onClose={() => setActiveModal('none')} updateStat={updateStat} onManagerHire={handleManagerHire} onCityUnlock={handleCityUnlock} onOpenShop={handleOpenShopSafe} />}
        {activeModal === 'map' && <TourMap player={player} onSelectCity={handleCitySelect} onClose={() => setActiveModal('none')} />}

        <div className="relative bg-black pt-safe-top overflow-hidden border-b border-white/10 shrink-0 min-h-[160px] md:min-h-[220px] flex flex-col justify-between shadow-2xl z-20">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 <div className="absolute -right-8 -top-6 opacity-60 grayscale-[30%] animate-[breathe_6s_ease-in-out_infinite]">
                    <Avatar appearance={player.appearance} gender={player.gender} size={300} />
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/80 to-transparent"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent"></div>
            </div>

            <div className="px-6 py-4 flex justify-between items-center relative z-20">
                <div className="flex gap-2">
                    <button onClick={() => { playClickSound(); onExit(); }} className="bg-black/40 backdrop-blur text-white p-2 rounded-full hover:bg-white/10 transition-colors border border-white/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                        onClick={() => { playClickSound(); if(onEditCharacter) onEditCharacter(); }} 
                        className="bg-black/40 backdrop-blur text-white px-6 py-2 rounded-full hover:bg-white/10 transition-colors border border-white/10 font-black text-[9px] uppercase tracking-widest flex items-center justify-center"
                    >
                        DÜZENLE
                    </button>
                </div>
                <button 
                    onClick={() => handleOpenShopSafe('vip')}
                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-800 border border-yellow-500/50 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-shimmer hover:scale-105 transition-transform bg-[length:200%_auto]"
                >
                    <DiamondIcon className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">PREMIUM</span>
                    <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded ml-1">SALE</span>
                </button>
            </div>

            <div className={`px-6 pb-6 relative z-10 w-full opacity-0 ${mounted ? 'animate-[slideInRight_0.6s_ease-out_forwards]' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    {isVerified && (
                        <div className="bg-blue-500 rounded-full p-0.5" title="Doğrulanmış Sanatçı">
                        <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M9 12L11 14L15 10" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    )}
                    <span className={`text-[9px] font-bold tracking-widest uppercase drop-shadow-md ${isVerified ? 'text-white' : 'text-neutral-400'}`}>
                        {isVerified ? 'Doğrulanmış Sanatçı' : 'Sanatçı'}
                    </span>
                </div>

                <h1 className="text-3xl xs:text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none mb-2 drop-shadow-lg select-none transition-transform origin-left">{player.name}</h1>
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] xs:text-[10px] font-bold text-white border border-white/5 backdrop-blur-md">
                        Hafta {player.week}
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-green-400 font-mono font-bold text-xs flex items-center bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 backdrop-blur-md">
                            ₺{player.careerCash.toLocaleString()}
                        </span>
                        
                        <div className="bg-blue-900/50 border border-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md ml-1">
                            <span>📍</span>
                            <span>{currentCityConfig.name}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-md flex-1 max-w-[180px]">
                        <div className="flex justify-between items-center text-[8px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                            <span>Enerji</span>
                            <span className={player.energy < 20 ? 'text-red-500' : 'text-white'}>{Math.floor(player.energy)} / {player.maxEnergy}</span>
                        </div>
                        <div className="flex gap-1">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < Math.floor(player.energy / 5) ? (player.energy < 20 ? 'bg-red-500' : 'bg-[#1ed760]') : 'bg-[#333]'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div className={`px-6 mt-4 mb-2 opacity-0 ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '200ms' }}>
            <button 
                onClick={() => { playClickSound(); onStartSetup(); }}
                className="w-full bg-[#1ed760] text-black font-black py-4 rounded-full uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(30,215,96,0.3)] flex items-center justify-center gap-2 border-2 border-[#1ed760]"
            >
                <MicIcon className="w-5 h-5" />
                KONSER VER (-{ECONOMY.COST.CONCERT} Enerji)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-12">
            
            <div className={`opacity-0 ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '250ms' }}>
                <button 
                    onClick={() => { playClickSound(); setIsStatsOpen(!isStatsOpen); }}
                    className={`flex items-center justify-between w-full mb-3 p-3 rounded-xl border transition-all duration-300 group ${isStatsOpen ? 'bg-white/10 border-white/20' : 'bg-[#1a1a1a] border-white/5 hover:border-white/10'}`}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest ml-1">İSTATİSTİKLER</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-white transition-colors">
                            {isStatsOpen ? 'GİZLE' : 'GÖSTER'}
                        </span>
                        <div className={`transform transition-transform duration-300 text-neutral-400 ${isStatsOpen ? 'rotate-180 text-white' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </button>
                
                {isStatsOpen && (
                    <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] text-neutral-500 font-bold uppercase mb-2 tracking-wider text-center">YETENEKLER</div>
                            <div className="grid grid-cols-2 gap-2">
                                <MinimalSkillCard label="Flow" val={player.flow} colorClass="text-blue-400" />
                                <MinimalSkillCard label="Lirik" val={player.lyrics} colorClass="text-green-400" />
                                <MinimalSkillCard label="Ritim" val={player.rhythm} colorClass="text-yellow-400" />
                                <MinimalSkillCard label="Swag" val={player.charisma} colorClass="text-purple-400" />
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-between">
                            <div className="text-[8px] text-neutral-500 font-bold uppercase mb-2 tracking-wider text-center">İLİŞKİLER</div>
                            <div className="flex flex-col gap-2">
                                <MinimalRelCard label="Menajer" val={player.rel_manager} />
                                <MinimalRelCard label="Ekip" val={player.rel_team} />
                                <MinimalRelCard label="Fanlar" val={player.rel_fans} />
                                <MinimalRelCard label="Aşk" val={player.rel_partner} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h3 className={`text-white font-bold text-xs uppercase tracking-widest mb-3 opacity-60 ml-1 opacity-0 ${mounted ? 'animate-fade-in' : ''}`} style={{ animationDelay: '400ms' }}>Kariyer Yönetimi</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => { playClickSound(); setActiveModal('market'); }} className={`w-full bg-[#d97706] border border-yellow-500 text-white p-2 rounded-full flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all opacity-0 shadow-lg ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '420ms' }}><div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-black text-2xl text-[#ffef00] shrink-0 border-2 border-yellow-500/20">S</div><div className="text-left flex-1 min-w-0 pr-2"><div className="text-white font-black text-xs uppercase tracking-tight">Sahisinden</div><div className="text-white/80 text-[9px] font-bold truncate">Araba Al-Sat</div></div></button>
                    <button onClick={() => { playClickSound(); setActiveModal('studio'); }} className={`w-full bg-[#dc2626] border border-red-500 text-white p-2 rounded-full flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all opacity-0 shadow-lg ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '440ms' }}><div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-xl text-white shrink-0 border-2 border-red-500/20">🎙️</div><div className="text-left flex-1 min-w-0 pr-2"><div className="text-white font-black text-xs uppercase tracking-tight">Stüdyo</div><div className="text-white/80 text-[9px] font-bold truncate">Hit Şarkı Yap</div></div></button>
                    <button onClick={() => { playClickSound(); setActiveModal('agency'); }} className={`w-full bg-[#2563eb] border border-blue-500 text-white p-2 rounded-full flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all opacity-0 shadow-lg ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '460ms' }}><div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-xl text-white shrink-0 border-2 border-blue-500/20">🤝</div><div className="text-left flex-1 min-w-0 pr-2"><div className="text-white font-black text-xs uppercase tracking-tight">Menajerlik</div><div className="text-white/80 text-[9px] font-bold truncate">İş Bağla</div></div></button>
                    <button onClick={() => { playClickSound(); setActiveModal('map'); }} className={`w-full bg-[#9333ea] border border-purple-500 text-white p-2 rounded-full flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all opacity-0 shadow-lg ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '480ms' }}><div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-xl text-white shrink-0 border-2 border-purple-500/20">🗺️</div><div className="text-left flex-1 min-w-0 pr-2"><div className="text-white font-black text-xs uppercase tracking-tight">Turne</div><div className="text-white/80 text-[9px] font-bold truncate">Şehir Gez</div></div></button>
                </div>
            </div>

            <div>
                <h3 className={`text-white font-bold text-xs uppercase tracking-widest mb-3 opacity-60 ml-1 opacity-0 ${mounted ? 'animate-fade-in' : ''}`} style={{ animationDelay: '550ms' }}>Yaşam Tarzı</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => handleNav('shop')} className={`w-full bg-[#a21caf] border border-fuchsia-500 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:brightness-110 transition-all shadow-lg opacity-0 active:scale-95 ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '600ms' }}><div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👕</div><div className="text-center"><div className="font-black text-white text-[12px] tracking-wide uppercase">STİL</div><div className="text-[8px] text-white/80 font-bold uppercase tracking-wider">İmajını Yenile</div></div></button>
                    <button onClick={() => handleNav('casino_menu')} className={`w-full bg-[#166534] border border-green-500 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:brightness-110 transition-all shadow-lg opacity-0 active:scale-95 ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '650ms' }}><div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform text-green-400">♠️</div><div className="text-center"><div className="font-black text-white text-[12px] tracking-wide uppercase">GECE HAYATI</div><div className="text-[8px] text-white/80 font-bold uppercase tracking-wider">Paranı Katla</div></div></button>
                </div>
                <button onClick={() => setShowActivities(true)} className={`w-full py-4 bg-[#1e3a8a] border border-blue-500/50 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-sm hover:scale-[1.01] active:scale-95 transition-all group opacity-0 shadow-lg ${mounted ? 'animate-[slideUp_0.5s_ease-out_forwards]' : ''}`} style={{ animationDelay: '700ms' }}><span className="text-blue-300">⚡</span><span className="uppercase tracking-widest text-white">ANTRENMAN VE GELİŞİM</span></button>
            </div>
        </div>

        <style>{`
            @keyframes breathe {
                0%, 100% { transform: scale(1.0) translateY(0); }
                50% { transform: scale(1.02) translateY(-2px); }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideInRight {
                from { transform: translateX(20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes shimmer {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
            }
            .animate-shimmer {
                background: linear-gradient(90deg, #ca8a04 0%, #facc15 50%, #ca8a04 100%);
                background-size: 200% auto;
                animation: shimmer 3s linear infinite;
            }
        `}</style>
    </div>
  );
};
