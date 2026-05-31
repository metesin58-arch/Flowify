
import React, { useState, useEffect } from 'react';
import { fetchSongs, searchSongs } from '../services/musicService';
import { SongTrack, PlayerStats } from '../types';
import { DiscIcon, PlayIcon, CheckIcon } from './Icons';
import { playClickSound, playErrorSound } from '../services/sfx';

interface Props {
  player: PlayerStats; // Added PlayerStats to access favoriteSong
  onComplete: (setlist: SongTrack[]) => void;
  onBack: () => void;
}

export const ConcertSetup: React.FC<Props> = ({ player, onComplete, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<SongTrack[]>([]);
  const [setlist, setSetlist] = useState<SongTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'hits' | 'search'>('hits');

  // Load Hits or Anthem-based recommendations Initially
  useEffect(() => {
    loadRecommendations();
  }, []);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const loadRecommendations = async () => {
    setLoading(true);
    let data: SongTrack[] = [];

    // If player has an anthem (favorite song), try to fetch songs by that artist first
    if (player.favoriteSong) {
        try {
            data = await searchSongs(player.favoriteSong.artistName);
        } catch (e) {
            console.warn("Anthem search failed, falling back to hits.");
            data = await fetchSongs();
        }
    } else {
        // Default hits if no anthem
        data = await fetchSongs(); 
    }

    // Take top unique songs
    const unique = Array.from(new Map(data.map(s => [s.trackId, s])).values()).slice(0, 12);
    setSongs(unique);
    setLoading(false);
  };

  const handleSearch = async () => {
    playClickSound();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await searchSongs(searchQuery);
    setSongs(data);
    setLoading(false);
    setActiveTab('search');
  };

  const toggleSong = (song: SongTrack) => {
    playClickSound();
    const exists = setlist.find(s => s.trackId === song.trackId);
    if (exists) {
      setSetlist(prev => prev.filter(s => s.trackId !== song.trackId));
    } else {
      if (setlist.length >= 5) {
          notify("Maksimum 5 parça seçebilirsin!", 'error');
          playErrorSound();
          return;
      }
      setSetlist(prev => [...prev, song]);
    }
  };

  const handleBack = () => {
      playClickSound();
      onBack();
  };

  const handleComplete = () => {
      playClickSound();
      if(setlist.length > 0) {
          onComplete(setlist);
      } else {
          notify("En az 1 şarkı seçmelisin!", 'error');
          playErrorSound();
      }
  };

  const isSelected = (id: number) => setlist.some(s => s.trackId === id);

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden font-sans animate-fade-in">
        
        {/* Header - Fixed Padding */}
        <div className="pt-safe-top mt-8 px-6 pb-6 bg-black/80 backdrop-blur-xl border-b border-white/5 z-20 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter lowercase font-sans">dj setup<span className="text-[#1DB954]">.</span></h1>
                <p className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight">setlistini oluştur ({setlist.length}/5)</p>
            </div>
            <div className="w-12 h-12 bg-[#1DB954]/5 rounded-2xl flex items-center justify-center border border-white/5">
                <DiscIcon className="w-5 h-5 text-[#1DB954] animate-spin-slow" />
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-6 z-10 font-sans">
            <div className="flex gap-3">
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="parça ara..."
                    className="flex-1 bg-[#050505] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:border-[#1DB954] focus:outline-none transition-all lowercase"
                />
                <button 
                    onClick={handleSearch}
                    className="bg-white text-black font-semibold px-8 rounded-2xl text-xs lowercase active:scale-95 transition-all"
                >
                    ara.
                </button>
            </div>
            {player.favoriteSong && activeTab === 'hits' && (
                <div className="mt-3 text-[10px] text-[#1DB954] font-bold lowercase tracking-tight animate-pulse">
                    ★ {player.favoriteSong.artistName.toLowerCase()} tarzı öneriliyor.
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar font-sans">
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {songs.map(song => (
                        <button 
                            key={song.trackId}
                            onClick={() => toggleSong(song)}
                            className={`relative aspect-square rounded-[2rem] overflow-hidden group transition-all duration-500 ${isSelected(song.trackId) ? 'ring-4 ring-[#1DB954] scale-95' : 'active:scale-95'}`}
                        >
                            <img src={song.artworkUrl100} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-end p-4">
                                <div className="text-white font-extrabold text-[12px] truncate leading-tight lowercase">{song.trackName.toLowerCase()}</div>
                                <div className="text-white/40 text-[9px] font-bold truncate lowercase tracking-tight">{song.artistName.toLowerCase()}</div>
                            </div>
                            
                            {/* Selected Overlay */}
                            {isSelected(song.trackId) && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                    <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(29,185,84,0.3)]">
                                        <CheckIcon className="w-6 h-6 text-black" />
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent z-30 pb-safe">
            <div className="flex gap-4">
                <button 
                    onClick={handleBack}
                    className="flex-1 py-4 bg-white/5 text-white font-semibold rounded-2xl border border-white/5 lowercase tracking-tight text-[11px] transition-all active:scale-95"
                >
                    geri.
                </button>
                <button 
                    onClick={handleComplete}
                    disabled={setlist.length === 0}
                    className={`flex-[2] py-4 font-bold rounded-2xl lowercase tracking-tight text-[11px] shadow-2xl transition-all active:scale-95 ${setlist.length > 0 ? 'bg-[#1DB954] text-black' : 'bg-white/5 text-neutral-500 border border-white/5'}`}
                >
                    sahneye çık. ({setlist.length})
                </button>
            </div>
        </div>

    </div>
  );
};
