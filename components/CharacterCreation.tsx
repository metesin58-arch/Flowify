
import React, { useState, useMemo } from 'react';
import { CharacterAppearance, Gender, SongTrack } from '../types';
import { searchSongs } from '../services/musicService';
import { Avatar } from './Avatar';
import { HEAD_OPTIONS, HAT_STYLES, CHAIN_STYLES, SHOE_STYLES, CLOTHING_STYLES, PANTS_STYLES, SKIN_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS } from '../constants';
import { playClickSound, playErrorSound } from '../services/sfx';

interface Props {
  onCreate: (name: string, gender: Gender, appearance: CharacterAppearance, favoriteSong?: SongTrack) => void;
  isEditing?: boolean;
  initialData?: { name: string, gender: Gender, appearance: CharacterAppearance, favoriteSong?: SongTrack };
  ownedUpgrades?: Record<string, number>; // New prop to check for unlocked items
}

export const CharacterCreation: React.FC<Props> = ({ onCreate, isEditing = false, initialData, ownedUpgrades }) => {
  const [step, setStep] = useState<1 | 2 | 3>(isEditing ? 2 : 1); 
  const [customTab, setCustomTab] = useState<0 | 1 | 2>(0);

  const [name, setName] = useState(initialData?.name || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male');
  
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

  // --- LOCK LOGIC ---

  const isHeadLocked = (index: number) => {
      // Free heads: 0 and 1
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`head_${index}`];
  };

  const isClothingLocked = (index: number) => {
      // Free clothing: 0 (T-shirt), 1 (Hoodie)
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`clothing_${index}`];
  };

  const isHatLocked = (index: number) => {
      // Free hats: 0 (None), 1 (Beanie)
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`hat_${index}`];
  };

  const isChainLocked = (index: number) => {
      // Free chains: 0 (None), 1 (Thin)
      if (index < 2) return false;
      return !ownedUpgrades || !ownedUpgrades[`chain_${index}`];
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

  const handleNext = () => { playClickSound(); setStep(prev => (prev < 3 ? prev + 1 : prev) as 1|2|3); }
  const handlePrev = () => { playClickSound(); setStep(prev => (prev > 1 ? prev - 1 : prev) as 1|2|3); }

  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      playClickSound();
      setIsSearching(true);
      const res = await searchSongs(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
  };

  const hasAnyLock = () => {
      return isHeadLocked(appearance.headIndex) || 
             isClothingLocked(appearance.clothingStyle) || 
             isHatLocked(appearance.hatIndex) || 
             isChainLocked(appearance.chainIndex);
  };

  const finishCreation = () => {
      if (hasAnyLock()) {
          playErrorSound();
          alert("Seçili bazı eşyalar kilitli! Stilden satın almalısın.");
          return;
      }
      
      playClickSound();
      if(name.length > 0) {
          onCreate(name, gender, appearance, favoriteSong);
      }
  };

  // --- COMPONENTS ---

  const ColorPicker = ({ current, options, onSelect }: any) => (
      <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto custom-scrollbar p-1">
          {options.map((c: string) => (
              <button
                key={c}
                onClick={() => { playClickSound(); onSelect(c); }}
                className={`w-6 h-6 rounded-full transition-all border border-white/20 shadow-sm ${current === c ? 'scale-110 ring-2 ring-white z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
          ))}
      </div>
  );

  // Generic Locked Selector
  const LockedSelector = ({ label, value, options, onNext, onPrev, isLocked }: any) => {
      return (
        <div className={`bg-[#111] p-2 rounded-lg border transition-colors ${isLocked ? 'border-red-500/50' : 'border-white/5'}`}>
            <label className={`text-[8px] font-bold uppercase mb-1 block text-center tracking-wider ${isLocked ? 'text-red-500' : 'text-neutral-500'}`}>
                {isLocked ? 'KİLİTLİ 🔒' : label}
            </label>
            <div className="flex items-center justify-between">
                <button onClick={onPrev} className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white text-xs hover:bg-white/10 active:scale-95">‹</button>
                <span className={`text-[9px] font-bold uppercase truncate px-2 ${isLocked ? 'text-red-500' : 'text-white'}`}>
                    {options[value]}
                </span>
                <button onClick={onNext} className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white text-xs hover:bg-white/10 active:scale-95">›</button>
            </div>
        </div>
      );
  };

  const SimpleSelector = ({ label, value, max, onChange, options }: any) => (
      <div className="bg-[#111] p-2 rounded-lg border border-white/5">
          <label className="text-[8px] text-neutral-500 font-bold uppercase mb-1 block text-center tracking-wider">{label}</label>
          <div className="flex items-center justify-between">
              <button onClick={() => { playClickSound(); onChange(Math.max(0, value - 1)); }} className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white text-xs hover:bg-white/10 active:scale-95">‹</button>
              <span className="text-[9px] font-bold text-white uppercase truncate px-2">{options ? options[value] : value + 1}</span>
              <button onClick={() => { playClickSound(); onChange(Math.min(max, value + 1)); }} className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white text-xs hover:bg-white/10 active:scale-95">›</button>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center p-0 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="pt-safe-top pt-4 w-full flex justify-center shrink-0 z-10 bg-gradient-to-b from-[#050505] to-transparent pb-4">
          <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-white' : 'w-2 bg-white/20'}`}></div>
              ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-sm flex flex-col relative overflow-hidden">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
              <div className="flex-1 flex flex-col justify-center items-center px-8 animate-fade-in space-y-8">
                  <div className="text-center">
                      <h2 className="text-xl font-black text-white italic tracking-tighter mb-1">KİMLİK</h2>
                      <p className="text-neutral-500 text-xs">Sahne adın ne olacak?</p>
                  </div>
                  
                  <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-white/20 text-white text-center text-lg font-bold placeholder-neutral-600 focus:border-white outline-none py-2 uppercase tracking-widest transition-all"
                      placeholder="Karakter Adın"
                  />

                  <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => { 
                            playClickSound(); 
                            setGender('male'); 
                            setAppearance(prev => ({ ...prev, headIndex: 0 })); // Default Male Head
                        }} 
                        className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest ${gender === 'male' ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-white/10'}`}
                      >
                          ERKEK
                      </button>
                      <button 
                        onClick={() => { 
                            playClickSound(); 
                            setGender('female'); 
                            setAppearance(prev => ({ ...prev, headIndex: 1 })); // Default Female Head
                        }} 
                        className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest ${gender === 'female' ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-white/10'}`}
                      >
                          KADIN
                      </button>
                  </div>
              </div>
          )}

          {/* STEP 2: APPEARANCE */}
          {step === 2 && (
              <div className="flex-1 flex flex-col h-full animate-fade-in relative">
                  
                  {/* --- ATMOSPHERIC BACKGROUND (Spotlight & Fog) --- */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {/* 1. Volumetric Light Beam (Conic Shape) */}
                      <div 
                        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-gradient-to-b from-white/15 via-white/5 to-transparent blur-xl z-0"
                        style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
                      ></div>
                      
                      {/* 2. Light Source Glow (Bright Top) */}
                      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-40 h-40 bg-white/20 rounded-full blur-[50px] z-0"></div>

                      {/* 3. Floating Dust Particles */}
                      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 animate-pulse"></div>

                      {/* 4. Animated Smoke/Fog Layers */}
                      <div className="absolute bottom-0 left-0 w-[200%] h-[300px] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] blur-2xl animate-[smoke-drift_10s_ease-in-out_infinite_alternate] opacity-30 z-0"></div>
                      <div className="absolute bottom-20 right-[-50%] w-[200%] h-[250px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_60%)] blur-3xl animate-[smoke-drift_15s_ease-in-out_infinite_alternate-reverse] opacity-30 z-0"></div>

                      {/* 5. Floor Light Reflection */}
                      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[200px] h-[40px] bg-white/10 blur-[20px] rounded-[100%] z-0 scale-150"></div>
                  </div>

                  {/* Avatar Preview */}
                  <div className="flex-shrink-0 relative flex items-end justify-center pb-2 h-[35vh] min-h-[240px] overflow-visible z-10">
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-20 pointer-events-none"></div>
                      
                      {/* Avatar */}
                      <div className="relative z-10">
                        <Avatar appearance={appearance} gender={gender} size={300} className={`${hasAnyLock() ? 'grayscale brightness-75' : ''} transition-all`} />
                      </div>
                      
                      {hasAnyLock() && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
                              <div className="text-4xl drop-shadow-lg">🔒</div>
                              <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded mt-2 shadow-lg">EŞYA KİLİTLİ</div>
                          </div>
                      )}
                  </div>

                  {/* Controls - Background removed to blend with page */}
                  <div className="flex-1 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent p-4 flex flex-col gap-3 z-20 min-h-0 relative">
                      
                      {/* Sub-Tabs */}
                      <div className="flex bg-[#1a1a1a] p-1 rounded-xl shrink-0 border border-white/5">
                          {['VÜCUT', 'STİL', 'AKSESUAR'].map((label, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => { playClickSound(); setCustomTab(idx as 0|1|2); }}
                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${customTab === idx ? 'bg-white text-black shadow' : 'text-neutral-500'}`}
                              >
                                  {label}
                              </button>
                          ))}
                      </div>

                      {/* Tab Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar pb-2">
                          
                          {/* TAB 0: BODY */}
                          {customTab === 0 && (
                              <>
                                <LockedSelector 
                                    label="KAFA TİPİ" 
                                    value={appearance.headIndex} 
                                    options={HEAD_OPTIONS.map((_, i) => `Tip ${i+1}`)}
                                    onNext={() => cycleOption('headIndex', appearance.headIndex, HEAD_OPTIONS.length)}
                                    onPrev={() => cycleOptionRev('headIndex', appearance.headIndex, HEAD_OPTIONS.length)}
                                    isLocked={isHeadLocked(appearance.headIndex)}
                                />
                                <div className="bg-[#111] p-2 rounded-lg border border-white/5">
                                    <label className="text-[8px] text-neutral-500 font-bold uppercase mb-2 block text-center">TEN RENGİ</label>
                                    <ColorPicker current={appearance.skinColor} options={SKIN_COLORS} onSelect={(c: string) => setAppearance({...appearance, skinColor: c})} />
                                </div>
                              </>
                          )}

                          {/* TAB 1: STYLE */}
                          {customTab === 1 && (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                    <LockedSelector 
                                        label="ÜST TARZI"
                                        value={appearance.clothingStyle}
                                        options={CLOTHING_STYLES}
                                        onNext={() => cycleOption('clothingStyle', appearance.clothingStyle, CLOTHING_STYLES.length)}
                                        onPrev={() => cycleOptionRev('clothingStyle', appearance.clothingStyle, CLOTHING_STYLES.length)}
                                        isLocked={isClothingLocked(appearance.clothingStyle)}
                                    />
                                    <SimpleSelector label="ALT TARZI" value={appearance.pantsStyle || 0} max={PANTS_STYLES.length - 1} options={PANTS_STYLES} onChange={(v: number) => setAppearance({...appearance, pantsStyle: v})} />
                                </div>
                                
                                <div className="bg-[#111] p-2 rounded-lg border border-white/5">
                                    <label className="text-[8px] text-neutral-500 font-bold uppercase mb-2 block text-center">ÜST RENGİ</label>
                                    <ColorPicker current={appearance.shirtColor} options={SHIRT_COLORS} onSelect={(c: string) => setAppearance({...appearance, shirtColor: c})} />
                                </div>
                                <div className="bg-[#111] p-2 rounded-lg border border-white/5">
                                    <label className="text-[8px] text-neutral-500 font-bold uppercase mb-2 block text-center">ALT RENGİ</label>
                                    <ColorPicker current={appearance.pantsColor} options={PANTS_COLORS} onSelect={(c: string) => setAppearance({...appearance, pantsColor: c})} />
                                </div>
                              </>
                          )}

                          {/* TAB 2: ACCESSORIES */}
                          {customTab === 2 && (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                    <LockedSelector 
                                        label="ŞAPKA"
                                        value={appearance.hatIndex}
                                        options={HAT_STYLES}
                                        onNext={() => cycleOption('hatIndex', appearance.hatIndex, HAT_STYLES.length)}
                                        onPrev={() => cycleOptionRev('hatIndex', appearance.hatIndex, HAT_STYLES.length)}
                                        isLocked={isHatLocked(appearance.hatIndex)}
                                    />
                                    <SimpleSelector label="AYAKKABI" value={appearance.shoeStyle || 0} max={SHOE_STYLES.length - 1} options={SHOE_STYLES} onChange={(v: number) => setAppearance({...appearance, shoeStyle: v})} />
                                </div>
                                
                                <div className="bg-[#111] p-2 rounded-lg border border-white/5">
                                    <label className="text-[8px] text-neutral-500 font-bold uppercase mb-2 block text-center">AYAKKABI RENGİ</label>
                                    <ColorPicker current={appearance.shoesColor} options={SHOE_COLORS} onSelect={(c: string) => setAppearance({...appearance, shoesColor: c})} />
                                </div>

                                <LockedSelector 
                                    label="ZİNCİR"
                                    value={appearance.chainIndex}
                                    options={CHAIN_STYLES}
                                    onNext={() => cycleOption('chainIndex', appearance.chainIndex, CHAIN_STYLES.length)}
                                    onPrev={() => cycleOptionRev('chainIndex', appearance.chainIndex, CHAIN_STYLES.length)}
                                    isLocked={isChainLocked(appearance.chainIndex)}
                                />
                              </>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 3: ANTHEM */}
          {step === 3 && (
              <div className="flex-1 flex flex-col p-6 animate-fade-in overflow-hidden">
                  <div className="text-center mb-6">
                      <h2 className="text-xl font-black text-white italic tracking-tighter mb-1">ÇIKIŞ PARÇASI</h2>
                      <p className="text-neutral-500 text-xs">Favori şarkın hangisi?</p>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                      <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Şarkı veya Sanatçı..."
                          className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-white outline-none"
                      />
                      <button onClick={handleSearch} className="bg-white text-black font-bold px-4 rounded-xl text-xs uppercase hover:bg-neutral-200">{isSearching ? '...' : 'ARA'}</button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pb-4 custom-scrollbar">
                      {searchResults.map(track => (
                          <button
                              key={track.trackId}
                              onClick={() => { playClickSound(); setFavoriteSong(track); }}
                              className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${favoriteSong?.trackId === track.trackId ? 'bg-white text-black border-white' : 'bg-[#111] border-white/5 text-white hover:bg-[#222]'}`}
                          >
                              <img src={track.artworkUrl100} className="w-10 h-10 rounded-lg bg-black object-cover" />
                              <div className="min-w-0">
                                  <div className="font-bold text-xs truncate leading-tight">{track.trackName}</div>
                                  <div className="text-[10px] opacity-70 truncate">{track.artistName}</div>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          )}

      </div>

      {/* Footer Actions - Background changed to blend seamlessly */}
      <div className="w-full max-w-sm px-6 pb-8 pt-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-30 shrink-0">
          <button 
              onClick={step === 3 ? finishCreation : handleNext}
              disabled={(step === 1 && name.length === 0) || (step === 2 && hasAnyLock())}
              className={`w-full font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:scale-[1.01] active:scale-95 transition-all text-xs shadow-lg disabled:opacity-50 ${step === 2 && hasAnyLock() ? 'bg-red-600 text-white cursor-not-allowed' : 'bg-white text-black'}`}
          >
              {step === 3 ? (isEditing ? 'KAYDET' : 'BAŞLA') : (step === 2 && hasAnyLock() ? 'EŞYALARI AÇMALISIN' : 'DEVAM ET')}
          </button>
          
          {(step > 1 && !(isEditing && step === 2)) && (
              <button onClick={handlePrev} className="w-full text-neutral-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-3 hover:text-white pb-2">GERİ DÖN</button>
          )}
      </div>

      <style>{`
        @keyframes smoke-drift {
            0% { transform: translateX(-10%) translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateX(10%) translateY(-20px) scale(1.1); opacity: 0.5; }
            100% { transform: translateX(-10%) translateY(0) scale(1); opacity: 0.3; }
        }
      `}</style>

    </div>
  );
};
