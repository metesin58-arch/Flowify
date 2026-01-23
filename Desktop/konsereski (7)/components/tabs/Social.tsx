import React from 'react';
import { SocialPost, PlayerStats } from '../../types';

interface Props {
  feed: SocialPost[];
  player: PlayerStats;
}

export const Social: React.FC<Props> = ({ feed, player }) => {
  return (
    <div>
      <div className="bg-slate-900 p-4 rounded-t-xl border-b border-slate-800 flex justify-between items-center">
        <span className="font-bold text-lg">Flowgram</span>
        <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
          {player.monthly_listeners.toLocaleString()} Followers
        </span>
      </div>
      
      <div className="bg-slate-900 rounded-b-xl min-h-[300px] p-4 space-y-4">
        {/* Mock pinned post */}
        <div className="flex space-x-3 opacity-50">
          <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
        </div>

        {feed.map((post) => (
          <div key={post.id} className="flex space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{post.author}</span>
                <span className="text-xs text-slate-500">2m ago</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">{post.content}</p>
              <div className="flex items-center space-x-4 mt-2 text-slate-500 text-xs font-bold">
                <span>❤️ {post.likes}</span>
                <span>💬 Reply</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};