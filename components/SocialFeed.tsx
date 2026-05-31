import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { HEAD_OPTIONS } from '../constants';
import { getFollowing, createPost } from '../services/socialService';
import { UserProfile } from './UserProfile';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHead: number;
  content: string;
  timestamp: number;
  type: 'text' | 'song' | 'car';
  meta?: any;
}

interface SocialFeedProps {
  uid: string;
  player: any;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ uid, player }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = getFollowing(uid, (list) => {
      setFollowing([...list, uid]); // Include self in feed
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (following.length === 0) return;

    // Firestore 'in' query is limited to 10 items.
    // We chunk the following array into groups of 10 and run multiple queries.
    const CHUNK_SIZE = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < following.length; i += CHUNK_SIZE) {
      chunks.push(following.slice(i, i + CHUNK_SIZE));
    }

    const postsRef = collection(db, 'posts');
    const unsubscribes: (() => void)[] = [];
    const allFetchedPosts: { [chunkIndex: number]: Post[] } = {};

    chunks.forEach((chunk, index) => {
      const q = query(
        postsRef, 
        where('authorId', 'in', chunk), 
        orderBy('timestamp', 'desc'), 
        limit(20)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const chunkPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
          return { id: doc.id, ...data, timestamp } as Post;
        });
        
        allFetchedPosts[index] = chunkPosts;
        
        // Merge all chunks and sort
        const combined = Object.values(allFetchedPosts)
          .flat()
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
          
        setPosts(combined);
      }, (error) => {
        console.error(`Error fetching posts for chunk ${index}:`, error);
      });
      
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [following]);

  const handlePost = async () => {
    if (!newPostText.trim()) return;

    try {
      await createPost(
        uid, 
        player.name, 
        player.appearance.headIndex, 
        newPostText, 
        'text'
      );
      setNewPostText("");
    } catch (e) {
      console.error("Post creation failed:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white select-none">
      {/* Post Input */}
      <div className="p-5 border-b border-white/5 bg-[#030303]">
        <div className="flex gap-3">
          <img 
            src={HEAD_OPTIONS[player.appearance.headIndex]} 
            className="w-10 h-10 rounded-full border border-white/5" 
            alt="me"
          />
          <div className="flex-1">
            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="mikrofon sende, kafiyeleri dök..."
              className="w-full bg-transparent border-none text-xs focus:outline-none resize-none h-12 text-white placeholder-neutral-600 font-medium"
            />
            <div className="flex justify-end mt-1">
              <button 
                onClick={handlePost}
                disabled={!newPostText.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-tight lowercase disabled:opacity-40 transition-all shadow-[0_10px_20px_rgba(147,51,234,0.15)] active:scale-[0.98]"
              >
                paylaş gitsin.
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-black">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-600 bg-black">
            <div className="text-3xl mb-3 opacity-35">📭</div>
            <p className="text-xs font-bold lowercase">gönderilecek bir şey yok.</p>
            <p className="text-[10px] text-neutral-500 mt-1 lowercase">diğer sanatçıları takip ederek liriklerini gözlemle!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-5 bg-[#0a0a0a] rounded-[2rem] border border-white/5 hover:bg-neutral-900 transition-colors">
              <div className="flex gap-3">
                <img 
                  src={HEAD_OPTIONS[post.authorHead]} 
                  className="w-10 h-10 rounded-full border border-white/5 cursor-pointer hover:scale-105 transition-transform" 
                  alt={post.authorName}
                  onClick={() => setSelectedUserUid(post.authorId)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span 
                      className="font-bold text-xs cursor-pointer text-white hover:text-purple-400 transition-colors lowercase"
                      onClick={() => setSelectedUserUid(post.authorId)}
                    >
                      {post.authorName.toLowerCase()}
                    </span>
                    <span className="text-[10px] text-neutral-600 font-medium lowercase">
                      {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium lowercase">
                    {post.content.toLowerCase()}
                  </p>
                  
                  {post.type === 'song' && post.meta && (
                    <div className="mt-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black text-xs">
                        {post.meta.name?.[0]?.toLowerCase() || '🎵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-emerald-400 tracking-tight mb-1.5 lowercase">yeni bir hit yayınladı!</div>
                        <div className="text-xs font-bold text-white truncate lowercase">{post.meta.name.toLowerCase()}</div>
                      </div>
                    </div>
                  )}
                  {post.type === 'car' && post.meta && (
                    <div className="mt-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="text-xl">{post.meta.carImg || '🚗'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-purple-400 tracking-tight mb-1.5 lowercase">yeni bir garaj üyesi ekledi!</div>
                        <div className="text-xs font-bold text-white truncate lowercase">{post.meta.name.toLowerCase()}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 mt-4 pt-1 border-t border-white/[0.02]">
                    <button className="flex items-center gap-1.5 text-neutral-600 hover:text-red-400 transition-colors group">
                      <span className="text-xs group-hover:scale-110 transition-transform">❤️</span>
                      <span className="text-[10px] font-bold">0</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-neutral-600 hover:text-purple-400 transition-colors group">
                      <span className="text-xs group-hover:scale-110 transition-transform">💬</span>
                      <span className="text-[10px] font-bold">0</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-neutral-600 hover:text-emerald-400 transition-colors group ml-auto">
                      <span className="text-xs group-hover:rotate-12 transition-transform">🔗</span>
                    </button>
                  </div>
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
