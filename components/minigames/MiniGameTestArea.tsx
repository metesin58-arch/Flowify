import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RapSurfer } from './RapSurfer';
import { FlashlightWave } from './FlashlightWave';
import { DJScratch } from './DJScratch';
import { LyricPrompter } from './LyricPrompter';
import { NSSKick } from './NSSKick';
import { playClickSound, playWinSound } from '../../services/sfx';

interface Props {
  onExit: () => void;
}

type MiniGameId = 'none' | 'rapsurfer' | 'flashlight' | 'scratch' | 'prompter' | 'nsskick';

interface MiniGameDef {
  id: MiniGameId;
  title: string;
  description: string;
  emoji: string;
  difficulty: 'kolay' | 'orta' | 'zor';
  color: string;
}

const MINIGAMES: MiniGameDef[] = [
  {
    id: 'rapsurfer',
    title: 'ses dalgası (rap surfer)',
    description: 'dalga frekansını takip ederek şarkı ritminin üzerinde sörf yap.',
    emoji: '🏄‍♂️',
    difficulty: 'orta',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30'
  },
  {
    id: 'flashlight',
    title: 'spot ışığı (flashlight wave)',
    description: 'hareket eden sanatçının üzerine spot ışığını odakla ve coşkuyu koru.',
    emoji: '🔦',
    difficulty: 'zor',
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30'
  },
  {
    id: 'scratch',
    title: 'dj scratch',
    description: 'pikap üzerinde ritme uygun şekilde scratch eylemleri gerçekleştir.',
    emoji: '💿',
    difficulty: 'orta',
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30'
  },
  {
    id: 'prompter',
    title: 'sözleri yakala (lyric prompter)',
    description: 'sahnedeyken akan şarkı sözlerini klavyenle hatasız yaz.',
    emoji: '🎤',
    difficulty: 'kolay',
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
  },
  {
    id: 'nsskick',
    title: 'kafiye avcısı (rhyme hunter)',
    description: 'hızla yükselen kelimelerden sadece başlığa uygun ve kafiyeli olanları patlatıp coşkuyu tavana çıkar!',
    emoji: '🔮',
    difficulty: 'kolay',
    color: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30'
  }
];

export const MiniGameTestArea: React.FC<Props> = ({ onExit }) => {
  const [activeGame, setActiveGame] = useState<MiniGameId>('none');
  const [scores, setScores] = useState<Record<MiniGameId, number | null>>({
    none: null,
    rapsurfer: null,
    flashlight: null,
    scratch: null,
    prompter: null,
    nsskick: null
  });

  const handleLaunch = (id: MiniGameId) => {
    playClickSound();
    setActiveGame(id);
  };

  const handleComplete = (score: number) => {
    setScores(prev => ({
      ...prev,
      [activeGame]: score
    }));
    playWinSound();
    setActiveGame('none');
  };

  return (
    <div className="w-full h-full bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        {activeGame === 'none' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center pb-24"
          >
            {/* Header Area */}
            <div className="w-full max-w-md flex justify-between items-center mb-10 mt-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#1DB954] uppercase block">geliştirici laboratuvarı</span>
                <h1 className="text-3xl font-black tracking-tighter lowercase leading-none mt-1">
                  oyun test odası<span className="text-[#1DB954]">.</span>
                </h1>
              </div>
              <button
                onClick={() => { playClickSound(); onExit(); }}
                className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-all text-xs font-bold lowercase hover:bg-white/10"
              >
                kapat
              </button>
            </div>

            {/* Explanatory banner */}
            <div className="w-full max-w-md bg-neutral-950/60 border border-white/5 p-4 rounded-3xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-3xl">🛠</div>
              <p className="text-neutral-400 text-xs leading-relaxed lowercase">
                bu alanda oyuna yeni eklenen interaktif mini kriz modlarını simülatörün tetiklemesini beklemeden doğrudan oynayarak test edebilirsiniz. tamamlandığında elde edilen skorlar aşağıda listelenecektir.
              </p>
            </div>

            {/* List of Game Cards */}
            <div className="w-full max-w-md space-y-4">
              {MINIGAMES.map((game) => {
                const lastScore = scores[game.id];
                return (
                  <div
                    key={game.id}
                    className={`p-5 rounded-3xl bg-gradient-to-r ${game.color} border flex flex-col justify-between gap-4 relative overflow-hidden shadow-xl transition-all duration-300 hover:brightness-110`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="text-3xl select-none">{game.emoji}</span>
                        <div>
                          <h3 className="font-extrabold text-sm text-white tracking-tight leading-snug">
                            {game.title}
                          </h3>
                          <p className="text-neutral-400 text-[11px] leading-snug mt-1 max-w-[240px]">
                            {game.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Difficulty Tag */}
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        game.difficulty === 'kolay' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        game.difficulty === 'orta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-1">
                      <div>
                        {lastScore !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400 uppercase font-bold">son skor:</span>
                            <span className="text-xs font-mono font-black text-[#1DB954] bg-[#1DB954]/10 px-2 py-0.5 rounded-lg border border-[#1DB954]/20 animate-pulse">
                              %{lastScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">henüz oynanmadı</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleLaunch(game.id)}
                        className="px-5 py-2.5 rounded-xl bg-white text-black active:scale-95 transition-all text-xs font-black lowercase tracking-tight shadow-lg hover:bg-neutral-150"
                      >
                        oyna 🚀
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Disclaimer at bottom */}
            <div className="mt-12 text-[10px] text-neutral-600 font-bold lowercase tracking-tight text-center">
              * geliştirme tamamlandıktan sonra bu panel kaldırılacaktır.
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            {/* Overlay Cancel Box top-right to abort back to test cabinet */}
            <button
              onClick={() => { playClickSound(); setActiveGame('none'); }}
              className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white text-base font-extrabold hover:bg-black/95 active:scale-95 transition-all shadow-xl"
              title="Testi Sonlandır"
            >
              ✕
            </button>

            {/* Active game runner wrapper */}
            {activeGame === 'rapsurfer' && (
              <div className="w-full h-full relative">
                <RapSurfer onComplete={handleComplete} />
              </div>
            )}
            {activeGame === 'flashlight' && (
              <div className="w-full h-full relative">
                <FlashlightWave onComplete={handleComplete} />
              </div>
            )}
            {activeGame === 'scratch' && (
              <div className="w-full h-full relative">
                <DJScratch onComplete={handleComplete} />
              </div>
            )}
            {activeGame === 'prompter' && (
              <div className="w-full h-full relative">
                <LyricPrompter onComplete={handleComplete} />
              </div>
            )}
            {activeGame === 'nsskick' && (
              <div className="w-full h-full relative">
                <NSSKick onComplete={handleComplete} />
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
