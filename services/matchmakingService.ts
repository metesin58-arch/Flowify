
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { handleFirestoreError, OperationType } from './errorService';
import { fetchSongs, generateGameSequence, generateTriviaQuestions, searchSongs } from './musicService';
import { SongTrack, LeaderboardEntry, OnlineUser } from '../types';

// --- OFFLINE / STUDIO PROGRESSION ---

export const addMonthlyListeners = async (userId: string, amount: number) => {
    if (amount <= 0) return;
    const statsRef = doc(db, 'users', userId, 'stats', 'current');
    const publicRef = doc(db, 'public_users', userId);
    
    const batch = writeBatch(db);
    batch.update(statsRef, { monthly_listeners: increment(amount) });
    batch.update(publicRef, { 
        monthly_listeners: increment(amount),
        lastActive: serverTimestamp()
    });
    try {
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_listeners_update');
    }
};

// --- RESPECT SYSTEM (THE CORE TROPHY LOGIC) ---

export const updatePlayerRespect = async (userId: string, amount: number): Promise<number> => {
    console.log(`🏆 RESPECT UPDATE: User ${userId} (${amount > 0 ? '+' : ''}${amount})`);

    const statsRef = doc(db, 'users', userId, 'stats', 'current');
    const publicRef = doc(db, 'public_users', userId);

    const batch = writeBatch(db);
    batch.update(statsRef, { respect: increment(amount) });
    batch.update(publicRef, { respect: increment(amount) });

    try {
        await batch.commit();
        return amount;
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_respect_update');
        return 0;
    }
};

// --- FLOWX GLOBAL FEED ---

export const sendGlobalPost = async (userId: string, author: string, content: string, avatarIndex: number) => {
    const postsRef = collection(db, 'global_feed');
    try {
        await addDoc(postsRef, {
            uid: userId,
            author: author,
            content: content,
            avatarIndex: avatarIndex,
            timestamp: serverTimestamp(),
            likes: 0
        });
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, postsRef.path);
    }
};

export const listenForGlobalPosts = (callback: (post: any) => void) => {
    const postsRef = query(collection(db, 'global_feed'), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(postsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                callback({ id: change.doc.id, ...data });
            }
        });
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'global_feed');
    });
};

// --- GAMEPLAY SYNC ---

export const updateScore = async (gameId: string, playerId: string, newScore: number, newLives: number = 3) => {
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    try {
        await updateDoc(playerRef, { score: newScore, lives: newLives });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, playerRef.path);
    }
};

export const setPlayerFinished = async (gameId: string, playerId: string, finalScore: number) => {
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    try {
        await updateDoc(playerRef, { 
            status: 'finished',
            score: finalScore 
        });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, playerRef.path);
    }
};

export const setPlayerGameOver = async (gameId: string, playerId: string) => {
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    try {
        await updateDoc(playerRef, { status: 'gameover' });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, playerRef.path);
    }
};

// --- DISS / TAUNT SYSTEM ---

export const sendTaunt = async (gameId: string, targetId: string, msg: string) => {
    const tauntsRef = collection(db, 'games', gameId, 'taunts');
    try {
        await addDoc(tauntsRef, { targetId, msg, timestamp: serverTimestamp() });
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, tauntsRef.path);
    }
};

export const listenForTaunts = (gameId: string, myId: string, callback: (msg: string) => void) => {
    const tauntsRef = query(collection(db, 'games', gameId, 'taunts'), where('targetId', '==', myId));
    return onSnapshot(tauntsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const val = change.doc.data();
                callback(val.msg);
                try {
                    await deleteDoc(change.doc.ref); // Consume event
                } catch (e) {
                    handleFirestoreError(e, OperationType.DELETE, change.doc.ref.path);
                }
            }
        });
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'taunts');
    });
};

// --- LOBBY & PRESENCE SYSTEM ---

export const joinLobby = async (gameType: string, player: { id: string, name: string, fans: number, level: number }) => {
    // Clear old invites
    const invitesRef = collection(db, 'invites', player.id, 'received');
    const invitesSnap = await getDocs(invitesRef);
    const batch = writeBatch(db);
    invitesSnap.forEach(doc => batch.delete(doc.ref));
    
    const lobbyRef = doc(db, 'lobbies', gameType, 'players', player.id);
    batch.set(lobbyRef, {
        name: player.name,
        level: player.level,
        status: 'idle',
        lastActive: serverTimestamp()
    });
    try {
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_lobby_join');
    }
};

