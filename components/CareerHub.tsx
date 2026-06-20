import React, { useEffect, useState } from 'react';
import { PlayerStats, CityKey, CharacterAppearance } from '../types';
import { Avatar } from './Avatar';
import { formatListeners } from '../services/gameLogic';
import { MicIcon, PlayIcon, CoinIcon, SpadeCardIcon, PlusIcon, DiamondIcon, ArrowUpDownIcon, CheckIcon, RocketIcon, SwordIcon, UsersIcon, GlobeIcon, HeartIcon, ZapIcon } from './Icons';
import { CareerTutorial } from './CareerTutorial';
import { playClickSound, playWinSound, playErrorSound } from '../services/sfx';
import { BattleBetGame } from './games/BattleBetGame';
import { BlackjackGame } from './games/BlackjackGame';
import { ZeppelinGame } from './games/ZeppelinGame';
import { DissGame } from './games/DissGame';
import { CITIES, ECONOMY, HEAD_OPTIONS, CLOTHING_STYLES, HAT_STYLES, CHAIN_STYLES, getAdjustedCities } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

// New Features
import { ManagerAgency } from './CityFeatures';
import { TourMap } from './TourMap';
import { IAPStore, IAPTab } from './IAPStore';
import { NightLife } from './NightLife';
import { StyleShop } from './StyleShop';
import { SahisindenApp } from './SahisindenApp';
import { MinderApp } from './MinderApp';

interface Props {
  player: PlayerStats;
  onStartSetup: () => void;
  onExit: () => void;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  updateMultipleStats: (updates: Partial<PlayerStats>) => void;
  onEditCharacter?: () => void;
  onOpenShop?: (tab: IAPTab) => void; 
  onSubViewChange?: (isSubView: boolean) => void;
  onPartnerAcquire?: () => void;
}

