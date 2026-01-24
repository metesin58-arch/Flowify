
import { PlayerStats, CharacterAppearance, CityKey } from '../types';
import { CITIES, ECONOMY } from '../constants';

export const calculateUpgradeCost = (baseCost: number, multiplier: number, owned: number): number => {
  return Math.floor(baseCost * Math.pow(multiplier, owned));
};

export const calculateLevel = (listeners: number): number => {
  if (listeners < 10000) return 1;
  return Math.floor(Math.sqrt(listeners) / 100) + 1;
};

// NEW: Calculate progress percentage (0-100) towards next level
export const calculateLevelProgress = (listeners: number): number => {
    if (listeners < 10000) {
        // Level 1 range: 0 to 10000
        return Math.min(100, (listeners / 10000) * 100);
    }
    
    const currentLevel = Math.floor(Math.sqrt(listeners) / 100) + 1;
    
    // Formula inverse: Listeners = ((Level - 1) * 100)^2
    const currentLevelThreshold = Math.pow((currentLevel - 1) * 100, 2);
    const nextLevelThreshold = Math.pow((currentLevel) * 100, 2);
    
    const range = nextLevelThreshold - currentLevelThreshold;
    const progress = listeners - currentLevelThreshold;
    
    return Math.min(100, Math.max(0, (progress / range) * 100));
};

export const getNextLevelThreshold = (listeners: number): number => {
    const currentLevel = calculateLevel(listeners);
    return Math.pow((currentLevel) * 100, 2);
};

// UI FORMATTER
export const formatListeners = (num: number): string => {
    if (num === undefined || num === null) return "0";
    if (num < 100000) return num.toLocaleString('tr-TR');
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(2) + 'M';
};

// --- ARCADE REWARDS ---
export const calculateArcadeReward = (gameType: string, score: number, playerLevel: number): { fans: number, cash: number } => {
    // Base multiplier reduces grinding effectiveness at higher levels
    const levelMult = Math.max(1, Math.sqrt(playerLevel));
    
    let fanReward = 0;
    let cashReward = 0;

    // DRASTICALLY REDUCED CASH REWARDS (Arcade should be for Fans/XP mostly)
    switch (gameType) {
        case 'rhythm': // Reflex
        case 'flappydisk':
        case 'hexagon':
            // High score based games (e.g. 50 score)
            // Increased Fan reward slightly
            fanReward = Math.floor(score * 3); 
            cashReward = Math.floor(score * 0.1); 
            break;
        
        case 'higherlower-solo':
        case 'rapquiz':
            // Count based (e.g. 10 score)
            fanReward = Math.floor(score * 20);
            cashReward = Math.floor(score * 1.5); 
            break;

        case 'flowbattle-solo': // Breakdance
        case 'covermatch-solo':
            // Percentage based (e.g. 100 score)
            fanReward = Math.floor(score * 3);
            cashReward = Math.floor(score * 0.3);
            break;
            
        case 'rhythmtwister':
             // Completed levels (e.g. 5)
             fanReward = score * 50;
             cashReward = score * 5; 
             break;

        default:
            fanReward = 10;
            cashReward = 1;
    }

    // Caps to prevent exploit
    const maxFans = 2000 * levelMult; 
    const maxCash = 150 * levelMult; // Hard cap on cash per game

    return {
        fans: Math.min(Math.floor(fanReward), Math.floor(maxFans)),
        cash: Math.min(Math.floor(cashReward), Math.floor(maxCash))
    };
};

// --- CITY & ECONOMY LOGIC ---

/**
 * Calculates concert revenue with STRICT CAPS based on City Tier.
 */
export const calculateConcertRevenue = (performanceScore: number, cityId: CityKey, player: PlayerStats): number => {
    const city = CITIES[cityId] || CITIES['eskisehir'];
    const basePay = city.basePay;
    const performanceMult = 0.5 + (performanceScore / 100);
    const logFans = Math.log10(Math.max(10, player.monthly_listeners));
    const fanMultiplier = 1 + (logFans * 0.1 * city.tier); 
    const skillBonus = player.charisma * 10 * city.tier;

    let totalIncome = (basePay * performanceMult * fanMultiplier) + skillBonus;
    const hardCap = basePay * 5; 
    
    if (totalIncome > hardCap) {
        totalIncome = hardCap;
    }

    const variance = 0.9 + (Math.random() * 0.2);
    totalIncome *= variance;

    return Math.floor(totalIncome);
};

export const canUnlockCity = (cityId: CityKey, player: PlayerStats): boolean => {
    const city = CITIES[cityId];
    if (!city) return false;
    return city.unlockRequirements.check(player);
};

export const handleWeeklyExpenses = (player: PlayerStats): Partial<PlayerStats> => {
    const cityId = player.currentCity || 'eskisehir';
    const city = CITIES[cityId];
    const rent = city.weeklyCost;
    
    let updates: Partial<PlayerStats> = {};
    const currentCash = player.careerCash; 
    const finalCash = currentCash - rent;

    if (finalCash < 0) {
        updates.careerCash = finalCash; 
        const lostFans = Math.floor(player.monthly_listeners * 0.05); 
        updates.monthly_listeners = Math.max(0, player.monthly_listeners - lostFans);
        updates.energy = Math.max(0, player.energy - 20);
        updates.charisma = Math.max(0, player.charisma - 2); 
        updates.rel_manager = Math.max(0, player.rel_manager - 5);
        console.log(`[ECONOMY] Bankruptcy in ${city.name}. Rent: ${rent}. Punishment applied.`);
    } else {
        updates.careerCash = finalCash;
    }

    return updates;
};
