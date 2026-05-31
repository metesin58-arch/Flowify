
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, TabType, UpgradeItem, CharacterAppearance, Gender, SongTrack, SongDraft, ReleasedSong } from './types';
import { INITIAL_STATS, UPGRADES, ECONOMY } from './constants';
import { calculateUpgradeCost, formatListeners, calculateArcadeReward, calculateLevel } from './services/gameLogic';
import { SongProductionManager } from './services/productionService';
import { observeAuth, savePlayerToCloud } from './services/authService';
import { listenForPokes, addMonthlyListeners } from './services/matchmakingService';
import type { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

// Services
import { adMobService } from './services/adMobService';
import { iapService } from './services/iapService';
import { NetworkHub } from './components/NetworkHub';
import { preloadAllSounds, initAudioContext, stopMusic, playWinSound, playClickSound, playErrorSound } from './services/sfx';
import { POTENTIAL_PARTNERS } from './constants';

// UI Context
import { UIProvider, useGameUI } from './context/UIContext';

// Components
import { SafeAreaWrapper } from './components/SafeAreaWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import { ArrowIcon, DiamondIcon } from './components/Icons'; 
import { IAPStore, IAPTab } from './components/IAPStore';
import { SplashScreen } from './components/SplashScreen';

// Sub Games
import { FreestyleGame } from './components/FreestyleGame';
import { LiveFreestyleArena } from './components/LiveFreestyleArena';
import { HigherLowerGame } from './components/HigherLowerGame';
import { TriviaGame } from './components/TriviaGame';
import { RhythmGame } from './components/RhythmGame';
import { RapQuizGame } from './components/RapQuizGame';
import { FlowBattleGame } from './components/FlowBattleGame'; 
import { CoverGuessGame } from './components/CoverGuessGame';
import { SongGuessGame } from './components/SongGuessGame';
import { FlappyDiskGame } from './components/games/FlappyDiskGame';
import { HexagonGame } from './components/games/HexagonGame';

// Casino Games
import { BattleBetGame } from './components/games/BattleBetGame';
import { BlackjackGame } from './components/games/BlackjackGame';
import { ZeppelinGame } from './components/games/ZeppelinGame';

import { MiniGameTestArea } from './components/minigames/MiniGameTestArea';

const GameContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); // Asset loading state

  const [viewMode, setViewMode] = useState<'selector' | 'hub' | 'career' | 'test_area'>('selector');
  const [activeTab, setActiveTab] = useState<TabType>('hub');
  
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);
  const [showEnergyAd, setShowEnergyAd] = useState(false);
  const [activeIAPTab, setActiveIAPTab] = useState<IAPTab | null>(null);
  const [hideGlobalHeader, setHideGlobalHeader] = useState(false);
  const [activeRhythmTrack, setActiveRhythmTrack] = useState<{ base64?: string, url?: string } | null>(null);
  const [activeGameMode, setActiveGameMode] = useState<'none' | 'freestyle' | 'live-freestyle' | 'trivia' | 'higherlower' | 'rhythm' | 'rapquiz' | 'flowbattle' | 'covermatch' | 'higherlower-solo' | 'flowbattle-solo' | 'covermatch-solo' | 'flappydisk' | 'rhythmtwister' | 'hexagon' | 'battlebet' | 'blackjack' | 'zeppelin' | 'coverguess' | 'coverguess-solo' | 'songguess-solo' | 'beatsmash'>('none');
  
  // New: Reward Modal State
  const [showPhone, setShowPhone] = useState(false);
  const [phoneInitialApp, setPhoneInitialApp] = useState<'home' | 'randevu'>('home');
  const [rewardData, setRewardData] = useState<{ fans: number, cash: number } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const gamesPlayedRef = useRef(0);
  const { showToast } = useGameUI();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- GLOBAL NATIVE CALLBACK: odulVer ---
  useEffect(() => {
      window.odulVer = (productId?: string) => {
          console.log("Global odulVer triggered with:", productId);
          const targetId = productId || localStorage.getItem('last_purchase_attempt');
          if (!targetId) return;

          let rewardMsg = "";
          switch (targetId) {
              case 'gold_mini': rewardMsg = "+₺25.000 Eklendi!"; break;
              case 'gold_100': rewardMsg = "+₺100.000 Eklendi!"; break;
              case 'gold_bag': rewardMsg = "+₺300.000 Eklendi!"; break;
              case 'gold_500': rewardMsg = "+₺1.000.000 Eklendi!"; break;
              case 'gold_vault': rewardMsg = "+₺5.000.000 Eklendi!"; break;
              case 'energy_coffee': rewardMsg = "+25 Enerji Eklendi!"; break;
              case 'energy_refill': rewardMsg = "Enerji Fullendi!"; break;
              case 'energy_bulk': rewardMsg = "+500 Enerji Eklendi!"; break;
              case 'vip_sub': rewardMsg = "FLOWIFY PRO Aktif Edildi!"; break;
              case 'verified_tick': rewardMsg = "Mavi Tik Hesabına Eklendi!"; break;
          }

          setPlayer(prev => {
              if (!prev || !user) return prev;
              const newStats = { ...prev };

              switch (targetId) {
                  case 'gold_mini': newStats.careerCash += 25000; break;
                  case 'gold_100': newStats.careerCash += 100000; break;
                  case 'gold_bag': newStats.careerCash += 300000; break;
                  case 'gold_500': newStats.careerCash += 1000000; break;
                  case 'gold_vault': newStats.careerCash += 5000000; break;
                  case 'energy_coffee': newStats.energy = Math.min(prev.maxEnergy, prev.energy + 25); break;
                  case 'energy_refill': newStats.energy = prev.maxEnergy; break;
                  case 'energy_bulk': newStats.energy = Math.min(prev.maxEnergy + 500, prev.energy + 500); break;
                  case 'vip_sub': newStats.isVip = true; newStats.energy = prev.maxEnergy; break;
                  case 'verified_tick': 
                      if (!newStats.ownedUpgrades) newStats.ownedUpgrades = {};
                      newStats.ownedUpgrades['verified_badge'] = 1;
                      break;
                  default: return prev;
              }

              savePlayerToCloud(user.uid, newStats);
              return newStats;
          });

          if (rewardMsg) {
              playWinSound();
              showToast(rewardMsg, 'success');
          }
          localStorage.removeItem('last_purchase_attempt');
          setActiveIAPTab(null);
      };
  }, [user]);

  // --- INIT ---
  useEffect(() => {
    const initGame = async () => {
        adMobService.initialize();
        iapService.initialize();

        // Optimized loading with Caching
        await preloadAllSounds((progress) => {
            // Not displaying percentage anymore, handled by Splash logic
        });

        // Set loaded
        setIsLoading(false);
        
        const unlockAudio = () => { initAudioContext(); };
        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
    };
    initGame();
  }, []);

  useEffect(() => {
      // Welcome tutorial deactivated
  }, []);

  const handleTabChange = (newTab: TabType) => {
      playClickSound();
      setActiveTab(newTab);
      // If we are in career mode and switch tabs, go back to hub view
      if (viewMode === 'career') {
          setViewMode('hub');
      }
  };

  useEffect(() => {
    let unsubscribeStats: (() => void) | null = null;
    let authTimeout = setTimeout(() => {
        console.warn("Auth check timeout, forcing authChecked to true");
        setAuthChecked(true);
    }, 5000);

    const unsubAuth = observeAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Try to load from local storage immediately for faster startup and offline support
        const localData = localStorage.getItem(`flowify_player_${currentUser.uid}`);
        if (localData) {
            setPlayer({ ...INITIAL_STATS, ...JSON.parse(localData) });
        }

        const statsRef = doc(db, 'users', currentUser.uid, 'stats', 'current');
        unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
            clearTimeout(authTimeout);
            if (snapshot.exists()) {
                const cloudData = snapshot.data();
                const syncedData = { ...INITIAL_STATS, ...cloudData };
                if (syncedData.careerCash !== undefined) syncedData.cash = syncedData.careerCash;
                
                // Force sync Level with Fans
                if (syncedData.monthly_listeners !== undefined) {
                    syncedData.careerLevel = calculateLevel(syncedData.monthly_listeners);
                }

                setPlayer(syncedData);
                // Sync to local storage
                localStorage.setItem(`flowify_player_${currentUser.uid}`, JSON.stringify(syncedData));
            }
            setAuthChecked(true);
        }, (error) => {
            clearTimeout(authTimeout);
            console.error("Firestore onSnapshot error (Offline?):", error);
            // If we have local data, we already set it above, so just mark auth as checked
            setAuthChecked(true);
        });
      } else {
        clearTimeout(authTimeout);
        setPlayer(null);
        setAuthChecked(true);
        if (unsubscribeStats) unsubscribeStats();
      }
    });
    return () => { 
        clearTimeout(authTimeout);
        unsubAuth(); 
        if (unsubscribeStats) unsubscribeStats(); 
    };
  }, []);

  // --- ENERGY REGENERATION ---
  useEffect(() => {
    if (!player || !user) return;

    // 1. ENERGY REGENERATION TICK (Checks every 10 seconds, adds energy based on CONFIG)
    const interval = setInterval(() => {
        const now = Date.now();
        const timeDiff = now - player.lastEnergyUpdate;
        const energyToGain = Math.floor(timeDiff / ECONOMY.REGEN_TIME_MS);

        if (energyToGain > 0 && player.energy < player.maxEnergy) {
           const newEnergy = Math.min(player.maxEnergy, player.energy + energyToGain);
           const updatedStats = { ...player, energy: newEnergy, lastEnergyUpdate: now };
           savePlayerToCloud(user.uid, updatedStats);
         }
    }, 10000); 

    // 2. PASSIVE LISTENERS AND CASH INCOME TICK (Ticks every 5 seconds, syncs to Firebase every 30 seconds)
    let tickCount = 0;
    const incomeInterval = setInterval(() => {
        const income = SongProductionManager.calculatePassiveIncome(player.discography || [], player.career.managerTier || 0);
        const listenersGained = SongProductionManager.calculatePassiveListeners(player.discography || [], player.careerLevel || 1);
        
        tickCount++;

        setPlayer(prev => {
            if (!prev) return null;
            const newListeners = (prev.monthly_listeners || 0) + listenersGained;
            const newLevel = calculateLevel(newListeners);

            const updated = {
                ...prev,
                pendingCash: (prev.pendingCash || 0) + income,
                monthly_listeners: newListeners,
                careerLevel: newLevel
            };

            // Save player locally instantly for UI responsiveness
            localStorage.setItem(`flowify_player_${user.uid}`, JSON.stringify(updated));

            // Sync with Server every 30 seconds (6 ticks of 5 seconds) to avoid read/write limits in Firestore
            if (tickCount >= 6) {
                tickCount = 0;
                savePlayerToCloud(user.uid, updated);
            }

            return updated;
        });
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

    const userRef = doc(db, 'public_users', user.uid);
    setDoc(userRef, {
        uid: user.uid,
        name: player.name,
        monthly_listeners: safeListeners,
        respect: player.respect,
        level: level,
        lastActive: serverTimestamp(),
        appearance: player.appearance,
        currentAction: action,
        followersCount: player.followersCount || 0,
        followingCount: player.followingCount || 0
    }, { merge: true });
    
    const heartbeat = setInterval(() => { 
        updateDoc(userRef, { 
            lastActive: serverTimestamp(), 
            currentAction: action 
        }).catch(err => console.warn("Heartbeat failed", err));
    }, 30000);
    return () => clearInterval(heartbeat);
  }, [user, player, viewMode, activeTab, activeGameMode]);

  // --- EVENT LISTENERS ---
  useEffect(() => {
    const handleAiTrackAdded = (e: any) => {
        const track = e.detail;
        setPlayer(prev => prev ? ({
            ...prev,
            aiTracks: [track, ...(prev.aiTracks || [])]
        }) : null);
    };

    const handlePlayRhythm = (e: any) => {
        const track = e.detail;
        setActiveRhythmTrack({ base64: track.audioBase64 });
        handleGameSelect('rhythm');
    };

    const handleFlowifyNotify = (e: any) => {
        const { message, type } = e.detail;
        showToast(message, type);
    };

    const handleFlowifyAward = (e: any) => {
        const { respect, followers } = e.detail;
        if (player) {
            updateMultipleStats({ respect: respect || 0, monthly_listeners: followers || 0 });
            showToast(`+${respect} Respect, +${followers} Dinleyici kazandın! 🔥`, 'success');
        }
    };

    window.addEventListener('aiTrackAdded', handleAiTrackAdded);
    window.addEventListener('playRhythmTrack', handlePlayRhythm);
    window.addEventListener('flowify-notify', handleFlowifyNotify);
    window.addEventListener('flowify-award', handleFlowifyAward);

    return () => {
        window.removeEventListener('aiTrackAdded', handleAiTrackAdded);
        window.removeEventListener('playRhythmTrack', handlePlayRhythm);
        window.removeEventListener('flowify-notify', handleFlowifyNotify);
        window.removeEventListener('flowify-award', handleFlowifyAward);
    };
  }, [player]);

  const updateStat = (stat: keyof PlayerStats, amount: number) => {
    if (!player || !user) return;
    let currentVal = player[stat] as number;
    let newVal = currentVal + amount;
    if (['monthly_listeners', 'energy', 'flow', 'lyrics', 'rhythm', 'charisma', 'cash', 'careerCash'].includes(stat)) newVal = Math.max(0, newVal);
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
    if (!user) return;
    
    setPlayer(prev => {
        if (!prev) return prev;
        const newStats = { ...prev };
        
        Object.entries(updates).forEach(([key, value]) => {
            const k = key as keyof PlayerStats;
            const currentVal = newStats[k];
            if (typeof currentVal === 'number' && typeof value === 'number') {
                let newVal = currentVal + value;
                if (['monthly_listeners', 'energy', 'flow', 'lyrics', 'rhythm', 'charisma', 'cash', 'careerCash'].includes(k)) newVal = Math.max(0, newVal);
                if (k === 'energy') newVal = Math.min(prev.maxEnergy || 100, newVal);
                (newStats[k] as any) = newVal;
            } else {
                (newStats[k] as any) = value;
            }
        });

        if (updates.cash !== undefined) newStats.careerCash = newStats.cash;
        if (updates.careerCash !== undefined) newStats.cash = newStats.careerCash;

        if (newStats.monthly_listeners !== undefined) {
            newStats.careerLevel = calculateLevel(newStats.monthly_listeners);
        }

        savePlayerToCloud(user.uid, newStats);
        return newStats;
    });
  };

  const spendCash = (amount: number, type: 'cash' | 'careerCash' = 'careerCash'): boolean => {
    if (!player || (player[type] as number) < amount) {
        playErrorSound();
        showToast("Yetersiz bakiye!", 'error');
        return false;
    }
    updateStat(type, -amount);
    return true;
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
          'rhythm',
          'coverguess-solo',
          'songguess-solo'
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
      if (!player?.isVip && gamesPlayedRef.current % 2 === 0) {
          try { await adMobService.showInterstitial(); } catch (e) {}
      }
  };

  // --- GAME LAUNCH LOGIC (Energy Check) ---
  const handleGameSelect = (game: any) => {
      let activeGame = game;

      // Free/Casino Games
      if (['battlebet', 'blackjack', 'zeppelin', 'casino_menu'].includes(activeGame)) {
          setActiveGameMode(activeGame);
          return;
      }
      
      // Determine Energy Cost based on Type
      const isOnline = ['flowbattle', 'higherlower', 'trivia', 'coverguess', 'live-freestyle'].includes(activeGame);
      const isSolo = ['freestyle', 'higherlower-solo', 'flowbattle-solo', 'covermatch-solo', 'flappydisk', 'rhythmtwister', 'hexagon', 'rapquiz', 'rhythm', 'coverguess-solo', 'songguess-solo', 'beatsmash'].includes(activeGame);
      
      let cost = 0;
      if (isOnline) {
          // For online games, we don't deduct energy here. 
          // It will be deducted in the GameLobby when a match actually starts.
          setActiveGameMode(activeGame);
          return;
      }
      else if (isSolo) cost = ECONOMY.COST.OFFLINE_GAME;

      if (spendEnergy(cost)) {
          setActiveGameMode(activeGame);
      }
  };

  const handlePartnerAcquire = () => {
      setPhoneInitialApp('randevu');
      setShowPhone(true);
  };

    const handlePhaseChange = React.useCallback((phase: string) => {
        setHideGlobalHeader(phase !== 'hub');
    }, []);

    // --- RENDER ---
  
  // Single Splash Screen handling both fake animation + real loading
  if (showSplash) {
      return <SplashScreen onFinish={() => setShowSplash(false)} isReady={!isLoading && authChecked} />;
  }

  // Not logged in or loading stats
  if (!authChecked) return <div className="h-dvh w-screen bg-black flex items-center justify-center text-white">Yükleniyor...</div>;
  if (!user) return <AuthScreen />;
  
  // Character Creation
  if (!player) return <CharacterCreation onCreate={(name, gender, app, cityId, song, vocal, backstory, personality) => {
      const newP = { 
          ...INITIAL_STATS, 
          name, 
          gender, 
          appearance: app, 
          currentCity: cityId,
          startingCity: cityId,
          unlockedCities: [cityId],
          favoriteSong: song,
          vocalStyle: vocal || 'raw',
          backstory: backstory || 'street',
          personality: personality || 'humble'
      };
      savePlayerToCloud(user.uid, newP);
      setIsEditingCharacter(false);
  }} />;

  if (showEnergyAd) return <AdModal title="ENERJİN BİTTİ!" rewardText={`Reklam izleyerek +${ECONOMY.AD_REWARD_ENERGY} Enerji kazan.`} onWatch={handleWatchEnergyAd} onCancel={() => setShowEnergyAd(false)} />;

  if (isEditingCharacter) return <CharacterCreation 
    onCreate={(name, gender, app, _cityId, song, vocal, backstory, personality) => {
      updateMultipleStats({ 
          name, 
          gender, 
          appearance: app, 
          favoriteSong: song,
          vocalStyle: vocal,
          backstory: backstory,
          personality: personality
      });
      setIsEditingCharacter(false);
    }} 
    isEditing={true} 
    initialData={player} 
    ownedUpgrades={player.ownedUpgrades} 
  />;

   if (activeGameMode !== 'none') {
      return (
          <SafeAreaWrapper className="bg-black">
              {activeGameMode === 'freestyle' && <FreestyleGame onExit={() => setActiveGameMode('none')} />}
              {activeGameMode === 'live-freestyle' && <LiveFreestyleArena player={player} onExit={() => setActiveGameMode('none')} />}
              {activeGameMode === 'trivia' && <TriviaGame playerName={player.name} player={player} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} updateStat={updateStat} />}
              {activeGameMode === 'higherlower' && <HigherLowerGame playerName={player.name} player={player} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} updateStat={updateStat} />}
              {activeGameMode === 'higherlower-solo' && <HigherLowerGame playerName={player.name} player={player} onGameEnd={handleGameEnd} onExit={() => setActiveGameMode('none')} isSolo={true} />}
              {activeGameMode === 'rhythm' && <RhythmGame onExit={() => { setActiveGameMode('none'); setActiveRhythmTrack(null); }} onGameEnd={handleGameEnd} musicBase64={activeRhythmTrack?.base64} musicUrl={activeRhythmTrack?.url} />}
              {activeGameMode === 'rapquiz' && <RapQuizGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'flowbattle' && <FlowBattleGame playerName={player.name} player={player} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} updateStat={updateStat} />}
              {activeGameMode === 'flowbattle-solo' && <FlowBattleGame playerName={player.name} player={player} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} isSolo={true} />}
              {activeGameMode === 'coverguess' && <CoverGuessGame playerName={player.name} player={player} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} isOnline={true} />}
              {activeGameMode === 'coverguess-solo' && <CoverGuessGame playerName={player.name} player={player} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'songguess-solo' && <SongGuessGame playerName={player.name} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'flappydisk' && <FlappyDiskGame onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'rhythmtwister' && <RhythmTwisterMode onExit={() => setActiveGameMode('none')} />}
              {activeGameMode === 'hexagon' && <HexagonGame onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'beatsmash' && <FlowBattleGame playerName={player.name} player={player} isSolo={true} onExit={() => setActiveGameMode('none')} onGameEnd={handleGameEnd} />}
              {activeGameMode === 'battlebet' && <BattleBetGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" showToast={showToast} />}
              {activeGameMode === 'blackjack' && <BlackjackGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" showToast={showToast} />}
              {activeGameMode === 'zeppelin' && <ZeppelinGame player={player} updateStat={updateStat} onExit={() => setActiveGameMode('none')} cashType="careerCash" showToast={showToast} />}
              {activeGameMode === 'casino_menu' && (
                  <div className="fixed inset-0 z-[100] bg-black">
                      <NightLife 
                        player={player} 
                        onSelectGame={handleGameSelect} 
                        onPartnerAcquire={handlePartnerAcquire} 
                        onClose={() => setActiveGameMode('none')}
                      />
                  </div>
              )}
          </SafeAreaWrapper>
      );
  }

  if (showWelcomeTutorial && viewMode === 'selector') return <WelcomeTutorial onComplete={() => { localStorage.setItem('flowify_welcome_seen', 'true'); setShowWelcomeTutorial(false); }} />;
  if (viewMode === 'test_area') return <SafeAreaWrapper className="bg-black"><MiniGameTestArea onExit={() => setViewMode('selector')} /></SafeAreaWrapper>;
  if (viewMode === 'selector') return <SafeAreaWrapper><GameSelector player={player} onSelectMode={setViewMode} /></SafeAreaWrapper>;
  
  // Main App Layout
  return (
    <SafeAreaWrapper className="bg-black text-white">
      {/* GLOBAL HEADER - PREMIUM GLASSMORPHISM */}
      {!hideGlobalHeader && !activeIAPTab && (
          <div className="absolute top-0 left-0 right-0 z-[100] px-3 py-2 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/50 to-transparent pb-8 pointer-events-none">
                 <div className="flex items-center gap-2 pointer-events-auto mt-1">
                     <button onClick={() => { playClickSound(); setViewMode('selector'); }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black active:scale-95 transition-all shadow-lg font-black text-[10px] tracking-tight lowercase z-50">
                         <ArrowIcon dir="left" className="w-3 h-3 text-black" />
                         <span>menü</span>
                     </button>
                 </div>
                 
                 <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl pointer-events-auto">
                     {isOffline && (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full mr-1">
                             <span className="text-[10px] animate-pulse">📡</span>
                             <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">OFFLINE</span>
                         </div>
                     )}
                     <button onClick={() => { playClickSound(); setActiveIAPTab('currency'); }} className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-full transition-colors">
                         <span className="text-[10px] font-mono text-[#1ed760] font-black">₺{player.careerCash.toLocaleString()}</span>
                     </button>
                     <div className="w-px h-4 bg-white/20"></div>
                     <button onClick={() => { playClickSound(); setActiveIAPTab('energy'); }} className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-full transition-colors">
                         <span className="text-yellow-400 text-[10px]">⚡</span>
                         <span className={`text-[10px] font-mono font-black ${player.energy < 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.floor(player.energy)}</span>
                     </button>
                     <button onClick={() => { playClickSound(); setActiveIAPTab('vip'); }} className="bg-gradient-to-r from-yellow-500 to-yellow-700 px-2 py-1 rounded-full ml-1 shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform flex items-center gap-1">
                         <DiamondIcon className="w-2.5 h-2.5 text-white" />
                         <span className="text-[8px] font-black text-white uppercase tracking-widest hidden sm:inline">PREMIUM</span>
                     </button>
                 </div>
          </div>
      )}

      <div className="flex-1 w-full relative h-full overflow-hidden">
          <div className="flex-1 w-full relative h-full overflow-hidden flex flex-col">
              {viewMode === 'career' ? (
                  <div className="w-full h-full animate-fade-in">
                      <ConcertMode 
                        player={player} 
                        updateStat={updateStat} 
                        updateMultipleStats={updateMultipleStats} 
                        onExit={() => { setViewMode('selector'); setHideGlobalHeader(false); }} 
                        onEditCharacter={() => setIsEditingCharacter(true)} 
                        onOpenShop={(tab) => { playClickSound(); setActiveIAPTab(tab); }} 
                        onPhaseChange={handlePhaseChange}
                        onPartnerAcquire={handlePartnerAcquire}
                      />
                  </div>
              ) : (
                  <>
                      <div className={`w-full h-full flex flex-col ${activeTab === 'hub' ? 'animate-fade-in' : 'hidden'}`}>
                          <Dashboard player={player} uid={user.uid} ownedUpgrades={player.ownedUpgrades || {}} onEditCharacter={() => setIsEditingCharacter(true)} updateStat={updateStat} updateMultipleStats={updateMultipleStats} onStartLiveFreestyle={() => handleGameSelect('live-freestyle')} onOpenShop={(tab) => { playClickSound(); setActiveIAPTab(tab); }} />
                      </div>
                      <div className={`w-full h-full flex flex-col ${activeTab === 'arcade' ? 'animate-fade-in' : 'hidden'}`}>
                          <Street player={player} onSelectGame={handleGameSelect} mode="arcade" />
                      </div>
                      <div className={`w-full h-full flex flex-col ${activeTab === 'online' ? 'animate-fade-in' : 'hidden'}`}>
                          <Street player={player} onSelectGame={handleGameSelect} mode="online" />
                      </div>
                      <div className={`w-full h-full flex flex-col ${activeTab === 'nightlife' ? 'animate-fade-in' : 'hidden'}`}>
                          <NightLife player={player} onSelectGame={handleGameSelect} onPartnerAcquire={handlePartnerAcquire} />
                      </div>
                      <div className={`w-full h-full flex flex-col ${activeTab === 'social' ? 'animate-fade-in' : 'hidden'}`}>
                          <NetworkHub 
                            player={player} 
                            uid={user.uid} 
                            updateMultipleStats={updateMultipleStats}
                            updateStat={updateStat}
                            onVehicleBuy={(v) => {
                                console.log("Vehicle bought:", v);
                            }}
                            onCityUnlock={(cityId) => {
                                if (!player.unlockedCities.includes(cityId)) {
                                    updateMultipleStats({
                                        unlockedCities: [...player.unlockedCities, cityId]
                                    });
                                }
                            }}
                            onOpenShop={(tab) => setActiveIAPTab(tab as IAPTab)}
                            onStartLiveFreestyle={() => handleGameSelect('live-freestyle')}
                          />
                      </div>
                  </>
              )}
          </div>
          {!hideGlobalHeader && !activeIAPTab && viewMode !== 'career' && <Navigation activeTab={activeTab} setTab={handleTabChange} />}
      </div>

      {activeIAPTab && <IAPStore player={player} updateMultipleStats={updateMultipleStats} onClose={() => setActiveIAPTab(null)} initialTab={activeIAPTab} />}
      
      {showPhone && (
          <div className="fixed inset-0 z-[200] animate-fade-in">
              <NetworkHub 
                player={player} 
                uid={user.uid} 
                updateMultipleStats={updateMultipleStats}
                updateStat={updateStat}
                onOpenShop={(tab) => setActiveIAPTab(tab as IAPTab)}
                onClose={() => setShowPhone(false)}
                onStartLiveFreestyle={() => {
                  setShowPhone(false);
                  handleGameSelect('live-freestyle');
                }}
              />
          </div>
      )}

      {/* REWARD MODAL OVERLAY */}
      {rewardData && (
          <RewardModal 
              fans={rewardData.fans} 
              cash={rewardData.cash} 
              onClose={() => setRewardData(null)} 
          />
      )}
    </SafeAreaWrapper>
  );
};

const App: React.FC = () => { return <ErrorBoundary><UIProvider><GameContent /></UIProvider></ErrorBoundary>; };
export default App;
