
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
import { FlowBattleGame } from './FlowBattleGame'; 
import { TrophyIcon, MicIcon, DiscIcon, ClockIcon, UsersIcon, CoinIcon, FourArrowsIcon, PlayIcon } from './Icons';
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
  onOpenShop?: (tab: IAPTab) => void; // Added prop
}

// Updated Duration to 35 seconds
const CONCERT_DURATION_SEC = 35; 

type ConcertPhase = 'hub' | 'city_select' | 'venue_select' | 'pre_scenario' | 'setup' | 'simulation' | 'post_scenario' | 'result';
type LogType = 'info' | 'good' | 'bad' | 'crisis';
type MiniGameType = 'none' | 'rapsurfer' | 'flashlight' | 'scratch' | 'breakdance' | 'prompter';

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

export const ConcertMode: React.FC<Props> = ({ player, updateStat, updateMultipleStats, onExit, onEditCharacter, onOpenShop }) => {
  const [phase, setPhase] = useState<ConcertPhase>('hub');
  
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

  const addLog = (text: string, type: LogType = 'info') => {
      const now = new Date();
      const timestamp = `${now.getHours()}:${now.getMinutes() < 10 ? '0'+now.getMinutes() : now.getMinutes()}`;
      setLogs(prev => [{ id: Date.now(), text, type, timestamp }, ...prev].slice(0, 20));
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
      const games: MiniGameType[] = ['rapsurfer', 'flashlight', 'scratch', 'breakdance', 'prompter'];
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
      
      // SIGNIFICANTLY REDUCED MINIGAME FREQUENCY
      // Was 0.7 if queue, now 0.35 (35% chance per tick)
      // Was 0.15 if empty, now 0.08 (8% chance per tick)
      const triggerChance = hasQueue ? 0.35 : 0.08; 
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
          const types: MiniGameType[] = ['rapsurfer', 'flashlight', 'scratch', 'breakdance', 'prompter'];
          nextGame = types[Math.floor(Math.random() * types.length)];
      }
      const config = {
          'rapsurfer': { label: 'SES DALGASI', msg: "⚠ SES FREKANSI KAYDI! DÜZELTMEK İÇİN SÖRF YAP!" },
          'flashlight': { label: 'FLAŞLARI YAK', msg: "ARKA TARAF SIKILDI TELEFONLARININ FLASHLARINI AÇTIR!" },
          'scratch': { label: 'BEAT DROP', msg: "⚠ DROP GELİYOR! SCRATCH AT!" },
          'breakdance': { label: 'BREAKDANCE ŞOV', msg: "⚠ SEYİRCİ COŞMAK İSTİYOR! ŞİMDİ BREAKDANCE ZAMANI!" },
          'prompter': { label: 'SÖZLERİ UNUTTUN', msg: "⚠ SÖZLER AKLINDAN UÇTU! PROMPTER'I OKU VE YAZ!" }, 
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

  const finishConcert = () => {
      clearInterval(timerRef.current);
      clearInterval(eventLoopRef.current);
      stopAudio();
      const luckFactor = Math.random(); 
      const isBadLuck = luckFactor < 0.1; 
      let isSuccess = hype >= 50 && !isBadLuck;
      let cashChange = 0;
      let fanChange = 0;
      let failReason = '';
      let finalUpdates: any = {};
      if (selectedVenue) {
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

  if (phase === 'hub') return <CareerHub player={player} onStartSetup={() => setPhase('city_select')} onExit={onExit} updateStat={updateStat} updateMultipleStats={updateMultipleStats} onEditCharacter={onEditCharacter} onOpenShop={onOpenShop} />;
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
          <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
              
              {/* Dynamic Background FX */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-black to-black animate-pulse"></div>
              <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              
              {/* Flash FX */}
              <div className={`absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay transition-opacity duration-150 ease-out ${fxFlash ? 'opacity-80' : 'opacity-0'}`}></div>

              {/* === HUD === */}
              <div className="relative z-30 p-4 pt-safe-top border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent">
                  
                  {/* Top Row */}
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-[#e91429] text-white text-[9px] font-black px-2 py-0.5 rounded animate-pulse shadow-[0_0_10px_#e91429]">CANLI</div>
                          <div className="flex items-center gap-1">
                              <TrophyIcon className="w-4 h-4 text-yellow-500" />
                              <span className="text-white font-black text-xl tracking-tight leading-none">{score.toLocaleString()}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 text-white/80 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                          <ClockIcon className="w-4 h-4 text-neutral-400" />
                          <span className={`font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                      </div>
                  </div>

                  {/* Hype Bar */}
                  <div>
                      <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                          <span className="text-[#1ed760] tracking-[0.2em] drop-shadow-sm">SEYİRCİ HYPE</span>
                          <span className="text-white">{hype}%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden border border-white/5 relative">
                          <div className={`h-full transition-all duration-500 ease-out relative ${hype > 70 ? 'bg-gradient-to-r from-[#1ed760] to-green-400 shadow-[0_0_15px_#1ed760]' : hype > 30 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${hype}%` }}>
                              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* === STAGE AREA & LOGS === */}
              <div className="flex-1 relative p-4 flex flex-col justify-end overflow-hidden z-10">
                  
                  {/* Crisis Overlay */}
                  {crisisActive && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6">
                          <div className="text-center p-6 bg-[#1a1a1a] border border-red-500/50 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.4)] w-full max-w-sm relative overflow-hidden">
                              <div className="absolute inset-0 bg-red-900/10 animate-pulse"></div>
                              <h2 className="text-2xl font-black text-red-500 italic mb-2 animate-bounce uppercase tracking-wider relative z-10">{crisisActive.label}</h2>
                              <p className="text-white text-xs mb-6 font-bold leading-relaxed uppercase tracking-wide relative z-10">{crisisActive.msg}</p>
                              <button onClick={() => setActiveMiniGame(crisisActive.type)} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-lg relative z-10">MÜDAHALE ET</button>
                          </div>
                      </div>
                  )}

                  {/* Logs Feed */}
                  <div ref={logContainerRef} className="w-full h-full overflow-y-auto space-y-2 relative mask-image-b pb-2">
                      {logs.map(log => {
                          let styleClass = "border-l-2 border-white/20 bg-black/40 text-neutral-400";
                          if (log.type === 'crisis') styleClass = "border-l-4 border-red-500 bg-red-900/30 text-white font-bold shadow-lg";
                          if (log.type === 'good') styleClass = "border-l-2 border-[#1ed760] bg-green-900/20 text-[#1ed760] font-medium";
                          if (log.type === 'bad') styleClass = "border-l-2 border-orange-500 bg-orange-900/20 text-orange-400";

                          return (
                              <div key={log.id} className={`p-3 rounded-r-xl backdrop-blur-sm animate-slide-in-left flex gap-3 items-start text-xs leading-snug ${styleClass}`}>
                                  <span className="font-mono text-[9px] opacity-60 mt-0.5">{log.timestamp}</span>
                                  <span>{log.text}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* === CONTROL DECK === */}
              <div className="bg-[#111] border-t border-white/10 p-4 pb-safe relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                  <div className="flex gap-4 items-center">
                      
                      {/* Album Art (Spinning Vinyl) */}
                      <div className={`w-16 h-16 rounded-full bg-[#1a1a1a] p-1 shadow-lg shrink-0 relative ${!crisisActive && activeMiniGame === 'none' ? 'animate-spin-slow' : ''}`}>
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#333] relative">
                              <img src={currentSong.artworkUrl100} className="w-full h-full object-cover opacity-90" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#111] rounded-full border border-white/20"></div>
                          </div>
                      </div>

                      {/* Song Info & Controls */}
                      <div className="flex-1 min-w-0">
                          <div className="text-[9px] text-[#1ed760] font-black uppercase tracking-wider mb-1 truncate">ŞU AN ÇALIYOR</div>
                          <div className="text-white font-bold text-sm truncate mb-3">{currentSong.trackName}</div>
                          
                          {/* Styled Next Song Button */}
                          <button 
                            onClick={() => { playClickSound(); switchSong(false); }}
                            disabled={!!crisisActive || activeMiniGame !== 'none' || songSwitchCooldown > 0} 
                            className="bg-[#1ed760] text-black px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                          >
                              {songSwitchCooldown > 0 ? (
                                  <span className="text-neutral-800">BEKLE {songSwitchCooldown}s</span>
                              ) : (
                                  <>
                                    <PlayIcon className="w-3 h-3" />
                                    SIRADAKİ PARÇAYI ÇAL
                                  </>
                              )}
                          </button>
                      </div>

                      {/* FX & Mic Actions */}
                      <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => !crisisActive && activeMiniGame === 'none' && addLog("Seyirciye bağırdın: 'SES VER!'", 'good')} 
                            className="bg-[#222] w-12 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-[#1ed760] hover:text-black hover:border-[#1ed760] transition-all active:scale-95"
                          >
                              <MicIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={triggerFX} 
                            disabled={fxCooldown > 0} 
                            className={`w-12 h-8 rounded-lg border border-white/10 flex items-center justify-center transition-all active:scale-95 ${fxCooldown > 0 ? 'bg-[#222] opacity-30 cursor-not-allowed' : 'bg-[#222] hover:bg-purple-600 hover:text-white hover:border-purple-600 text-purple-400'}`}
                          >
                              <span className="text-[9px] font-black tracking-widest">{fxCooldown > 0 ? `${fxCooldown}` : 'FX'}</span>
                          </button>
                      </div>
                  </div>
              </div>

          </div>
      );
  }

  if (phase === 'result') {
      return (
          <div className="h-full bg-[#050505] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden font-sans">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1ed760]/20 via-black to-black pointer-events-none"></div>
              <div className="relative z-10 w-full max-w-sm text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce ${gainedStats.success ? 'bg-[#1ed760] shadow-[#1ed760]/40' : 'bg-red-500 shadow-red-500/40'}`}>
                      {gainedStats.success ? <TrophyIcon className="w-12 h-12 text-black" /> : <div className="text-4xl">💩</div>}
                  </div>
                  <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">{gainedStats.success ? 'KONSER BİTTİ!' : 'FİYASKO!'}</h1>
                  <p className="text-neutral-400 font-medium mb-10 text-sm uppercase tracking-widest">{gainedStats.failReason || "Performans Özeti"}</p>
                  <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 space-y-4 mb-8 backdrop-blur-md shadow-2xl">
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Toplam Skor</span>
                          <span className="text-white font-black text-2xl">{score.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Kariyer Kazancı</span>
                          <span className={`font-black text-xl flex items-center gap-1 ${gainedStats.cash >= 0 ? 'text-[#1ed760]' : 'text-red-500'}`}>{gainedStats.cash >= 0 ? '+' : ''}₺{gainedStats.cash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Dinleyici</span>
                          <span className={`font-black text-xl flex items-center gap-1 ${gainedStats.fans >= 0 ? 'text-purple-400' : 'text-red-500'}`}>{gainedStats.fans >= 0 ? '+' : ''}{gainedStats.fans.toLocaleString()}</span>
                      </div>
                  </div>
                  <button onClick={() => setPhase('hub')} className="w-full bg-white text-black font-black py-4 rounded-full uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-transform shadow-lg">KULİSE DÖN</button>
              </div>
          </div>
      );
  }
  return null;
};
