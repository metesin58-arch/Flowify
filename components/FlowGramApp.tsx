import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { SocialFeed } from './SocialFeed';
import { HEAD_OPTIONS } from '../constants';

interface FlowGramAppProps {
  uid: string;
  player: PlayerStats;
  onBack: () => void;
  onSearch: () => void;
}

export const FlowGramApp: React.FC<FlowGramAppProps> = ({ uid, player, onBack, onSearch }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');

  return (
    <div className="h-full flex flex-col bg-black text-white font-sans select-none">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-black">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="text-neutral-400 hover:text-white text-base">←</button>
          <h2 className="text-lg font-black tracking-tighter lowercase">flowgram<span className="text-purple-500">.</span></h2>
        </div>
        <div className="flex gap-4">
          <span className="text-lg cursor-pointer opacity-50 hover:opacity-100">➕</span>
          <span className="text-lg cursor-pointer opacity-50 hover:opacity-100">❤️</span>
          <span className="text-lg cursor-pointer opacity-50 hover:opacity-100">💬</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0 bg-[#020202]">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3.5 text-xs font-bold tracking-tight lowercase transition-all ${activeTab === 'feed' ? 'text-white border-b-2 border-purple-500' : 'text-neutral-500'}`}
        >
          akış.
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3.5 text-xs font-bold tracking-tight lowercase transition-all ${activeTab === 'profile' ? 'text-white border-b-2 border-purple-500' : 'text-neutral-500'}`}
        >
          profilim.
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' ? (
          <SocialFeed uid={uid} player={player} />
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar bg-black">
            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden">
                    <img src={HEAD_OPTIONS[player.appearance.headIndex]} alt="me" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">
                  ✓
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between text-center max-w-xs">
                  <div>
                    <div className="font-black text-base leading-none">{player.discography?.length || 0}</div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-tight mt-15 lowercase">şarkı</div>
                  </div>
                  <div>
                    <div className="font-black text-base leading-none">{player.followersCount || 0}</div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-tight mt-15 lowercase">takipçi</div>
                  </div>
                  <div>
                    <div className="font-black text-base leading-none">{player.followingCount || 0}</div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-tight mt-15 lowercase">takip</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <div className="font-black text-sm tracking-tight lowercase">{player.name.toLowerCase()}</div>
              <div className="text-[11px] text-neutral-500 font-bold tracking-tight lowercase">profesyonel rap sanatçısı.</div>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-[85%] lowercase">
                {player.currentCity?.toLowerCase() || 'eskisehir'} sokaklarından listelerin zirvesine. 🎤🔥
              </p>
              <div className="text-[10px] text-purple-400 font-bold lowercase">#flow #hiphop #rap #{player.currentCity?.toLowerCase() || 'eskisehir'}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-[#0a0a0a] border border-white/5 hover:bg-white/5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all lowercase text-neutral-300">profili düzenle.</button>
              <button className="flex-1 bg-[#0a0a0a] border border-white/5 hover:bg-white/5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all lowercase text-neutral-300">paylaş.</button>
            </div>

            {/* Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 tracking-tight lowercase">diskografim.</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {player.discography?.length > 0 ? (
                  player.discography.map((song, i) => (
                    <div key={i} className="aspect-square bg-[#0a0a0a] hover:bg-neutral-900 rounded-2xl flex flex-col items-center justify-center text-white/20 p-2 transition-all group cursor-pointer border border-white/5">
                      <span className="text-xl group-hover:scale-110 transition-transform">🎵</span>
                      <span className="text-[10px] text-neutral-400 truncate w-full text-center mt-2 font-bold lowercase tracking-tight">{song.name.toLowerCase()}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-10 text-center border border-dashed border-white/5 rounded-2xl bg-[#030303]">
                    <p className="text-[10px] text-neutral-600 font-bold lowercase">henüz yayınlanmış bir hitin yok.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="h-14 shrink-0 border-t border-white/5 flex items-center justify-around bg-black">
        <button onClick={() => setActiveTab('feed')} className={`text-xl transition-all ${activeTab === 'feed' ? 'scale-110 opacity-100' : 'opacity-40'}`}>🏠</button>
        <button onClick={onSearch} className="text-xl opacity-40 hover:opacity-100 transition-all">🔍</button>
        <span className="text-xl opacity-40 cursor-not-allowed">🎬</span>
        <span className="text-xl opacity-40 cursor-not-allowed">🛍️</span>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${activeTab === 'profile' ? 'border-purple-500 scale-105' : 'border-transparent opacity-40'}`}
        >
          <img src={HEAD_OPTIONS[player.appearance.headIndex]} alt="me" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  );
};
