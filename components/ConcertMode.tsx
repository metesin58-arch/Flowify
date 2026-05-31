
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, SongTrack, CityKey } from '../types';
import { CareerHub } from './CareerHub';
import { ConcertSetup } from './ConcertSetup';
import { VenueSelection } from './VenueSelection'; 
import { TourMap } from './TourMap';
import { RapSurfer } from './minigames/RapSurfer';
import { FlashlightWave } from './minigames/FlashlightWave';
import { DJScratch } from './minigames/DJScratch';
import { LyricPrompter } from './minigames/LyricPrompter'; 
import { NSSKick } from './minigames/NSSKick';
import { FlowBattleGame } from './FlowBattleGame'; 
import { TrophyIcon, MicIcon, DiscIcon, ClockIcon, UsersIcon, CoinIcon, FourArrowsIcon, PlayIcon } from './Icons';
import { Avatar } from './Avatar';
import { PRE_CONCERT_SCENARIOS, POST_CONCERT_SCENARIOS, ScenarioModal, ScenarioResultModal } from './ScenarioSystem';
import { calculateConcertRevenue, handleWeeklyExpenses } from '../services/gameLogic';
import { playMusic, stopMusic, playClickSound } from '../services/sfx';
import { IAPTab } from './IAPStore';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  updateMultipleStats: (updates: Partial<PlayerStats>) => void;
  onExit: () => void;
  onEditCharacter?: () => void;
  onOpenShop?: (tab: IAPTab) => void;
  onPhaseChange?: (phase: ConcertPhase) => void;
  onPartnerAcquire?: () => void;
}

// Updated Duration to 35 seconds
const CONCERT_DURATION_SEC = 35; 

type ConcertPhase = 'hub' | 'city_select' | 'venue_select' | 'pre_scenario' | 'setup' | 'simulation' | 'post_scenario' | 'result';
type LogType = 'info' | 'good' | 'bad' | 'crisis';
type MiniGameType = 'none' | 'rapsurfer' | 'flashlight' | 'scratch' | 'breakdance' | 'prompter' | 'nsskick';

interface ConcertLog {
    id: number;
    text: string;
    type: LogType;
    timestamp: string;
}

interface VenueData {
    id: string;
    name: string;
    capacity: number;
    rentCost: number;
    prestige: number;
}

