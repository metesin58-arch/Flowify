
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { sendGlobalPost, listenForGlobalPosts } from '../services/matchmakingService';
import { PlayerStats, OnlineUser } from '../types';
import { FAKE_POSTS, HEAD_OPTIONS } from '../constants';
import { playClickSound } from '../services/sfx';
import { SendIcon, MicIcon, CheckIcon, GlobeIcon } from './Icons';

interface SocialHubProps {
  player: PlayerStats;
  uid: string;
}

const STORY_NAMES = ['MC Gölge', 'Lil Vibe', 'DJ Venom', 'Rap Lord', 'Flow King', 'Beat Master', 'Young G', 'Kara Ritim', 'Sokak Şairi'];

const DYNAMIC_CONTENTS = [
    "Stüdyoda yeni işler peşindeyiz... 🎤 #studio",
    "Bu beat çok fena oldu! 🔥",
    "Konser biletleri tükenmek üzere!",
    "Yeraltından selamlar.",
    "Flowify'da zirveye oynuyorum.",
    "Yeni albüm yolda, beklemede kalın.",
    "Sokaklar bizimdir.",
    "Mikrofonu verin bana!",
    "Bugün modum efsane."
];

interface Post {
    id: string | number;
    author: string;
    handle: string;
    avatarUrl: string;
    content: string;
    likes: number;
    retweets: number;
    replies: number;
    isLiked: boolean;
    time: string;
    isVerified?: boolean;
    isPlayer?: boolean;
}

