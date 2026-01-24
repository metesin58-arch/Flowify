
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, TabType, UpgradeItem, CharacterAppearance, Gender, SongTrack, SongDraft, ReleasedSong } from './types';
import { INITIAL_STATS, UPGRADES, ECONOMY } from './constants';
import { calculateUpgradeCost, formatListeners, calculateArcadeReward, calculateLevel } from './services/gameLogic';
import { SongProductionManager } from './services/productionService';
import { observeAuth, savePlayerToCloud } from './services/authService';
import { listenForPokes, addMonthlyListeners } from './services/matchmakingService';
import type { User } from 'firebase/auth';
import { ref, onValue, update, set, onDisconnect } from 'firebase/database';
import { db } from './services/firebaseConfig';

// Services
import { adMobService } from './services/adMobService';
import { iapService } from './services/iapService';
import { preloadAllSounds, initAudioContext, stopMusic, playWinSound, playClickSound, playErrorSound } from './services/sfx';

// UI Context
import { UIProvider, useGameUI } from './context/UIContext';

// Components
import { SafeAreaWrapper } from './components/SafeAreaWrapper';
import { Navigation } from './components/Navigation';
import { CharacterCreation } from './components/CharacterCreation';
import { Dashboard } from './components/Dashboard';
import { Street } from './components/Street';
import { SocialHub } from './components/SocialHub';
import { NightLife } from './components/NightLife';
import { AuthScreen } from './components/AuthScreen';
import { GameSelector } from './components/GameSelector';
import { ConcertMode } from './components/ConcertMode';
import { RhythmTwisterMode } from './components/RhythmTwisterMode';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { AdModal } from './components/AdModal';
import { RewardModal } from './components/RewardModal';
import { ArrowIcon } from './components/Icons';
import { IAPStore, IAPTab } from './components/IAPStore';
import { SplashScreen } from './components/SplashScreen';

// Sub Games
import { FreestyleGame } from './components/FreestyleGame';
import { HigherLowerGame } from './components/HigherLowerGame';
import { TriviaGame } from './components/TriviaGame';
import { RhythmGame } from './components/RhythmGame';
import { RapQuizGame } from './components/RapQuizGame';
import { FlowBattleGame } from './components/FlowBattleGame';
import { CoverMatchGame } from './components/CoverMatchGame';
import { FlappyDiskGame } from './components/games/FlappyDiskGame';
import { HexagonGame } from './components/minigames/HexagonGame';

// Casino Games
import { BattleBetGame } from './components/games/BattleBetGame';
import { BlackjackGame } from './components/games/BlackjackGame';
import { ZeppelinGame } from './components/games/ZeppelinGame';