export const ConcertMode: React.FC<Props> = ({ player, updateStat, updateMultipleStats, onExit, onEditCharacter, onOpenShop, onPhaseChange, onPartnerAcquire }) => {
  const [phase, setPhase] = useState<ConcertPhase>('hub');
  const [isSubView, setIsSubView] = useState(false);

  useEffect(() => {
    // If we are in the hub but a sub-view (like Market or Studio) is active,
    // we should notify the parent to hide the header.
    if (phase === 'hub' && isSubView) {
        onPhaseChange?.('setup'); // Using 'setup' as a proxy for "hide header"
    } else {
        onPhaseChange?.(phase);
    }
  }, [phase, isSubView, onPhaseChange]);
  
  // Concert State
  const [setlist, setSetlist] = useState<SongTrack[]>([]);
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CONCERT_DURATION_SEC);
  const [score, setScore] = useState(0);
  const [hype, setHype] = useState(50); // 0-100
  const [logs, setLogs] = useState<ConcertLog[]>([]);
  const [songSwitchCooldown, setSongSwitchCooldown] = useState(0); 
  const [fxCooldown, setFxCooldown] = useState(0); 
  const [fxFlash, setFxFlash] = useState(false); 
  
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [ticketPrice, setTicketPrice] = useState(50);

  // Active Crisis / MiniGame
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameType>('none');
  const [crisisActive, setCrisisActive] = useState<{ type: MiniGameType, label: string, msg: string } | null>(null);
  const [miniGameQueue, setMiniGameQueue] = useState<MiniGameType[]>([]);

  // Results
  const [gainedStats, setGainedStats] = useState({ cash: 0, fans: 0, reputation: 0, success: true, failReason: '' });

  // Scenarios
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [scenarioOutcome, setScenarioOutcome] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);
  const eventLoopRef = useRef<any>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (phase === 'simulation') {
          stopMusic();
          if (setlist.length > 0) {
              const url = setlist[currentSongIdx].previewUrl;
              if (audioRef.current && audioRef.current.src === url && !audioRef.current.paused) {
                  return;
              }
              playSong(url);
          }
      } else {
          stopAudio();
          playMusic();
      }
      return () => stopAudio();
  }, [phase, currentSongIdx]); 

  const playSong = (url: string) => {
      if (audioRef.current) audioRef.current.pause();
      if (!url) return;
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.loop = false; 
      audio.onended = () => { switchSong(true); };
      audioRef.current = audio;
      audio.play().catch(e => console.log("Audio play failed", e));
  };

  const stopAudio = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
  };

  const cancelConcert = () => {
      playClickSound();
      finishConcert(true);
  };

  const handleCitySelect = (cityId: CityKey) => {
      updateMultipleStats({ currentCity: cityId });
      setPhase('venue_select');
  };

  const handleVenueConfirm = (venue: any, price: number) => {
      setSelectedVenue(venue);
      setTicketPrice(price);
      updateStat('careerCash', -venue.rentCost);
      const randScenario = PRE_CONCERT_SCENARIOS[Math.floor(Math.random() * PRE_CONCERT_SCENARIOS.length)];
      setActiveScenario(randScenario);
      setPhase('pre_scenario');
  };

  const handleScenarioOption = (effects: any, outcome: string) => {
      if (effects) {
          if (Object.keys(effects).length > 1) {
              updateMultipleStats(effects);
          } else {
              Object.entries(effects).forEach(([key, val]) => {
                  updateStat(key as keyof PlayerStats, Number(val));
              });
          }
      }
      setActiveScenario(null);
      setScenarioOutcome(outcome);
  };

  const closeScenarioOutcome = () => {
      setScenarioOutcome(null);
      if (phase === 'pre_scenario') setPhase('setup');
      else if (phase === 'post_scenario') setPhase('result');
  };

  const logCounter = useRef(0);
  const addLog = (text: string, type: LogType = 'info') => {
      const now = new Date();
      const timestamp = `${now.getHours()}:${now.getMinutes() < 10 ? '0'+now.getMinutes() : now.getMinutes()}`;
      const uniqueId = `${Date.now()}-${logCounter.current++}`;
      setLogs(prev => [{ id: uniqueId, text, type, timestamp }, ...prev].slice(0, 20));
  };

  const startConcert = (selectedSongs: SongTrack[]) => {
      setSetlist(selectedSongs);
      setCurrentSongIdx(0);
      setTimeLeft(CONCERT_DURATION_SEC);
      setScore(0);
      setSongSwitchCooldown(0);
      setFxCooldown(0);
      const baseHype = 30 + ((player.rel_fans || 0) * 0.1) + ((player.rel_manager || 0) * 0.1);
      setHype(Math.min(100, baseHype));
      setLogs([]);
      const games: MiniGameType[] = ['rapsurfer', 'flashlight', 'scratch', 'breakdance', 'prompter', 'nsskick'];
      setMiniGameQueue(games.sort(() => Math.random() - 0.5));
      setPhase('simulation');
      addLog("SAHNEYE ÇIKTIN! HERKES SENİN İSMİNİ HAYKIRIYOR!", 'good');
  };

  useEffect(() => {
      if (phase !== 'simulation') return;
      timerRef.current = setInterval(() => {
          if (activeMiniGame !== 'none' || crisisActive) return;
          setTimeLeft(prev => {
              if (prev <= 0) return 0;
              if (prev === 6) addLog("FİNAL YAKLAŞIYOR! SON BİR ENERJİ!", 'info');
              return prev - 1;
          });
          setSongSwitchCooldown(prev => Math.max(0, prev - 1));
          setFxCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timerRef.current);
  }, [phase, activeMiniGame, crisisActive]);

  useEffect(() => {
      if (phase === 'simulation' && timeLeft === 0) finishConcert();
  }, [timeLeft, phase]);

  useEffect(() => {
      if (phase !== 'simulation') return;
      eventLoopRef.current = setInterval(() => {
          if (crisisActive || activeMiniGame !== 'none') return;
          handleRandomEvent();
      }, 2500); // Faster event loop
      return () => clearInterval(eventLoopRef.current);
  }, [phase, crisisActive, activeMiniGame]);

  // --- ACTION TEXT SYSTEM ---
  const handleRandomEvent = () => {
      const hasQueue = miniGameQueue.length > 0;
      
    // Was 0.7 if queue, now 0.25 (25% chance per tick)
    // Was 0.15 if empty, now 0.05 (5% chance per tick)
    const triggerChance = hasQueue ? 0.25 : 0.05; 
      const rand = Math.random();
      
      if (rand < triggerChance) { triggerCrisis(); return; }
      
      if (rand > 0.6) {
          setHype(h => Math.min(100, h + 5));
          setScore(s => s + 100);
          const msgs = [
              "Kalabalık ismini haykırıyor!",
              "Flashlar geceyi aydınlattı!",
              "Sahneye sütyen atıldı!",
              "En öndeki fanlar çıldırdı!",
              "Bu beat mekanı yıkar geçer!",
              "Nakaratı tüm salon söylüyor!",
              "Enerji tavan yaptı, yer yerinden oynuyor!",
              "Sahne senin, yargı dağıtıyorsun!"
          ];
          addLog(msgs[Math.floor(Math.random() * msgs.length)], 'good');
      } else if (rand < 0.3) {
          setHype(h => Math.max(0, h - 5));
          const msgs = [
              "Monitörden ses gelmiyor...",
              "Arka taraf kendi arasında konuşuyor.",
              "Ritim biraz aksadı sanki.",
              "Sahne ışıkları gözünü aldı.",
              "Mikrofon kablosuna takıldın.",
              "Seyircinin enerjisi düşüyor.",
              "Birisi sahneye su şişesi attı!",
              "Sesçi uyuyor galiba..."
          ];
          addLog(msgs[Math.floor(Math.random() * msgs.length)], 'bad');
      } else {
          const msgs = [
              "Duman efektleri sahneyi kapladı.",
              "Basslar ciğerleri titretiyor.",
              "Lazer şovu başladı.",
              "DJ scratch atıyor.",
              "Güvenlik bariyerleri zorlanıyor.",
              "Atmosfer ısınıyor...",
              "Herkes ellerini havaya kaldırdı."
          ];
          addLog(msgs[Math.floor(Math.random() * msgs.length)], 'info');
      }
  };

  const triggerCrisis = () => {
      let nextGame: MiniGameType;
      if (miniGameQueue.length > 0) {
          nextGame = miniGameQueue[0];
          setMiniGameQueue(prev => prev.slice(1));
      } else {
          const types: MiniGameType[] = ['rapsurfer', 'flashlight', 'scratch', 'breakdance', 'prompter', 'nsskick'];
          nextGame = types[Math.floor(Math.random() * types.length)];
      }
      const config = {
          'rapsurfer': { label: 'SES DALGASI', msg: "⚠ SES FREKANSI KAYDI! DÜZELTMEK İÇİN SÖRF YAP!" },
          'flashlight': { label: 'FLAŞLARI YAK', msg: "ARKA TARAF SIKILDI TELEFONLARININ FLASHLARINI AÇTIR!" },
          'scratch': { label: 'BEAT DROP', msg: "⚠ DROP GELİYOR! SCRATCH AT!" },
          'breakdance': { label: 'BEAT SMASH ŞOV', msg: "⚠ SEYİRCİ COŞMAK İSTİYOR! PEDLERİ EZEREK BASS PATLAT!" },
          'prompter': { label: 'SÖZLERİ UNUTTUN', msg: "⚠ SÖZLER AKLINDAN UÇTU! PROMPTER'I OKU VE YAZ!" }, 
          'nsskick': { label: 'KAFİYE SIKIŞMASI', msg: "⚠ FLOW TIKANDI! HIZLICA UYGUN RİTMİK KAFİYELİ KELİMELERİ BULARAK SEYİRCİYİ COŞTUR!" },
          'none': { label: '', msg: '' }
      }[nextGame];
      setCrisisActive({ type: nextGame, label: config.label, msg: config.msg });
      addLog(config.msg, 'crisis');
  };

  const resolveCrisis = (miniGameScore: number) => {
      setActiveMiniGame('none');
      setCrisisActive(null);
      if (miniGameScore > 50) {
          addLog(`KRİZ ÇÖZÜLDÜ! EFSANE MÜDAHALE! (+${miniGameScore} Puan)`, 'good');
          setScore(s => s + miniGameScore * 10);
          setHype(h => Math.min(100, h + 20));
      } else {
          addLog("MÜDAHALE BAŞARISIZ! SEYİRCİ SOĞUDU.", 'bad');
          setHype(h => Math.max(0, h - 20));
      }
  };

  const switchSong = (auto: boolean = false) => {
      if (crisisActive || activeMiniGame !== 'none') return;
      if (!auto && songSwitchCooldown > 0) { addLog(`Çok sık parça değiştiriyorsun! (${songSwitchCooldown}s bekle)`, 'bad'); return; }
      
      const nextIdx = (currentSongIdx + 1) % setlist.length;
      setCurrentSongIdx(nextIdx);
      setSongSwitchCooldown(5); 
      addLog(auto ? `OTOMATİK GEÇİŞ: ${setlist[nextIdx].trackName}` : `YENİ PARÇA GİRDİ: ${setlist[nextIdx].trackName}`, 'info');
  };

  const triggerFX = () => {
      if (crisisActive || activeMiniGame !== 'none' || fxCooldown > 0) return;
      setFxCooldown(16); 
      setFxFlash(true);
      setTimeout(() => setFxFlash(false), 50); 

      setHype(h => Math.min(100, h + 5));
      const effects = ["Sahne duman altı!", "Konfeti yağmuru!", "Lazer şovu göz alıyor!", "Alevler yükseliyor!"];
      addLog(effects[Math.floor(Math.random() * effects.length)], 'good');
  };

  const finishConcert = (manualCancel: boolean = false) => {
      clearInterval(timerRef.current);
      clearInterval(eventLoopRef.current);
      stopAudio();
      const luckFactor = Math.random(); 
      const isBadLuck = luckFactor < 0.1; 
      let isSuccess = manualCancel ? false : (hype >= 50 && !isBadLuck);
      let cashChange = 0;
      let fanChange = 0;
      let failReason = '';
      let finalUpdates: any = {};
      
      if (manualCancel) {
          failReason = "KONSERİ YARIDA BIRAKTIN!";
          // Penalty: Lose 10% of cash and 5% of fans
          cashChange = -Math.floor(player.careerCash * 0.1);
          fanChange = -Math.floor(player.monthly_listeners * 0.05);
          isSuccess = false;
          finalUpdates.rel_manager = -15;
          finalUpdates.rel_fans = -15;
      } else if (selectedVenue) {
          const pricePenalty = Math.max(0, (ticketPrice - 50) / 500); 
          const fillRate = Math.min(1, Math.max(0.1, (hype / 100) - pricePenalty));
          const attendance = Math.floor(selectedVenue.capacity * fillRate);
          const revenue = attendance * ticketPrice;
          const performanceBonus = Math.floor(score * 0.5);
          const baseRevenue = revenue + performanceBonus;
          cashChange = calculateConcertRevenue(baseRevenue, player.currentCity || 'eskisehir', player);
          fanChange = Math.floor(attendance * (hype / 100) * 0.5); 
          if (isBadLuck) {
              failReason = "POLİS BASKINI! KONSER İPTAL EDİLDİ.";
              if (luckFactor < 0.05) failReason = "SES SİSTEMİ PATLADI! SEYİRCİ İSYAN ETTİ.";
              cashChange = -Math.floor(revenue * 0.5); 
              fanChange = -Math.floor(selectedVenue.capacity * 0.2); 
              isSuccess = false;
              finalUpdates.rel_manager = -10;
              finalUpdates.rel_fans = -10;
          } else if (!isSuccess) {
              failReason = "SEYİRCİ HİÇ BEĞENMEDİ.";
              cashChange = Math.floor(revenue * 0.2); 
              fanChange = -Math.floor(fanChange * 0.5); 
              finalUpdates.rel_fans = -5;
          } else {
              finalUpdates.rel_fans = 5;
              finalUpdates.rel_team = 2;
              finalUpdates.rel_manager = 2;
          }
      } else {
          const multiplier = hype / 50;
          cashChange = Math.floor(500 + (score * 0.5 * multiplier));
          cashChange = calculateConcertRevenue(cashChange, player.currentCity || 'eskisehir', player);
      }
      const finalCash = Math.floor(cashChange);
      const finalFans = Math.floor(fanChange);
      finalUpdates.careerCash = finalCash;
      finalUpdates.monthly_listeners = finalFans;
      if (isSuccess) {
          finalUpdates.week = 1;
          // Level updates are now handled automatically in App.tsx based on monthly_listeners
          finalUpdates.flow = -Math.ceil(player.flow * 0.03);
          finalUpdates.lyrics = -Math.ceil(player.lyrics * 0.03);
          finalUpdates.charisma = -Math.ceil(player.charisma * 0.03);
      }
      const tempPlayerState = { ...player, careerCash: player.careerCash + finalCash };
      const expenseUpdates = handleWeeklyExpenses(tempPlayerState);
      Object.entries(expenseUpdates).forEach(([key, val]) => {
          if (key === 'careerCash') {
             const expensesResult = val as number;
             const delta = expensesResult - player.careerCash;
             finalUpdates.careerCash = delta; 
          } else {
             const currentStat = player[key as keyof PlayerStats] as number;
             const newStat = val as number;
             finalUpdates[key] = newStat - currentStat;
          }
      });
      updateMultipleStats(finalUpdates);
      setGainedStats({ cash: finalCash, fans: finalFans, reputation: 0, success: isSuccess, failReason: failReason });
      const randScenario = POST_CONCERT_SCENARIOS[Math.floor(Math.random() * POST_CONCERT_SCENARIOS.length)];
      setActiveScenario(randScenario);
      setPhase('post_scenario');
  };

  if (phase === 'hub') return <CareerHub player={player} onStartSetup={() => setPhase('city_select')} onExit={onExit} updateStat={updateStat} updateMultipleStats={updateMultipleStats} onEditCharacter={onEditCharacter} onOpenShop={onOpenShop} onSubViewChange={setIsSubView} onPartnerAcquire={onPartnerAcquire} />;
  if (phase === 'city_select') return <TourMap player={player} onSelectCity={handleCitySelect} onClose={() => setPhase('hub')} />;
  if (phase === 'venue_select') return <VenueSelection player={player} onConfirm={handleVenueConfirm} onBack={() => setPhase('city_select')} />;
  
  if (activeScenario) return <ScenarioModal scenario={activeScenario} onOptionSelect={(opt) => handleScenarioOption(opt.effects, opt.outcome)} />;
  if (scenarioOutcome) return <ScenarioResultModal outcome={scenarioOutcome} onClose={closeScenarioOutcome} />;
  if (phase === 'setup') return <ConcertSetup player={player} onComplete={startConcert} onBack={() => setPhase('venue_select')} />;

  // MINIGAME OVERLAYS
  if (activeMiniGame === 'rapsurfer') return <div className="absolute inset-0 z-50"><RapSurfer onComplete={(s) => resolveCrisis(s)} /></div>;
  if (activeMiniGame === 'flashlight') return <div className="absolute inset-0 z-50"><FlashlightWave onComplete={(s) => resolveCrisis(s)} /></div>;
  if (activeMiniGame === 'scratch') return <div className="absolute inset-0 z-50"><DJScratch onComplete={(s) => resolveCrisis(s)} /></div>;
  if (activeMiniGame === 'prompter') return <LyricPrompter onComplete={(s) => resolveCrisis(s)} />;
  if (activeMiniGame === 'nsskick') return <div className="absolute inset-0 z-50"><NSSKick onComplete={(s) => resolveCrisis(s)} /></div>;
  
  if (activeMiniGame === 'breakdance') {
    return (
      <div className="absolute inset-0 z-50">
        <FlowBattleGame 
          playerName={player.name} 
          isSolo={true} 
          isMiniGame={true} 
          initialDuration={10} 
          onGameEnd={(percentage) => resolveCrisis(percentage)} 
          onExit={() => setActiveMiniGame('none')} 
        />
      </div>
    );
  }

  if (phase === 'simulation') {
      const currentSong = setlist[currentSongIdx];
      return (
          <div className="h-full w-full bg-black flex flex-col relative overflow-hidden font-sans">
              
              {/* Dynamic Background FX */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/30 via-black to-black animate-pulse"></div>
              
              {/* Flash FX */}
              <div className={`absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay transition-opacity duration-150 ease-out ${fxFlash ? 'opacity-80' : 'opacity-0'}`}></div>

              {/* === HUD === */}
              <div className="relative z-30 p-4 pt-safe-top border-b border-white/[0.02] bg-gradient-to-b from-black/80 to-transparent">
                  
                  {/* Top Row */}
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-[#1DB954] text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_#1DB954]">canlı.</div>
                          <div className="flex items-center gap-1">
                              <TrophyIcon className="w-3.5 h-3.5 text-yellow-500" />
                              <span className="text-white font-black text-lg tracking-tight leading-none">{score.toLocaleString()}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-white/80 bg-[#0a0a0a] px-2.5 py-1 rounded-full border border-white/5">
                              <ClockIcon className="w-3.5 h-3.5 text-neutral-400" />
                              <span className={`font-mono font-bold text-xs ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                          </div>
                          <button 
                            onClick={cancelConcert}
                            className="bg-white/5 text-white text-[9px] font-bold px-3 py-1.5 rounded-full border border-white/5 transition-all active:scale-95 lowercase tracking-tight"
                          >
                            iptal et.
                          </button>
                      </div>
                  </div>

                  {/* Hype Bar */}
                  <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                          <span className="text-[#1DB954] tracking-tight lowercase">seyirci coşkusu.</span>
                          <span className="text-white lowercase">%{hype}</span>
                      </div>
                      <div className="h-1.5 bg-[#111] rounded-full overflow-hidden border border-white/5 relative">
                          <div className={`h-full transition-all duration-500 ease-out relative ${hype > 70 ? 'bg-gradient-to-r from-[#1DB954] to-green-400 shadow-[0_0_15px_#1DB954]' : hype > 30 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${hype}%` }}>
                              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* === STAGE AREA & LOGS === */}
              <div className="flex-1 relative p-4 flex flex-col justify-end overflow-hidden z-10">
                  
                  {/* Character Avatar Display (Circular Window) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                      <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/10 overflow-hidden bg-black/40 backdrop-blur-sm shadow-2xl transition-all duration-500 ${hype > 70 ? 'scale-110 border-[#1DB954]/50' : hype < 30 ? 'scale-90 border-red-500/50 grayscale' : 'scale-100'}`}>
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10"></div>
                          <div className="absolute inset-0 flex items-center justify-center mt-10">
                              <Avatar appearance={player.appearance} gender={player.gender} size={300} />
                          </div>
                      </div>
                      {/* Emotion Indicator */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[9px] font-extrabold uppercase tracking-tight text-white whitespace-nowrap z-20 shadow-lg lowercase">
                          {hype > 70 ? '🔥 coşku.' : hype < 30 ? '😰 telaşlı.' : '🎤 akışta.'}
                      </div>
                  </div>
                  
                  {/* Crisis Overlay */}
                  {crisisActive && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6">
                          <div className="text-center p-6 bg-[#0a0a0a] border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] w-full max-w-sm relative overflow-hidden">
                              <div className="absolute inset-0 bg-red-900/5 animate-pulse"></div>
                              <h2 className="text-xl font-black text-red-500 mb-2 animate-bounce lowercase tracking-tight relative z-10">{crisisActive.label.toLowerCase()}.</h2>
                              <p className="text-white text-xs mb-6 font-bold leading-relaxed lowercase tracking-tight relative z-10">{crisisActive.msg.toLowerCase()}</p>
                              <button 
                                onClick={() => setActiveMiniGame(crisisActive.type)} 
                                className="w-full bg-[#1DB954] text-black font-black py-4 rounded-2xl text-[10px] lowercase tracking-tight transition-all active:scale-95 shadow-lg relative z-10"
                              >
                                müdahale et.
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Logs Feed */}
                  <div ref={logContainerRef} className="w-full h-full overflow-y-auto space-y-2 relative mask-image-b pb-2">
                      {logs.map(log => {
                          let styleClass = "border-l-2 border-white/10 bg-[#0a0a0a] text-neutral-400";
                          if (log.type === 'crisis') styleClass = "border-l-4 border-red-500 bg-red-900/10 text-white font-bold shadow-lg";
                          if (log.type === 'good') styleClass = "border-l-2 border-[#1DB954] bg-[#1DB954]/5 text-[#1DB954] font-medium";
                          if (log.type === 'bad') styleClass = "border-l-2 border-orange-500 bg-orange-950/10 text-orange-400";

                          return (
                              <div key={log.id} className={`p-3 rounded-r-xl backdrop-blur-sm animate-slide-in-left flex gap-3 items-start text-xs leading-snug ${styleClass}`}>
                                  <span className="font-mono text-[9px] opacity-60 mt-0.5">{log.timestamp}</span>
                                  <span className="lowercase">{log.text.toLowerCase()}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* === CONTROL DECK === */}
              <div className="bg-[#050505] border-t border-white/5 p-4 pb-safe relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                  <div className="flex gap-4 items-center">
                      
                      {/* Album Art (Spinning Vinyl) */}
                      <div className={`w-16 h-16 rounded-full bg-[#0a0a0a] p-1 shadow-lg shrink-0 relative ${!crisisActive && activeMiniGame === 'none' ? 'animate-spin-slow' : ''}`}>
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/5 relative">
                              <img src={currentSong.artworkUrl100} className="w-full h-full object-cover opacity-90" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#050505] rounded-full border border-white/10"></div>
                          </div>
                      </div>

                      {/* Song Info & Controls */}
                      <div className="flex-1 min-w-0">
                          <div className="text-[9px] text-[#1DB954] font-bold lowercase tracking-tight mb-1 truncate">şu an çalıyor.</div>
                          <div className="text-white font-extrabold text-sm truncate mb-3 lowercase">{currentSong.trackName.toLowerCase()}</div>
                          
                          {/* Styled Next Song Button */}
                          <button 
                            onClick={() => { playClickSound(); switchSong(false); }}
                            disabled={!!crisisActive || activeMiniGame !== 'none' || songSwitchCooldown > 0} 
                            className="bg-white text-black px-6 py-3 rounded-2xl font-black lowercase tracking-tight text-[10px] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                          >
                              {songSwitchCooldown > 0 ? (
                                  <span className="opacity-60 lowercase">bekle {songSwitchCooldown}s</span>
                              ) : (
                                  <>
                                    <PlayIcon className="w-3 h-3 text-black" />
                                    sıradaki parçayı çal.
                                  </>
                              )}
                          </button>
                      </div>

                      {/* FX & Mic Actions */}
                      <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => !crisisActive && activeMiniGame === 'none' && addLog("Seyirciye bağırdın: 'SES VER!'", 'good')} 
                            className="bg-[#0a0a0a] w-12 h-8 rounded-lg border border-white/5 flex items-center justify-center text-white transition-all active:bg-[#1DB954]/20 active:scale-95"
                          >
                              <MicIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={triggerFX} 
                            disabled={fxCooldown > 0} 
                            className={`w-12 h-8 rounded-lg border border-white/5 flex items-center justify-center transition-all active:scale-95 ${fxCooldown > 0 ? 'bg-neutral-900 opacity-30 cursor-not-allowed text-neutral-600' : 'bg-[#0a0a0a] active:bg-purple-900/35 text-purple-400'}`}
                          >
                              <span className="text-[9px] font-black lowercase tracking-tight">{fxCooldown > 0 ? `${fxCooldown}` : 'fx.'}</span>
                          </button>
                      </div>
                  </div>
              </div>

          </div>
      );
  }

  if (phase === 'result') {
        const isSuccess = !!gainedStats.success;
        return (
            <div className="h-full bg-[#000000] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden font-sans select-none">
                
                {/* Background Atmosphere */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent"></div>
                    {/* Ambient Background Matrix Dots */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                </div>

                <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                    
                    {/* Modern Cybernetic Card Container */}
                    <div className={`w-full bg-[#020204] border-2 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative overflow-hidden ${isSuccess ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                        {/* Brackets around corners */}
                        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-50 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
                        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 opacity-50 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
                        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 opacity-50 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-50 ${isSuccess ? 'border-emerald-400' : 'border-red-400'}`} />

                        {/* Top neon indicator stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-transparent to-transparent opacity-80 ${isSuccess ? 'via-emerald-400' : 'via-red-400'}`} />

                        {/* Status Watermark */}
                        <div className="text-[8px] font-mono tracking-[0.2em] text-[#10b981]/50 mb-4 text-center uppercase">CONCERT_PERFORMANCE // RESULT_DECK</div>

                        {/* Title */}
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {isSuccess ? 'EFSANE GECE!' : 'FİYASKO.'}
                            </h1>
                            <p className="text-[#10b981] font-black text-[9px] tracking-wider uppercase mt-1">
                                {gainedStats.failReason ? gainedStats.failReason : "PERFORMANS RAPORU SEKTÖRÜ"}
                            </p>
                        </div>

                        {/* Stats Grid - Minimal Rows */}
                        <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                            <div className="bg-neutral-900/35 border border-white/5 rounded-2xl p-4.5">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">TOPLAM SKOR</span>
                                <div className="text-xl font-black text-white font-mono tracking-tight">{score.toLocaleString()}</div>
                            </div>
                            <div className="bg-neutral-900/35 border border-white/5 rounded-2xl p-4.5">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">COŞKU S.</span>
                                <div className="text-xl font-black text-white font-mono tracking-tight">%{hype}</div>
                            </div>
                        </div>

                        {/* Financial and Fan metrics */}
                        <div className="bg-neutral-900/15 border border-white/5 rounded-2xl p-5 mb-6 w-full relative">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">KAZANÇ</span>
                                    <div className={`text-xl font-black font-mono tracking-tight ${gainedStats.cash >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                                        {gainedStats.cash >= 0 ? '+' : ''}₺{Math.abs(gainedStats.cash).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">YENİ DİNLEYİCİ</span>
                                    <div className={`text-xl font-black font-mono tracking-tight ${gainedStats.fans >= 0 ? 'text-purple-400' : 'text-red-500'}`}>
                                        {gainedStats.fans >= 0 ? '+' : ''}{Math.abs(gainedStats.fans).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 my-4"></div>

                            {/* Progression Indicators */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider block mb-0.5">MENAJER</span>
                                    <span className="text-[10px] font-black font-mono text-emerald-400">+2%</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider block mb-0.5">EKİP</span>
                                    <span className="text-[10px] font-black font-mono text-emerald-400">+2%</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider block mb-0.5">SADAKAT</span>
                                    <span className="text-[10px] font-black font-mono text-emerald-400">+5%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button 
                          onClick={() => setPhase('hub')} 
                          className="w-full py-4 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-[0.18em] transition-all hover:transform hover:scale-[1.01] active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] cursor-pointer"
                        >
                          KULİSE DÖN
                        </button>
                    </div>
                </div>
            </div>
        );
    }
  return null;
};
