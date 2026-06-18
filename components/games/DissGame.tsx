import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../../types';
import { playClickSound, playWinSound, playErrorSound } from '../../services/sfx';

interface Props {
    player: PlayerStats;
    updateMultipleStats: (updates: Partial<PlayerStats>) => void;
    onExit: () => void;
}

const OPPONENTS = [
    { id: 'cakal', name: 'Çakal', hp: 100, attack: 10, defense: 5, reward: 5000, reqLevel: 1 },
    { id: 'uzi', name: 'Uzi', hp: 150, attack: 15, defense: 10, reward: 10000, reqLevel: 2 },
    { id: 'khontkar', name: 'Khontkar', hp: 200, attack: 20, defense: 15, reward: 25000, reqLevel: 3 },
    { id: 'ezhel', name: 'Ezhel', hp: 300, attack: 25, defense: 20, reward: 50000, reqLevel: 4 },
    { id: 'sagopa', name: 'Sagopa Kajmer', hp: 500, attack: 35, defense: 30, reward: 100000, reqLevel: 5 },
    { id: 'ceza', name: 'Ceza', hp: 600, attack: 45, defense: 25, reward: 200000, reqLevel: 6 },
    { id: 'massaka', name: 'Massaka', hp: 700, attack: 50, defense: 35, reward: 300000, reqLevel: 7 },
    { id: 'killa_hakan', name: 'Killa Hakan', hp: 800, attack: 55, defense: 40, reward: 400000, reqLevel: 8 },
    { id: 'ben_fero', name: 'Ben Fero', hp: 900, attack: 60, defense: 45, reward: 500000, reqLevel: 9 },
    { id: 'norm_ender', name: 'Norm Ender', hp: 1000, attack: 65, defense: 50, reward: 600000, reqLevel: 10 },
    { id: 'sehabe', name: 'Sehabe', hp: 1100, attack: 70, defense: 55, reward: 700000, reqLevel: 11 },
    { id: 'hidra', name: 'Hidra', hp: 1200, attack: 75, defense: 60, reward: 800000, reqLevel: 12 },
    { id: 'joker', name: 'Joker', hp: 1300, attack: 80, defense: 65, reward: 900000, reqLevel: 13 },
    { id: 'allame', name: 'Allame', hp: 1400, attack: 85, defense: 70, reward: 1000000, reqLevel: 14 },
    { id: 'sansar_salvo', name: 'Sansar Salvo', hp: 1500, attack: 90, defense: 75, reward: 1100000, reqLevel: 15 },
    { id: 'patron', name: 'Patron', hp: 1600, attack: 95, defense: 80, reward: 1200000, reqLevel: 16 },
    { id: 'saian', name: 'Saian', hp: 1700, attack: 100, defense: 85, reward: 1300000, reqLevel: 17 },
    { id: 'kara_cali', name: 'Karaçalı', hp: 1800, attack: 105, defense: 90, reward: 1400000, reqLevel: 18 },
    { id: 'hayki', name: 'Hayki', hp: 1900, attack: 110, defense: 95, reward: 1500000, reqLevel: 19 },
    { id: 'gazapizm', name: 'Gazapizm', hp: 2000, attack: 115, defense: 100, reward: 1600000, reqLevel: 20 },
    { id: 'anıl_piyancı', name: 'Anıl Piyancı', hp: 2100, attack: 120, defense: 105, reward: 1700000, reqLevel: 21 },
    { id: 'server_uraz', name: 'Server Uraz', hp: 2200, attack: 125, defense: 110, reward: 1800000, reqLevel: 22 },
    { id: 'beta', name: 'Beta', hp: 2300, attack: 130, defense: 115, reward: 1900000, reqLevel: 23 },
    { id: 'şanışer', name: 'Şanışer', hp: 2400, attack: 135, defense: 120, reward: 2000000, reqLevel: 24 },
    { id: 'sokrat_st', name: 'Sokrat St', hp: 2500, attack: 140, defense: 125, reward: 2100000, reqLevel: 25 },
    { id: 'defkhan', name: 'Defkhan', hp: 2600, attack: 145, defense: 130, reward: 2200000, reqLevel: 26 },
    { id: 'rota', name: 'Rota', hp: 2700, attack: 150, defense: 135, reward: 2300000, reqLevel: 27 },
    { id: 'tepki', name: 'Tepki', hp: 2800, attack: 155, defense: 140, reward: 2400000, reqLevel: 28 },
    { id: 'motive', name: 'Motive', hp: 2900, attack: 160, defense: 145, reward: 2500000, reqLevel: 29 },
    { id: 'ati242', name: 'Ati242', hp: 3000, attack: 165, defense: 150, reward: 2600000, reqLevel: 30 },
    { id: 'batuflex', name: 'Batuflex', hp: 3100, attack: 170, defense: 155, reward: 2700000, reqLevel: 31 },
    { id: 'lvbel_c5', name: 'Lvbel C5', hp: 3200, attack: 175, defense: 160, reward: 2800000, reqLevel: 32 },
    { id: 'ceno', name: 'Ceno', hp: 3300, attack: 180, defense: 165, reward: 2900000, reqLevel: 33 },
    { id: 'reckol', name: 'Reckol', hp: 3400, attack: 185, defense: 170, reward: 3000000, reqLevel: 34 },
    { id: 'sefo', name: 'Sefo', hp: 3500, attack: 190, defense: 175, reward: 3100000, reqLevel: 35 },
    { id: 'murda', name: 'Murda', hp: 3600, attack: 195, defense: 180, reward: 3200000, reqLevel: 36 },
    { id: 'misha', name: 'Misha', hp: 3700, attack: 200, defense: 185, reward: 3300000, reqLevel: 37 },
    { id: 'kodes', name: 'Kodes', hp: 3800, attack: 205, defense: 190, reward: 3400000, reqLevel: 38 },
    { id: 'yener_cevik', name: 'Yener Çevik', hp: 3900, attack: 210, defense: 195, reward: 3500000, reqLevel: 39 },
    { id: 'cash_flow', name: 'Cash Flow', hp: 4000, attack: 215, defense: 200, reward: 3600000, reqLevel: 40 },
    { id: 'no_1', name: 'No.1', hp: 4100, attack: 220, defense: 205, reward: 3700000, reqLevel: 41 },
    { id: 'canbay', name: 'Canbay', hp: 4200, attack: 225, defense: 210, reward: 3800000, reqLevel: 42 },
    { id: 'wolker', name: 'Wolker', hp: 4300, attack: 230, defense: 215, reward: 3900000, reqLevel: 43 },
    { id: 'heijan', name: 'Heijan', hp: 4400, attack: 235, defense: 220, reward: 4000000, reqLevel: 44 },
    { id: 'muti', name: 'Muti', hp: 4500, attack: 240, defense: 225, reward: 4100000, reqLevel: 45 },
    { id: 'uzi_2', name: 'Uzi (V2)', hp: 4600, attack: 245, defense: 230, reward: 4200000, reqLevel: 46 },
    { id: 'cakal_2', name: 'Çakal (V2)', hp: 4700, attack: 250, defense: 235, reward: 4300000, reqLevel: 47 },
    { id: 'ezhel_2', name: 'Ezhel (V2)', hp: 4800, attack: 255, defense: 240, reward: 4400000, reqLevel: 48 },
    { id: 'sagopa_2', name: 'Sagopa (V2)', hp: 4900, attack: 260, defense: 245, reward: 4500000, reqLevel: 49 },
    { id: 'ceza_2', name: 'Ceza (V2)', hp: 5000, attack: 265, defense: 250, reward: 4600000, reqLevel: 50 },
];