export const leaveLobby = async (gameType: string, playerId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'lobbies', gameType, 'players', playerId));
    
    const invitesRef = collection(db, 'invites', playerId, 'received');
    const invitesSnap = await getDocs(invitesRef);
    invitesSnap.forEach(doc => batch.delete(doc.ref));
    
    try {
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_lobby_leave');
    }
};

// --- INVITE SYSTEM ---

export const sendInvite = async (targetId: string, challenger: { id: string, name: string }, gameType: string, category?: any) => {
    const inviteRef = doc(db, 'invites', targetId, 'received', challenger.id);
    try {
        await setDoc(inviteRef, {
            challengerName: challenger.name,
            gameType: gameType,
            status: 'pending',
            timestamp: serverTimestamp(),
            category: category || null
        });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, inviteRef.path);
    }
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
            songs = await searchSongs(category.query, 60, true);
        } else {
            songs = await fetchSongs();
        }
    } catch(e) { console.error(e); }
    
    if (!songs || songs.length < 5) return null;

    let gameDataPayload: any = {};
    if (gameType === 'higherlower') {
        gameDataPayload = { sequence: generateGameSequence(songs) };
    } else if (gameType === 'trivia' || gameType === 'coverguess') {
        gameDataPayload = { questions: generateTriviaQuestions(songs, 10) };
    } else if (gameType === 'flowbattle') {
        const randSong = songs[0];
        gameDataPayload = { bpm: 100 + Math.floor(Math.random() * 30), songUrl: randSong.previewUrl };
    }

    if (!gameDataPayload) return null;

    const gameRef = doc(collection(db, 'games'));
    const gameId = gameRef.id;

    const initialGameData = {
        id: gameId,
        type: gameType,
        status: 'starting',
        createdAt: serverTimestamp(),
        ...gameDataPayload
    };
    
    const batch = writeBatch(db);
    batch.set(gameRef, initialGameData);
    
    // Add players as subcollection
    const challengerRef = doc(db, 'games', gameId, 'players', challengerId);
    const myRef = doc(db, 'games', gameId, 'players', myPlayer.id);
    
    batch.set(challengerRef, { id: challengerId, name: "Rakip", score: 0, lives: 3, status: 'playing' });
    batch.set(myRef, { id: myPlayer.id, name: myPlayer.name, score: 0, lives: 3, status: 'playing' });

    const inviteRef = doc(db, 'invites', myPlayer.id, 'received', challengerId);
    batch.update(inviteRef, { status: 'accepted', gameId: gameId });

    try {
        await batch.commit();
        return gameId;
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_invite_accept');
        return null;
    }
};

// --- NOTIFICATIONS ---

export const listenForPokes = (userId: string, callback: (senderName: string) => void) => {
    const pokesRef = collection(db, 'pokes', userId, 'received');
    return onSnapshot(pokesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const poke = change.doc.data();
                if (poke && poke.senderName) {
                    callback(poke.senderName);
                    try {
                        await deleteDoc(change.doc.ref);
                    } catch (e) {
                        handleFirestoreError(e, OperationType.DELETE, change.doc.ref.path);
                    }
                }
            }
        });
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, pokesRef.path);
    });
};

export const sendPoke = async (targetId: string, sender: { name: string }) => {
    const pokesRef = collection(db, 'pokes', targetId, 'received');
    try {
        await addDoc(pokesRef, { senderName: sender.name, timestamp: serverTimestamp() });
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, pokesRef.path);
    }
};

// --- DIRECT MESSAGING (INSTAFLOW DMs) ---

