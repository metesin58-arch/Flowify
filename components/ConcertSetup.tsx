
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
    <div className="h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans animate-slide-in-right">
        
        {/* Header - Fixed Padding */}
        <div className="pt-safe-top mt-8 px-6 pb-4 bg-black/80 backdrop-blur-md border-b border-white/10 z-20 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter">DJ SET-UP</h1>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Setlistini Oluştur ({setlist.length}/5)</p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/50">
                <DiscIcon className="w-6 h-6 text-purple-400 animate-spin-slow" />
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 z-10">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Parça ara..."
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors"
                />
                <button 
                    onClick={handleSearch}
                    className="bg-white text-black font-bold px-4 rounded-xl text-xs uppercase tracking-wide hover:bg-neutral-200"
                >
                    Ara
                </button>
            </div>
            {player.favoriteSong && activeTab === 'hits' && (
                <div className="mt-2 text-[10px] text-[#1ed760] font-bold uppercase tracking-wider animate-pulse">
                    ★ {player.favoriteSong.artistName} tarzı öneriliyor
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {songs.map(song => (
                        <button 
                            key={song.trackId}
                            onClick={() => toggleSong(song)}
                            className={`relative aspect-square rounded-2xl overflow-hidden group transition-all duration-300 ${isSelected(song.trackId) ? 'ring-4 ring-[#1ed760] scale-95' : 'hover:scale-[1.02]'}`}
                        >
                            <img src={song.artworkUrl100} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                <div className="text-white font-bold text-xs truncate leading-tight">{song.trackName}</div>
                                <div className="text-neutral-400 text-[10px] truncate">{song.artistName}</div>
                            </div>
                            
                            {/* Selected Overlay */}
                            {isSelected(song.trackId) && (
                                <div className="absolute inset-0 bg-[#1ed760]/20 flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center shadow-lg">
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
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-30 pb-safe">
            <div className="flex gap-4">
                <button 
                    onClick={handleBack}
                    className="flex-1 py-4 bg-[#1a1a1a] text-white font-bold rounded-xl border border-white/10 uppercase tracking-widest text-xs"
                >
                    Geri
                </button>
                <button 
                    onClick={handleComplete}
                    disabled={setlist.length === 0}
                    className={`flex-[2] py-4 font-black rounded-xl uppercase tracking-widest text-xs shadow-lg transition-all ${setlist.length > 0 ? 'bg-[#1ed760] text-black hover:scale-[1.02]' : 'bg-neutral-800 text-neutral-500'}`}
                >
                    SAHNEYE ÇIK ({setlist.length})
                </button>
            </div>
        </div>

    </div>
  );
};
