import React, { useRef, useState, useEffect } from "react";
import { PlayerStats, OnlineUser, ReleasedSong } from "../types";
import { Avatar } from "./Avatar";
import {
  formatListeners,
  calculateLevelProgress,
  getNextLevelThreshold,
  calculateLevel,
} from "../services/gameLogic";
import { getGlobalLeaderboard } from "../services/matchmakingService";
import {
  DiscIcon,
  PlayIcon,
  TrophyIcon,
  CoinIcon,
  MicIcon,
  DiamondIcon,
  MusicIcon,
  MusicOffIcon,
  MoonIcon,
  SunIcon,
  CrownIcon,
  VerifiedIcon,
  CheckIcon,
  GlobeIcon,
} from "./Icons";
import { useGameUI } from "../context/UIContext";
import { IAPTab } from "./IAPStore";
import { playClickSound } from "../services/sfx";
import { HubTutorial } from "./HubTutorial";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  player: PlayerStats;
  uid: string;
  ownedUpgrades: Record<string, number>;
  onEditCharacter?: () => void;
  updateStat?: (stat: keyof PlayerStats, amount: number) => void;
  updateMultipleStats?: (updates: Partial<PlayerStats>) => void;
  onOpenShop: (tab: IAPTab) => void;
  onStartLiveFreestyle?: () => void;
}