export const sendDirectMessage = async (fromId: string, toId: string, author: string, content: string) => {
    const chatId = [fromId, toId].sort().join('_');
    const chatRef = collection(db, 'direct_messages', chatId, 'messages');
    
    const batch = writeBatch(db);
    
    const newMessageRef = doc(chatRef);
    batch.set(newMessageRef, {
        fromId,
        author,
        content,
        timestamp: serverTimestamp(),
        read: false
    });

    const myChatRef = doc(db, 'user_chats', fromId, 'conversations', toId);
    const otherChatRef = doc(db, 'user_chats', toId, 'conversations', fromId);
    
    const summaryData = {
        lastMessage: content,
        lastAuthor: author,
        timestamp: serverTimestamp()
    };
    
    batch.set(myChatRef, { ...summaryData, unread: false }, { merge: true });
    batch.set(otherChatRef, { ...summaryData, unread: true }, { merge: true });
    
    try {
        await batch.commit();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'batch_direct_message');
    }
};

export const listenForDirectMessages = (fromId: string, toId: string, callback: (msg: any) => void) => {
    const chatId = [fromId, toId].sort().join('_');
    const chatRef = query(collection(db, 'direct_messages', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    
    return onSnapshot(chatRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                callback({ id: change.doc.id, ...data });
            }
        });
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'direct_messages');
    });
};

export const markChatAsRead = async (myId: string, otherId: string) => {
    const chatRef = doc(db, 'user_chats', myId, 'conversations', otherId);
    try {
        await updateDoc(chatRef, { unread: false });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, chatRef.path);
    }
};

export const listenForUserChats = (myId: string, callback: (chats: any) => void) => {
    const chatsRef = collection(db, 'user_chats', myId, 'conversations');
    return onSnapshot(chatsRef, (snapshot) => {
        const chats: any = {};
        snapshot.forEach(doc => {
            chats[doc.id] = doc.data();
        });
        callback(chats);
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, chatsRef.path);
    });
};

// --- LEADERBOARDS ---

export const saveRapQuizScore = async (userId: string, name: string, score: number) => {
    const userScoreRef = doc(db, 'leaderboards', 'rapquiz', 'scores', userId);
    try {
        await setDoc(userScoreRef, { name, score, timestamp: serverTimestamp() });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, userScoreRef.path);
    }
};

export const saveSongGuessScore = async (userId: string, name: string, score: number) => {
    const userScoreRef = doc(db, 'leaderboards', 'songguess', 'scores', userId);
    try {
        await setDoc(userScoreRef, { name, score, timestamp: serverTimestamp() });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, userScoreRef.path);
    }
};

export const getRapQuizLeaderboard = async (limitCount: number = 20): Promise<LeaderboardEntry[]> => {
    try {
        const lbRef = query(collection(db, 'leaderboards', 'rapquiz', 'scores'), orderBy('score', 'desc'), limit(limitCount));
        const snapshot = await getDocs(lbRef);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as LeaderboardEntry));
    } catch (e) { return []; }
};

// GLOBAL LEADERBOARD BASED ON RESPECT (KUPA)
export const getGlobalLeaderboard = async (limitCount: number = 100): Promise<OnlineUser[]> => {
    try {
        console.log("Fetching Leaderboard from public_users...");
        
        if (!navigator.onLine) {
            console.warn("Offline, cannot fetch leaderboard");
            return [];
        }

        const lbQuery = query(collection(db, 'public_users'), orderBy('respect', 'desc'), limit(limitCount));
        const snapshot = await getDocs(lbQuery);
        
        return snapshot.docs.map(doc => {
            const userData = doc.data();
            return {
                uid: doc.id,
                name: userData.name || "Anonim",
                monthly_listeners: userData.monthly_listeners || 0,
                respect: Number(userData.respect) || 0,
                level: userData.level || 1,
                lastActive: userData.lastActive?.toMillis?.() || 0,
                appearance: userData.appearance
            } as OnlineUser;
        });
    } catch (e) { 
        console.error("Leaderboard Fetch Critical Error:", e);
        return []; 
    }
};

export const listenForOnlineCount = (callback: (count: number) => void) => {
    const usersRef = collection(db, 'public_users');
    return onSnapshot(usersRef, (snapshot) => {
        const now = Date.now();
        let activeCount = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const lastActive = data.lastActive?.toMillis?.() || 0;
            if (lastActive && (now - lastActive < 120000)) {
                activeCount++;
            }
        });
        callback(activeCount);
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, usersRef.path);
    });
};
