import { PlayerStats } from '../types';
import { SAVE_KEY } from '../constants';

export const loadGame = (): PlayerStats | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load save", e);
  }
  return null;
};

export const saveGameLocal = (player: PlayerStats) => {
  const data = { ...player, lastSaveTime: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
};

export const syncWithCloud = async (player: PlayerStats): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.1);
    }, 800);
  });
};