
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { handleFirestoreError, OperationType } from './errorService';
import { PlayerStats } from '../types';
import { INITIAL_STATS } from '../constants';
import { calculateLevel } from './gameLogic';

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

export const loginGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logoutUser = async () => {
  return signOut(auth);
};

// --- DATA PERSISTENCE ---

export const savePlayerToCloud = async (uid: string, stats: PlayerStats) => {
  try {
    // Always save to localStorage first for offline support
    localStorage.setItem(`flowify_player_${uid}`, JSON.stringify(stats));

    const userRef = doc(db, 'users', uid);
    const statsRef = doc(db, 'users', uid, 'stats', 'current');
    
    // Remove undefined values to avoid Firebase errors
    const cleanStats = JSON.parse(JSON.stringify(stats));
    
    // Use setDoc with merge for the main stats
    try {
      // Ensure top-level user doc exists for isAdmin checks and metadata
      await setDoc(userRef, { 
        uid, 
        name: stats.name, 
        updatedAt: serverTimestamp(),
        role: stats.role || 'user' // Default role
      }, { merge: true });

      await setDoc(statsRef, cleanStats, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, statsRef.path);
    }
    
    // Also update public profile for leaderboards/lobby
    const publicRef = doc(db, 'public_users', uid);
    
    // Ensure listeners is non-negative for calculation to avoid NaN
    const safeListeners = Math.max(0, stats.monthly_listeners || 0);
    const level = calculateLevel(safeListeners);

    try {
      await setDoc(publicRef, {
          uid: uid,
          name: stats.name,
          monthly_listeners: safeListeners, 
          level: level,
          respect: stats.respect || 0,
          lastActive: serverTimestamp(),
          appearance: stats.appearance
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, publicRef.path);
    }

  } catch (error) {
    console.error("Cloud save failed, using local storage", error);
  }
};

export const loadPlayerFromCloud = async (uid: string): Promise<PlayerStats | null> => {
  try {
    // Try local storage first if offline or for speed
    const localData = localStorage.getItem(`flowify_player_${uid}`);
    let localStats: PlayerStats | null = null;
    if (localData) {
      localStats = { ...INITIAL_STATS, ...JSON.parse(localData) };
    }

    const statsRef = doc(db, 'users', uid, 'stats', 'current');
    let snapshot;
    try {
      snapshot = await getDoc(statsRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, statsRef.path);
      return localStats;
    }
    
    if (snapshot.exists()) {
      const cloudData = snapshot.data();
      const cloudStats = { ...INITIAL_STATS, ...cloudData } as PlayerStats;
      
      localStorage.setItem(`flowify_player_${uid}`, JSON.stringify(cloudStats));
      return cloudStats;
    } else {
      return localStats; // Fallback to local if cloud doesn't exist yet
    }
  } catch (error) {
    console.error("Cloud load failed, using local storage", error);
    const localData = localStorage.getItem(`flowify_player_${uid}`);
    if (localData) {
      return { ...INITIAL_STATS, ...JSON.parse(localData) };
    }
    return null;
  }
};