// Reusable Card Component for Career Actions (Pure Lowercase Elegant Style with App-specific Glass styling)
const CareerCard = ({ title, subtitle, icon, accentColor, onClick }: any) => {
    let styleClasses = "border-white/5 bg-[#0a0a0a]";
    if (accentColor === '#ffe800') {
        styleClasses = "border-[#ffe800]/20 active:border-[#ffe800]/40 bg-gradient-to-br from-[#ffe800]/5 via-black to-black shadow-[0_0_20px_rgba(255,232,0,0.03)]";
    } else if (accentColor === '#ec4899') {
        styleClasses = "border-[#ec4899]/20 active:border-[#ec4899]/40 bg-gradient-to-br from-[#ec4899]/5 via-black to-black shadow-[0_0_20px_rgba(236,72,153,0.03)]";
    } else if (accentColor === '#1DB954') {
        styleClasses = "border-[#1DB954]/20 active:border-[#1DB954]/40 bg-gradient-to-br from-[#1DB954]/5 via-black to-black shadow-[0_0_20px_rgba(29,185,84,0.03)]";
    } else if (accentColor === '#6366f1') {
        styleClasses = "border-[#6366f1]/20 active:border-[#6366f1]/40 bg-gradient-to-br from-[#6366f1]/5 via-black to-black shadow-[0_0_20px_rgba(99,102,241,0.03)]";
    } else if (accentColor === '#ef4444') {
        styleClasses = "border-[#ef4444]/20 active:border-[#ef4444]/40 bg-gradient-to-br from-[#ef4444]/5 via-black to-black shadow-[0_0_20px_rgba(239,68,68,0.03)]";
    } else if (accentColor === '#a21caf') {
        styleClasses = "border-[#a21caf]/20 active:border-[#a21caf]/40 bg-gradient-to-br from-[#a21caf]/5 via-black to-black shadow-[0_0_20px_rgba(162,28,175,0.03)]";
    } else if (accentColor === '#166534') {
        styleClasses = "border-[#166534]/20 active:border-[#166534]/40 bg-gradient-to-br from-[#166534]/5 via-black to-black shadow-[0_0_20px_rgba(22,101,52,0.03)]";
    }
 
    return (
        <button 
            onClick={onClick}
            className={`w-full p-6 rounded-[2rem] flex flex-col gap-5 text-left transition-all duration-150 active:scale-[0.95] border relative overflow-hidden ${styleClasses}`}
        >
            <div className="absolute top-0 right-0 w-20 h-20 blur-[50px] opacity-[0.05] pointer-events-none" style={{ backgroundColor: accentColor }}></div>
            
            <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/[0.03] border border-white/5 shadow-inner relative z-10"
            >
                <div style={{ color: accentColor }} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                    {typeof icon === 'string' ? <span className="text-xl">{icon}</span> : React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
                </div>
            </div>
 
            <div className="relative z-10 font-sans">
                <h4 className="text-white font-black text-sm tracking-tight lowercase">{title.toLowerCase()}.</h4>
                <div className="text-[10px] text-neutral-400 font-semibold tracking-tight lowercase mt-1">{subtitle.toLowerCase()}</div>
            </div>
        </button>
    );
};

export const CareerHub: React.FC<Props> = ({ player, onStartSetup, onExit, updateStat, updateMultipleStats, onEditCharacter, onOpenShop, onSubViewChange, onPartnerAcquire }) => {
  
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'hub' | 'shop' | 'casino_menu' | 'battlebet' | 'blackjack' | 'zeppelin' | 'diss_game'>('hub');
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  const [activeModal, setActiveModal] = useState<'none' | 'map' | 'market' | 'agency' | 'minder'>('none');

  const handleVehicleBuy = (vehicleId: string, cost: number) => {
    const carModels = [
      { id: 'scooter', swag: 3 },
      { id: 'tofas', swag: 12 },
      { id: 'doblo', swag: 7 },
      { id: 'honda', swag: 28 },
      { id: 'bmw', swag: 45 },
      { id: 'passat', swag: 65 },
      { id: 'range', swag: 100 },
    ];
    const isCarPrefix = vehicleId.startsWith('car_');
    const coreId = isCarPrefix ? vehicleId.split('_')[1] : vehicleId.split('_')[0];
    const found = carModels.find(m => m.id === coreId);
    const swagBoost = found ? found.swag : 10;

    updateMultipleStats({
      careerCash: player.careerCash - cost,
      charisma: player.charisma + swagBoost,
      inventory: {
        ...player.inventory,
        vehicles: [...player.inventory.vehicles, vehicleId]
      }
    });
  };

  const isVerified = player.ownedUpgrades?.['verified_badge'] > 0;

  useEffect(() => {
      setMounted(true);
  }, []);

  useEffect(() => {
      const isSubView = view !== 'hub' || activeModal !== 'none' || showActivities;
      onSubViewChange?.(isSubView);
  }, [view, activeModal, showActivities, onSubViewChange]);

  const closeTutorial = () => {
      playClickSound();
      localStorage.setItem('flowify_career_intro_seen', 'true');
      setShowTutorial(false);
  };

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const handleNav = (target: 'hub' | 'shop' | 'casino_menu' | 'diss_game') => {
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

  const handleHitSong = () => {
      updateMultipleStats({ career: { ...player.career, hasHitSong: true } });
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

  const handleManagerHire = (tier: number, cost: number, name: string) => {
      updateMultipleStats({ 
          career: { 
              ...player.career, 
              managerTier: tier, 
              managerName: name,
              chatHistory: {
                  ...player.career.chatHistory,
                  manager: [{ role: 'model', text: `Selam! Ben ${name}. Yeni menajerinim. Hadi piyasayı sallayalım! 🎤` }]
              }
          } 
      });
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
      notify("antrenman tamamlandı! yeteneklerin gelişti.", 'success');
  };

  const handleFixRel = (rel: 'rel_manager' | 'rel_team' | 'rel_fans' | 'rel_partner') => {
      playClickSound();
      const cost = ECONOMY.TRAINING_PRICE;
      if (player.energy < ECONOMY.COST.RELATIONSHIP) { handleOpenShopSafe('energy'); return; }
      if (player.careerCash < cost) { handleOpenShopSafe('currency'); return; }
      if ((player[rel] as number) >= 100) { notify("ilişkin zaten mükemmel!", 'info'); return; }
      
      updateMultipleStats({
          energy: -ECONOMY.COST.RELATIONSHIP,
          careerCash: -cost,
          [rel]: 5
      });
      notify("ilişkiler düzeliyor...", 'success');
  };

  const MinimalSkillCard = ({ label, val, colorClass }: { label: string, val: number, colorClass: string }) => (
      <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-5 flex flex-col items-center justify-center group hover:bg-white/5 hover:border-white/10 transition-all active:scale-[0.98]">
          <div className={`text-4xl font-black ${colorClass} tracking-tighter mb-1`}>{val}</div>
          <div className="text-[10px] text-neutral-500 font-bold tracking-tight lowercase">{label.toLowerCase()}.</div>
      </div>
  );

  const MinimalRelCard = ({ label, val }: { label: string, val: number }) => (
      <div className="w-full">
          <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-bold text-neutral-500 tracking-tight lowercase">{label.toLowerCase()}.</span>
              <span className={`text-[11px] font-black tabular-nums ${val < 30 ? 'text-red-400' : 'text-white'}`}>{val}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                className={`h-full rounded-full transition-all duration-700 ease-out ${val < 30 ? 'bg-red-500' : val < 70 ? 'bg-yellow-500' : 'bg-spotify-green'}`}
              ></motion.div>
          </div>
      </div>
  );

  const ActionCard = ({ title, subtitle, icon, action, cost, energyCost, color }: any) => (
      <motion.button 
        onClick={action}
        className={`w-full flex items-center gap-4 p-4 bg-[#0a0a0a] border border-white/5 rounded-3xl group transition-all relative overflow-hidden active:scale-[0.98]`}
      >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 bg-white/5 ${color} font-black`}>
              {icon}
          </div>
          <div className="flex-1 text-left min-w-0">
              <div className="text-white font-bold text-sm tracking-tight truncate leading-none mb-2 lowercase">{title.toLowerCase()}.</div>
              <div className="text-[10px] text-neutral-500 font-semibold tracking-tight truncate lowercase">{subtitle.toLowerCase()}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
              <div className="text-[9px] font-bold bg-red-500/10 px-2 py-0.5 rounded-lg text-red-400 whitespace-nowrap border border-red-500/10 lowercase">
                  -{energyCost}e
              </div>
              <div className="text-xs font-black text-spotify-green tabular-nums lowercase">
                  {cost.toLowerCase()}
              </div>
          </div>
      </motion.button>
  );

  if (view === 'battlebet') return <BattleBetGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;
  if (view === 'blackjack') return <BlackjackGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;
  if (view === 'zeppelin') return <ZeppelinGame player={player} updateStat={updateStat} onExit={() => setView('casino_menu')} cashType="careerCash" />;
  if (view === 'diss_game') return <DissGame player={player} updateMultipleStats={updateMultipleStats} onExit={() => setView('hub')} />;

  if (view === 'casino_menu') {
      return (
          <NightLife 
            player={player} 
            onSelectGame={(game) => setView(game as any)} 
            onPartnerAcquire={onPartnerAcquire} 
            onClose={() => setView('hub')}
          />
      );
  }

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

  const citiesConfig = getAdjustedCities(player.startingCity);
  const currentCityConfig = citiesConfig[player.currentCity || 'eskisehir'];

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden font-sans text-white animate-fade-in select-none">
        
        <AnimatePresence>
            {showActivities && (
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[200] bg-black flex flex-col"
                >
                    <div className="p-6 flex justify-between items-center border-b border-white/5 bg-[#050505]">
                        <h2 className="text-lg font-black tracking-tighter lowercase">gelişim merkezim<span className="text-spotify-green">.</span></h2>
                        <button onClick={() => setShowActivities(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 text-neutral-400">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32 no-scrollbar bg-black">
                        <div>
                            <h3 className="text-xs text-neutral-500 font-bold tracking-tight lowercase mb-4">kişisel yeteneklerim.</h3>
                            <div className="space-y-4">
                                <ActionCard title="Stüdyo Antrenmanı" subtitle="+1 Flow Yeteneği" icon="🎙️" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-blue-400" action={() => handleTrain('flow')} />
                                <ActionCard title="Kitap Oku" subtitle="+1 Lirik Yeteneği" icon="📚" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-green-400" action={() => handleTrain('lyrics')} />
                                <ActionCard title="Stil Danışmanı" subtitle="+1 Karizma (Swag)" icon="✨" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.TRAINING} color="text-purple-400" action={() => handleTrain('charisma')} />
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-xs text-neutral-500 font-bold tracking-tight lowercase mb-4">sektör içi ilişkilerim.</h3>
                            <div className="space-y-4">
                                <ActionCard title="Menajer Toplantısı" subtitle="+5 Menajer İlişkisi" icon="🤝" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-blue-400" action={() => handleFixRel('rel_manager')} />
                                <ActionCard title="Ekip Yemeği" subtitle="+5 Ekip İlişkisi" icon="🍕" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-purple-400" action={() => handleFixRel('rel_team')} />
                                <ActionCard title="Fan Buluşması" subtitle="+5 Fan İlişkisi" icon="❤️" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-red-400" action={() => handleFixRel('rel_fans')} />
                                <ActionCard title="Romantik Yemek" subtitle="+5 Aşk (Partner İlişkisi)" icon="🌹" cost={`-₺${ECONOMY.TRAINING_PRICE}`} energyCost={ECONOMY.COST.RELATIONSHIP} color="text-pink-400" action={() => handleFixRel('rel_partner')} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {showTutorial && <CareerTutorial onClose={closeTutorial} />}
        
        {activeModal === 'agency' && (
            <div className="fixed inset-0 z-[200] animate-in fade-in slide-in-from-bottom-5">
                <ManagerAgency player={player} onClose={() => setActiveModal('none')} updateStat={updateStat} onManagerHire={handleManagerHire} onCityUnlock={handleCityUnlock} onOpenShop={handleOpenShopSafe} />
            </div>
        )}
        {activeModal === 'map' && (
            <div className="fixed inset-0 z-[200] animate-in fade-in">
                <TourMap player={player} onSelectCity={handleCitySelect} onClose={() => setActiveModal('none')} />
            </div>
        )}
        {activeModal === 'market' && (
            <div className="fixed inset-0 z-[200] animate-in fade-in">
                <SahisindenApp 
                    player={player} 
                    onClose={() => setActiveModal('none')} 
                    updateStat={updateStat} 
                    onVehicleBuy={handleVehicleBuy}
                    onCityUnlock={handleCityUnlock}
                    onOpenShop={(tab) => handleOpenShopSafe(tab as any)}
                />
            </div>
        )}
        {activeModal === 'minder' && (
            <div className="fixed inset-0 z-[200] animate-in fade-in">
                <MinderApp 
                    player={player} 
                    updateMultipleStats={updateMultipleStats} 
                    onBack={() => setActiveModal('none')} 
                />
            </div>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-44">
            
            {/* Profile Header Block - Made more compact & minimal to start action buttons higher up */}
            <div className="relative w-full h-[260px] overflow-hidden bg-black border-b border-white/5">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                    {/* Dynamic Ambient Glows (Rendered behind) */}
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[100px] rounded-full z-0"></div>
                    <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[80px] rounded-full z-0"></div>

                    {/* Giant background-embedded MicIcon styled with glowing purple and high-contrast vector gradient */}
                    <div className="absolute right-[-20px] top-[10px] pointer-events-none z-0 text-indigo-500/10 opacity-25 select-none animate-pulse-slow">
                      <MicIcon className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] filter drop-shadow-[0_0_80px_rgba(168,85,247,0.3)]" />
                    </div>
                    
                    <div className="absolute inset-0 opacity-[0.01] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0"></div>

                    {/* Premium depth gradients (rendered behind the avatar so they don't cover it) */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-0"></div>

                    {/* Avatar Container: Placed clearly above the background layers (opacity-85 for beautiful visibility, z-10) */}
                    {/* Showing character up to shoulders by translating it upward and scaling it inside an overflow-hidden wrapper */}
                    <div className="absolute inset-x-0 top-0 bottom-0 flex items-start justify-center opacity-85 z-10 overflow-hidden">
                        <div className="relative -translate-y-[15%] scale-[1.3] pointer-events-none">
                            <Avatar
                                appearance={player.appearance}
                                gender={player.gender}
                                size={440}
                            />
                        </div>
                    </div>

                    {/* Black dissolve helper gradient, placed IN FRONT of the avatar (z-20) to blend with black background at seam */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/85 to-transparent z-20 pointer-events-none"></div>
                </div>

                {/* Name / Info Text Block overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pb-4">
                    <div className="flex flex-col gap-1 max-w-lg">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            {isVerified && (
                                <div className="bg-[#3897f0] rounded-full p-0.5 shadow-[0_0_12px_rgba(56,151,240,0.5)]">
                                    <CheckIcon className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                            <span className="text-[10px] font-bold text-neutral-400 tracking-tight lowercase">
                                {isVerified ? 'doğrulanmış sanatçı' : 'doğrulanmamış sanatçı'}
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white lowercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                            {player.name.toLowerCase()}<span className="text-spotify-green">.</span>
                        </h1>
                    </div>
                </div>
            </div>
 
            <div className="px-4 py-4 space-y-4 bg-black min-h-full pb-36">
                {/* Level / City Stats - Compact, beautiful double-pill style */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm animate-fade-in">
                    <div className="bg-[#050505] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/5 flex items-center justify-center border border-white/[0.03] shrink-0">
                            <ZapIcon className="w-3.5 h-3.5 text-yellow-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-neutral-500 tracking-tight leading-none mb-0.5 lowercase">seviye</span>
                            <span className="text-sm font-black text-white tracking-tighter tabular-nums">{player.careerLevel}</span>
                        </div>
                    </div>
                    <div 
                        onClick={() => { playClickSound(); setActiveModal('map'); }}
                        className="bg-[#050505] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer active:scale-95 transition-all duration-150"
                    >
                        <div className="w-7 h-7 rounded-lg bg-[#1DB954]/5 flex items-center justify-center border border-white/[0.03] shrink-0">
                            <GlobeIcon className="w-3.5 h-3.5 text-spotify-green" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-neutral-500 tracking-tight leading-none mb-0.5 lowercase">aktif bölgem</span>
                            <span className="text-sm font-black text-white tracking-tighter truncate leading-none lowercase">
                                {currentCityConfig.name?.toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Actions - Redesigned Cards */}
                <div className="space-y-4">
                    
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <CareerCard 
                                title="sahisinden"
                                subtitle="vasıta & swag pazarı"
                                accentColor="#ffe800"
                                icon={<CoinIcon />}
                                onClick={() => { playClickSound(); setActiveModal('market'); }}
                            />
 
                            <CareerCard 
                                title="minder"
                                subtitle="eşleşme & aşk lojistiği"
                                accentColor="#ec4899"
                                icon={<HeartIcon />}
                                onClick={() => { playClickSound(); setActiveModal('minder'); }}
                            />
 
                            <CareerCard 
                                shadow={true}
                                title="harita"
                                subtitle="turne & rota seçimi"
                                accentColor="#1DB954"
                                icon={<GlobeIcon />}
                                onClick={() => { playClickSound(); setActiveModal('map'); }}
                            />
 
                            <CareerCard 
                                title="menajer"
                                subtitle="ekibini yönet & geliştir"
                                accentColor="#6366f1"
                                icon={<UsersIcon />}
                                onClick={() => { playClickSound(); setActiveModal('agency'); }}
                            />
                        </div>
                    </div>
                </div>                  {/* Stats Section - Animated Disclosure */}
                <div className="space-y-4">
                    <button 
                        onClick={() => { playClickSound(); setIsStatsOpen(!isStatsOpen); }}
                        className="flex items-center justify-between w-full group border-b border-white/5 pb-2"
                    >
                        <h3 className="text-lg font-black text-white tracking-tighter lowercase">istatistiklerim<span className="text-spotify-green">.</span></h3>
                        <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 ${isStatsOpen ? 'rotate-180 bg-spotify-green text-black' : 'text-neutral-500'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </button>
                    
                    <AnimatePresence>
                        {isStatsOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 gap-10 mb-6">
                                    <div className="space-y-4">
                                        <div className="text-[10px] text-neutral-500 font-bold tracking-tight flex items-center gap-3 lowercase">
                                            <div className="h-px bg-white/5 flex-1"></div>
                                            müzikal yeteneklerim.
                                            <div className="h-px bg-white/5 flex-1"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MinimalSkillCard label="Flow" val={player.flow} colorClass="text-blue-400" />
                                            <MinimalSkillCard label="Lirik" val={player.lyrics} colorClass="text-green-400" />
                                            <MinimalSkillCard label="Ritim" val={player.rhythm} colorClass="text-yellow-400" />
                                            <MinimalSkillCard label="Swag" val={player.charisma} colorClass="text-purple-400" />
                                        </div>
                                    </div>
 
                                    <div className="space-y-4">
                                        <div className="text-[10px] text-neutral-500 font-bold tracking-tight flex items-center gap-3 lowercase">
                                            <div className="h-px bg-white/5 flex-1"></div>
                                            ilişki durumlarım.
                                            <div className="h-px bg-white/5 flex-1"></div>
                                        </div>
                                        <div className="space-y-6 bg-[#0a0a0a] p-6 rounded-[2rem] border border-white/5">
                                            <MinimalRelCard label="Menajer" val={player.rel_manager} />
                                            <MinimalRelCard label="Ekip" val={player.rel_team} />
                                            <MinimalRelCard label="Fanlar" val={player.rel_fans} />
                                            <MinimalRelCard label="Aşk" val={player.rel_partner} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sub Games - Gaming Layout */}
                <div className="grid grid-cols-1 gap-10 pt-2">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tighter mb-4 lowercase">yaşam tarzım<span className="text-[#a21caf]">.</span></h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CareerCard 
                                title="stil & gardrop"
                                subtitle="giysi ve imaj dükkanı"
                                accentColor="#a21caf"
                                icon={<PlusIcon />}
                                onClick={() => { playClickSound(); handleNav('shop'); }}
                            />
                            <CareerCard 
                                title="casino & gece"
                                subtitle="gece hayatı maceraları"
                                accentColor="#166534"
                                icon={<SpadeCardIcon />}
                                onClick={() => { playClickSound(); handleNav('casino_menu'); }}
                            />
                        </div>
                        <button 
                            onClick={() => setShowActivities(true)} 
                            className="w-full py-5 bg-[#0a0a0a] text-white rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs transition-all border border-white/5 relative overflow-hidden group active:scale-[0.98] transform hover:scale-[1.01]"
                        >
                            <div className="absolute inset-0 bg-spotify-green/5 op-15 pointer-events-none"></div>
                            <ZapIcon className="w-4 h-4 text-spotify-green fill-current" />
                            <span className="tracking-tight font-black lowercase text-neutral-200">gelişim merkezim.</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Floating "Konser Ver" Button at the Bottom */}
        {activeModal === 'none' && !showActivities && (
            <div className="absolute bottom-6 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="w-full max-w-md mx-auto pointer-events-auto">
                    <div className="relative p-[3px] rounded-[2rem] overflow-hidden shadow-[0_12px_40px_rgba(66,133,244,0.45)] active:scale-95 transition-all duration-150">
                        {/* Rotating Google colored border glow */}
                        <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#4285F4,#EA4335,#FBBC05,#34A853,#4285F4)] animate-spin" style={{ animationDuration: '4s' }}></div>
                        {/* Soft ambient glow behind */}
                        <div className="absolute inset-[-20%] bg-[conic-gradient(from_0deg,#4285F4,#EA4335,#FBBC05,#34A853,#4285F4)] blur-xl opacity-90 animate-spin pointer-events-none" style={{ animationDuration: '4s' }}></div>
                        
                        <button 
                            onClick={onStartSetup}
                            className="relative w-full h-16 sm:h-18 bg-white text-black font-extrabold rounded-[1.85rem] tracking-tight text-base sm:text-lg flex items-center justify-center gap-2.5 active:bg-neutral-100 transition-colors z-10 shadow-lg"
                        >
                            <MicIcon className="w-6 h-6 text-[#EA4335]" />
                            <span className="lowercase font-black text-base sm:text-lg tracking-tight text-neutral-900">konser ver.</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
