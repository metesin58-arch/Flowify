import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { OnlineUser, PlayerStats } from '../types';
import { HEAD_OPTIONS } from '../constants';
import { GlobeIcon, SearchIcon } from './Icons';
import { followUser, unfollowUser, isFollowing } from '../services/socialService';
import { UserProfile } from './UserProfile';

interface SocialHubProps {
  player: PlayerStats;
  uid: string;
  onBack?: () => void;
}

export const SocialHub: React.FC<SocialHubProps> = ({ player, uid, onBack }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: any;
    const initPresence = async () => {
      try {
        const allUsersRef = collection(db, 'public_users');
        const q = query(allUsersRef, orderBy('monthly_listeners', 'desc'), limit(50));
        
        unsubscribe = onSnapshot(q, async (snapshot) => {
          const list: OnlineUser[] = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to number if needed
            const lastActive = data.lastActive instanceof Timestamp ? data.lastActive.toMillis() : data.lastActive;
            return { ...data, lastActive } as OnlineUser;
          });
          
          const now = Date.now();
          // Filter users active in the last 10 minutes
          const activeList = list.filter(u => now - u.lastActive < 600000);
          setOnlineUsers(activeList);

          // Check following status for each user
          const map: Record<string, boolean> = {};
          for (const u of activeList) {
            if (u.uid !== uid) {
              map[u.uid] = await isFollowing(uid, u.uid);
            }
          }
          setFollowingMap(map);
        });
      } catch (e) { 
        console.error("Presence Error", e); 
      }
    };

    initPresence();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [uid]);

  const handleFollowToggle = async (e: React.MouseEvent, targetUid: string) => {
    e.stopPropagation();
    if (followingMap[targetUid]) {
      await unfollowUser(uid, targetUid);
      setFollowingMap(prev => ({ ...prev, [targetUid]: false }));
    } else {
      await followUser(uid, targetUid);
      setFollowingMap(prev => ({ ...prev, [targetUid]: true }));
    }
  };

  const filteredUsers = onlineUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-black flex flex-col font-sans overflow-hidden">
        {/* App Header */}
        <div className="shrink-0 bg-transparent pt-6 pb-4 px-6 z-40">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-white/5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter lowercase">aktif sanatçılar<span className="text-purple-500">.</span></h1>
                        <p className="text-[10px] text-neutral-500 font-bold tracking-tight mt-1 lowercase">
                            çevrimiçi lirik lobisi sokak rapçileri
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10 mb-0.5">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-black text-emerald-400 tabular-nums">
                        {onlineUsers.length}
                    </span>
                </div>
            </div>

            {/* Search Bar - Custom Style */}
            <div className="mt-5 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                    <SearchIcon className="w-3.5 h-3.5" />
                </div>
                <input 
                    type="text"
                    placeholder="sanatçı ya da rakip ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/30 transition-all"
                />
            </div>
        </div>

        {/* User List Area */}
        <div className="flex-1 overflow-y-auto px-6 space-y-3.5 no-scrollbar pb-32">
            {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-700">
                    <GlobeIcon className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-xs font-bold tracking-tight lowercase">kimse bulunamadı.</p>
                </div>
            ) : (
                filteredUsers.map((u, idx) => (
                    <div 
                        key={u.uid}
                        onClick={() => setSelectedUserUid(u.uid)}
                        className="group relative bg-[#0a0a0a] p-3.5 rounded-[2rem] flex items-center gap-4 transition-all duration-300 border border-white/5 cursor-pointer active:scale-[0.98] hover:bg-neutral-900 animate-fade-in"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 bg-neutral-950 shadow-xl">
                                <img 
                                    src={HEAD_OPTIONS[u.appearance?.headIndex || 0]} 
                                    className="w-full h-full object-cover" 
                                    alt={u.name}
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_10px_#10b981]" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-bold text-white truncate tracking-tight lowercase">
                                    {u.name.toLowerCase()}
                                </h3>
                                {u.uid === uid && (
                                    <span className="text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-lg font-bold tracking-tight lowercase">sen</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-neutral-500 tracking-tight lowercase">
                                    {u.monthly_listeners.toLocaleString()} dinleyici
                                </span>
                                <span className="text-white/10">•</span>
                                <span className="text-[10px] font-bold text-yellow-500/90 tracking-tight lowercase">
                                    🏆 {u.respect} saygınlık
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {u.uid !== uid && (
                                <button 
                                    onClick={(e) => handleFollowToggle(e, u.uid)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all lowercase ${
                                        followingMap[u.uid] 
                                        ? 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10' 
                                        : 'bg-white text-black font-black hover:scale-[1.02] active:scale-95'
                                    }`}
                                >
                                    {followingMap[u.uid] ? 'takiptesin' : 'takip et'}
                                </button>
                            )}
                            <div className="text-[9px] font-semibold text-neutral-600 tracking-tight lowercase">
                                {u.followersCount || 0} takipçi
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* User Profile Modal */}
        {selectedUserUid && (
            <UserProfile 
                uid={uid} 
                targetUid={selectedUserUid} 
                onClose={() => setSelectedUserUid(null)} 
            />
        )}
    </div>
  );
};
