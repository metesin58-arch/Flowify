import React, { useState } from 'react';
import { CharacterAppearance, Gender, SongTrack, CityKey, VocalStyle, Backstory, Personality } from '../types';
import { searchSongs } from '../services/musicService';
import { Avatar } from './Avatar';
import { HEAD_OPTIONS, HAT_STYLES, CHAIN_STYLES, SHOE_STYLES, CLOTHING_STYLES, PANTS_STYLES, SKIN_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS } from '../constants';
import { playClickSound, playErrorSound } from '../services/sfx';
import { UsersIcon, CheckIcon, UserIcon, TrophyIcon, SearchIcon, LockIcon, SparklesIcon, MusicIcon } from './Icons';
import { StartingCitySelector } from './StartingCitySelector';

interface Props {
  onCreate: (name: string, gender: Gender, appearance: CharacterAppearance, startingCityId: CityKey, favoriteSong?: SongTrack, vocalStyle?: VocalStyle, backstory?: Backstory, personality?: Personality) => void;
  isEditing?: boolean;
  initialData?: { name: string, gender: Gender, appearance: CharacterAppearance, favoriteSong?: SongTrack, vocalStyle?: VocalStyle, backstory?: Backstory, personality?: Personality };
  ownedUpgrades?: Record<string, number>;
}