export const DissGame: React.FC<Props> = ({ player, updateMultipleStats, onExit }) => {
    const [selectedOpponent, setSelectedOpponent] = useState<typeof OPPONENTS[0] | null>(null);
    const [battleState, setBattleState] = useState<'select' | 'battle' | 'win' | 'lose'>('select');
    
    // Battle stats
    const [playerHp, setPlayerHp] = useState(0);
    const [maxPlayerHp, setMaxPlayerHp] = useState(0);
    const [oppHp, setOppHp] = useState(0);
    const [maxOppHp, setMaxOppHp] = useState(0);
    
    const [turn, setTurn] = useState<'player' | 'opponent'>('player');
    const [battleLog, setBattleLog] = useState<{text: string, type: 'player' | 'opponent' | 'system'}[]>([]);
    const [playerBuff, setPlayerBuff] = useState(0);

    // Timing Mechanic State
    const [isTiming, setIsTiming] = useState(false);
    const [timingValue, setTimingValue] = useState(0);
    const [timingDirection, setTimingDirection] = useState(1);
    const [pendingMove, setPendingMove] = useState<'punchline' | 'fastflow' | null>(null);
    const timingRequestRef = useRef<number | null>(null);

    // Custom Lyrics State
    const [customLyric, setCustomLyric] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize battle
    const startBattle = async (opp: typeof OPPONENTS[0]) => {
        playClickSound();
        if (player.energy < 10) {
            playErrorSound();
            alert("Yeterli enerjin yok! (10 Enerji gerekli)");
            return;
        }
        
        updateMultipleStats({ energy: player.energy - 10 });
        setSelectedOpponent(opp);
        
        // Calculate player stats
        const pHp = 100 + (player.charisma * 10) + (player.careerLevel * 20);
        setMaxPlayerHp(pHp);
        setPlayerHp(pHp);
        
        setMaxOppHp(opp.hp);
        setOppHp(opp.hp);
        
        setPlayerBuff(0);
        setTurn('player');
        setBattleLog([{ text: `Diss savaşı başladı: ${player.name} vs ${opp.name}`, type: 'system' }]);
        setBattleState('battle');

        // Fetch and play music once (no loop)
        try {
            const res = await fetch(`/api/music?term=${encodeURIComponent(opp.name)}&limit=5`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const randomSong = data.results[Math.floor(Math.random() * data.results.length)];
                if (randomSong.previewUrl) {
                    audioRef.current = new Audio(randomSong.previewUrl);
                    audioRef.current.loop = false; // Do not loop
                    audioRef.current.volume = 0.3;
                    audioRef.current.play().catch(e => console.log("Audio play blocked", e));
                }
            }
        } catch (e) {
            console.error("Music Proxy error", e);
        }
    };

    // Cleanup audio on unmount or battle end
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const addToLog = (text: string, type: 'player' | 'opponent' | 'system') => {
        setBattleLog(prev => [{text, type}, ...prev].slice(0, 6));
    };

    // Timing Animation Loop
    useEffect(() => {
        if (isTiming) {
            const animate = () => {
                setTimingValue(prev => {
                    let next = prev + (timingDirection * 5);
                    if (next >= 100) {
                        setTimingDirection(-1);
                        return 100;
                    }
                    if (next <= 0) {
                        setTimingDirection(1);
                        return 0;
                    }
                    return next;
                });
                timingRequestRef.current = requestAnimationFrame(animate);
            };
            timingRequestRef.current = requestAnimationFrame(animate);
        } else {
            if (timingRequestRef.current) cancelAnimationFrame(timingRequestRef.current);
        }
        return () => {
            if (timingRequestRef.current) cancelAnimationFrame(timingRequestRef.current);
        };
    }, [isTiming, timingDirection]);

    const handlePlayerMove = (moveType: 'punchline' | 'fastflow' | 'flex' | 'custom') => {
        if (turn !== 'player' || !selectedOpponent) return;
        playClickSound();

        if (moveType === 'punchline' || moveType === 'fastflow') {
            setPendingMove(moveType);
            setIsTiming(true);
            setTimingValue(0);
            setTimingDirection(1);
            return;
        }

        executeMove(moveType);
    };

    const handleTimingClick = () => {
        if (!isTiming || !pendingMove) return;
        playClickSound();
        
        // Calculate multiplier based on how close to center (50)
        const distance = Math.abs(50 - timingValue);
        let multiplier = 1;
        
        if (distance < 5) multiplier = 2.0; // Perfect
        else if (distance < 15) multiplier = 1.5; // Great
        else if (distance < 30) multiplier = 1.0; // Good
        else multiplier = 0.5; // Poor

        setIsTiming(false);
        executeMove(pendingMove, multiplier);
        setPendingMove(null);
    };

    const executeMove = (moveType: 'punchline' | 'fastflow' | 'flex' | 'custom', multiplier: number = 1) => {
        if (!selectedOpponent) return;
        
        let damage = 0;
        let logText = "";
        const baseDamage = 10 + (player.careerLevel * 2);

        switch (moveType) {
            case 'punchline':
                damage = (baseDamage + (player.lyrics * 3) + playerBuff) * multiplier;
                damage = Math.max(5, Math.floor(damage - selectedOpponent.defense));
                logText = `${multiplier >= 2 ? 'MÜKEMMEL! ' : multiplier >= 1.5 ? 'HARİKA! ' : ''}Punchline attın! (${damage} hasar)`;
                setPlayerBuff(0);
                break;
            case 'fastflow':
                const hits = Math.floor(Math.random() * 3) + 2;
                const dmgPerHit = Math.max(2, (player.flow * 1.5) - (selectedOpponent.defense / 2));
                damage = (Math.floor(hits * dmgPerHit) + playerBuff) * multiplier;
                damage = Math.floor(damage);
                logText = `${multiplier >= 2 ? 'KOMBO! ' : ''}Fast Flow ile ${hits} kere vurdun! (${damage} hasar)`;
                setPlayerBuff(0);
                break;
            case 'flex':
                const heal = 20 + (player.charisma * 2);
                setPlayerHp(prev => Math.min(maxPlayerHp, prev + heal));
                setPlayerBuff(10 + player.charisma);
                logText = `Sahnede Flex attın! (+${heal} Can, Sonraki saldırı güçlendi)`;
                break;
            case 'custom':
                if (!customLyric.trim()) return;
                damage = baseDamage + (player.lyrics * 2) + Math.min(50, customLyric.length) + playerBuff;
                damage = Math.max(5, damage - selectedOpponent.defense);
                logText = `"${customLyric}" (${damage} hasar)`;
                setPlayerBuff(0);
                setCustomLyric("");
                setIsTyping(false);
                break;
        }

        if (damage > 0) {
            setOppHp(prev => Math.max(0, prev - damage));
        }
        
        addToLog(logText, 'player');

        if (oppHp - damage <= 0) {
            setTimeout(() => {
                stopAudio();
                playWinSound();
                setBattleState('win');
                updateMultipleStats({
                    careerCash: player.careerCash + selectedOpponent.reward,
                    monthly_listeners: player.monthly_listeners + Math.floor(selectedOpponent.reward / 10)
                });
            }, 1000);
            return;
        }

        setTurn('opponent');
    };

    // Opponent turn
    useEffect(() => {
        if (battleState === 'battle' && turn === 'opponent' && selectedOpponent) {
            const timer = setTimeout(() => {
                const isCrit = Math.random() > 0.8;
                let damage = selectedOpponent.attack + (Math.random() * 10);
                if (isCrit) damage *= 1.5;
                
                const playerDef = (player.flow + player.lyrics + player.rhythm + player.charisma) / 4;
                damage = Math.max(5, Math.floor(damage - playerDef));

                setPlayerHp(prev => Math.max(0, prev - damage));
                addToLog(`${selectedOpponent.name} diss attı! ${isCrit ? '(KRİTİK!)' : ''} (${damage} hasar)`, 'opponent');

                if (playerHp - damage <= 0) {
                    stopAudio();
                    playErrorSound();
                    setBattleState('lose');
                } else {
                    setTurn('player');
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [turn, battleState, selectedOpponent, playerHp, player]);

    if (battleState === 'select') {
        return (
            <div className="h-full bg-black relative flex flex-col font-sans">
                <div className="px-6 pt-16 pb-6 border-b border-white/5 bg-gradient-to-b from-black via-black/95 to-transparent relative z-20 shrink-0">
                    <div className="absolute top-6 left-6 z-50">
                        <button onClick={onExit} className="bg-white/5 backdrop-blur-xl text-white w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors shadow-lg">✕</button>
                    </div>
                    <div className="flex items-center gap-3 mb-2 mt-4">
                        <div className="w-2 h-2 rounded-full animate-pulse bg-red-500 shadow-[0_0_15px_#ef4444]"></div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.5em]">
                            DİSS SAVAŞI
                        </span>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none drop-shadow-2xl">
                        YERALTI
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar z-10">
                    <div className="grid grid-cols-1 gap-3">
                        {OPPONENTS.map((opp) => {
                            const isLocked = false;
                            return (
                                <div key={opp.id} className={`bg-[#0a0a0a] border ${isLocked ? 'border-red-900/20 opacity-40' : 'border-white/10 hover:border-white/20 hover:bg-[#111] shadow-lg'} rounded-2xl p-4 flex items-center justify-between transition-all duration-300`}>
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm border border-white/10 ${isLocked ? 'bg-neutral-800' : 'bg-gradient-to-br from-neutral-800 to-black'}`}>
                                            {opp.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{opp.name}</h3>
                                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Ödül: ₺{new Intl.NumberFormat('tr-TR', { notation: "compact" }).format(opp.reward)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="shrink-0 ml-4">
                                        {isLocked ? (
                                            <div className="text-red-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                                                Lvl {opp.reqLevel}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => startBattle(opp)}
                                                className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                            >
                                                Savaş
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (battleState === 'win' || battleState === 'lose') {
        const isWin = battleState === 'win';
        return (
            <div className="h-full bg-[#050505] flex flex-col items-center justify-center p-6 relative font-sans">
                <div className="relative z-10 text-center w-full max-w-sm">
                    <h1 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 ${isWin ? 'text-green-400' : 'text-red-500'}`}>
                        {isWin ? 'KAZANDIN' : 'KAYBETTİN'}
                    </h1>
                    
                    {isWin ? (
                        <div className="bg-[#111] border border-green-500/30 rounded-2xl p-6">
                            <p className="text-neutral-400 text-sm mb-4">{selectedOpponent?.name} piyasadan silindi!</p>
                            <div className="flex justify-center gap-6">
                                <div className="text-center">
                                    <div className="text-[10px] text-neutral-500 font-bold uppercase">Para</div>
                                    <div className="text-green-400 font-black text-lg">+₺{selectedOpponent?.reward.toLocaleString()}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-neutral-500 font-bold uppercase">Fan</div>
                                    <div className="text-blue-400 font-black text-lg">+{Math.floor((selectedOpponent?.reward || 0) / 10).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#111] border border-red-500/30 rounded-2xl p-6">
                            <p className="text-neutral-400 text-sm">{selectedOpponent?.name} seni sahnede rezil etti.</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => {
                            setBattleState('select');
                            setSelectedOpponent(null);
                        }}
                        className="mt-8 bg-white text-black font-black uppercase px-8 py-3 rounded-full w-full"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    // BATTLE SCREEN
    return (
        <div className="h-full bg-[#050505] flex flex-col relative font-sans">
            {/* Header Stats */}
            <div className="px-4 py-4 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0 pt-safe-top">
                <div className="flex flex-col w-[45%]">
                    <div className="flex justify-between mb-1">
                        <span className="text-white font-bold text-xs truncate">{player.name}</span>
                        <span className="text-green-400 text-[10px] font-bold">{Math.floor(playerHp)}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}></div>
                    </div>
                </div>
                
                <div className="text-xs font-black italic text-neutral-500">VS</div>
                
                <div className="flex flex-col w-[45%] text-right">
                    <div className="flex justify-between mb-1">
                        <span className="text-red-400 text-[10px] font-bold">{Math.floor(oppHp)}</span>
                        <span className="text-white font-bold text-xs truncate">{selectedOpponent?.name}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden flex justify-end">
                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(oppHp / maxOppHp) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Battle Log Area */}
            <div className="flex-1 p-4 flex flex-col justify-end overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/5 via-black to-black pointer-events-none"></div>
                
                <div className="w-full flex flex-col-reverse gap-2 relative z-10">
                    {battleLog.map((log, i) => (
                        <div key={i} className={`p-3 rounded-xl text-xs font-medium border ${log.type === 'player' ? 'bg-green-900/10 border-green-500/20 text-green-400 self-end text-right ml-8' : log.type === 'opponent' ? 'bg-red-900/10 border-red-500/20 text-red-400 self-start text-left mr-8' : 'bg-white/5 border-white/10 text-neutral-400 text-center self-center'} ${i === 0 ? 'opacity-100' : 'opacity-50'}`}>
                            {log.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 bg-[#111] border-t border-white/5 shrink-0 pb-safe min-h-[180px] flex flex-col justify-center">
                {!isTiming && !isTyping && (
                    <div className="text-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${turn === 'player' ? 'text-green-400' : 'text-red-500 animate-pulse'}`}>
                            {turn === 'player' ? 'SENİN SIRAN' : 'RAKİP BEKLENİYOR...'}
                        </span>
                    </div>
                )}
                {isTiming ? (
                    <div className="w-full animate-fade-in">
                        <div className="text-center mb-4">
                            <span className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">TAM ZAMANINDA BAS!</span>
                        </div>
                        <div className="relative h-12 bg-black rounded-2xl border border-white/10 overflow-hidden mb-4" onClick={handleTimingClick}>
                            {/* Sweet Spot */}
                            <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-green-500/30 border-x border-green-500/50"></div>
                            <div className="absolute top-0 bottom-0 left-[48%] right-[48%] bg-green-400 shadow-[0_0_20px_#4ade80]"></div>
                            
                            {/* Moving Indicator */}
                            <div 
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_white] z-10 transition-none"
                                style={{ left: `${timingValue}%` }}
                            ></div>
                        </div>
                        <button 
                            onClick={handleTimingClick}
                            className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                        >
                            VUR!
                        </button>
                    </div>
                ) : isTyping ? (
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={customLyric}
                            onChange={(e) => setCustomLyric(e.target.value)}
                            placeholder="Sözlerini yaz..."
                            className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-green-500"
                            autoFocus
                        />
                        <button 
                            onClick={() => handlePlayerMove('custom')}
                            disabled={!customLyric.trim()}
                            className="bg-green-600 text-white font-bold px-4 rounded-xl disabled:opacity-50"
                        >
                            Gönder
                        </button>
                        <button 
                            onClick={() => setIsTyping(false)}
                            className="bg-white/10 text-white font-bold px-4 rounded-xl"
                        >
                            İptal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            disabled={turn !== 'player'}
                            onClick={() => handlePlayerMove('punchline')}
                            className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl hover:bg-[#222] active:scale-95 transition-all disabled:opacity-50 text-left"
                        >
                            <div className="text-xs font-bold text-white uppercase mb-1">Punchline</div>
                            <div className="text-[9px] text-neutral-500">Standart Hasar</div>
                        </button>
                        
                        <button 
                            disabled={turn !== 'player'}
                            onClick={() => handlePlayerMove('fastflow')}
                            className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl hover:bg-[#222] active:scale-95 transition-all disabled:opacity-50 text-left"
                        >
                            <div className="text-xs font-bold text-white uppercase mb-1">Fast Flow</div>
                            <div className="text-[9px] text-neutral-500">Çoklu Vuruş</div>
                        </button>
                        
                        <button 
                            disabled={turn !== 'player'}
                            onClick={() => handlePlayerMove('flex')}
                            className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl hover:bg-[#222] active:scale-95 transition-all disabled:opacity-50 text-left"
                        >
                            <div className="text-xs font-bold text-white uppercase mb-1">Flex</div>
                            <div className="text-[9px] text-neutral-500">Can Yenileme</div>
                        </button>
                        
                        <button 
                            disabled={turn !== 'player'}
                            onClick={() => setIsTyping(true)}
                            className="bg-white text-black p-3 rounded-xl hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 text-left"
                        >
                            <div className="text-xs font-black uppercase mb-1">Kendi Sözünü Yaz</div>
                            <div className="text-[9px] text-neutral-600 font-bold">Klavye ile saldır</div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
