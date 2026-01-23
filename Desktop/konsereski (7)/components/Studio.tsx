
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, SongDraft, ProductionPhase } from '../types';
import { SongProductionManager } from '../services/productionService';
import { MicIcon, DiscIcon, ClockIcon, CheckIcon, CoinIcon } from './Icons';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  spendEnergy: (amount: number) => boolean;
}

const BEAT_STYLES = [
    { id: 'trap', name: 'Trap', bgImage: 'linear-gradient(45deg, #4f46e5, #9333ea)', label: 'HARD' },
    { id: 'drill', name: 'Drill', bgImage: 'linear-gradient(45deg, #dc2626, #ea580c)', label: 'AGGRESSIVE' },
    { id: 'boombap', name: 'Boom Bap', bgImage: 'linear-gradient(45deg, #d97706, #fbbf24)', label: 'CLASSIC' },
    { id: 'lofi', name: 'Lo-Fi', bgImage: 'linear-gradient(45deg, #059669, #14b8a6)', label: 'CHILL' }
];

export const Studio: React.FC<Props> = ({ player, updateStat, spendEnergy }) => {
  // Local State
  const [songName, setSongName] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);
  const [phase, setPhase] = useState<ProductionPhase>('idle');
  const [showBeatSelector, setShowBeatSelector] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Initialize phase
  useEffect(() => {
    if (!player.activeProduction) {
        setPhase('idle');
    } else if (player.activeProduction.finishTime === 0) {
        setPhase('recording');
    } else {
        const status = SongProductionManager.checkMixingStatus(player.activeProduction);
        setPhase(status);
    }
  }, [player.activeProduction]);

  // Check Tutorial
  useEffect(() => {
      const hasSeenTutorial = localStorage.getItem('flowify_studio_tutorial_seen');
      if (!hasSeenTutorial) {
          setShowTutorial(true);
      }
  }, []);

  const closeTutorial = () => {
      localStorage.setItem('flowify_studio_tutorial_seen', 'true');
      setShowTutorial(false);
  };

  const notify = (message: string, type: 'success' | 'error' | 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  // --- ACTIONS ---

  const initiateProject = () => {
      if (!songName.trim()) { notify("Şarkına bir isim ver!", 'error'); return; }
      if (player.cash < 100) { notify("Yetersiz bakiye! Kayıt için ₺100 gerekli.", 'error'); return; }
      setShowBeatSelector(true);
  };

  const confirmStartProject = (beatId: string) => {
    updateStat('cash', -100);
    const draft = SongProductionManager.startProduction(songName, player);
    window.dispatchEvent(new CustomEvent('updatePlayerProduction', { detail: draft }));
    setPhase('recording');
    setShowBeatSelector(false);
    setSelectedBeat(null);
  };

  const handleRecordingComplete = (score: number) => {
    if (!player.activeProduction) return;
    
    const quality = SongProductionManager.calculateQuality(score, player);
    const updatedDraft = { ...player.activeProduction, quality };
    const mixingDraft = SongProductionManager.startMixing(updatedDraft);
    
    window.dispatchEvent(new CustomEvent('updatePlayerProduction', { detail: mixingDraft }));
    setPhase('mixing');
  };

  const handleBoostMixing = () => {
      if (!player.activeProduction) return;
      if (player.cash < 100) { notify("Yetersiz bakiye (₺100)", 'error'); return; }

      updateStat('cash', -100);
      const boosted = SongProductionManager.boostMixing(player.activeProduction);
      window.dispatchEvent(new CustomEvent('updatePlayerProduction', { detail: boosted }));
      setPhase('ready');
  };

  const handleRelease = () => {
      if (!player.activeProduction) return;

      const { song, listenersGained, initialCash } = SongProductionManager.releaseSong(player.activeProduction, player);
      
      // Dispatch ATOMIC event to App.tsx to handle state update correctly
      window.dispatchEvent(new CustomEvent('songReleased', { 
          detail: { 
              song, 
              listenersGained, 
              initialCash 
          } 
      }));

      notify(`"${song.name}" YAYINDA! 🔥 +${listenersGained} Dinleyici`, 'success');
      setTimeout(() => {
          notify(`İlk Hafta Satışları: +₺${initialCash.toLocaleString()}`, 'success');
      }, 1000);

      setPhase('idle');
      setSongName('');
  };

  const collectMoney = () => {
      if (player.pendingCash <= 0) return;
      updateStat('cash', player.pendingCash);
      window.dispatchEvent(new CustomEvent('resetPendingCash'));
  };

  // --- RENDER ---

  return (
    <div className="h-full bg-[#050505] flex flex-col relative overflow-hidden">
        
        {/* TUTORIAL OVERLAY */}
        {showTutorial && (
            <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl">
                    <h2 className="text-xl font-black text-center mb-4 text-white uppercase tracking-wider">Stüdyo Rehberi</h2>
                    <div className="space-y-4 text-sm text-neutral-300">
                        <p>1. <strong>Proje Başlat:</strong> Şarkı ismi gir ve Beat seç.</p>
                        <p>2. <strong>Kayıt Al:</strong> Yeşil barı tutturarak kaliteyi belirle.</p>
                        <p>3. <strong>Mixing & Yayınla:</strong> İşlem bitince yayınla.</p>
                        <p>4. <strong>Para Kazan:</strong> Sağ üstteki Kasa'dan biriken parayı topla.</p>
                    </div>
                    <button onClick={closeTutorial} className="w-full bg-[#1ed760] text-black font-black py-3 rounded-xl mt-6">ANLAŞILDI</button>
                </div>
            </div>
        )}

        {/* BEAT SELECTOR OVERLAY (PREMIUM UI - High Z-Index to cover Nav) */}
        {showBeatSelector && (
            <div className="absolute inset-0 z-[120] bg-black flex flex-col animate-fade-in">
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pb-20">
                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter pt-safe-top mt-4">BEAT SEÇİMİ</h2>
                    <p className="text-neutral-500 text-xs mb-6 font-bold tracking-widest uppercase">Prodüksiyon Başlıyor</p>
                    
                    {/* Beat List */}
                    <div className="grid grid-cols-1 gap-3 w-full max-w-sm mx-auto mb-8">
                        {BEAT_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedBeat(style.id)}
                                className={`relative h-20 rounded-2xl overflow-hidden transition-all duration-300 group ${selectedBeat === style.id ? 'ring-2 ring-white scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                            >
                                {/* Background Art */}
                                <div className="absolute inset-0" style={{ background: style.bgImage }}></div>
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                
                                {/* Vinyl Disc Decor */}
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-24 h-24 bg-black rounded-full border-4 border-[#111] flex items-center justify-center opacity-80 group-hover:rotate-45 transition-transform duration-500">
                                    <div className="w-8 h-8 bg-[#222] rounded-full border border-white/20"></div>
                                </div>

                                <div className="absolute inset-0 p-5 flex flex-col justify-center items-start">
                                    <span className="bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur mb-1 border border-white/10">{style.label}</span>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-md">{style.name}</h3>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Buttons Moved Here (Inside Scroll) */}
                    <div className="flex gap-4 max-w-sm mx-auto mb-10">
                        <button 
                            onClick={() => setShowBeatSelector(false)} 
                            className="flex-1 py-4 bg-[#222] text-white font-bold rounded-xl border border-white/10"
                        >
                            İPTAL
                        </button>
                        <button 
                            onClick={() => selectedBeat && confirmStartProject(selectedBeat)}
                            disabled={!selectedBeat}
                            className={`flex-1 py-4 font-bold rounded-xl transition-all shadow-lg ${selectedBeat ? 'bg-[#1ed760] text-black hover:scale-[1.02]' : 'bg-[#333] text-neutral-500'}`}
                        >
                            KAYIT AL
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* TOP BAR - Kasa Button */}
        <div className="absolute top-20 right-4 z-20">
             <button 
                onClick={collectMoney}
                disabled={player.pendingCash <= 0}
                className={`relative group flex items-center gap-3 px-4 py-2 rounded-full transition-all border shadow-xl ${player.pendingCash > 0 ? 'bg-[#111] border-green-500/50 hover:border-green-500' : 'opacity-0 pointer-events-none'}`}
            >
                 <div className="relative">
                     <CoinIcon className={`w-5 h-5 ${player.pendingCash > 0 ? 'text-green-400' : 'text-neutral-600'}`} />
                     {player.pendingCash > 0 && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>}
                 </div>
                 <div className="flex flex-col items-end leading-none">
                     <span className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Kasa</span>
                     <span className={`text-xs font-mono font-bold ${player.pendingCash > 0 ? 'text-white' : 'text-neutral-500'}`}>
                         +₺{player.pendingCash.toLocaleString()}
                     </span>
                 </div>
            </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden flex flex-col pt-20">

            {/* PHASE 1: IDLE */}
            {phase === 'idle' && (
                <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in p-6 pb-32 overflow-y-auto">
                     <div className="w-full max-w-sm bg-[#111]/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-[-50%] left-[-50%] w-[100%] h-[100%] bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
                         <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">Yeni Proje</h2>
                         <div className="space-y-6 relative z-10">
                             <div>
                                 <label className="text-[10px] font-bold text-neutral-500 uppercase ml-3 mb-2 block tracking-widest">Parça İsmi</label>
                                 <input 
                                    value={songName}
                                    onChange={(e) => setSongName(e.target.value)}
                                    placeholder="Proje Adı Giriniz"
                                    className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-700 focus:border-white/30 focus:outline-none transition-colors text-sm font-medium"
                                 />
                             </div>
                             <button 
                                onClick={initiateProject}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                             >
                                 <MicIcon className="w-4 h-4" />
                                 KAYIT (₺100)
                             </button>
                         </div>
                     </div>
                     <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                         <StatBadge label="Flow" val={player.flow} />
                         <StatBadge label="Lirik" val={player.lyrics} />
                         <StatBadge label="Ritim" val={player.rhythm} />
                     </div>
                </div>
            )}

            {/* PHASE 2: RECORDING (DAW UI) */}
            {phase === 'recording' && (
                <RecordingDAW 
                    songName={player.activeProduction?.name || 'Untitled'} 
                    onComplete={handleRecordingComplete} 
                />
            )}

            {/* PHASE 3 & 4: MIXING UI REFRESHED */}
            {(phase === 'mixing' || phase === 'ready') && player.activeProduction && (
                <div className="h-full flex flex-col items-center justify-center animate-fade-in p-6 pb-20 overflow-y-auto">
                    
                    {/* STUDIO MONITOR SCREEN */}
                    <div className="w-full max-w-md bg-[#0a0a0a] rounded-xl border border-[#333] p-6 shadow-2xl relative overflow-hidden mb-8 flex flex-col items-center">
                        {/* Status Text (Moved Up) */}
                        {phase === 'mixing' ? (
                            <div className="text-white font-black text-2xl tracking-tighter mb-6 text-center animate-pulse">
                                MIXING & MASTERING
                            </div>
                        ) : (
                            <div className="text-[#1ed760] font-black text-2xl tracking-tighter mb-6 text-center">
                                HAZIR!
                            </div>
                        )}

                        {/* Center Visuals (Spectrum) */}
                        <div className="h-32 w-full flex items-end justify-center gap-1 opacity-80 mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                             {[...Array(15)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-3 bg-green-500 rounded-t-sm ${phase === 'mixing' ? 'animate-pulse' : ''}`}
                                    style={{ 
                                        height: phase === 'mixing' ? `${Math.random() * 100}%` : '20%',
                                        animationDuration: `${0.5 + Math.random() * 0.5}s`
                                    }}
                                 ></div>
                             ))}
                        </div>
                        
                        {/* Progress Bar & Timer (Moved Down) */}
                        {phase === 'mixing' ? (
                            <MixingProgress finishTime={player.activeProduction.finishTime} onFinish={() => setPhase('ready')} />
                        ) : (
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                                <CheckIcon className="w-8 h-8 text-black" />
                            </div>
                        )}
                        
                    </div>

                    {/* CONTROLS */}
                    <div className="w-full max-w-sm space-y-4">
                        {phase === 'mixing' ? (
                            <button 
                                onClick={handleBoostMixing}
                                className="w-full bg-[#111] border border-yellow-500/20 text-yellow-500 font-bold py-4 rounded-xl hover:bg-yellow-500/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <ClockIcon className="w-4 h-4" />
                                HIZLANDIR (₺100)
                            </button>
                        ) : (
                            <button 
                                onClick={handleRelease}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <DiscIcon className="w-4 h-4" />
                                ŞARKIYI YAYINLA
                            </button>
                        )}
                    </div>

                </div>
            )}

        </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatBadge = ({ label, val }: any) => (
    <div className="bg-[#111] p-3 rounded-xl border border-white/5 text-center">
        <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1 tracking-wider">{label}</div>
        <div className="text-white font-bold text-lg leading-none">{val}</div>
    </div>
);

