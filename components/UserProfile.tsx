
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { HEAD_OPTIONS } from '../constants';
import { followUser, unfollowUser, isFollowing } from '../services/socialService';
import { MicIcon, UsersIcon, TrophyIcon, SparklesIcon, PlayIcon, ZapIcon } from './Icons';

interface UserProfileProps {
  uid: string;
  targetUid: string;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ uid, targetUid, onClose }) => {
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [aiTracks, setAiTracks] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch User Info
    const userRef = doc(db, 'public_users', targetUid);
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      }
      setLoading(false);
    });

    // Fetch User AI Tracks
    const tracksRef = collection(db, 'users', targetUid, 'tracks');
    const unsubTracks = onSnapshot(tracksRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAiTracks(list.sort((a, b) => b.createdAt - a.createdAt));
    });

    // Fetch User Posts
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorId', '==', targetUid), orderBy('timestamp', 'desc'), limit(10));
    const unsubPosts = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
        return {
          id: doc.id,
          ...data,
          timestamp
        };
      });
      setPosts(list);
    }, (error) => {
      console.error("Error fetching user posts:", error);
    });

    // Check following status
    const checkFollow = async () => {
      const followingStatus = await isFollowing(uid, targetUid);
      setFollowing(followingStatus);
    };
    checkFollow();

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, [uid, targetUid]);

  const handleFollowToggle = async () => {
    if (following) {
      await unfollowUser(uid, targetUid);
      setFollowing(false);
    } else {
      await followUser(uid, targetUid);
      setFollowing(true);
    }
  };

  if (loading) return null;
  if (!userData) return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="text-white text-center">
        <p>Kullanıcı bulunamadı.</p>
        <button onClick={onClose} className="mt-4 text-blue-400">Kapat</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in font-sans">
      {/* Header */}
      <div className="p-4 pt-12 flex items-center gap-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">✕</button>
        <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">PROFİL</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Profile Info */}
        <div className="p-6 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle Spotify Green Glow behind character */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-spotify-green/20 blur-[60px] rounded-full pointer-events-none z-0"></div>
          
          <div className="relative mb-4 z-10">
            <img 
              src={HEAD_OPTIONS[userData.appearance?.headIndex || 0]} 
              className="w-24 h-24 rounded-full border-2 border-white/20 shadow-2xl" 
              alt={userData.name}
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-black flex items-center justify-center text-[10px] font-black text-black">
              {userData.level || 1}
            </div>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tighter mb-1 relative z-10">{userData.name}</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 relative z-10">
            {userData.currentAction || 'Müzik Yapıyor'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-xs mb-8 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg leading-none">{userData.followersCount || 0}</span>
              <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1">TAKİPÇİ</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg leading-none">{userData.followingCount || 0}</span>
              <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1">TAKİP</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg leading-none">{posts.length}</span>
              <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1">POST</span>
            </div>
          </div>

          {/* Follow Button */}
          {uid !== targetUid && (
            <button 
              onClick={handleFollowToggle}
              className={`w-full max-w-xs py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 ${
                following 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              }`}
            >
              {following ? 'TAKİPTEN ÇIK' : 'TAKİP ET'}
            </button>
          )}
        </div>

        {/* User Stats Summary */}
        <div className="px-6 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">DİNLEYİCİ</div>
                <div className="text-white font-black text-sm">{(userData.monthly_listeners || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">SAYGINLIK</div>
                <div className="text-white font-black text-sm">{(userData.respect || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Tracks Section */}
        {aiTracks.length > 0 && (
          <div className="px-6 mb-8">
            <h3 className="text-[10px] font-black text-[#1ed760] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <SparklesIcon className="w-3 h-3" />
              AI MASTERPIECES
            </h3>
            <div className="space-y-3">
              {aiTracks.map(track => (
                <div key={track.id} className="bg-gradient-to-r from-black to-[#111] border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#1ed760] rounded-xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform cursor-pointer" onClick={() => {
                        const audio = new Audio(`data:audio/wav;base64,${track.audioBase64}`);
                        audio.play();
                    }}>
                      <PlayIcon className="w-5 h-5 text-black" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-black text-sm truncate uppercase italic tracking-tighter">{track.name}</div>
                      <div className="text-[#1ed760] text-[8px] font-black uppercase tracking-widest mt-0.5">Lyria 3 Generation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('playRhythmTrack', { detail: track }));
                            onClose();
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#1ed760] active:scale-90 transition-all border border-white/5"
                        title="Ritm Oyunu Oyna"
                    >
                        <ZapIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[8px] text-neutral-600 font-bold">
                        {new Date(track.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Posts */}
        <div className="px-6 pb-20">
          <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">GÖNDERİLER</h3>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
                Henüz bir paylaşım yapmamış.
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] text-neutral-500 font-black uppercase">
                      {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                    {post.type !== 'text' && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        post.type === 'song' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {post.type === 'song' ? 'MÜZİK' : 'ARAÇ'}
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 text-xs leading-relaxed">{post.content}</p>
                  
                  {post.type === 'song' && post.meta && (
                    <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                      <MicIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-white truncate">{post.meta.name}</span>
                    </div>
                  )}
                  
                  {post.type === 'car' && post.meta && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-xl">{post.meta.carImg || '🚗'}</span>
                      <span className="text-xs font-bold text-white truncate">{post.meta.name}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