const GameContent: React.FC = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [player, setPlayer] = useState<PlayerStats | null>(null);

    const [isLoading, setIsLoading] = useState(true); // Asset loading state

    const [viewMode, setViewMode] = useState<'selector' | 'hub' | 'career'>('selector');
    const [activeTab, setActiveTab] = useState<TabType>('hub');

    const [isEditingCharacter, setIsEditingCharacter] = useState(false);
    const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);
    const [showEnergyAd, setShowEnergyAd] = useState(false);
    const [activeIAPTab, setActiveIAPTab] = useState<IAPTab | null>(null);
    const [activeGameMode, setActiveGameMode] = useState<'none' | 'freestyle' | 'trivia' | 'higherlower' | 'rhythm' | 'rapquiz' | 'flowbattle' | 'covermatch' | 'higherlower-solo' | 'flowbattle-solo' | 'covermatch-solo' | 'flappydisk' | 'rhythmtwister' | 'hexagon' | 'battlebet' | 'blackjack' | 'zeppelin'>('none');

    // New: Reward Modal State
    const [rewardData, setRewardData] = useState<{ fans: number, cash: number } | null>(null);

    const gamesPlayedRef = useRef(0);
    const { showToast } = useGameUI();

    // --- GLOBAL NATIVE CALLBACK: odulVer ---
    useEffect(() => {
        window.odulVer = (productId?: string) => {
            console.log("Global odulVer triggered with:", productId);
            const targetId = productId || localStorage.getItem('last_purchase_attempt');
            if (!targetId) return;

            setPlayer(prev => {
                if (!prev || !user) return prev;
                const newStats = { ...prev };
                let rewardMsg = "";

                switch (targetId) {
                    case 'gold_mini': newStats.careerCash += 25000; rewardMsg = "+₺25.000 Eklendi!"; break;
                    case 'gold_100': newStats.careerCash += 100000; rewardMsg = "+₺100.000 Eklendi!"; break;
                    case 'gold_bag': newStats.careerCash += 300000; rewardMsg = "+₺300.000 Eklendi!"; break;
                    case 'gold_500': newStats.careerCash += 1000000; rewardMsg = "+₺1.000.000 Eklendi!"; break;
                    case 'gold_vault': newStats.careerCash += 5000000; rewardMsg = "+₺5.000.000 Eklendi!"; break;
                    case 'energy_coffee': newStats.energy = Math.min(prev.maxEnergy, prev.energy + 25); rewardMsg = "+25 Enerji Eklendi!"; break;
                    case 'energy_refill': newStats.energy = prev.maxEnergy; rewardMsg = "Enerji Fullendi!"; break;
                    case 'energy_bulk': newStats.energy = Math.min(prev.maxEnergy + 500, prev.energy + 500); rewardMsg = "+500 Enerji Eklendi!"; break;
                    case 'vip_sub':
                        newStats.isVip = true;
                        newStats.energy = prev.maxEnergy;
                        // Set fans to 24,010,000 to reach Level 50
                        newStats.monthly_listeners = Math.max(newStats.monthly_listeners || 0, 24010000);
                        if (!newStats.ownedUpgrades) newStats.ownedUpgrades = {};
                        newStats.ownedUpgrades['verified_badge'] = 1;
                        rewardMsg = "FLOWIFY PRO Aktif Edildi! Seviye 50 ve Mavi Tik Hesabına Eklendi.";
                        break;
                    case 'verified_tick':
                        if (!newStats.ownedUpgrades) newStats.ownedUpgrades = {};
                        newStats.ownedUpgrades['verified_badge'] = 1;
                        rewardMsg = "Mavi Tik Hesabına Eklendi!";
                        break;
                    case 'rewarded_ad':
                        newStats.energy = Math.min(prev.maxEnergy, prev.energy + 30);
                        rewardMsg = "+30 Enerji Eklendi!";
                        break;
                    default: return prev;
                }

                savePlayerToCloud(user.uid, newStats);
                playWinSound();
                showToast(rewardMsg, 'success');
                localStorage.removeItem('last_purchase_attempt');
                setActiveIAPTab(null);
                return newStats;
            });
        };
    }, [user]);

    // --- INIT ---
    useEffect(() => {
        const initGame = async () => {
            try {
                adMobService.initialize();
                iapService.initialize();

                // Optimized loading with Caching - with timeout fallback
                const loadPromise = preloadAllSounds((progress) => {
                    // Not displaying percentage anymore, handled by Splash logic
                });

                // Race between actual loading and 8 second timeout
                await Promise.race([
                    loadPromise,
                    new Promise(resolve => setTimeout(resolve, 8000))
                ]);

            } catch (error) {
                console.error('Init error:', error);
            } finally {
                // Always set loaded, even if there were errors
                setIsLoading(false);
            }

            const unlockAudio = () => { initAudioContext(); };
            window.addEventListener('click', unlockAudio, { once: true });
            window.addEventListener('touchstart', unlockAudio, { once: true });
            window.addEventListener('keydown', unlockAudio, { once: true });
        };
        initGame();
    }, []);

    useEffect(() => {
        const seen = localStorage.getItem('flowify_welcome_seen');
        if (!seen) setShowWelcomeTutorial(true);
    }, []);

    const handleTabChange = (newTab: TabType) => {
        playClickSound();
        setActiveTab(newTab);
    };

    useEffect(() => {
        let unsubscribeStats: (() => void) | null = null;
        let authTimeout: NodeJS.Timeout | null = null;

        // Fallback timeout - if auth doesn't respond in 10 seconds, proceed anyway
        authTimeout = setTimeout(() => {
            console.warn('Auth timeout - proceeding without auth');
            setAuthChecked(true);
        }, 10000);

        const unsubAuth = observeAuth(async (currentUser) => {
            // Clear the timeout since auth responded
            if (authTimeout) {
                clearTimeout(authTimeout);
                authTimeout = null;
            }

            setUser(currentUser);
            if (currentUser) {
                const statsRef = ref(db, `users/${currentUser.uid}/stats`);
                unsubscribeStats = onValue(statsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const cloudData = snapshot.val();
                        const syncedData = { ...INITIAL_STATS, ...cloudData };
                        if (syncedData.careerCash !== undefined) syncedData.cash = syncedData.careerCash;

                        // Force sync Level with Fans
                        if (syncedData.monthly_listeners !== undefined) {
                            syncedData.careerLevel = calculateLevel(syncedData.monthly_listeners);
                        }

                        setPlayer(syncedData);
                    } else {
                        setPlayer(null);
                    }
                    setAuthChecked(true);
                });
            } else {
                setPlayer(null);
                setAuthChecked(true);
                if (unsubscribeStats) unsubscribeStats();
            }
        });
        return () => {
            unsubAuth();
            if (unsubscribeStats) unsubscribeStats();
            if (authTimeout) clearTimeout(authTimeout);
        };
    }, []);

    // --- ENERGY REGENERATION ---
    useEffect(() => {
        if (!player || !user) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const timeDiff = now - player.lastEnergyUpdate;
            // 3 Minutes (180000ms)
            const energyToGain = Math.floor(timeDiff / ECONOMY.REGEN_TIME_MS);

            if (energyToGain > 0 && player.energy < player.maxEnergy) {
                const newEnergy = Math.min(player.maxEnergy, player.energy + energyToGain);
                const updatedStats = { ...player, energy: newEnergy, lastEnergyUpdate: now };
                savePlayerToCloud(user.uid, updatedStats);
            }
        }, 10000);

        const incomeInterval = setInterval(() => {
            const income = SongProductionManager.calculatePassiveIncome(player.discography || []);
            if (income > 0) {
                setPlayer(prev => prev ? ({ ...prev, pendingCash: (prev.pendingCash || 0) + income }) : null);
            }
        }, 5000);

        return () => { clearInterval(interval); clearInterval(incomeInterval); };
    }, [player, user]);

    // --- PRESENCE ---
    useEffect(() => {
        if (!user || !player) return;
        let action = "Dolanıyor...";
        if (viewMode === 'career') action = "Kariyer Yolunda";
        else if (activeTab === 'nightlife') action = "Casinoda";
        else if (activeTab === 'social') action = "Sosyalleşiyor";
        else if (activeTab === 'arcade') action = "Arcade Salonunda";
        else if (activeTab === 'online') action = "Online Arenada";
        if (activeGameMode !== 'none') action = "Kapışmada!";

        const safeListeners = Math.max(0, player.monthly_listeners || 0);
        const level = calculateLevel(safeListeners); // Always calculate dynamically

        const userRef = ref(db, `public_users/${user.uid}`);
        set(userRef, {
            uid: user.uid,
            name: player.name,
            monthly_listeners: safeListeners,
            respect: player.respect,
            level: level,
            lastActive: Date.now(),
            appearance: player.appearance,
            currentAction: action
        });
        onDisconnect(userRef).remove();
        const heartbeat = setInterval(() => { update(userRef, { lastActive: Date.now(), currentAction: action }); }, 30000);
        return () => clearInterval(heartbeat);
    }, [user, player, viewMode, activeTab, activeGameMode]);

    const updateStat = (stat: keyof PlayerStats, amount: number) => {
        if (!player || !user) return;
        let currentVal = player[stat] as number;
        let newVal = currentVal + amount;
        if (['monthly_listeners', 'energy', 'flow', 'lyrics', 'rhythm', 'charisma'].includes(stat)) newVal = Math.max(0, newVal);
        if (stat === 'energy') newVal = Math.min(player.maxEnergy || 100, newVal);

        let updatedStats = { ...player, [stat]: newVal };

        if (stat === 'cash') updatedStats.careerCash = newVal;
        else if (stat === 'careerCash') updatedStats.cash = newVal;

        // SYNC LEVEL WITH FANS
        if (stat === 'monthly_listeners') {
            updatedStats.careerLevel = calculateLevel(updatedStats.monthly_listeners);
        }

        setPlayer(updatedStats);
        savePlayerToCloud(user.uid, updatedStats);
    };

    const updateMultipleStats = (updates: Partial<PlayerStats>) => {
        if (!player || !user) return;
        const newStats = { ...player };

        Object.entries(updates).forEach(([key, value]) => {
            const k = key as keyof PlayerStats;
            const currentVal = newStats[k];
            if (typeof currentVal === 'number' && typeof value === 'number') {
                let newVal = currentVal + value;
                if (['monthly_listeners', 'energy', 'flow', 'lyrics', 'rhythm', 'charisma'].includes(k)) newVal = Math.max(0, newVal);
                if (k === 'energy') newVal = Math.min(player.maxEnergy || 100, newVal);
                (newStats[k] as any) = newVal;
            } else {
                (newStats[k] as any) = value;
            }
        });

        if (updates.cash !== undefined) newStats.careerCash = newStats.cash;
        if (updates.careerCash !== undefined) newStats.cash = newStats.careerCash;

        // SYNC LEVEL WITH FANS (Automatic Level Up)
        if (newStats.monthly_listeners !== undefined) {
            newStats.careerLevel = calculateLevel(newStats.monthly_listeners);
        }

        setPlayer(newStats);
        savePlayerToCloud(user.uid, newStats);
    };

    const spendEnergy = (amount: number): boolean => {
        if (!player || player.energy < amount) {
            setShowEnergyAd(true);
            return false;
        }
        updateStat('energy', -amount);
        return true;
    };

    const handleWatchEnergyAd = () => {
        setShowEnergyAd(false);
        updateStat('energy', ECONOMY.AD_REWARD_ENERGY); // +20
        showToast(`+${ECONOMY.AD_REWARD_ENERGY} Enerji Kazandın!`, 'success');
    };

    const handleGameEnd = async (score: number) => {
        // Calculate Fan/XP rewards based on game type and score
        // Note: We check activeGameMode to determine type.
        // This applies to ALL offline arcade games now.

        const arcadeModes = [
            'freestyle',
            'higherlower-solo',
            'flowbattle-solo',
            'covermatch-solo',
            'flappydisk',
            'rhythmtwister',
            'hexagon',
            'rapquiz',
            'rhythm' // Added: Reflex game ID
        ];

        if (arcadeModes.includes(activeGameMode)) {
            const level = player?.careerLevel || 1;
            const { fans, cash } = calculateArcadeReward(activeGameMode, score, level);

            if (fans > 0 || cash > 0) {
                updateMultipleStats({
                    monthly_listeners: fans,
                    careerCash: cash,
                    battlesWon: 1
                });

                if (user?.uid) {
                    addMonthlyListeners(user.uid, fans); // Update leaderboard
                }

                // Trigger Reward Modal
                setRewardData({ fans, cash });
            }
        }

        setActiveGameMode('none');
        gamesPlayedRef.current += 1;

        // AD FREQUENCY UPGRADE: 
        // 1. All Online Games
        // 2. Rap Quiz & Higher Lower Solo
        // 3. Every other game (for non-pro users)
        const alwaysAdModes = ['trivia', 'higherlower', 'flowbattle', 'covermatch', 'rapquiz', 'higherlower-solo'];
        const shouldShowAd = !player?.isVip && (alwaysAdModes.includes(activeGameMode) || gamesPlayedRef.current % 2 === 0);

        if (shouldShowAd) {
            try { await adMobService.showInterstitial(); } catch (e) { }
        }
    };

    // --- GAME LAUNCH LOGIC (Energy Check) ---
    const handleGameSelect = (game: any) => {
        // Free/Casino Games
        if (['battlebet', 'blackjack', 'zeppelin'].includes(game)) {
            setActiveGameMode(game);
            return;
        }

        // Determine Energy Cost based on Type
        const isOnline = ['flowbattle', 'higherlower', 'trivia'].includes(game);
        const isSolo = ['freestyle', 'higherlower-solo', 'flowbattle-solo', 'covermatch-solo', 'flappydisk', 'rhythmtwister', 'hexagon', 'rapquiz', 'rhythm'].includes(game);

        let cost = 0;
        if (isOnline) cost = ECONOMY.COST.ONLINE_MATCH;
        else if (isSolo) cost = ECONOMY.COST.OFFLINE_GAME;

        if (spendEnergy(cost)) {
            setActiveGameMode(game);
        }
    };

    // --- RENDER ---

    // Single Splash Screen handling both fake animation + real loading
    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} isReady={!isLoading && authChecked} />;
    }

    // Not logged in or loading stats
    if (!authChecked) return <div className="h-dvh w-screen bg-black flex items-center justify-center text-white">Yükleniyor...</div>;
    if (!user) return <AuthScreen />;

    // Character Creation
    if (!player) return <CharacterCreation onCreate={(name, gender, app, song) => {
        const newP = { ...INITIAL_STATS, name, gender, appearance: app, favoriteSong: song };
        savePlayerToCloud(user.uid, newP);
        setIsEditingCharacter(false);
    }} />;

    if (showEnergyAd) return <AdModal title="ENERJİN BİTTİ!" rewardText={`Reklam izleyerek +${ECONOMY.AD_REWARD_ENERGY} Enerji kazan.`} onWatch={handleWatchEnergyAd} onCancel={() => setShowEnergyAd(false)} />;

    if (isEditingCharacter) return <CharacterCreation onCreate={(name, gender, app, song) => {
        updateMultipleStats({ name, gender, appearance: app, favoriteSong: song });
        setIsEditingCharacter(false);
    }} isEditing={true} initialData={player} ownedUpgrades={player.ownedUpgrades} />;

    if (activeGameMode !== 'none') {
        return (
            <SafeAreaWrapper className="bg-black">
                {activeGameMode === 'freestyle' && <FreestyleGame onExit={() => setActiveGameMode('none')} />}
                {activeGameMode === 'trivia' && <TriviaGame playerName={player.name} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} />}
                {activeGameMode === 'higherlower' && <HigherLowerGame playerName={player.name} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} />}
                {activeGameMode === 'higherlower-solo' && <HigherLowerGame playerName={player.name} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} isSolo={true} />}
                {activeGameMode === 'rhythm' && <RhythmGame onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'rapquiz' && <RapQuizGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'flowbattle' && <FlowBattleGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'flowbattle-solo' && <FlowBattleGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} isSolo={true} />}
                {activeGameMode === 'covermatch' && <CoverMatchGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'covermatch-solo' && <CoverMatchGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} isSolo={true} />}
                {activeGameMode === 'flappydisk' && <FlappyDiskGame onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'rhythmtwister' && <RhythmTwisterMode onExit={() => setActiveGameMode('none')} />}
                {activeGameMode === 'hexagon' && <HexagonGame onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
                {activeGameMode === 'battlebet' && <BattleBetGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" />}
                {activeGameMode === 'blackjack' && <BlackjackGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" />}
                {activeGameMode === 'zeppelin' && <ZeppelinGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" />}
            </SafeAreaWrapper>
        );
    }

    if (showWelcomeTutorial && viewMode === 'selector') return <WelcomeTutorial onComplete={() => { localStorage.setItem('flowify_welcome_seen', 'true'); setShowWelcomeTutorial(false); }} />;
    if (viewMode === 'selector') return <SafeAreaWrapper><GameSelector player={player} onSelectMode={setViewMode} /></SafeAreaWrapper>;

    if (viewMode === 'career') {
        return (
            <>
                <SafeAreaWrapper>
                    <ConcertMode player={player} updateStat={updateStat} updateMultipleStats={updateMultipleStats} onExit={() => setViewMode('selector')} onEditCharacter={() => setIsEditingCharacter(true)} onOpenShop={(tab) => { playClickSound(); setActiveIAPTab(tab); }} />
                </SafeAreaWrapper>
                {activeIAPTab && <IAPStore player={player} updateMultipleStats={updateMultipleStats} onClose={() => setActiveIAPTab(null)} initialTab={activeIAPTab} />}
            </>
        );
    }

    return (
        <>
            <SafeAreaWrapper className="bg-[#121212] text-white">
                {/* GLOBAL HEADER - UPDATED ENERGY BAR */}
                <div
                    className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/95 via-black/80 to-transparent pb-8 pointer-events-none"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
                >
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <button onClick={() => { playClickSound(); setViewMode('selector'); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-sm">
                            <ArrowIcon dir="left" className="w-3 h-3 text-white" />
                            <span>MENÜ</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 drop-shadow-md pointer-events-auto">
                        {/* Cash Display */}
                        <button onClick={() => { playClickSound(); setActiveIAPTab('currency'); }} className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Nakit</span>
                            <span className="text-sm font-mono text-[#1ed760] font-black">₺{player.careerCash.toLocaleString()}</span>
                        </button>

                        {/* Enhanced Energy Bar */}
                        <button onClick={() => { playClickSound(); setActiveIAPTab('energy'); }} className="flex flex-col items-end w-28 group">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="text-yellow-400">⚡</span>
                                ENERJİ
                                <span className={player.energy < 20 ? 'text-red-500 animate-pulse' : 'text-white'}>{Math.floor(player.energy)}</span>
                            </span>
                            <div className="w-full h-3 bg-[#222] rounded-full overflow-hidden border border-white/20 group-hover:border-white/40 transition-colors shadow-lg relative">
                                <div
                                    className={`h-full transition-all duration-500 relative overflow-hidden ${player.energy < 30 ? 'bg-red-500' : 'bg-white'}`}
                                    style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full relative bg-[#121212] h-full overflow-hidden">
                    {activeTab === 'hub' && <div className="w-full animate-fade-in h-full"><Dashboard player={player} ownedUpgrades={player.ownedUpgrades || {}} onEditCharacter={() => setIsEditingCharacter(true)} updateStat={updateStat} updateMultipleStats={updateMultipleStats} onOpenShop={(tab) => { playClickSound(); setActiveIAPTab(tab); }} /></div>}
                    {activeTab === 'arcade' && <div className="w-full animate-fade-in h-full"><Street player={player} onSelectGame={handleGameSelect} mode="arcade" /></div>}
                    {activeTab === 'online' && <div className="w-full animate-fade-in h-full"><Street player={player} onSelectGame={handleGameSelect} mode="online" /></div>}
                    {activeTab === 'nightlife' && <div className="w-full animate-fade-in h-full"><NightLife player={player} onSelectGame={handleGameSelect} /></div>}
                    {activeTab === 'social' && <div className="w-full animate-fade-in h-full"><SocialHub player={player} uid={user.uid} /></div>}
                </div>

                <Navigation
                    activeTab={activeTab}
                    setTab={handleTabChange}
                />
            </SafeAreaWrapper>

            {activeIAPTab && <IAPStore player={player} updateMultipleStats={updateMultipleStats} onClose={() => setActiveIAPTab(null)} initialTab={activeIAPTab} />}

            {/* REWARD MODAL OVERLAY */}
            {rewardData && (
                <RewardModal
                    fans={rewardData.fans}
                    cash={rewardData.cash}
                    onClose={() => setRewardData(null)}
                />
            )}
        </>
    );
};

const App: React.FC = () => { return <UIProvider><GameContent /></UIProvider>; };
export default App;