export const CharacterCreation: React.FC<Props> = ({ onCreate, isEditing = false, initialData, ownedUpgrades }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(isEditing ? 4 : 1); 
  const [customTab, setCustomTab] = useState<'body' | 'style' | 'colors' | 'accessories'>('body');

  const [name, setName] = useState(initialData?.name || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male');
  const [startingCityId, setStartingCityId] = useState<CityKey>('eskisehir');
  
  const [vocalStyle, setVocalStyle] = useState<VocalStyle>(initialData?.vocalStyle || 'raw');
  const [backstory, setBackstory] = useState<Backstory>(initialData?.backstory || 'street');
  const [personality, setPersonality] = useState<Personality>(initialData?.personality || 'humble');

  const [appearance, setAppearance] = useState<CharacterAppearance>(initialData?.appearance || {
    headIndex: 0,
    skinColor: '#f1c27d',
    shirtColor: '#333333',
    pantsColor: '#1a1a1a',
    shoesColor: '#ffffff',
    clothingStyle: 0,
    pantsStyle: 0,
    hatIndex: 0,
    chainIndex: 0,
    shoeStyle: 0
  });

  const [favoriteSong, setFavoriteSong] = useState<SongTrack | undefined>(initialData?.favoriteSong);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SongTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const suggestName = () => {
    playClickSound();
    const prefixes = ["Lil", "Mc", "Dj", "Aura", "Trap", "Ritim", "Lirik", "Sokak", "Karanlik", "Ghetto", "Micro", "Flow", "Hyper", "Siber", "Sago", "Cezo"];
    const suffixes = ["Flow", "Sair", "Kral", "Ustasi", "Vibe", "Makinesi", "Deha", "Spit", "Boy", "G", "Cezmi", "Hejan", "Rapci", "Sovalye", "Lord"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randNum = Math.floor(Math.random() * 99);
    const suggested = `${randomPrefix}_${randomSuffix}${randNum > 50 ? randNum : ''}`.toLowerCase();
    setName(suggested);
  };

  // --- LOCK LOGIC ---
  const isHeadLocked = (index: number) => {
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`head_${index}`];
  };

  const isClothingLocked = (index: number) => {
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`clothing_${index}`];
  };

  const isHatLocked = (index: number) => {
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`hat_${index}`];
  };

  const isChainLocked = (index: number) => {
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`chain_${index}`];
  };

  const hasAnyLock = () => {
      return isHeadLocked(appearance.headIndex) || 
             isClothingLocked(appearance.clothingStyle) || 
             isHatLocked(appearance.hatIndex) || 
             isChainLocked(appearance.chainIndex);
  };

  // --- CYCLERS ---
  const cycleOption = (key: keyof CharacterAppearance, currentVal: number, total: number) => {
      playClickSound();
      const next = (currentVal + 1) % total;
      setAppearance({ ...appearance, [key]: next });
  };

  const cycleOptionRev = (key: keyof CharacterAppearance, currentVal: number, total: number) => {
      playClickSound();
      const prev = (currentVal - 1 + total) % total;
      setAppearance({ ...appearance, [key]: prev });
  };

  const handleNext = () => { 
      playClickSound(); 
      setStep(prev => (prev < 5 ? prev + 1 : prev) as 1|2|3|4|5); 
  };
  
  const handlePrev = () => { 
      playClickSound(); 
      setStep(prev => (prev > 1 ? prev - 1 : prev) as 1|2|3|4|5); 
  };

  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      playClickSound();
      setIsSearching(true);
      const res = await searchSongs(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
  };

  const finishCreation = () => {
      if (hasAnyLock()) {
          playErrorSound();
          alert("Seçili bazı eşyalar kilitli! Stilden satın almalısın.");
          return;
      }
      playClickSound();
      if(name.length > 0) {
          onCreate(name, gender, appearance, startingCityId, favoriteSong, vocalStyle, backstory, personality);
      }
  };

  // --- SUB COMPONENTS ---
  const ColorPickerGrid = ({ title, current, options, onSelect }: { title: string, current: string, options: string[], onSelect: (color: string) => void }) => (
      <div className="bg-[#080808] p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
          <span className="text-[10px] font-black tracking-wider text-neutral-500 uppercase px-1">{title}</span>
          <div className="flex flex-wrap gap-1.5 justify-start">
              {options.map((c: string) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { playClickSound(); onSelect(c); }}
                    className={`w-6 h-6 rounded-full transition-all duration-200 border-2 relative ${
                      current.toLowerCase() === c.toLowerCase() 
                        ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)] z-10' 
                        : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.05]'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                      {current.toLowerCase() === c.toLowerCase() && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              <CheckIcon className="w-2.5 h-2.5 text-black filter invert drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                          </div>
                      )}
                  </button>
              ))}
          </div>
      </div>
  );

  const CustomSelector = ({ label, value, options, onNext, onPrev, isLocked, isHead = false }: any) => {
      const lowerLabel = String(label).toLowerCase();
      return (
        <div className={`p-3 rounded-2xl border transition-all duration-300 ${isLocked ? 'border-red-500/20 bg-red-500/5' : 'bg-[#080808] border-white/5 hover:border-white/10'}`}>
            <div className="flex justify-between items-center mb-2 px-1">
                <label className={`text-[10px] font-black tracking-wider uppercase ${isLocked ? 'text-red-500' : 'text-neutral-500'}`}>
                    {lowerLabel}.
                </label>
                {isLocked && <span className="text-red-500 text-[10px]">🔒</span>}
            </div>
            <div className="flex items-center justify-between gap-1.5">
                <button 
                    type="button"
                    onClick={onPrev} 
                    className="w-8 h-8 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl flex items-center justify-center text-xs active:scale-90 transition-all border border-white/5 shrink-0"
                >
                    ‹
                </button>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                    {isHead ? (
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-white/5 animate-fade-in relative">
                            <img src={HEAD_OPTIONS[value]} className="w-11 h-11 object-contain translate-y-0.5" alt="Head" />
                            {isLocked && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-[10px]">🔒</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className={`text-[11px] font-black tracking-wide lowercase truncate block ${isLocked ? 'text-red-400' : 'text-white'}`}>
                            {String(options[value]).toLowerCase()}{isLocked ? ' (kilitli)' : '.'}
                        </span>
                    )}
                </div>
                <button 
                    type="button"
                    onClick={onNext} 
                    className="w-8 h-8 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl flex items-center justify-center text-xs active:scale-90 transition-all border border-white/5 shrink-0"
                >
                    ›
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center p-0 font-sans overflow-hidden">
      
      {/* 1. Header Navigation & Steps */}
      <div className="pt-safe-top pt-6 w-full flex flex-col items-center shrink-0 z-10 bg-gradient-to-b from-black to-transparent pb-3 select-none">
          <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-[#1DB954]' : 'w-2 bg-white/10'}`}></div>
              ))}
          </div>
          {step === 4 && (
              <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10">
                  <span className="text-[#1DB954] text-[9px] font-black tracking-widest uppercase">karakter stil tasarımı</span>
              </div>
          )}
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 w-full max-w-4xl flex flex-col md:flex-row gap-5 p-4 md:p-6 overflow-hidden items-stretch justify-center relative min-h-0">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
              <div className="flex-1 flex flex-col justify-center items-center px-6 max-w-md mx-auto space-y-8 select-none animate-fade-in">
                  <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-4 border border-[#1DB954]/20 shadow-[0_0_20px_rgba(29,185,84,0.1)]">
                          <UserIcon className="w-6 h-6 text-[#1DB954]" />
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tighter lowercase mb-1">kimlik tanımla<span className="text-[#1DB954]">.</span></h2>
                      <p className="text-neutral-500 text-xs font-bold tracking-tight lowercase">türkçe rap sahnesindeki ismini ve cinsiyetini gir.</p>
                  </div>
                  
                  <div className="w-full space-y-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-500 font-black uppercase tracking-wider px-1">sahne adı</label>
                          <div className="flex gap-2">
                              <input
                                  type="text"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="flex-1 bg-white border-2 border-[#1DB954] rounded-2xl px-4 py-4 text-black text-center text-sm font-black placeholder-neutral-400 focus:ring-4 focus:ring-[#1DB954]/20 outline-none transition-all duration-300 lowercase shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                                  placeholder="örn: hiphop_ustasi"
                              />
                              <button
                                  type="button"
                                  onClick={suggestName}
                                  className="bg-white hover:bg-neutral-100 text-black border-2 border-[#1DB954] font-black px-4 rounded-2xl text-xs lowercase active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-black/10"
                              >
                                  <SparklesIcon className="w-3.5 h-3.5 text-[#1DB954]" />
                                  öner
                              </button>
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-500 font-black uppercase tracking-wider px-1">cinsiyet seçimi</label>
                          <div className="flex gap-3 w-full">
                              <button 
                                type="button"
                                onClick={() => { 
                                    playClickSound(); 
                                    setGender('male'); 
                                    setAppearance(prev => ({ ...prev, headIndex: 0 }));
                                }} 
                                className={`flex-1 py-3.5 rounded-2xl font-bold text-xs tracking-tight transition-all duration-300 active:scale-95 lowercase border flex items-center justify-center gap-2 ${gender === 'male' ? 'bg-purple-600/10 text-purple-400 border-purple-500/40 font-extrabold shadow-[0_10px_25px_rgba(147,51,234,0.1)]' : 'bg-[#080808] text-neutral-500 border-white/5 hover:text-white'}`}
                              >
                                  erkek.
                              </button>
                              <button 
                                type="button"
                                onClick={() => { 
                                    playClickSound(); 
                                    setGender('female'); 
                                    setAppearance(prev => ({ ...prev, headIndex: 1 }));
                                }} 
                                className={`flex-1 py-3.5 rounded-2xl font-bold text-xs tracking-tight transition-all duration-300 active:scale-95 lowercase border flex items-center justify-center gap-2 ${gender === 'female' ? 'bg-purple-600/10 text-purple-400 border-purple-500/40 font-extrabold shadow-[0_10px_25px_rgba(147,51,234,0.1)]' : 'bg-[#080808] text-neutral-500 border-white/5 hover:text-white'}`}
                              >
                                  kadın.
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: CITY SELECTION */}
          {step === 2 && (
              <StartingCitySelector 
                onSelect={(cityId) => {
                    setStartingCityId(cityId);
                    handleNext();
                }}
                onBack={handlePrev}
              />
          )}

          {/* STEP 3: STYLE & BACKGROUND */}
          {step === 3 && (
              <div className="flex-1 flex flex-col max-w-md mx-auto p-3 overflow-y-auto no-scrollbar animate-fade-in select-none">
                  <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-white tracking-tighter lowercase mb-1">tarz & köken<span className="text-[#1DB954]">.</span></h2>
                      <p className="text-neutral-500 text-xs font-bold tracking-tight lowercase">karakterinin sanatsal tarzını ve geçmiş hikayesini belirle.</p>
                  </div>

                  <div className="space-y-5 pb-6">
                      {/* Vocal Style */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">vokal tarzı.</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[
                                  { id: 'autotune', label: 'autotune' },
                                  { id: 'raw', label: 'ham (raw)' },
                                  { id: 'aggressive', label: 'agresif' },
                                  { id: 'melodic', label: 'melodik' }
                              ].map(v => (
                                  <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => { playClickSound(); setVocalStyle(v.id as VocalStyle); }}
                                      className={`py-3 rounded-2xl font-bold text-xs tracking-tight transition-all duration-200 border text-center ${vocalStyle === v.id ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/40 font-extrabold shadow-[0_4px_12px_rgba(29,185,84,0.05)]' : 'bg-[#080808]/80 border-white/5 text-neutral-500 hover:text-white'}`}
                                  >
                                      {v.label}.
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Backstory */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">geçmiş serüven.</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[
                                  { id: 'street', label: 'sokak' },
                                  { id: 'rich', label: 'zengin' },
                                  { id: 'underground', label: 'yeraltı' },
                                  { id: 'social', label: 'sosyal medya' }
                              ].map(b => (
                                  <button
                                      key={b.id}
                                      type="button"
                                      onClick={() => { playClickSound(); setBackstory(b.id as Backstory); }}
                                      className={`py-3 rounded-2xl font-bold text-xs tracking-tight transition-all duration-200 border text-center ${backstory === b.id ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/40 font-extrabold shadow-[0_4px_12px_rgba(29,185,84,0.05)]' : 'bg-[#080808]/80 border-white/5 text-neutral-500 hover:text-white'}`}
                                  >
                                      {b.label}.
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Personality */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">kişilik tipi.</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[
                                  { id: 'arrogant', label: 'kibirli' },
                                  { id: 'humble', label: 'mütevazı' },
                                  { id: 'mysterious', label: 'gizemli' },
                                  { id: 'energetic', label: 'enerjik' }
                              ].map(p => (
                                  <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => { playClickSound(); setPersonality(p.id as Personality); }}
                                      className={`py-3 rounded-2xl font-bold text-xs tracking-tight transition-all duration-200 border text-center ${personality === p.id ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/40 font-extrabold shadow-[0_4px_12px_rgba(29,185,84,0.05)]' : 'bg-[#080808]/80 border-white/5 text-neutral-500 hover:text-white'}`}
                                  >
                                      {p.label}.
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 4: APPEARANCE CUSTOMIZER (Responsive Dual-Panel) */}
          {step === 4 && (
              <div className="flex-1 flex flex-col md:flex-row items-stretch gap-4 md:gap-6 min-h-0 w-full animate-fade-in relative z-20">
                  
                  {/* LEFT COLUMN: VISUAL PREVIEW WINDOW */}
                  <div className="w-full md:w-5/12 flex-shrink-0 relative flex flex-col h-[32vh] md:h-full min-h-[190px] bg-[#050505]/60 border border-white/[0.04] rounded-3xl overflow-hidden p-4 z-10 justify-end">
                      
                      {/* Volumetric Spot Light Effect inside Stage */}
                      <div 
                        className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[110%] h-[75%] bg-gradient-to-b from-[#1DB954]/8 via-[#1DB954]/3 to-transparent blur-lg pointer-events-none z-0"
                        style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
                      ></div>
                      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-28 h-28 bg-[#1DB954]/15 rounded-full blur-[40px] pointer-events-none z-0"></div>
                      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[160px] h-[30px] bg-white/5 blur-[15px] rounded-[100%] pointer-events-none z-0 scale-125"></div>

                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none z-20"></div>

                      {/* Stage Floor Ring */}
                      <div className="absolute bottom-[2%] inset-x-4 h-16 rounded-[100%] border border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none z-0"></div>

                      <div className="relative flex justify-center items-end h-full z-10 select-none overflow-visible pb-1.5 md:pb-4">
                          <Avatar 
                            appearance={appearance} 
                            gender={gender} 
                            size={270} 
                            className={`${hasAnyLock() ? 'grayscale brightness-75' : ''} transition-all duration-300 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]`} 
                          />
                          
                          {hasAnyLock() && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center select-none animate-pulse-slow">
                                  <LockIcon className="w-8 h-8 text-red-500 drop-shadow-md mb-2" />
                                  <span className="bg-red-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">stilden alinmalidir</span>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* RIGHT COLUMN: RESTRUCTURED STYLE SELECTION TAB PANEL */}
                  <div className="flex-1 w-full flex flex-col min-h-0 bg-neutral-900/30 border border-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden p-3 md:p-5 relative z-20">
                      
                      {/* Responsive, thumb-friendly horizontal tab navigation */}
                      <div className="flex bg-[#050505] border border-white/5 p-1 rounded-2xl shrink-0 select-none gap-0.5 overflow-x-auto no-scrollbar">
                          {[
                              { id: 'body', label: 'kafa & ten.' },
                              { id: 'style', label: 'giyim.' },
                              { id: 'colors', label: 'renk paleti.' },
                              { id: 'accessories', label: 'aksesuar.' }
                          ].map(t => (
                              <button 
                                key={t.id} 
                                type="button"
                                onClick={() => { playClickSound(); setCustomTab(t.id as any); }}
                                className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-black tracking-tight text-center transition-all duration-200 lowercase shrink-0 ${
                                    customTab === t.id 
                                        ? 'bg-purple-600 text-white font-black shadow-[0_8px_16px_rgba(147,51,234,0.15)]' 
                                        : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                              >
                                  {t.label}
                              </button>
                          ))}
                      </div>

                      {/* Content panels which avoid nested vertical scrolling where possible */}
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pt-3 select-none min-h-0">
                          
                          {/* TAB A: BODY & TEN (COMPLETELY EXPOSES SKIN COLOR CHANCE) */}
                          {customTab === 'body' && (
                              <div className="space-y-3.5 animate-fade-in">
                                  <CustomSelector 
                                      label="kafa tipi stili" 
                                      value={appearance.headIndex} 
                                      options={HEAD_OPTIONS.map((_, i) => `kafa tipi ${i+1}`)}
                                      onNext={() => cycleOption('headIndex', appearance.headIndex, HEAD_OPTIONS.length)}
                                      onPrev={() => cycleOptionRev('headIndex', appearance.headIndex, HEAD_OPTIONS.length)}
                                      isLocked={isHeadLocked(appearance.headIndex)}
                                      isHead={true}
                                  />

                                  <ColorPickerGrid 
                                      title="ten rengi tonu"
                                      current={appearance.skinColor} 
                                      options={SKIN_COLORS} 
                                      onSelect={(color) => setAppearance(prev => ({ ...prev, skinColor: color }))} 
                                  />
                              </div>
                          )}

                          {/* TAB B: KIYAFET (STYLISH SKEW COATING CHANGER) */}
                          {customTab === 'style' && (
                              <div className="space-y-3.5 animate-fade-in">
                                  <div className="grid grid-cols-2 gap-3">
                                      <CustomSelector 
                                          label="üst giyim tarzı"
                                          value={appearance.clothingStyle}
                                          options={CLOTHING_STYLES}
                                          onNext={() => cycleOption('clothingStyle', appearance.clothingStyle, CLOTHING_STYLES.length)}
                                          onPrev={() => cycleOptionRev('clothingStyle', appearance.clothingStyle, CLOTHING_STYLES.length)}
                                          isLocked={isClothingLocked(appearance.clothingStyle)}
                                      />
                                      <CustomSelector 
                                          label="alt pantolon tarzı"
                                          value={appearance.pantsStyle || 0}
                                          options={PANTS_STYLES}
                                          onNext={() => cycleOption('pantsStyle', appearance.pantsStyle || 0, PANTS_STYLES.length)}
                                          onPrev={() => cycleOptionRev('pantsStyle', appearance.pantsStyle || 0, PANTS_STYLES.length)}
                                          isLocked={false}
                                      />
                                  </div>
                                  
                                  <div className="bg-[#080808] p-3 rounded-2xl border border-white/5 space-y-2">
                                      <span className="text-[10px] font-black tracking-wider text-neutral-500 uppercase px-1">Seçili Kıyafet Kılavuzu</span>
                                      <p className="text-[10px] text-neutral-400 font-medium px-1 leading-relaxed lowercase">
                                          giydiğin kıyafetlerin renk tonunu özelleştirmek için yukarıdan <span className="text-purple-400 font-bold">renk paleti.</span> sekmesine göz at.
                                      </p>
                                  </div>
                              </div>
                          )}

                          {/* TAB C: RENK PALETİ (100% VISIBLE ALL COLOR SELECTIONS IN GRIDS ON THE SAME VIEW) */}
                          {customTab === 'colors' && (
                              <div className="space-y-3.5 animate-fade-in pb-4">
                                  <ColorPickerGrid 
                                      title="üst giyim (shirt) rengi" 
                                      current={appearance.shirtColor} 
                                      options={SHIRT_COLORS} 
                                      onSelect={(color) => setAppearance(prev => ({ ...prev, shirtColor: color }))} 
                                  />

                                  <ColorPickerGrid 
                                      title="alt pantolon rengi" 
                                      current={appearance.pantsColor} 
                                      options={PANTS_COLORS} 
                                      onSelect={(color) => setAppearance(prev => ({ ...prev, pantsColor: color }))} 
                                  />

                                  <ColorPickerGrid 
                                      title="ayakkabı taban rengi" 
                                      current={appearance.shoesColor || '#ffffff'} 
                                      options={SHOE_COLORS} 
                                      onSelect={(color) => setAppearance(prev => ({ ...prev, shoesColor: color }))} 
                                  />
                              </div>
                          )}

                          {/* TAB D: ACCESSORIES */}
                          {customTab === 'accessories' && (
                              <div className="space-y-3.5 animate-fade-in">
                                  <div className="grid grid-cols-2 gap-3">
                                      <CustomSelector 
                                          label="şapka aksesuarı"
                                          value={appearance.hatIndex}
                                          options={HAT_STYLES}
                                          onNext={() => cycleOption('hatIndex', appearance.hatIndex, HAT_STYLES.length)}
                                          onPrev={() => cycleOptionRev('hatIndex', appearance.hatIndex, HAT_STYLES.length)}
                                          isLocked={isHatLocked(appearance.hatIndex)}
                                      />
                                      <CustomSelector 
                                          label="ayakkabı stili"
                                          value={appearance.shoeStyle || 0}
                                          options={SHOE_STYLES}
                                          onNext={() => cycleOption('shoeStyle', appearance.shoeStyle || 0, SHOE_STYLES.length)}
                                          onPrev={() => cycleOptionRev('shoeStyle', appearance.shoeStyle || 0, SHOE_STYLES.length)}
                                          isLocked={false}
                                      />
                                  </div>

                                  <CustomSelector 
                                      label="boyun zinciri stili"
                                      value={appearance.chainIndex}
                                      options={CHAIN_STYLES}
                                      onNext={() => cycleOption('chainIndex', appearance.chainIndex, CHAIN_STYLES.length)}
                                      onPrev={() => cycleOptionRev('chainIndex', appearance.chainIndex, CHAIN_STYLES.length)}
                                      isLocked={isChainLocked(appearance.chainIndex)}
                                  />
                              </div>
                          )}

                      </div>
                  </div>
              </div>
          )}

          {/* STEP 5: ANTHEM SELECTION */}
          {step === 5 && (
              <div className="flex-1 flex flex-col p-4 max-w-md mx-auto overflow-hidden animate-fade-in select-none">
                  <div className="text-center mb-5 shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-3 border border-[#1DB954]/20">
                          <MusicIcon className="w-5 h-5 text-[#1DB954]" />
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tighter lowercase mb-0.5">çıkış marşı<span className="text-[#1DB954]">.</span></h2>
                      <p className="text-neutral-500 text-xs font-bold tracking-tight lowercase">spotify veya apple music kütüphanelerinden favori parçanı seç.</p>
                  </div>
                  
                  <div className="flex gap-2 mb-4 shrink-0">
                      <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="şarkı ya da sanatçı ara..."
                          className="flex-1 bg-[#080808]/80 border border-white/5 rounded-2xl px-4 py-3 text-white text-xs font-bold placeholder-neutral-600 focus:border-[#1DB954]/30 outline-none lowercase shadow-inner"
                      />
                      <button 
                        type="button"
                        onClick={handleSearch} 
                        className="bg-white hover:bg-neutral-200 text-black font-black px-5 rounded-2xl text-xs lowercase active:scale-95 transition-all outline-none"
                      >
                          {isSearching ? '...' : 'ara.'}
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pb-4 no-scrollbar min-h-0">
                      {searchResults.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-600">
                              <span className="text-2xl mb-2">🔍</span>
                              <span className="text-[10px] font-bold tracking-wider uppercase">müzik arama motoru hazır</span>
                          </div>
                      ) : (
                          searchResults.map(track => (
                              <button
                                  key={track.trackId}
                                  type="button"
                                  onClick={() => { playClickSound(); setFavoriteSong(track); }}
                                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 ${
                                      favoriteSong?.trackId === track.trackId 
                                          ? 'bg-purple-600/15 text-white border-purple-600 shadow-[0_8px_20px_rgba(147,51,234,0.1)] font-bold' 
                                          : 'bg-[#080808] border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                  }`}
                              >
                                  <img src={track.artworkUrl100} className="w-9 h-9 rounded-xl bg-black object-cover shadow-md shrink-0" alt="Cover" />
                                  <div className="min-w-0 flex-1">
                                      <div className="font-bold text-xs truncate leading-snug lowercase">{track.trackName.toLowerCase()}</div>
                                      <div className="text-[9px] opacity-75 truncate lowercase">{track.artistName.toLowerCase()}</div>
                                  </div>
                                  {favoriteSong?.trackId === track.trackId && (
                                      <CheckIcon className="w-4 h-4 text-purple-400 shrink-0 select-none animate-scale-up" />
                                  )}
                              </button>
                          ))
                      )}
                  </div>
              </div>
          )}

      </div>

      {/* 3. Footer Control Bar */}
      <div className={`w-full max-w-sm px-7 pb-8 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent z-30 shrink-0 select-none ${step === 2 ? 'hidden' : ''}`}>
          <button 
              type="button"
              onClick={step === 5 ? finishCreation : handleNext}
              disabled={(step === 1 && name.length === 0) || (step === 4 && hasAnyLock())}
              className={`w-full font-black py-4 rounded-3xl active:scale-95 transition-all text-xs tracking-tight lowercase disabled:opacity-45 disabled:cursor-not-allowed border flex items-center justify-center gap-1.5 shadow-2xl ${
                  step === 4 && hasAnyLock() 
                      ? 'bg-red-600/10 text-red-400 border-red-500/20' 
                      : 'bg-white text-black border-transparent hover:bg-neutral-100'
              }`}
          >
              {step === 5 ? (
                  isEditing ? 'kaydet.' : 'başla.'
              ) : (
                  step === 4 && hasAnyLock() 
                      ? '🔒 kilitli eşyaları kaldırmalısın.' 
                      : 'devam et.'
              )}
          </button>
          
          {(step > 1 && !(isEditing && step === 3)) && (
              <button 
                type="button"
                onClick={handlePrev} 
                className="w-full text-neutral-600 hover:text-neutral-300 text-xs font-black mt-4.5 transition-colors duration-200 py-1.5 lowercase outline-none"
              >
                  geri dön.
              </button>
          )}
      </div>

    </div>
  );
};
