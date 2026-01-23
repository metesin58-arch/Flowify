
import { ref, get, set, update, push, remove, onChildAdded, off, increment, query, orderByChild, limitToLast, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from './firebaseConfig';
import { fetchSongs, generateGameSequence, generateTriviaQuestions, searchSongs } from './musicService';
import { SongTrack, LeaderboardEntry, OnlineUser } from '../types';

// --- OFFLINE / STUDIO PROGRESSION ---

export const addMonthlyListeners = async (userId: string, amount: number) => {
    if (amount <= 0) return;
    const updates: any = {};
    updates[`users/${userId}/stats/monthly_listeners`] = increment(amount);
    updates[`public_users/${userId}/monthly_listeners`] = increment(amount);
    updates[`public_users/${userId}/lastActive`] = serverTimestamp();
    await update(ref(db), updates);
};

// --- RESPECT SYSTEM (THE CORE TROPHY LOGIC) ---

export const resolveRespectDuel = async (winnerId: string, loserId: string): Promise<{ winnerRespectChange: number, loserRespectChange: number }> => {
    const RESPECT_GAIN = 34;
    const RESPECT_LOSS = -34;

    console.log(`🏆 RESPECT DUEL: Winner ${winnerId} (+${RESPECT_GAIN}), Loser ${loserId} (${RESPECT_LOSS})`);

    // We must update both the PUBLIC profile (for leaderboard) and PRIVATE stats (for dashboard UI)
    const updates: any = {};

    // 1. PUBLIC_USERS (Leaderboard Source)
    updates[`public_users/${winnerId}/respect`] = increment(RESPECT_GAIN);
    updates[`public_users/${loserId}/respect`] = increment(RESPECT_LOSS);
    
    // 2. PRIVATE STATS (Sync for Dashboard/Profile UI)
    updates[`users/${winnerId}/stats/respect`] = increment(RESPECT_GAIN);
    updates[`users/${loserId}/stats/respect`] = increment(RESPECT_LOSS);

    try {
        await update(ref(db), updates);
        return { winnerRespectChange: RESPECT_GAIN, loserRespectChange: RESPECT_LOSS };
    } catch (e) {
        console.error("❌ Respect update failed:", e);
        return { winnerRespectChange: 0, loserRespectChange: 0 };
    }
};

// --- FLOWX GLOBAL FEED ---

export const sendGlobalPost = async (userId: string, author: string, content: string, avatarIndex: number) => {
    const postsRef = ref(db, 'global_feed');
    const newPostRef = push(postsRef);
    await set(newPostRef, {
        uid: userId,
        author: author,
        content: content,
        avatarIndex: avatarIndex,
        timestamp: serverTimestamp(),
        likes: 0
    });
};

export const listenForGlobalPosts = (callback: (post: any) => void) => {
    const postsRef = query(ref(db, 'global_feed'), limitToLast(20));
    const unsub = onChildAdded(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback({ id: snapshot.key, ...data });
        }
    });
    return () => off(postsRef, 'child_added', unsub);
};

// --- GAMEPLAY SYNC ---

export const updateScore = (gameId: string, playerId: string, newScore: number, newLives: number = 3) => {
    update(ref(db, `games/${gameId}/players/${playerId}`), { score: newScore, lives: newLives });
};

export const setPlayerFinished = (gameId: string, playerId: string, finalScore: number) => {
    update(ref(db, `games/${gameId}/players/${playerId}`), { 
        status: 'finished',
        score: finalScore 
    });
};

export const setPlayerGameOver = (gameId: string, playerId: string) => {
    update(ref(db, `games/${gameId}/players/${playerId}`), { status: 'gameover' });
};

// --- DISS / TAUNT SYSTEM ---

export const sendTaunt = async (gameId: string, targetId: string, msg: string) => {
    const tauntRef = push(ref(db, `games/${gameId}/taunts`));
    await set(tauntRef, { targetId, msg, timestamp: serverTimestamp() });
};

export const listenForTaunts = (gameId: string, myId: string, callback: (msg: string) => void) => {
    const tauntsRef = ref(db, `games/${gameId}/taunts`);
    const unsub = onChildAdded(tauntsRef, (snapshot) => {
        const val = snapshot.val();
        if (val && val.targetId === myId) {
            callback(val.msg);
            remove(snapshot.ref); // Consume event
        }
    });
    return () => off(tauntsRef, 'child_added', unsub);
};

// --- LOBBY & PRESENCE SYSTEM ---

export const joinLobby = async (gameType: string, player: { id: string, name: string, fans: number, level: number }) => {
    await remove(ref(db, `invites/${player.id}`));
    const lobbyRef = ref(db, `lobbies/${gameType}/${player.id}`);
    await set(lobbyRef, {
        name: player.name,
        level: player.level,
        status: 'idle',
        lastActive: serverTimestamp()
    });
    onDisconnect(lobbyRef).remove();
};

export const leaveLobby = async (gameType: string, playerId: string) => {
    await remove(ref(db, `lobbies/${gameType}/${playerId}`));
    await remove(ref(db, `invites/${playerId}`));
};

// --- INVITE SYSTEM ---

export const sendInvite = async (targetId: string, challenger: { id: string, name: string }, gameType: string, category?: any) => {
    const inviteRef = ref(db, `invites/${targetId}/${challenger.id}`);
    await set(inviteRef, {
        challengerName: challenger.name,
        gameType: gameType,
        status: 'pending',
        timestamp: serverTimestamp(),
        category: category || null
    });
    onDisconnect(inviteRef).remove();
};