export const SocialHub: React.FC<SocialHubProps> = ({ player, uid }) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'online'>('feed');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [botPosts, setBotPosts] = useState<Post[]>([]);
  const [realPosts, setRealPosts] = useState<Post[]>([]);

  useEffect(() => {
      const posts: Post[] = FAKE_POSTS.map((p, i) => ({
          id: i + 100,
          author: p.author,
          handle: `@${p.author.toLowerCase().replace(/\s/g, '')}`,
          avatarUrl: HEAD_OPTIONS[i % HEAD_OPTIONS.length],
          content: p.content,
          likes: Math.floor(Math.random() * 5000) + 100,
          retweets: Math.floor(Math.random() * 500),
          replies: Math.floor(Math.random() * 200),
          isLiked: false,
          time: `${Math.floor(Math.random() * 10) + 1}s`,
          isVerified: Math.random() > 0.5
      }));
      setBotPosts(posts);
  }, []);

  useEffect(() => {
      const interval = setInterval(() => {
          const randomName = STORY_NAMES[Math.floor(Math.random() * STORY_NAMES.length)];
          const randomContent = DYNAMIC_CONTENTS[Math.floor(Math.random() * DYNAMIC_CONTENTS.length)];
          const randomHead = HEAD_OPTIONS[Math.floor(Math.random() * HEAD_OPTIONS.length)];
          
          const newPost: Post = {
              id: `bot_${Date.now()}`,
              author: randomName,
              handle: `@${randomName.toLowerCase().replace(/\s/g, '')}`,
              avatarUrl: randomHead,
              content: randomContent,
              likes: Math.floor(Math.random() * 100),
              retweets: Math.floor(Math.random() * 10),
              replies: Math.floor(Math.random() * 5),
              isLiked: false,
              time: 'Şimdi',
              isVerified: Math.random() > 0.7
          };

          setBotPosts(prev => [newPost, ...prev.slice(0, 40)]); 
      }, 45000); 

      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      const unsub = listenForGlobalPosts((data) => {
          setRealPosts(prev => {
              if (prev.some(p => p.id === data.id)) return prev;
              
              const newRealPost: Post = {
                  id: data.id,
                  author: data.author,
                  handle: `@${data.author.toLowerCase().replace(/\s/g, '')}`,
                  avatarUrl: HEAD_OPTIONS[data.avatarIndex || 0],
                  content: data.content,
                  likes: data.likes || 0,
                  retweets: 0,
                  replies: 0,
                  isLiked: false,
                  time: 'Yeni',
                  isVerified: true,
                  isPlayer: true
              };
              return [newRealPost, ...prev];
          });
      });
      return () => unsub();
  }, []);

  useEffect(() => {
      const combined = [...realPosts, ...botPosts].sort((a, b) => {
          if (a.time === 'Yeni' && b.time !== 'Yeni') return -1;
          if (b.time === 'Yeni' && a.time !== 'Yeni') return 1;
          return 0; 
      });
      setFeed(combined);
  }, [realPosts, botPosts]);

  useEffect(() => {
    let unsubscribe: any;
    const initPresence = async () => {
      try {
        const allUsersRef = ref(db, 'public_users');
        unsubscribe = onValue(allUsersRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
             const list: OnlineUser[] = Object.values(val);
             const now = Date.now();
             const activeList = list.filter(u => now - u.lastActive < 120000);
             activeList.sort((a, b) => b.monthly_listeners - a.monthly_listeners);
             setOnlineUsers(activeList);
          } else { setOnlineUsers([]); }
        });
      } catch (e) { console.error("Presence Error", e); }
    };

    if(activeSubTab === 'online') {
        initPresence();
    }
    
    return () => { if (unsubscribe) unsubscribe(); };
  }, [activeSubTab, uid]);

  const handleLike = (postId: string | number) => {
      setFeed(prev => prev.map(p => {
          if (p.id === postId) {
              return { 
                  ...p, 
                  likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                  isLiked: !p.isLiked 
              };
          }
          return p;
      }));
  };

  const handlePostTweet = () => {
      if (!newTweet.trim()) return;
      playClickSound();
      sendGlobalPost(uid, player.name, newTweet, player.appearance.headIndex);
      setNewTweet("");
  };

  const switchTab = (tab: 'feed' | 'online') => {
      playClickSound();
      setActiveSubTab(tab);
  };

  return (
    // Fixed H-Full Layout
    <div className="h-full w-full bg-black flex flex-col relative">
        
        {/* Header Tabs - Sticky/Fixed at top of container */}
        <div className="shrink-0 bg-black/95 backdrop-blur border-b border-white/10 pt-20 z-40">
            <div className="flex">
                <button 
                    onClick={() => switchTab('feed')}
                    className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeSubTab === 'feed' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-neutral-500'}`}
                >
                    <GlobeIcon className="w-4 h-4" />
                    FlowX
                </button>
                <button 
                    onClick={() => switchTab('online')}
                    className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest transition-colors ${activeSubTab === 'online' ? 'text-white border-b-2 border-white' : 'text-neutral-500'}`}
                >
                    Online ({onlineUsers.length})
                </button>
            </div>
        </div>

        {/* CONTENT SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto pb-32">
            
            {/* --- SOCIAL FEED (FlowX) --- */}
            {activeSubTab === 'feed' && (
                <div className="w-full">
                    
                    {/* Tweet Input Area */}
                    <div className="p-4 border-b border-white/10 flex gap-3 bg-[#0a0a0a]">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <img src={HEAD_OPTIONS[player.appearance.headIndex]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <textarea 
                                value={newTweet}
                                onChange={(e) => setNewTweet(e.target.value)}
                                placeholder="Tüm dünyayla paylaş..."
                                className="w-full bg-transparent text-white text-sm placeholder-neutral-500 outline-none resize-none h-12 pt-2"
                                maxLength={140}
                            />
                            <div className="flex justify-end pt-2 border-t border-white/5">
                                <button 
                                    onClick={handlePostTweet}
                                    disabled={!newTweet.trim()}
                                    className="bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-full disabled:opacity-50 hover:bg-blue-400 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                >
                                    PAYLAŞ
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        {feed.map((post) => (
                            <div key={post.id} className={`border-b border-white/5 p-4 hover:bg-white/[0.02] transition-colors flex gap-3 animate-fade-in-up ${post.isPlayer ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : ''}`}>
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#222]">
                                    <img src={post.avatarUrl} alt={post.author} className="w-full h-full object-cover" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className={`font-bold text-sm truncate ${post.isPlayer ? 'text-blue-300' : 'text-white'}`}>{post.author}</span>
                                        {post.isVerified && <CheckIcon className="w-3 h-3 text-blue-400" />}
                                        {post.isPlayer && (
                                            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30 font-bold">ONAYLI MC</span>
                                        )}
                                        <span className="text-neutral-500 text-sm truncate ml-1">{post.handle}</span>
                                        <span className="text-neutral-500 text-sm">·</span>
                                        <span className="text-neutral-500 text-sm">{post.time}</span>
                                    </div>
                                    
                                    {/* Text */}
                                    <p className="text-neutral-200 text-sm leading-snug mb-3 whitespace-pre-wrap">{post.content}</p>
                                    
                                    {/* Actions */}
                                    <div className="flex justify-between text-neutral-500 max-w-xs">
                                        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10"><MicIcon className="w-4 h-4" /></div>
                                            <span className="text-xs">{post.replies}</span>
                                        </button>
                                        <button className="flex items-center gap-1 hover:text-green-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-green-500/10">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 12v8h16v-8"/><path d="M12 2L12 16"/><path d="M8 6l4-4 4 4"/></svg>
                                            </div>
                                            <span className="text-xs">{post.retweets}</span>
                                        </button>
                                        <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 transition-colors group ${post.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                                            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10">
                                                {post.isLiked ? (
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                                )}
                                            </div>
                                            <span className="text-xs">{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10"><SendIcon className="w-4 h-4" /></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ONLINE USERS --- */}
            {activeSubTab === 'online' && (
                <div className="p-4 space-y-2">
                     <div className="text-xs text-neutral-500 uppercase font-bold mb-4 flex justify-between px-2">
                         <span>Sanatçı</span>
                         <span className="text-green-500 flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                             {onlineUsers.length} Aktif
                         </span>
                     </div>
                     
                     {onlineUsers.length === 0 ? (
                         <div className="text-center text-neutral-500 py-10">Kimse aktif değil.</div>
                     ) : (
                         onlineUsers.map(u => (
                            <div 
                                key={u.uid}
                                className={`w-full flex items-center p-3 rounded-xl border border-white/5 bg-[#111] transition-all text-left group ${u.uid === uid ? 'opacity-50' : 'hover:border-white/20'}`}
                            >
                                <div className="w-10 h-10 bg-gradient-to-tr from-[#1ed760] to-blue-500 rounded-full flex items-center justify-center font-bold text-black text-sm mr-3 relative shrink-0">
                                    {u.name[0]}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#111] rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <div className="font-bold text-white text-sm truncate leading-normal pb-0.5">{u.name} {u.uid === uid && '(Sen)'}</div>
                                        {u.appearance?.headIndex !== undefined && u.monthly_listeners > 50000 && (
                                             <div className="bg-blue-500 rounded-full p-0.5 shrink-0"><svg viewBox="0 0 24 24" fill="white" className="w-2 h-2"><path d="M9 12L11 14L15 10" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Lv {u.level} • {new Intl.NumberFormat('tr-TR', { notation: "compact" }).format(u.monthly_listeners)} Dinleyici</div>
                                </div>
                                
                                <div className="text-right ml-2 shrink-0">
                                    <div className="text-[10px] text-[#1ed760] font-black uppercase tracking-widest whitespace-nowrap animate-pulse">
                                        {u.currentAction || 'Dolanıyor...'}
                                    </div>
                                    <div className="text-[8px] text-neutral-600 font-bold uppercase mt-0.5">ŞU AN</div>
                                </div>
                            </div>
                        ))
                     )}
                </div>
            )}

        </div>
    </div>
  );
};
