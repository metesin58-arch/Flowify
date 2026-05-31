import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { joinLobby, leaveLobby, sendInvite, acceptInviteAndCreateGame } from '../services/matchmakingService';
import { UsersIcon, SwordIcon, PlayIcon } from './Icons';
import { playClickSound, playWinSound } from '../services/sfx';
import { GAME_CATEGORIES } from '../constants';

interface GameLobbyProps {
  gameType: 'flowbattle' | 'quiz' | 'higherlower' | 'trivia' | 'coverguess';
  gameName: string;
  playerId: string;
  playerName: string;
  playerFans: number;
  playerLevel: number;
  onGameStart: (gameId: string) => void;
  onExit: () => void;
  updateStat?: (stat: any, amount: number) => void;
}

interface LobbyUser {
  id: string;
  name: string;
  fans: number;
  level: number;
  status: string;
}

interface IncomingInvite {
  fromId: string;
  challengerName: string;
  gameType: string;
  status: 'pending' | 'accepted';
  gameId?: string;
  category?: string; // Optional category
}

export const GameLobby: React.FC<GameLobbyProps> = ({ 
  gameType, gameName, playerId, playerName, playerFans, playerLevel, onGameStart, onExit, updateStat
}) => {
  const [users, setUsers] = useState<LobbyUser[]>([]);
  const [invites, setInvites] = useState<IncomingInvite[]>([]);
  
  const [sentInviteTo, setSentInviteTo] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Category Selection
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [targetUserForInvite, setTargetUserForInvite] = useState<LobbyUser | null>(null);

  useEffect(() => {
    // 1. Join Lobby with Error Handling
    const enterLobby = async () => {
        try {
            await joinLobby(gameType, { id: playerId, name: playerName, fans: playerFans, level: playerLevel });
        } catch (error) {
            console.error("Lobby Join Error (Permission?):", error);
        }
    };
    enterLobby();

    // 2. Listen for Other Users in this Lobby
    const lobbyRef = collection(db, 'lobbies', gameType, 'players');
    const lobbyUnsub = onSnapshot(lobbyRef, (snapshot) => {
      const list: LobbyUser[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as LobbyUser))
        .filter(u => u.id !== playerId);
      setUsers(list);
    }, (error) => {
        console.error("Lobby Listener Error:", error);
    });

    // 3. Listen for Incoming Invites (My Inbox)
    const myInvitesRef = collection(db, 'invites', playerId, 'received');
    const invitesUnsub = onSnapshot(myInvitesRef, (snapshot) => {
       const list: IncomingInvite[] = snapshot.docs.map(doc => ({
           fromId: doc.id,
           ...doc.data()
       } as IncomingInvite));
       
       const pending = list.filter(i => i.status === 'pending');
       
       if (pending.length > 0 && invites.length === 0) {
           playWinSound();
       }
       setInvites(pending);
    });

    return () => {
        leaveLobby(gameType, playerId).catch(e => console.error("Leave Lobby Error:", e));
        lobbyUnsub();
        invitesUnsub();
    };
  }, []);

  // --- SENDER LOGIC ---
  const handleInviteClick = (user: LobbyUser) => {
      playClickSound();
      setTargetUserForInvite(user);
      
      // If Trivia, HigherLower or CoverGuess, allow category selection
      if (gameType === 'trivia' || gameType === 'higherlower' || gameType === 'coverguess') {
          setShowCategorySelect(true);
      } else {
          // Direct Invite for FlowBattle
          proceedToSendInvite(user.id, user.name);
      }
  };

  const confirmCategoryAndInvite = (catId: string) => {
      if (!targetUserForInvite) return;
      playClickSound();
      const selectedCat = GAME_CATEGORIES.find(c => c.id === catId);
      proceedToSendInvite(targetUserForInvite.id, targetUserForInvite.name, selectedCat);
      setShowCategorySelect(false);
      setTargetUserForInvite(null);
  };

  const proceedToSendInvite = async (targetId: string, targetName: string, category?: any) => {
      if (isProcessing) return;
      setSentInviteTo(targetId);
      setIsProcessing(true);
      setStatusMsg(`Davet gönderildi: ${targetName} ${category ? `(${category.label})` : ''}`);

      // 1. Write to THEIR invite box
      try {
          await sendInvite(targetId, { id: playerId, name: playerName }, gameType, category);
      } catch (e) {
          console.error("Invite Send Error:", e);
          setIsProcessing(false);
          setStatusMsg("Hata: Davet gönderilemedi.");
          return;
      }

      // 2. Listen to THAT specific invite for a response
      const responseRef = doc(db, 'invites', targetId, 'received', playerId);
      const unsub = onSnapshot(responseRef, (snapshot) => {
          if (!snapshot.exists()) return;
          const val = snapshot.data();

          if (val.status === 'accepted' && val.gameId) {
              setStatusMsg("Kabul edildi! Oyuna giriliyor...");
              unsub();
              deleteDoc(responseRef).catch(e => console.warn("Delete invite failed", e));
              
              // Deduct Energy for Sender
              if (updateStat) {
                  updateStat('energy', -10); 
              }

              setTimeout(() => {
                  onGameStart(val.gameId);
              }, 500);
          }
      });
  };

  // --- RECEIVER LOGIC ---
  const handleAcceptInvite = async (invite: IncomingInvite) => {
      if (isProcessing) return;
      playClickSound();
      setIsProcessing(true);
      setStatusMsg("Oyun verileri hazırlanıyor...");

      try {
          const gameId = await acceptInviteAndCreateGame(invite.fromId, { id: playerId, name: playerName }, gameType, invite.category);
          
          if (gameId) {
              setStatusMsg("Başlatılıyor...");
              
              // Deduct Energy for Receiver
              if (updateStat) {
                  updateStat('energy', -10);
              }

              setTimeout(() => {
                  onGameStart(gameId);
              }, 500);
          } else {
              setIsProcessing(false);
              setStatusMsg("Hata: Veri alınamadı veya bağlantı koptu.");
          }
      } catch (e) {
          console.error(e);
          setIsProcessing(false);
          setStatusMsg("Bağlantı hatası.");
      }
  };

  const cancelInvite = async () => {
    if (!sentInviteTo) return;
    setIsProcessing(false);
    const inviteRef = doc(db, 'invites', sentInviteTo, 'received', playerId);
    await deleteDoc(inviteRef).catch(e => console.warn("Cancel invite failed", e));
    setSentInviteTo(null);
    setStatusMsg("");
  };

  return (
    <div className="h-full bg-black flex flex-col relative font-sans overflow-hidden text-white select-none">
        
        {/* Subtle decorative grid and breathing glow backgrounds */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-neutral-800/10 rounded-full blur-[150px]"></div>
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        </div>

        {/* Dynamic header row layout */}
        <div className="px-6 pt-12 pb-6 relative z-10 flex justify-between items-center shrink-0">
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                    <span className="text-[9px] font-black text-neutral-400 lowercase tracking-tighter leading-none">canlı lobi</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tighter lowercase leading-none">{gameName}</h1>
                <p className="text-[10px] font-bold text-neutral-500 lowercase tracking-tighter">{users.length} bağlı mc</p>
            </div>
            
            <button 
                onClick={onExit} 
                className="w-10 h-10 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/10 transition-all active:scale-95 shadow-md"
            >
                <span className="text-sm font-bold">✕</span>
            </button>
        </div>

        {/* CATEGORY SELECT MODAL */}
        <AnimatePresence>
            {showCategorySelect && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="fixed inset-0 z-[250] bg-black/98 backdrop-blur-3xl flex flex-col font-sans"
                >
                    <div className="pt-12 px-6 pb-6 shrink-0 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter lowercase mb-0.5">kategori seç.</h2>
                            <p className="text-neutral-500 text-[9px] font-black lowercase tracking-tighter">meydan okuma türünü belirle</p>
                        </div>
                        <button 
                            onClick={() => setShowCategorySelect(false)} 
                            className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-400"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-safe no-scrollbar">
                        {GAME_CATEGORIES.map((cat, idx) => {
                            return (
                                <motion.button
                                    key={cat.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => confirmCategoryAndInvite(cat.id)}
                                    className="w-full bg-neutral-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group transition-all hover:border-[#1ed760]/30"
                                >
                                    <div className="text-left">
                                        <div className="text-white font-black text-sm lowercase tracking-tighter group-hover:text-[#1ed760] transition-colors leading-tight">
                                            {cat.label}
                                        </div>
                                        <div className="text-neutral-500 text-[8px] font-black lowercase tracking-tighter mt-0.5">
                                            düelloyu başlat
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-black group-hover:bg-white transition-all">
                                        <PlayIcon className="w-3 h-3 ml-0.5 fill-current" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* PROCESSING OVERLAY */}
        <AnimatePresence>
            {isProcessing && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center flex-col p-8"
                >
                    <div className="relative mb-8">
                        <div className="w-16 h-16 border-2 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 w-16 h-16 border-t-2 border-[#1ed760] rounded-full animate-spin"></div>
                    </div>
                    
                    <div className="text-white font-black text-md tracking-tighter text-center lowercase leading-normal max-w-xs">{statusMsg}</div>
                    
                    {sentInviteTo && (
                        <button 
                            onClick={cancelInvite}
                            className="mt-8 bg-neutral-900 text-red-500 text-[10px] font-black lowercase tracking-tighter px-8 py-3 rounded-xl border border-red-500/10 hover:bg-neutral-800 transition-all"
                        >
                            iptal et
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* INCOMING INVITES CUSTOM MODAL OVERLAY */}
        <AnimatePresence>
            {invites.length > 0 && !isProcessing && (
                <div className="fixed inset-0 z-[350] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
                     <motion.div 
                         initial={{ scale: 0.98, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0.98, opacity: 0 }}
                         className="w-full max-w-xs bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
                     >
                         {/* Header accent blur */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#1ed760]/5 blur-[40px] rounded-full pointer-events-none"></div>
                         
                         {/* Challenge Ring Graphic */}
                         <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
                             <SwordIcon className="w-4 h-4 text-white animate-pulse" />
                             {/* Scanner ping */}
                             <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30"></div>
                         </div>
                         
                         <p className="text-[8px] font-black text-[#1ed760] tracking-[0.2em] lowercase mb-1">MEYDAN OKUMA TALEBİ</p>
                         <h3 className="text-lg font-black text-white lowercase tracking-tighter max-w-[200px] truncate leading-none mb-1">
                             {invites[0].challengerName}
                         </h3>
                         <p className="text-[9px] text-neutral-500 font-bold lowercase tracking-tighter mb-6">
                             {invites[0].category ? `${(invites[0] as any).category.label} kategorisinde` : '1v1 canlı düello istiyor'}
                         </p>

                         {/* Action Buttons */}
                         <div className="flex flex-col gap-1.5 w-full">
                             <motion.button 
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => handleAcceptInvite(invites[0])}
                                 className="w-full py-3 rounded-2xl bg-white text-black font-black text-[10px] lowercase tracking-tighter shadow-lg transition-all"
                             >
                                 kabul et
                             </motion.button>
                             <motion.button 
                                 whileTap={{ scale: 0.98 }}
                                 onClick={async () => {
                                     playClickSound();
                                     const inviteRef = doc(db, 'invites', playerId, 'received', invites[0].fromId);
                                     await deleteDoc(inviteRef).catch(e => console.warn(e));
                                 }}
                                 className="w-full py-3 rounded-2xl bg-neutral-800 text-neutral-400 hover:text-white font-black text-[10px] lowercase tracking-tighter border border-white/5 transition-all"
                             >
                                 reddet
                             </motion.button>
                         </div>
                     </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ELEVATED MINIMAL USER LIST */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-24 px-6 relative z-10 no-scrollbar">
            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                        <UsersIcon className="w-6 h-6 text-neutral-700 animate-pulse" />
                    </div>
                    <p className="font-black text-neutral-500 text-[10px] lowercase tracking-tighter">lobi şu an sakin.</p>
                    <p className="text-[9px] mt-1 text-neutral-600 font-bold lowercase tracking-tighter">meydan okumak için rakip kullanıcıların gelmesi bekleniyor</p>
                </div>
            ) : (
                users.map((user, idx) => (
                    <motion.div 
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-neutral-900/40 border border-white/5 p-3 rounded-2xl flex items-center justify-between group transition-all hover:bg-neutral-900/60"
                    >
                        <div className="flex items-center gap-3.5 overflow-hidden">
                            <div className="w-9 h-9 bg-neutral-800 border border-white/5 rounded-xl flex items-center justify-center font-black text-xs text-neutral-400 uppercase">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-black text-white text-sm lowercase tracking-tighter truncate leading-none mb-0.5">{user.name}</div>
                                <div className="flex items-center gap-1.5 h-3">
                                    <span className="text-[9px] text-[#1ed760] font-black lowercase tracking-tighter">lv. {user.level}</span>
                                    <div className="w-[1.5px] h-[1.5px] rounded-full bg-neutral-600"></div>
                                    <span className="text-[9px] text-neutral-500 font-bold lowercase tracking-tighter">{(user.fans ?? 0).toLocaleString()} hayran</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleInviteClick(user)}
                            disabled={isProcessing}
                            className="bg-white hover:bg-neutral-100 text-black px-3.5 py-1.5 rounded-xl font-black text-[10px] lowercase tracking-tighter transition-all flex items-center gap-1 active:scale-95 shadow"
                        >
                            <SwordIcon className="w-3 h-3 text-black shrink-0 animate-pulse" />
                            düello
                        </button>
                    </motion.div>
                ))
            )}
        </div>
    </div>
  );
};
