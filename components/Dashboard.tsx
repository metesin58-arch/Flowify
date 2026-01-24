
import React, { useRef, useState, useEffect } from 'react';
import { PlayerStats, OnlineUser, ReleasedSong } from '../types';
import { Avatar } from './Avatar';
import { formatListeners, calculateLevelProgress, getNextLevelThreshold, calculateLevel } from '../services/gameLogic';
import { getGlobalLeaderboard } from '../services/matchmakingService';
import { DiscIcon, PlayIcon, TrophyIcon, CoinIcon, MicIcon, DiamondIcon, MusicIcon, MusicOffIcon, MoonIcon, SunIcon, CrownIcon } from './Icons';
import { useGameUI } from '../context/UIContext';
import { IAPTab } from './IAPStore';
import { playClickSound } from '../services/sfx';
import { HubTutorial } from './HubTutorial';

interface Props {
    player: PlayerStats;
    ownedUpgrades: Record<string, number>;
    onEditCharacter?: () => void;
    updateStat?: (stat: keyof PlayerStats, amount: number) => void;
    updateMultipleStats?: (updates: Partial<PlayerStats>) => void;
    onOpenShop: (tab: IAPTab) => void;
}

export const Dashboard: React.FC<Props> = ({ player, ownedUpgrades, onEditCharacter, updateStat, updateMultipleStats, onOpenShop }) => {

    const [isPlaying, setIsPlaying] = useState(false);
    const [leaderboard, setLeaderboard] = useState<OnlineUser[]>([]);
    const [isLoadingLb, setIsLoadingLb] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [showHubTutorial, setShowHubTutorial] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isVerified = ownedUpgrades && ownedUpgrades['verified_badge'] && ownedUpgrades['verified_badge'] > 0;

    // XP Calculations
    const xpPercent = calculateLevelProgress(player.monthly_listeners);
    const nextLevelThreshold = getNextLevelThreshold(player.monthly_listeners);

    useEffect(() => {
        const seen = localStorage.getItem('flowify_hub_seen');
        if (!seen) {
            setShowHubTutorial(true);
        }
    }, []);

    const completeHubTutorial = () => {
        localStorage.setItem('flowify_hub_seen', 'true');
        setShowHubTutorial(false);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchLb = async () => {
            setIsLoadingLb(true);
            const list = await getGlobalLeaderboard(100);
            if (isMounted) {
                setLeaderboard(list);
                setIsLoadingLb(false);
            }
        };
        fetchLb();

        return () => {
            isMounted = false;
            if (audioRef.current) audioRef.current.pause();
        }
    }, []);

    const togglePlay = () => {
        if (!player.favoriteSong?.previewUrl) return;

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current) {
                audioRef.current = new Audio(player.favoriteSong.previewUrl);
                audioRef.current.volume = 0.5;
                audioRef.current.onended = () => setIsPlaying(false);
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const closeLeaderboard = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setShowLeaderboard(false);
            setIsAnimatingOut(false);
        }, 300);
    };

    const king = leaderboard.length > 0 ? leaderboard[0] : null;

    return (
        <div className="h-full bg-[#121212] relative overflow-hidden flex flex-col">

            {showHubTutorial && <HubTutorial onClose={completeHubTutorial} />}

            {/* 1. HEADER SECTION - Adjusted padding to fit under notch with Universal Header */}
            <div
                className="relative w-full h-[40vh] min-h-[300px] flex flex-col justify-end overflow-hidden shrink-0"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
            >

                {/* Background Layer */}
                <div className="absolute inset-0 z-0 bg-[#222]">
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 to-[#121212] opacity-50"></div>
                    <div className="absolute inset-0 flex items-center justify-center transform translate-y-[10%] scale-110 opacity-70 filter blur-sm">
                        <Avatar appearance={player.appearance} gender={player.gender} size={320} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent z-10"></div>
                </div>

                {/* Foreground Content */}
                <div className="relative z-20 px-6 pb-6 w-full">

                    {/* Top Row: Verified & Respect */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            {isVerified && (
                                <div className="bg-blue-500 rounded-full p-0.5" title="Doğrulanmış Sanatçı">
                                    <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M9 12L11 14L15 10" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            )}
                            <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase drop-shadow-md ${isVerified ? 'text-white' : 'text-neutral-400'}`}>
                                {isVerified ? 'Doğrulanmış Sanatçı' : 'Sanatçı'}
                            </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-neutral-400"></div>
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                            <TrophyIcon className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] font-bold text-yellow-100 tracking-wide">{player.respect.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Artist Name */}
                    <h1
                        className="text-4xl font-black text-white tracking-tighter leading-tight mb-2 drop-shadow-2xl origin-left select-none transition-transform truncate pb-1 pr-4"
                    >
                        {player.name}
                    </h1>

                    {/* LEVEL & XP BAR (Replaces Monthly Listeners) */}
                    <div className="mb-6 w-full max-w-[240px]">
                        <div className="flex justify-between items-end mb-1">
                            <div className="text-[10px] font-black text-[#1ed760] uppercase tracking-widest">
                                SEVİYE {calculateLevel(player.monthly_listeners)}
                            </div>
                            <div className="text-[8px] font-bold text-neutral-500 uppercase">
                                SONRAKİ SEVİYE
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-[#1ed760] to-green-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(30,215,96,0.5)]"
                                style={{ width: `${xpPercent}%` }}
                            ></div>
                        </div>
                        <div className="text-[8px] text-neutral-400 font-bold mt-1.5 flex justify-between items-center">
                            <span>FAN (XP): {formatListeners(player.monthly_listeners)}</span>
                            <span className="text-white opacity-60">HEDEF: {formatListeners(nextLevelThreshold)}</span>
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center gap-3">

                        {/* SPOTIFY STYLE ANTHEM CARD */}
                        {player.favoriteSong ? (
                            <div className="flex-1 bg-[#181818]/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 pr-4 flex items-center gap-3 max-w-[220px] shadow-xl hover:bg-[#222] transition-colors group cursor-pointer h-12" onClick={togglePlay}>
                                <div className="relative w-9 h-9 shrink-0">
                                    <img
                                        src={player.favoriteSong.artworkUrl100}
                                        className={`w-full h-full rounded-full object-cover shadow-lg border border-white/10 ${isPlaying ? 'animate-spin-slow' : ''}`}
                                        alt="Cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isPlaying ? (
                                            <div className="w-2 h-2 bg-[#1ed760] rounded-sm"></div>
                                        ) : (
                                            <div className="hidden group-hover:block"><PlayIcon className="w-3 h-3 text-white drop-shadow-md" /></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] text-[#1ed760] font-black uppercase tracking-wider">MARŞ</span>
                                        <span className="text-white font-bold text-[10px] truncate leading-tight">{player.favoriteSong.trackName}</span>
                                    </div>
                                    <span className="text-neutral-400 text-[9px] truncate leading-tight">{player.favoriteSong.artistName}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 text-neutral-500 text-xs italic">Marş seçilmedi.</div>
                        )}

                        {/* Edit Profile Button */}
                        <button
                            onClick={onEditCharacter}
                            className="h-12 bg-transparent border border-white/20 hover:border-white text-white rounded-full px-4 font-bold text-[9px] uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 flex items-center justify-center shrink-0"
                        >
                            DÜZENLE
                        </button>
                    </div>
                </div>

                {/* Header Buttons Container */}
                <div className="absolute top-20 right-6 z-50 flex flex-col items-end gap-2">
                    <button
                        onClick={() => { playClickSound(); onOpenShop('vip'); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-800 border border-yellow-500/50 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-shimmer hover:scale-105 transition-transform bg-[length:200%_auto]"
                    >
                        <DiamondIcon className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">PREMIUM</span>
                        <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded ml-1">SALE</span>
                    </button>
                </div>

            </div>

            {/* 2. SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-6 bg-[#121212]">

                {/* DISCOGRAPHY */}
                <div className="bg-[#181818] rounded-2xl p-5 border border-white/5 shadow-xl relative z-20">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <DiscIcon className="w-4 h-4 text-white" />
                        DİSKOGRAFİ
                    </h2>

                    <div className="space-y-3">
                        {player.discography && player.discography.length > 0 ? (
                            player.discography.map((song) => (
                                <SimpleSongItem key={song.id} song={song} />
                            ))
                        ) : (
                            <div className="text-center text-neutral-500 text-xs py-6 italic">
                                Henüz şarkı yayınlamadın.<br />
                                <span className="text-[#1ed760] font-bold not-italic">Kariyer bölümündeki stüdyoya git ve ilk hitini yap!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* MINIMALIST SKILLS */}
                <div className="bg-[#181818] rounded-2xl p-5 border border-white/5 shadow-xl">
                    <h2 className="text-sm font-bold text-white mb-4">YETENEKLER</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <MinimalStat label="Flow" value={player.flow} color="bg-blue-500" />
                        <MinimalStat label="Lirik" value={player.lyrics} color="bg-green-500" />
                        <MinimalStat label="Ritim" value={player.rhythm} color="bg-yellow-500" />
                        <MinimalStat label="Karizma" value={player.charisma} color="bg-purple-500" />
                    </div>
                </div>
            </div>

            {/* 3. LEADERBOARD FLOATING BUTTON */}
            <button
                onClick={() => setShowLeaderboard(true)}
                className="fixed bottom-32 right-4 z-[100] w-14 h-14 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.6)] flex items-center justify-center border-2 border-white/20 animate-[breathe_3s_infinite] hover:scale-110 active:scale-95 transition-transform"
            >
                <TrophyIcon className="w-7 h-7 text-white drop-shadow-md" />
            </button>

            {/* 4. LEADERBOARD MODAL */}
            {showLeaderboard && (
                <div
                    className={`fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}
                    onClick={closeLeaderboard}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md h-[85vh] bg-[#121212] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 flex flex-col relative shadow-2xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${isAnimatingOut ? 'translate-y-full' : 'translate-y-0 animate-[slideUp_0.4s_cubic-bezier(0.19,1,0.22,1)]'}`}
                    >
                        {/* Close */}
                        <button
                            onClick={closeLeaderboard}
                            className="absolute top-4 right-4 z-50 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        >
                            ✕
                        </button>

                        {/* Header: TOP 100 */}
                        <div className="bg-gradient-to-b from-yellow-900/40 to-[#121212] pt-12 pb-8 px-6 text-center border-b border-white/5 shrink-0 relative overflow-hidden">
                            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-6 animate-pulse">FLOWIFY TOP 100</div>

                            {isLoadingLb ? (
                                <div className="text-neutral-500 text-sm animate-pulse">Sıralama Yükleniyor...</div>
                            ) : king ? (
                                <div className="flex flex-col items-center relative z-10">
                                    <div className="mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                        <CrownIcon className="w-20 h-20 text-yellow-400" />
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 italic tracking-tighter drop-shadow-2xl mb-4 leading-none pr-4">
                                        {king.name}
                                    </h2>
                                    <div className="bg-yellow-500/20 border border-yellow-500/50 px-6 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                        <TrophyIcon className="w-5 h-5 text-yellow-400" />
                                        <span className="text-yellow-100 font-black text-lg tracking-wide">{king.respect.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-neutral-500 text-sm">Henüz Sıralama Yok</div>
                            )}
                        </div>

                        {/* LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {leaderboard.slice(1).map((user, idx) => {
                                const rank = idx + 2;
                                let rankStyle = "bg-[#1a1a1a] border-white/5";
                                let textStyle = "text-white";
                                let numStyle = "text-neutral-500";

                                if (rank === 2) {
                                    rankStyle = "bg-gradient-to-r from-gray-800 to-[#1a1a1a] border-gray-500/30";
                                    textStyle = "text-gray-300";
                                    numStyle = "text-gray-400";
                                } else if (rank === 3) {
                                    rankStyle = "bg-gradient-to-r from-[#451a03] to-[#1a1a1a] border-amber-700/30";
                                    textStyle = "text-amber-500";
                                    numStyle = "text-amber-600";
                                }

                                return (
                                    <div key={user.uid} className={`flex items-center gap-4 p-3 rounded-xl border ${rankStyle}`}>
                                        <div className={`w-8 text-center font-black text-sm ${numStyle}`}>#{rank}</div>
                                        <div className="w-10 h-10 bg-black rounded-full overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                                            {user.appearance ? (
                                                <Avatar appearance={user.appearance} size={160} className="transform scale-[0.25] origin-top translate-y-1" />
                                            ) : (
                                                <span className={`font-bold ${textStyle}`}>{user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${textStyle}`}>{user.name}</div>
                                            <div className="text-[10px] text-neutral-500">Lv {user.level}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold text-sm ${textStyle}`}>{user.respect}</div>
                                            <div className="text-[9px] text-neutral-600 uppercase">Respect</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MinimalStat = ({ label, value, color }: { label: string, value: number, color: string }) => {
    return (
        <div className="bg-[#111] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
                <span className="font-mono font-bold text-white text-sm">{value}</span>
            </div>
            <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }}></div>
            </div>
        </div>
    );
};

const SimpleSongItem: React.FC<{ song: ReleasedSong }> = ({ song }) => {
    const idNum = song.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = idNum % 360;
    const isDark = idNum % 2 === 0;

    return (
        <div className="flex items-center gap-3 bg-[#111] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">

            <div
                className="w-12 h-12 rounded shadow-lg relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300"
                style={{
                    background: `linear-gradient(135deg, hsl(${hue}, 60%, ${isDark ? '20%' : '30%'}), hsl(${hue + 40}, 60%, 10%))`,
                }}
            >
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)'
                }}></div>

                <div className="absolute inset-0 flex items-center justify-center font-black text-white/30 text-xl select-none">
                    {song.name.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-0.5">
                    <div className="text-white font-bold text-xs sm:text-sm truncate pr-2">{song.name}</div>
                    <div className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border ${song.quality >= 90 ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-neutral-500 border-white/10 bg-white/5'}`}>
                        %{song.quality}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-neutral-400 text-[10px] sm:text-xs font-medium">
                        {(song.popularityScore * 1000).toLocaleString()} <span className="text-[9px] uppercase text-neutral-600 ml-0.5">Dinlenme</span>
                    </div>
                    {song.totalEarnings > 0 && (
                        <div className="text-[#1ed760] text-[10px] sm:text-xs font-mono font-bold">
                            +₺{song.totalEarnings.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