export const acceptInviteAndCreateGame = async (
    challengerId: string,
    myPlayer: { id: string, name: string },
    gameType: string,
    category?: any
): Promise<string | null> => {
    
    let songs: SongTrack[] = [];
    try { 
        if (category && category.id !== 'general') {
            // Strict filtering based on invite category
            songs = await searchSongs(category.query, 60, true);
        } else {
            songs = await fetchSongs();
        }
    } catch(e) { console.error(e); }
    
    if (!songs || songs.length < 5) return null;

    let gameDataPayload: any = {};
    if (gameType === 'higherlower') {
        gameDataPayload = { sequence: generateGameSequence(songs) };
    } else if (gameType === 'trivia') {
        gameDataPayload = { questions: generateTriviaQuestions(songs, 10) };
    } else if (gameType === 'flowbattle') {
        const randSong = songs[0];
        gameDataPayload = { bpm: 100 + Math.floor(Math.random() * 30), songUrl: randSong.previewUrl };
    }

    if (!gameDataPayload) return null;

    const gameRef = push(ref(db, 'games'));
    const gameId = gameRef.key;
    if (!gameId) return null;

    const initialGameData = {
        id: gameId,
        type: gameType,
        status: 'starting',
        createdAt: serverTimestamp(),
        ...gameDataPayload,
        players: {
            [challengerId]: { id: challengerId, name: "Rakip", score: 0, lives: 3, status: 'playing' }, 
            [myPlayer.id]: { id: myPlayer.id, name: myPlayer.name, score: 0, lives: 3, status: 'playing' }
        }
    };
    await set(gameRef, initialGameData);

    const inviteRef = ref(db, `invites/${myPlayer.id}/${challengerId}`);
    await update(inviteRef, { status: 'accepted', gameId: gameId });

    return gameId;
};

// --- NOTIFICATIONS ---

export const listenForPokes = (userId: string, callback: (senderName: string) => void) => {
    const pokesRef = ref(db, `pokes/${userId}`);
    const unsub = onChildAdded(pokesRef, (snapshot) => {
        const poke = snapshot.val();
        if (poke && poke.senderName) {
            callback(poke.senderName);
            remove(snapshot.ref);
        }
    });
    return () => off(pokesRef, 'child_added', unsub);
};

export const sendPoke = async (targetId: string, sender: { name: string }) => {
    const pokeRef = push(ref(db, `pokes/${targetId}`));
    await set(pokeRef, { senderName: sender.name, timestamp: serverTimestamp() });
};

// --- LEADERBOARDS ---

export const saveRapQuizScore = async (userId: string, name: string, score: number) => {
    const userScoreRef = ref(db, `leaderboards/rapquiz/${userId}`);
    await set(userScoreRef, { name, score, timestamp: serverTimestamp() });
};

export const getRapQuizLeaderboard = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
    try {
        const lbRef = query(ref(db, 'leaderboards/rapquiz'), orderByChild('score'), limitToLast(limit));
        const snapshot = await get(lbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.entries(data).map(([uid, val]: any) => ({ uid, ...val })).sort((a: any, b: any) => b.score - a.score);
        }
        return [];
    } catch (e) { return []; }
};

// Helper for snapshot processing
const processLeaderboardSnapshot = (snapshot: any): OnlineUser[] => {
    const sortedList: OnlineUser[] = [];
    snapshot.forEach((childSnapshot: any) => {
        const userData = childSnapshot.val();
        if (userData) {
            sortedList.push({
                uid: childSnapshot.key as string,
                name: userData.name || "Anonim",
                monthly_listeners: userData.monthly_listeners || 0,
                respect: Number(userData.respect) || 0,
                level: userData.level || 1,
                lastActive: userData.lastActive || 0,
                appearance: userData.appearance
            });
        }
    });
    // Sort descending by respect
    return sortedList.sort((a, b) => b.respect - a.respect);
};

// GLOBAL LEADERBOARD BASED ON RESPECT (KUPA)
export const getGlobalLeaderboard = async (limit: number = 100): Promise<OnlineUser[]> => {
    try {
        console.log("Fetching Leaderboard from public_users...");
        
        if (!navigator.onLine) {
            console.warn("Offline, cannot fetch leaderboard");
            return [];
        }

        const dbRef = ref(db, 'public_users');

        // 1. Try Optimized Server-Side Sort
        try {
            const lbQuery = query(dbRef, orderByChild('respect'), limitToLast(limit));
            const snapshot = await get(lbQuery);
            if (snapshot.exists()) {
                return processLeaderboardSnapshot(snapshot);
            }
            return [];
        } catch (e: any) {
            // 2. Fallback: Missing Index Error
            // If the index isn't defined, fetch the last N items (ordered by key/date) and sort client-side.
            // This ensures the app doesn't break while rules are being updated.
            if (e.message && (e.message.includes("Index not defined") || e.code === "PERMISSION_DENIED")) {
                console.warn("⚠️ Firebase Index Warning: Falling back to client-side sorting.");
                try {
                    const fallbackQuery = query(dbRef, limitToLast(limit));
                    const snapshot = await get(fallbackQuery);
                    if (snapshot.exists()) {
                        return processLeaderboardSnapshot(snapshot);
                    }
                } catch (fallbackErr) {
                    console.error("Fallback Fetch Error:", fallbackErr);
                }
            } else {
                throw e; // Rethrow other errors
            }
            return [];
        }
    } catch (e) { 
        console.error("Leaderboard Fetch Critical Error:", e);
        return []; 
    }
};
