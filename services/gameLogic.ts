
import { PlayerStats, CharacterAppearance, CityKey } from '../types';
import { CITIES, ECONOMY } from '../constants';

export const calculateUpgradeCost = (baseCost: number, multiplier: number, owned: number): number => {
  return Math.floor(baseCost * Math.pow(multiplier, owned));
};

export const calculateLevel = (listeners: number): number => {
  if (listeners <= 0) return 1;
  if (listeners < 1000) return 1;
  if (listeners < 3000) return 2;
  if (listeners < 8000) return 3;
  if (listeners < 15000) return 4;
  if (listeners < 30000) return 5;
  if (listeners < 60000) return 6;
  if (listeners < 120000) return 7;
  if (listeners < 250000) return 8;
  if (listeners < 500000) return 9;
  return Math.floor(Math.sqrt(listeners - 500000) / 100) + 10;
};

export const getLevelMinAndMax = (level: number): { min: number, max: number } => {
  const thresholds = [0, 1000, 3000, 8000, 15000, 30000, 60000, 120000, 250000, 500000];
  if (level <= 1) return { min: 0, max: 1000 };
  if (level <= 10) {
    return { min: thresholds[level - 1], max: thresholds[level] || 1000000 };
  }
  const min = Math.pow((level - 10) * 100, 2) + 500000;
  const max = Math.pow((level - 9) * 100, 2) + 500000;
  return { min, max };
};

export const calculateLevelProgress = (listeners: number): number => {
  const level = calculateLevel(listeners);
  const { min, max } = getLevelMinAndMax(level);
  const range = max - min;
  const progress = listeners - min;
  return Math.min(100, Math.max(0, (progress / range) * 100));
};

export const getNextLevelThreshold = (listeners: number): number => {
  const level = calculateLevel(listeners);
  const { max } = getLevelMinAndMax(level);
  return max;
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
    
    let cashReward = 0;

    // DRASTICALLY REDUCED CASH REWARDS (Arcade should be for Fans/XP mostly)
    switch (gameType) {
        case 'rhythm': // Reflex
        case 'flappydisk':
        case 'hexagon':
            // High score based games (e.g. 50 score)
            cashReward = Math.floor(score * 0.1); 
            break;
        
        case 'higherlower-solo':
        case 'rapquiz':
            // Count based (e.g. 10 score)
            cashReward = Math.floor(score * 1.5); 
            break;

        case 'flowbattle-solo': // Breakdance
        case 'covermatch-solo':
            // Percentage based (e.g. 100 score)
            cashReward = Math.floor(score * 0.3);
            break;
            
        case 'rhythmtwister':
             // Completed levels (e.g. 5)
             cashReward = score * 5; 
             break;

        default:
            cashReward = 1;
    }

    // Caps to prevent exploit
    const maxCash = 150 * levelMult; // Hard cap on cash per game

    return {
        fans: 0, // No fans/listeners from offline games
        cash: Math.min(Math.floor(cashReward), Math.floor(maxCash))
    };
};

// --- CITY & ECONOMY LOGIC ---

/**
 * Calculates concert revenue - SIMPLIFIED for now.
 */
export const calculateConcertRevenue = (performanceScore: number, cityId: CityKey, player: PlayerStats): number => {
    // Base reward based on performance
    const baseReward = 2000;
    const performanceMult = 0.5 + (performanceScore / 100);
    
    // Manager Bonus: Tier 1 (+10%), Tier 2 (+25%), Tier 3 (+50%)
    const managerTier = player.career.managerTier || 0;
    const managerBonus = managerTier === 1 ? 1.1 : 
                         managerTier === 2 ? 1.25 : 
                         managerTier === 3 ? 1.5 : 1.0;

    const totalIncome = baseReward * performanceMult * managerBonus;
    const variance = 0.9 + (Math.random() * 0.2);

    return Math.floor(totalIncome * variance);
};

export const canUnlockCity = (cityId: CityKey, player: PlayerStats): boolean => {
    const city = CITIES[cityId];
    if (!city) return false;
    return city.unlockRequirements.check(player);
};

/**
 * Handles weekly expenses - DISABLED for now.
 */
export const handleWeeklyExpenses = (player: PlayerStats): Partial<PlayerStats> => {
    return {}; // No expenses for now
};