// --- NEW RECORDING DAW INTERFACE ---
const RecordingDAW = ({ songName, onComplete }: { songName: string, onComplete: (score: number) => void }) => {
    // Refs for minigame logic
    const cursorRef = useRef(0);
    const directionRef = useRef(1);
    const animationRef = useRef<number>(0);
    
    // State
    const [cursorVisual, setCursorVisual] = useState(0); 
    const [round, setRound] = useState(1);
    const [scores, setScores] = useState<number[]>([]);
    const [target, setTarget] = useState({ start: 40, width: 20 });
    
    // Fake Spectrum Data
    const [spectrumData, setSpectrumData] = useState<number[]>(new Array(20).fill(10));

    // Spectrum Animation
    useEffect(() => {
        const interval = setInterval(() => {
            setSpectrumData(prev => prev.map(() => Math.random() * 100));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Minigame Loop
    useEffect(() => {
        let isRunning = true;
        const loop = () => {
            if (!isRunning) return;
            const speed = 1.5 + (round * 0.5); 
            cursorRef.current += (speed * directionRef.current);
            if (cursorRef.current >= 100) { cursorRef.current = 100; directionRef.current = -1; } 
            else if (cursorRef.current <= 0) { cursorRef.current = 0; directionRef.current = 1; }
            setCursorVisual(cursorRef.current);
            animationRef.current = requestAnimationFrame(loop);
        };
        animationRef.current = requestAnimationFrame(loop);
        return () => { isRunning = false; cancelAnimationFrame(animationRef.current); };
    }, [round]);

    const handleHit = (e?: React.SyntheticEvent) => {
        // Prevent default actions to ensure the button registers on mobile
        if(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Prevent double taps
        if (round > 3) return;

        const currentPos = cursorRef.current;
        const center = target.start + (target.width / 2);
        const dist = Math.abs(currentPos - center);
        const maxDist = target.width / 2;
        let hitScore = dist <= maxDist ? Math.floor(50 + ((1 - (dist / maxDist)) * 50)) : Math.max(0, 50 - Math.floor(dist - maxDist));
        
        const newScores = [...scores, hitScore];
        setScores(newScores);
        
        // Reset Cursor
        cursorRef.current = 0; 
        directionRef.current = 1;

        if (round < 3) {
            // Delay next round slightly for visual feedback
            setRound(r => r + 1);
            setTarget({ start: Math.random() * 60 + 10, width: Math.max(10, 20 - (round * 2)) });
        } else {
            // End
            setRound(4); // Stops loop effectively in UI
            cancelAnimationFrame(animationRef.current);
            setTimeout(() => { onComplete(Math.floor(newScores.reduce((a, b) => a + b, 0) / 3)); }, 1000);
        }
    };

    return (
        <div className="h-full bg-[#181818] flex flex-col relative overflow-hidden">
            {/* Header: DAW Toolbar */}
            <div className="h-10 bg-[#222] border-b border-black flex items-center justify-between px-4 shrink-0">
                <div className="text-[10px] font-mono text-green-500 font-bold tracking-widest">FLOWIFY STUDIO V1.0</div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="text-[10px] font-bold text-neutral-400">REC</div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden p-4 flex flex-col items-center justify-center">
                
                {/* Background Grid Lines */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* THE TRACK VISUALIZER */}
                <div className="w-full max-w-sm mb-12 relative z-10">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-black text-white tracking-tight">{songName}.mp3</h2>
                    </div>

                    {/* Spectrum - Updated to Green */}
                    <div className="h-24 flex items-end justify-center gap-1 bg-black/20 p-4 rounded-xl border border-white/5">
                        {spectrumData.map((h, i) => (
                            <div 
                                key={i} 
                                className="w-3 bg-green-500 rounded-t-sm transition-all duration-100 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                style={{ height: `${h}%`, opacity: 0.8 }}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* THE MINIGAME INTEGRATED INTO UI */}
                <div className="w-full max-w-sm relative z-10 bg-[#252525] p-4 rounded-xl border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">INPUT LEVEL</div>
                        <div className="text-xs font-bold text-white">ROUND {Math.min(3, round)}/3</div>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-8 bg-[#111] rounded relative overflow-hidden mb-4 border border-[#333]">
                        <div className="absolute top-0 bottom-0 bg-green-500/30 border-l border-r border-green-500" style={{ left: `${target.start}%`, width: `${target.width}%` }}></div>
                        <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" style={{ left: `${cursorVisual}%` }}></div>
                    </div>

                    {/* TAP BUTTON (UPDATED WITH POINTER EVENT) */}
                    <button 
                        onPointerDown={handleHit}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-lg shadow-lg active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2 touch-manipulation"
                    >
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        KAYIT AL
                    </button>
                </div>

                {/* Scores */}
                <div className="flex gap-2 mt-6 relative z-10">
                    {scores.map((s, i) => (
                        <div key={i} className={`text-xs font-bold px-2 py-1 rounded bg-black/50 border ${s > 80 ? 'border-green-500 text-green-500' : 'border-neutral-500 text-neutral-500'}`}>
                            {s}%
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

const MixingProgress = ({ finishTime, onFinish }: { finishTime: number, onFinish: () => void }) => {
    const [timeLeftStr, setTimeLeftStr] = useState("00:00");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const remain = Math.max(0, finishTime - now);
            
            if (remain <= 0) { 
                clearInterval(interval); 
                onFinish(); 
            } else {
                const minutes = Math.floor(remain / 60000);
                const seconds = Math.floor((remain % 60000) / 1000);
                setTimeLeftStr(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [finishTime]);

    return (
        <div className="w-full space-y-2">
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
            </div>
            <div className="text-center text-xs font-mono text-neutral-400">
                KALAN SÜRE: <span className="text-white font-bold">{timeLeftStr}</span>
            </div>
        </div>
    );
};
