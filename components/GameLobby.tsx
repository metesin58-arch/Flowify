
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, off } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { joinLobby, leaveLobby, sendInvite, acceptInviteAndCreateGame } from '../services/matchmakingService';
import { UsersIcon, SwordIcon, PlayIcon } from './Icons';
import { playClickSound, playWinSound } from '../services/sfx';
import { GAME_CATEGORIES } from '../constants';

interface GameLobbyProps {
  gameType: 'flowbattle' | 'quiz' | 'higherlower' | 'trivia';
  gameName: string;
  playerId: string;
  playerName: string;
  playerFans: number;
  playerLevel: number;
  onGameStart: (gameId: string) => void;
  onExit: () => void;
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
  gameType, gameName, playerId, playerName, playerFans, playerLevel, onGameStart, onExit 
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
            alert("Lobiye giriş yapılamadı. İnternet bağlantını kontrol et.");
        }
    };
    enterLobby();

    // 2. Listen for Other Users in this Lobby
    const lobbyRef = ref(db, `lobbies/${gameType}`);
    const lobbyUnsub = onValue(lobbyRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: LobbyUser[] = Object.entries(val).map(([key, data]: any) => ({
          id: key,
          ...data
        })).filter((u: LobbyUser) => u.id !== playerId); // Exclude self
        setUsers(list);
      } else {
        setUsers([]);
      }
    }, (error) => {
        console.error("Lobby Listener Error:", error);
        // Permission denied ise burası çalışır
    });

    // 3. Listen for Incoming Invites (My Inbox)
    const myInvitesRef = ref(db, `invites/${playerId}`);
    const invitesUnsub = onValue(myInvitesRef, (snapshot) => {
       const val = snapshot.val();
       if (val) {
           const list: IncomingInvite[] = Object.entries(val).map(([key, data]: any) => ({
               fromId: key,
               ...data
           }));
           const pending = list.filter(i => i.status === 'pending');
           
           if (pending.length > 0 && invites.length === 0) {
               playWinSound();
           }
           setInvites(pending);
       } else {
           setInvites([]);
       }
    });

    return () => {
        leaveLobby(gameType, playerId).catch(e => console.error("Leave Lobby Error:", e));
        off(lobbyRef);
        off(myInvitesRef);
        if (sentInviteTo) {
             off(ref(db, `invites/${sentInviteTo}/${playerId}`));
        }
    };
  }, []);

  // --- SENDER LOGIC ---
  
  const handleInviteClick = (user: LobbyUser) => {
      playClickSound();
      setTargetUserForInvite(user);
      
      // If Trivia or HigherLower, allow category selection
      if (gameType === 'trivia' || gameType === 'higherlower') {
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
      const responseRef = ref(db, `invites/${targetId}/${playerId}`);
      
      onValue(responseRef, (snapshot) => {
          const val = snapshot.val();
          if (!val) return; 

          if (val.status === 'accepted' && val.gameId) {
              setStatusMsg("Kabul edildi! Oyuna giriliyor...");
              off(responseRef);
              remove(responseRef);
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

  return (
    <div className="h-full bg-black flex flex-col p-6 relative font-sans">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-safe-top mt-safe">
            <div>
                <div className="flex items-center gap-2 text-[#1ed760] mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Lobi: {users.length} Kişi</span>
                </div>
                <h1 className="text-3xl font-black text-white italic">{gameName}</h1>
            </div>
            <button onClick={onExit} className="w-10 h-10 rounded-full bg-[#222] text-white font-bold flex items-center justify-center border border-white/10">✕</button>
        </div>

        {/* CATEGORY SELECT MODAL (Redesigned) */}
        {showCategorySelect && (
            <div className="fixed inset-0 z-[250] bg-black flex flex-col p-6 animate-fade-in font-sans">
                <div className="pt-safe-top px-2 pb-6 shrink-0">
                    <button onClick={() => setShowCategorySelect(false)} className="mb-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">✕</button>
                    <h2 className="text-3xl font-black text-white italic mb-1">KATEGORİ SEÇ</h2>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Rakibine meydan oku</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pb-safe custom-scrollbar">
                    {GAME_CATEGORIES.map((cat, idx) => {
                        const hue = (idx * 45) % 360;
                        const gradient = `linear-gradient(135deg, hsl(${hue}, 60%, 20%), hsl(${hue}, 60%, 5%))`;
                        
                        return (
                            <button
                                key={cat.id}
                                onClick={() => confirmCategoryAndInvite(cat.id)}
                                className="w-full bg-[#181818] hover:bg-[#282828] p-3 rounded-md flex items-center gap-4 group transition-all active:scale-[0.98] border border-transparent hover:border-[#1ed760]/20"
                            >
                                <div 
                                    className="w-12 h-12 rounded bg-[#333] shadow-lg flex items-center justify-center shrink-0 font-black text-white/20 text-lg"
                                    style={{ background: gradient }}
                                >
                                    {cat.label.charAt(0)}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="text-white font-bold text-sm truncate group-hover:text-[#1ed760] transition-colors leading-tight">
                                        {cat.label}
                                    </div>
                                    <div className="text-neutral-500 text-[10px] font-medium mt-0.5 truncate">
                                        Davet Gönder
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayIcon className="w-3 h-3 ml-0.5" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* PROCESSING OVERLAY */}
        {isProcessing && (
            <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center flex-col">
                <div className="w-16 h-16 border-4 border-[#1ed760] border-t-transparent rounded-full animate-spin mb-6"></div>
                <div className="text-white font-black text-xl animate-pulse tracking-widest text-center px-4">{statusMsg}</div>
                {sentInviteTo && (
                    <button 
                        onClick={() => { 
                            setIsProcessing(false); 
                            remove(ref(db, `invites/${sentInviteTo}/${playerId}`));
                            setSentInviteTo(null); 
                            setStatusMsg(""); 
                        }}
                        className="mt-8 text-red-500 text-xs font-bold border border-red-500/50 px-6 py-3 rounded-full hover:bg-red-900/20"
                    >
                        İPTAL ET
                    </button>
                )}
            </div>
        )}

        {/* INCOMING INVITES TOAST */}
        {invites.length > 0 && !isProcessing && (
            <div className="fixed top-24 left-0 right-0 z-[100] px-4 animate-slide-in pointer-events-none">
                <div className="bg-[#1a1a1a] border border-[#1ed760] rounded-xl p-4 shadow-[0_0_30px_rgba(30,215,96,0.2)] pointer-events-auto flex items-center gap-4">
                     <div className="w-10 h-10 bg-[#1ed760]/20 rounded-full flex items-center justify-center shrink-0">
                         <SwordIcon className="w-5 h-5 text-[#1ed760]" />
                     </div>
                     <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold text-white truncate">{invites[0].challengerName}</div>
                         <div className="text-xs text-neutral-400">
                             {invites[0].category ? `${(invites[0] as any).category.label} kapışması!` : 'Seni kapışmaya çağırıyor!'}
                         </div>
                     </div>
                     <button 
                        onClick={() => handleAcceptInvite(invites[0])}
                        className="bg-[#1ed760] hover:bg-[#1db954] text-black font-bold px-4 py-2 rounded-lg text-xs shrink-0"
                     >
                         KABUL ET
                     </button>
                </div>
            </div>
        )}

        {/* USER LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
            {users.length === 0 ? (
                <div className="text-center py-20 text-neutral-600">
                    <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">Lobi Boş</p>
                    <p className="text-xs mt-2 opacity-50">Arkadaşına "Online" olmasını söyle.</p>
                </div>
            ) : (
                users.map(user => (
                    <div key={user.id} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-[#1ed760]/50 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg flex items-center justify-center font-bold text-white text-sm border border-white/5">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-white text-sm truncate">{user.name}</div>
                                <div className="text-[10px] text-neutral-500 font-bold">LVL {user.level} • {user.fans} FAN</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleInviteClick(user)}
                            disabled={isProcessing}
                            className="bg-white text-black font-black px-5 py-2 rounded-lg text-xs flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
                        >
                            <SwordIcon className="w-3 h-3" />
                            DAVET
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