export const Dashboard: React.FC<Props> = ({
  player,
  uid,
  ownedUpgrades,
  onEditCharacter,
  updateStat,
  updateMultipleStats,
  onOpenShop,
  onStartLiveFreestyle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leaderboard, setLeaderboard] = useState<OnlineUser[]>([]);
  const [isLoadingLb, setIsLoadingLb] = useState(true);
  const [showHubTutorial, setShowHubTutorial] = useState(false);

  const [spotifyToken, setSpotifyToken] = useState<string | null>(
    localStorage.getItem("spotify_access_token"),
  );
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMobileClient = typeof window !== 'undefined' && 
    (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);

  const handleConnectSpotify = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    if (!BACKEND_URL) {
      alert("Spotify entegrasyonu için uzak sunucu (backend) kurulmuş olmalıdır. Şu an sunucusuz (standalone) moddasınız.");
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/spotify/url`);
      if (!response.ok) throw new Error("Failed to get auth URL");
      const { url } = await response.json();
 
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
 
      window.open(
        url,
        "spotify_auth",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
    } catch (error) {
      console.error("Spotify connection error:", error);
    }
  };
 
  const isVerified =
    ownedUpgrades &&
    ownedUpgrades["verified_badge"] &&
    ownedUpgrades["verified_badge"] > 0;
 
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "OAUTH_AUTH_SUCCESS" &&
        event.data.provider === "spotify"
      ) {
        const token = event.data.accessToken;
        setSpotifyToken(token);
        localStorage.setItem("spotify_access_token", token);
        fetchPlaylists(token);
      }
    };
 
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
 
  const fetchPlaylists = async (token: string) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    if (!BACKEND_URL) return;
    setIsLoadingPlaylists(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/spotify/playlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.items || []);
      } else if (response.status === 401) {
        setSpotifyToken(null);
        localStorage.removeItem("spotify_access_token");
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (spotifyToken) {
      fetchPlaylists(spotifyToken);
    }
  }, []);

  useEffect(() => {
    // Hub tutorial deactivated
  }, []);

  const completeHubTutorial = () => {
    localStorage.setItem("flowify_hub_seen", "true");
    setShowHubTutorial(false);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLb = async () => {
      setIsLoadingLb(true);
      const list = await getGlobalLeaderboard(10);
      if (isMounted) {
        setLeaderboard(list);
        setIsLoadingLb(false);
      }
    };
    fetchLb();

    return () => {
      isMounted = false;
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const togglePlay = () => {
    if (!player.favoriteSong?.previewUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(player.favoriteSong.previewUrl);
        audioRef.current.volume = 0.5;
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-full bg-black relative overflow-hidden flex flex-col font-sans">
      {showHubTutorial && <HubTutorial onClose={completeHubTutorial} />}

      {/* Main Scrollable Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-48 relative">
        {/* PREMIUM ARTIST HEADER */}
        <div className="absolute inset-x-0 top-0 h-[420px] z-0 pointer-events-none overflow-hidden bg-black">
          {/* Dynamic Ambient Glows - Optimized for performance */}
          {!isMobileClient ? (
            <>
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-spotify-green/5 blur-[120px] rounded-full animate-pulse-slow"></div>
              <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full animate-float"></div>
            </>
          ) : (
            <>
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-spotify-green/5 blur-[40px] rounded-full opacity-60"></div>
              <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[45px] rounded-full opacity-50"></div>
            </>
          )}

          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="absolute inset-0 flex items-center justify-center pt-12 opacity-60">
            <div className="relative animate-fade-in">
              <Avatar
                appearance={player.appearance}
                gender={player.gender}
                size={isMobileClient ? 640 : 800}
              />
              {/* Artistic Shadow/Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            </div>
          </div>

          {/* Premium depth gradients */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent"></div>
        </div>

        {/* 1. PROFILE HEADER */}
        <div className="relative shrink-0 min-h-[260px] flex flex-col justify-end px-6 pb-6 z-10">
          <div className="relative z-10">
            <div className="flex flex-col gap-1 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                {isVerified && (
                  <div className="bg-[#1DB954] rounded-full p-0.5 shadow-[0_0_15px_rgba(29,185,84,0.4)]">
                    <CheckIcon className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-[#1DB954] lowercase tracking-tight">
                  {isVerified ? "doğrulanmış sanatçı." : "doğrulanmamış sanatçı."}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tighter leading-none select-none text-white lowercase">
                {player.name.toLowerCase()}
              </h1>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight mb-0.5">
                    aylık dinleyici.
                  </span>
                  <span className="text-sm font-black text-white tracking-tighter">
                    {formatListeners(player.monthly_listeners)}
                  </span>
                </div>

                <div className="w-px h-8 bg-white/5 mx-1"></div>

                <button
                  onClick={onEditCharacter}
                  className="bg-[#0a0a0a] border border-white/5 active:border-purple-500/20 px-4 py-2 rounded-2xl text-[10px] font-bold text-neutral-400 transition-all active:scale-95 lowercase"
                >
                  profili düzenle.
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BENTO GRID CONTENT */}
        <div className="px-6 pb-32 space-y-8 relative z-10">
          {/* QUICK STATS ROW */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-3xl flex flex-col gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-[#1DB954]/5 flex items-center justify-center">
                <TrophyIcon className="w-4 h-4 text-[#1DB954]" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  saygınlık.
                </div>
                <div className="text-lg font-black text-white tracking-tighter">
                  {(player.respect || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-3xl flex flex-col gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-purple-500/5 flex items-center justify-center">
                <CoinIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  bakiye.
                </div>
                <div className="text-lg font-black text-white tracking-tighter">
                  ₺{(player.careerCash || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* PLAYER ANTHEM CARD */}
          {player.favoriteSong && (
            <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-[2rem] relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                <MusicIcon className="w-16 h-16 text-purple-500" />
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-black overflow-hidden shadow-2xl border border-white/5">
                    <img
                      src={player.favoriteSong.artworkUrl100}
                      className="w-full h-full object-cover"
                      alt="Cover"
                    />
                  </div>
                  <button
                    onClick={togglePlay}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center shadow-xl active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <div className="flex gap-0.5 items-end h-2.5">
                        <div className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite] h-full"></div>
                        <div className="w-0.5 bg-white animate-[music-bar_1.2s_ease-in-out_infinite] h-2/3"></div>
                        <div className="w-0.5 bg-white animate-[music-bar_1s_ease-in-out_infinite] h-1/2"></div>
                      </div>
                    ) : (
                      <PlayIcon className="w-2.5 h-2.5 text-white ml-0.5 fill-current" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-purple-400 lowercase tracking-tight mb-1">
                    şu an çalıyor.
                  </div>
                  <div className="text-sm font-black text-white truncate tracking-tighter leading-tight lowercase">
                    {player.favoriteSong.trackName.toLowerCase()}
                  </div>
                  <div className="text-[11px] font-bold text-neutral-500 truncate tracking-tight lowercase">
                    {player.name.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLOWIFY TOP 10 SECTION */}
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-black text-white tracking-tighter lowercase">
                flowify <span className="text-[#1DB954]">top 10</span><span className="text-[#1DB954]">.</span>
              </h2>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden divide-y divide-white/5">
              {isLoadingLb ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-white/5 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              ) : leaderboard.length > 0 ? (
                leaderboard.slice(0, 10).map((user, idx) => (
                  <div
                    key={user.uid}
                    className={`flex items-center gap-4 p-4 transition-all active:bg-neutral-900/20 ${user.uid === uid ? "bg-purple-500/5" : ""}`}
                  >
                    <span
                      className={`text-xs font-bold w-4 text-center ${idx < 3 ? "text-purple-500" : "text-neutral-500"}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                      <Avatar
                        appearance={user.appearance}
                        gender={user.gender}
                        size={50}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-bold text-xs truncate tracking-tight lowercase ${user.uid === uid ? "text-purple-400" : "text-white"}`}
                      >
                        {user.name.toLowerCase()}
                      </div>
                      <div className="text-neutral-500 text-[10px] font-bold tracking-tight lowercase">
                        {formatListeners(user.monthly_listeners)} dinleyici
                      </div>
                    </div>
                    <div className="text-white font-bold text-xs tracking-tight">
                      {(user.respect || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-500 text-xs lowercase">
                  sıralama verisi bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* SPOTIFY PLAYLISTS */}
          {!spotifyToken ? (
            <div className="bg-[#0a0a0a] p-6 rounded-[2rem] border border-white/5 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <MusicIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-white tracking-tight lowercase">
                    spotify bağla<span className="text-[#1DB954]">.</span>
                  </h3>
                  <p className="text-[10px] font-medium text-neutral-500 lowercase">
                    çalma listelerini profilinde göster.
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectSpotify}
                className="w-full bg-[#1DB954] text-black font-black py-3.5 rounded-2xl text-xs lowercase active:scale-95 transition-all"
              >
                spotify ile bağlan.
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white tracking-tighter lowercase">
                  spotify<span className="text-[#1DB954]">.</span>
                </h2>
                <button
                  onClick={() => {
                    localStorage.removeItem("spotify_access_token");
                    setSpotifyToken(null);
                    setPlaylists([]);
                  }}
                  className="text-neutral-500 text-[10px] font-bold lowercase active:text-white transition-colors"
                >
                  bağlantıyı kes.
                </button>
              </div>

              {isLoadingPlaylists ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-32 shrink-0 space-y-3 animate-pulse"
                    >
                      <div className="w-32 h-32 bg-white/5 rounded-3xl"></div>
                      <div className="h-3 bg-white/5 rounded-full w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : playlists.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 font-sans">
                  {playlists.map((playlist) => (
                    <a
                      key={playlist.id}
                      href={playlist.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-32 shrink-0 group"
                    >
                      <div className="w-32 h-32 bg-[#0a0a0a] rounded-3xl overflow-hidden mb-3 shadow-2xl transition-all duration-500 border border-white/5">
                        <img
                          src={
                            playlist.images?.[0]?.url ||
                            "https://via.placeholder.com/150"
                          }
                          className="w-full h-full object-cover"
                          alt={playlist.name}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-xs font-bold text-white truncate tracking-tight mb-0.5 lowercase">
                        {playlist.name.toLowerCase()}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-500 truncate tracking-tight lowercase">
                        {playlist.tracks.total} parça
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl text-center text-neutral-500 text-xs lowercase">
                  çalma listesi bulunamadı.
                </div>
              )}
            </div>
          )}

          {/* GLOBAL STATS - EFFECTIVE FEATURE */}
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                <GlobeIcon className="w-4.5 h-4.5 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white tracking-tight lowercase">
                  global etki<span className="text-[#1DB954]">.</span>
                </h3>
                <p className="text-[10px] font-bold text-neutral-500 lowercase">
                  senin istatistiklerin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  dünya sıralaması.
                </p>
                <p className="text-2xl font-black text-white tracking-tighter">
                  #{leaderboard.findIndex((u) => u.uid === uid) + 1 || "---"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  popülerlik.
                </p>
                <p className="text-2xl font-black text-[#1DB954] tracking-tighter">
                  %{calculateLevelProgress(player.monthly_listeners).toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  kariyer seviyesi.
                </p>
                <p className="text-2xl font-black text-white tracking-tighter">
                  lv {calculateLevel(player.monthly_listeners)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 lowercase tracking-tight">
                  sonraki hedef.
                </p>
                <p className="text-2xl font-black text-neutral-400 tracking-tighter">
                  {formatListeners(
                    getNextLevelThreshold(player.monthly_listeners),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes music-bar {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export const SimpleSongItem: React.FC<{
  song: ReleasedSong;
  index: number;
}> = ({ song, index }) => {
  const idNum = song.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = idNum % 360;
  const isDark = idNum % 2 === 0;

  return (
    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 active:bg-white/10 active:border-white/10 transition-all cursor-pointer animate-fade-in">
      <div
        className="w-10 h-10 rounded-lg shadow-2xl relative overflow-hidden shrink-0 transition-transform duration-500"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 60%, ${isDark ? "20%" : "30%"}), hsl(${hue + 40}, 60%, 10%))`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)",
          }}
        ></div>

        <div className="absolute inset-0 flex items-center justify-center font-black text-white/20 text-2xl select-none">
          {song.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1">
          <div className="text-white font-black text-xs truncate pr-2 tracking-tight">
            {song.name}
          </div>
          <div
            className={`text-[8px] font-black px-2 py-0.5 rounded border ${song.quality >= 90 ? "text-[#1DB954] border-[#1DB954]/30 bg-[#1DB954]/10" : "text-neutral-500 border-white/10 bg-white/5"}`}
          >
            %{song.quality}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-neutral-400 text-[9px] font-bold">
            {((song.popularityScore || 0) * 1000).toLocaleString()}{" "}
            <span className="text-[8px] uppercase text-neutral-600 ml-1 tracking-widest">
              Dinlenme
            </span>
          </div>
          {song.totalEarnings > 0 && (
            <div className="text-[#1DB954] text-[9px] font-mono font-black">
              +₺{(song.totalEarnings || 0).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
