
import { PlayerStats, SongDraft, ReleasedSong } from '../types';

// Constants
const MIXING_TIME_MS = 7200000; // 2 Hours (120 mins * 60 * 1000)
const ROYALTY_RATE = 0.015; 

export const SongProductionManager = {
    
    // 1. Start Recording
    startProduction: (name: string, stats: PlayerStats): SongDraft => {
        return {
            id: Date.now().toString(),
            name,
            quality: 0, // Will be set by mini-game
            startTime: 0,
            finishTime: 0,
            potentialListeners: stats.monthly_listeners * 0.1 // Base potential
        };
    },

    // 2. Calculate Quality from Mini-Game Score
    calculateQuality: (miniGameScore: number, stats: PlayerStats): number => {
        // Base score from mini-game (0-100)
        // Bonus from skills (max +20)
        const skillFactor = (stats.rhythm + stats.flow + stats.lyrics) / 30; // Assuming skills around 10-100
        let finalQuality = miniGameScore + (skillFactor * 5);
        return Math.min(100, Math.floor(finalQuality));
    },

    // 3. Start Mixing Phase
    startMixing: (draft: SongDraft): SongDraft => {
        const now = Date.now();
        return {
            ...draft,
            startTime: now,
            finishTime: now + MIXING_TIME_MS
        };
    },

    // Check if mixing is done
    checkMixingStatus: (draft: SongDraft): 'mixing' | 'ready' => {
        if (Date.now() >= draft.finishTime) {
            return 'ready';
        }
        return 'mixing';
    },

    // Speed up mixing
    boostMixing: (draft: SongDraft): SongDraft => {
        return {
            ...draft,
            finishTime: Date.now() // Finish immediately
        };
    },

    // 4. Release Song & Calculate Success (UPDATED)
    releaseSong: (draft: SongDraft, stats: PlayerStats): { song: ReleasedSong, listenersGained: number, initialCash: number } => {
        // SUCCESS ALGORITHM
        const qualityScore = draft.quality * 50; 
        const charismaScore = stats.charisma * 20; 
        const listenerBonus = Math.sqrt(stats.monthly_listeners) * 2; 
        const luck = Math.random() * 800;

        const totalScore = qualityScore + charismaScore + listenerBonus + luck;
        
        // Normalize popularity
        const popularityScore = Math.floor(totalScore / 10); 
        
        // Listeners Gained (Immediate) - Min 500
        const listenersGained = Math.max(500, Math.floor(popularityScore * 5)); 

        // Initial Sales Cash (Immediate) - High impact
        // e.g. Popularity 1000 -> 25,000 TL
        const initialCash = Math.floor(popularityScore * 25);

        const newSong: ReleasedSong = {
            id: draft.id,
            name: draft.name,
            quality: draft.quality,
            releasedAt: Date.now(),
            popularityScore: popularityScore,
            totalEarnings: initialCash // Track total
        };

        return { song: newSong, listenersGained, initialCash };
    },

    // 5. Calculate Passive Income (UPDATED DECAY)
    calculatePassiveIncome: (discography: ReleasedSong[]): number => {
        if (discography.length === 0) return 0;

        let income = 0;
        const now = Date.now();

        discography.forEach(song => {
            // Songs decay in popularity over time
            // 48 hours to reach 5% baseline
            const ageInHours = (now - song.releasedAt) / (1000 * 60 * 60);
            
            // Decays linearly until 48 hours, then holds at 5% of potential
            const decayFactor = Math.max(0.05, 1 - (ageInHours / 48)); 
            
            const songIncome = song.popularityScore * ROYALTY_RATE * decayFactor;
            income += songIncome;
        });

        // Round down aggressively
        return Math.floor(income);
    }
};
