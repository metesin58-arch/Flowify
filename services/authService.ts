
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, set, get, update, child } from 'firebase/database';
import { auth, db } from './firebaseConfig';
import { PlayerStats } from '../types';
import { INITIAL_STATS } from '../constants';

export const observeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const loginGuest = async () => {
  return signInAnonymously(auth);
};

export const registerEmail = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  return signOut(auth);
};

// --- DATA PERSISTENCE ---

export const savePlayerToCloud = async (uid: string, stats: PlayerStats) => {
  try {
    const userRef = ref(db, `users/${uid}/stats`);
    // Remove undefined values to avoid Firebase errors
    const cleanStats = JSON.parse(JSON.stringify(stats));
    await update(userRef, cleanStats);
    
    // Also update public profile for leaderboards/lobby
    const publicRef = ref(db, `public_users/${uid}`);
    
    // Ensure listeners is non-negative for calculation to avoid NaN
    const safeListeners = Math.max(0, stats.monthly_listeners || 0);
    const level = Math.floor(Math.sqrt(safeListeners) / 100) + 1;

    await update(publicRef, {
        name: stats.name,
        // Ensure monthly_listeners is synced to public profile for global leaderboard
        monthly_listeners: safeListeners, 
        level: level,
        lastActive: Date.now()
    });

  } catch (error) {
    console.error("Cloud save failed", error);
  }
};

export const loadPlayerFromCloud = async (uid: string): Promise<PlayerStats | null> => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${uid}/stats`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Merge with initial stats to ensure new fields (like monthly_listeners) exist
      return { ...INITIAL_STATS, ...data };
    } else {
      return null; // New user
    }
  } catch (error) {
    console.error("Cloud load failed", error);
    return null;
  }
};
