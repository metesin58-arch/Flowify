import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerStats } from '../types';
import { ECONOMY } from '../constants';
import { DiscIcon, CheckIcon, CoinIcon, SparklesIcon, PlayIcon } from './Icons';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  spendEnergy: (amount: number) => boolean;
  onClose?: () => void;
}

// 4 iconic Turkish Rap Lyrical Directions
const SPEC_THEMES = [
  { 
    title: "Sokak Çetesi", 
    desc: "Sert drill ritimleri, getto yaşantısı, sokak kültürü ve dostluk bağları.", 
    icon: "🏙️",
    templates: [
      "[Chorus]\nSokaklar soğuk, betonlar gri bizim mekanda\nGölgeler peşimde sinsi bir fırtına kıvamında\nBize bulaşanlar her defasında derin pişmanda\n{playerName} sahnede, hitler hep en ön sırada!\n\n[Verse 1]\nKaranlık sokak arkası, siren sesleri\nKırık hayallerin sıcak, hırslı nefesi\nBurda büyüdük abi, bükülmez bilekler\nKorkutamaz bizi o sahte yürekler\nYarını mühürledik biz bir hecede\nKralı gelse duramaz bu yüksek derecede\n\n[Chorus]\nSokaklar soğuk, betonlar gri bizim mekanda\nGölgeler peşimde sinsi bir fırtına kıvamında\nBize bulaşanlar her defasında derin pişmanda\n{playerName} sahnede, hitler hep en ön sırada!\n\n[Outro]\nFlowify Studio gururla sundu\nTüm mahalle bu ritimde tek vücut oldu..."
    ]
  },
  { 
    title: "Zirveye Yolculuk", 
    desc: "Sıfırdan başlayıp zirveye tırmanış, kazanılan zaferler ve hırs.", 
    icon: "👑",
    templates: [
      "[Chorus]\nZirvedeyiz artık, rüzgarlar sert eser\n{playerName} sahneye çıkınca herkes sesini keser\nBiz yazdık bu tarihi hece hece ve her gece\nIşıklar üstümüzde parlar en asil derecede!\n\n[Verse 1]\nSıfırdan başladım, cebimde umut ve sabır\nŞimdi göklerdeyiz rakipler kalır şakır şakır\nEngelleri birer birer devirip kovaladım şansı\nDeğiştirdim baştan aşağı mahallenin havası\nKendi şansımı tırnaklarımla kazıyarak kazandım\nYalan sevgilerden kaçıp liriklere sığındım\n\n[Chorus]\nZirvedeyiz artık, rüzgarlar sert eser\n{playerName} sahneye çıkınca herkes sesini keser\nBiz yazdık bu tarihi hece hece ve her gece\nIşıklar üstümüzde parlar en asil derecede!\n\n[Outro]\nFlowify Studio şampiyonu ilan etti\nBoş konuşanların hepsi şimdi bitti..."
    ]
  },
  { 
    title: "Karanlık Gece", 
    desc: "Gece melodileri, kırık kalpler, yalnızlık ve hüzünlü akorlar.", 
    icon: "🌙",
    templates: [
      "[Chorus]\nKaranlık çökünce odama şarkılar başlar\nAkıp gider gözlerden o sessiz, yorgun yaşlar\n{playerName} mikrofon başında derdini fısıldar\nŞehrin sokakları yine karanlıkta fısıldar\n\n[Verse 1]\nGecenin rengi lacivert, loş bir ışık altında\nKafamda sorular, dertler omuzlarımda\nEski dostlar hani nerdeler şimdi tek başımayım\nDoğru mu yanlış mı bilmem, bir boşluğun kıyısındayım\nYağmur yağar cama melodik bir hüzün gibi\nGeçip gidiyor yıllar rüzgardaki toz gibi\n\n[Chorus]\nKaranlık çökünce odama şarkılar başlar\nAkıp gider gözlerden o sessiz, yorgun yaşlar\n{playerName} mikrofon başında derdini fısıldar\nŞehrin sokakları yine karanlıkta fısıldar\n\n[Outro]\nFlowify melankoli hattı sonlandı\nYüreğim bu gece ritimle harmanlandı..."
    ]
  },
  { 
    title: "Sert Dissleşme", 
    desc: "Rakiplere diss atan acımasız punchlinelar, agresif kafiyeler ve sert flowlar.", 
    icon: "🔥",
    templates: [
      "[Chorus]\nPunchlar patlar ardı ardına hiç durmadan\nKimse dayanamaz bana hile hurda katmadan\n{playerName} sahnede, dissler havada uçuşur\nTüm rakipler köşesinde çaresizce büzüşür!\n\n[Verse 1]\nKlavye başında aslan kesilen zavallılar\nKarşıma çıkınca anında kedi gibi pusarlar\nBoş lafı bırak, gel mikrofon başına kapışalım\nBakalım kim gerçek şair, yoksa boşuna mı yarışalım?\nBenim liriklerim kurşun gibi deler geçer hedefin ortasını\nTopla bence şimdiden o derme çatma tasını tarağını\n\n[Chorus]\nPunchlar patlar ardı ardına hiç durmadan\nKimse dayanamaz bana hile hurda katmadan\n{playerName} sahnede, dissler havada uçuşur\nTüm rakipler köşesinde çaresizce büzüşür!\n\n[Outro]\nFlowify Studio dersi bitirdi\nHaddini bilmeyen herkes yerini öğrendi..."
    ]
  }
];

const PROCESSING_STEPS = [
  "Ritim altyapısı dizayn ediliyor...",
  "Dinamik 808 sub-bass dalgaları kalibre ediliyor...",
  "Lirik kafiye şeması sentezleniyor...",
  "Vokal kompresör ayarları ve mastering yapılıyor..."
];

const PauseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="4" x2="18" y2="20" />
    <line x1="6" y1="4" x2="6" y2="20" />
  </svg>
);

export const Studio: React.FC<Props> = ({ player, updateStat, spendEnergy, onClose }) => {
  // Navigation & Creation State
  const [songName, setSongName] = useState('');
  const [storyPrompt, setStoryPrompt] = useState('');
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'setup' | 'generating' | 'preview'>('setup');
  
  // Real-time Synthesizer parameters (Mixer)
  const [bpm, setBpm] = useState(130);
  const [bassLevel, setBassLevel] = useState(80);
  const [synthVol, setSynthVol] = useState(70);
  const [reverbValue, setReverbValue] = useState(50);

  // AI Preset State
  const [aiPreset, setAiPreset] = useState<any>({
    bpm: 120,
    bassStyle: "heavy-drill",
    chordProgression: [57, 53, 52, 55],
    hihatStyle: "trap-rolls",
    melodySpeed: 1
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafidRef = useRef<number | null>(null);

  // Completed Track Meta
  const [lyricsText, setLyricsText] = useState('');
  const [isSavingTrack, setIsSavingTrack] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Audio Sequencer Refs & State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);

  // Processing step timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'generating') {
      setCurrentStepIndex(0);
      interval = setInterval(() => {
        setCurrentStepIndex(prev => (prev + 1) % PROCESSING_STEPS.length);
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSynthesizer();
    };
  }, []);

  const notify = (message: string, type: 'success' | 'error' | 'info') => {
    window.dispatchEvent(new CustomEvent('flowify-notify', { detail: { message, type } }));
  };

  const handleSelectRecipe = (idx: number) => {
    setSelectedThemeIdx(idx);
    const theme = SPEC_THEMES[idx];
    setStoryPrompt(theme.desc);
    if (!songName.trim()) {
      setSongName(`${theme.title} Başyapıtı`);
    }
  };

  const startSynthesizer = () => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create AnalyserNode for Visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      // Master output volume limit
      const masterLimiter = ctx.createGain();
      masterLimiter.gain.value = 0.45;
      masterLimiter.connect(analyser);
      analyser.connect(ctx.destination);

      const targetBpm = bpm || aiPreset?.bpm || 120;
      const stepTime = 60 / targetBpm / 2; // 8th notes
      currentStepRef.current = 0;

      const scheduleNextStep = () => {
        const time = ctx.currentTime;
        const step = currentStepRef.current;

        // Kick Drum & 808 Slide on beat 0, 4, 8, 12... (quarter notes on/off beats)
        const isKickStep = aiPreset?.bassStyle === "fast-double" 
          ? (step % 4 === 0 || step % 6 === 0) 
          : (step % 4 === 0);

        if (isKickStep) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterLimiter);

          osc.type = 'sawtooth';
          // Low-pass filter for massive deep 808 slide feel
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(140, time);
          filter.frequency.exponentialRampToValueAtTime(35, time + 0.4);

          osc.disconnect(gain);
          osc.connect(filter);
          filter.connect(gain);

          // Deep frequencies base pitch
          const rootMidi = aiPreset?.chordProgression?.[Math.floor(step / 4) % 4] || 57;
          const midiBase = rootMidi - 24; 
          const freq = Math.pow(2, (midiBase - 69) / 12) * 440;
          
          osc.frequency.setValueAtTime(freq * 2, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.3);

          gain.gain.setValueAtTime((bassLevel / 100) * 0.95, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

          osc.start(time);
          osc.stop(time + 0.4);
        }

        // Ticking Trap HiHats click on steps
        const isHihatStep = aiPreset?.hihatStyle === "dotted"
          ? (step % 3 === 0)
          : (aiPreset?.hihatStyle === "straight-8th" ? (step % 2 === 0) : (step % 2 === 1 || Math.random() > 0.4));

        if (isHihatStep) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterLimiter);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(12000, time);
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

          osc.start(time);
          osc.stop(time + 0.06);
        }

        // Catchy Melodic Plug-Synth chords (Plucks)
        const isMelodyStep = step % 4 === 2 || (step % 8 === 0 && Math.random() > 0.7);
        if (isMelodyStep) {
          const synthOsc = ctx.createOscillator();
          const synthGain = ctx.createGain();
          
          // Optional delay node for Reverb Simulation
          const delayNode = ctx.createDelay();
          const feedback = ctx.createGain();
          
          delayNode.delayTime.value = (reverbValue / 100) * 0.4;
          feedback.gain.value = (reverbValue / 100) * 0.55;

          synthOsc.connect(synthGain);
          
          if (reverbValue > 10) {
            synthGain.connect(delayNode);
            delayNode.connect(feedback);
            feedback.connect(delayNode);
            delayNode.connect(masterLimiter);
          }
          synthGain.connect(masterLimiter);

          synthOsc.type = 'sine';

          // Load dynamic chord progressions
          const chordRootMap = aiPreset?.chordProgression || [57, 57, 53, 53, 52, 52, 55, 59];
          const chordIndex = Math.floor(step / 4) % chordRootMap.length;
          const rootMidi = chordRootMap[chordIndex];
          
          // Generate simple Arpeggio notes (Root -> 3rd -> 5th -> Octave)
          const offsets = [0, 3, 7, 12, 15]; // Minor
          const offsetIdx = step % offsets.length;
          const noteMidi = rootMidi + offsets[offsetIdx];
          const noteFreq = Math.pow(2, (noteMidi - 69) / 12) * 440;

          synthOsc.frequency.setValueAtTime(noteFreq, time);
          
          synthGain.gain.setValueAtTime((synthVol / 100) * 0.22, time);
          synthGain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

          synthOsc.start(time);
          synthOsc.stop(time + 0.3);
        }

        currentStepRef.current = (step + 1) % 16;
      };

      // Set ultra stable interval loop using web audio clock scheduler
      let lastScheduledTime = ctx.currentTime;
      
      const runner = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        
        while (lastScheduledTime < audioContextRef.current.currentTime + 0.1) {
          scheduleNextStep();
          lastScheduledTime += stepTime;
        }
        synthIntervalRef.current = setTimeout(runner, 15) as any;
      };

      runner();
      setIsPlaying(true);

      // Start visualizer draw loop with RAF
      setTimeout(drawVisualizer, 50);
    } catch (e) {
      console.error("Audio Context Init Limit", e);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      rafidRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.6;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.82;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.45)');
        grad.addColorStop(1, '#10b981');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };
    draw();
  };

  const stopSynthesizer = () => {
    if (rafidRef.current) {
      cancelAnimationFrame(rafidRef.current);
      rafidRef.current = null;
    }
    if (synthIntervalRef.current) {
      clearTimeout(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsPlaying(false);
  };

  const playLiveSFX = (type: string) => {
    try {
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === '808') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.52);
      } else if (type === 'snare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'scratch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.1);
        osc.frequency.linearRampToValueAtTime(500, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'horn') {
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const gain3 = ctx.createGain();

        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc3.connect(gain3); gain3.connect(ctx.destination);

        osc.type = 'square'; osc2.type = 'square'; osc3.type = 'square';
        osc.frequency.setValueAtTime(392, now); 
        osc2.frequency.setValueAtTime(523, now); 
        osc3.frequency.setValueAtTime(587, now); 

        gain.gain.setValueAtTime(0.18, now);
        gain2.gain.setValueAtTime(0.18, now);
        gain3.gain.setValueAtTime(0.18, now);

        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.start(now); osc.stop(now + 0.75);
        osc2.start(now); osc2.stop(now + 0.75);
        osc3.start(now); osc3.stop(now + 0.75);
      } else if (type === 'yeah') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.3);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(1600, now + 0.25);
        filter.Q.value = 4.0;

        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSynthesizer();
    } else {
      startSynthesizer();
    }
  };

  const handleGenerate = async () => {
    if (!songName.trim()) {
      notify("Şarkına hit olacak bir isim ver!", 'error');
      return;
    }
    if (!storyPrompt.trim() && selectedThemeIdx === null) {
      notify("Bir tema seçmeli ya da hikayeni girmelisin!", 'error');
      return;
    }
    if (player.cash < ECONOMY.LYRIA_COST) {
      notify(`Yetersiz bakiye! Premium stüdyo kaydı için ₺${ECONOMY.LYRIA_COST} gerekli.`, 'error');
      return;
    }

    stopSynthesizer();
    setPhase('generating');
    updateStat('cash', -ECONOMY.LYRIA_COST);

    // Completely offline local generator (instantaneous, no API server required)
    setTimeout(() => {
      try {
        const currentThemeIdx = selectedThemeIdx !== null ? selectedThemeIdx : 0;
        const baseTemplate = SPEC_THEMES[currentThemeIdx].templates[0];
        const customizedLyrics = baseTemplate
          .replaceAll('{playerName}', player.name)
          .replaceAll('Sokaklar soğuk', storyPrompt.length > 5 ? storyPrompt.slice(0, 30) : 'Sokaklar soğuk');

        setLyricsText(customizedLyrics);
        setPresetFallback(currentThemeIdx);
        setPhase('preview');
        notify("Flowify Stüdyo Kaydı Hazır! 🔥", 'success');
      } catch (err) {
        console.error("Local track generation error:", err);
        setPhase('preview');
      }
    }, 1000);
  };

  const setPresetFallback = (themeIdx: number) => {
    const fallbackPresets = [
      { bpm: 135, bassStyle: "heavy-drill", chordProgression: [57, 53, 52, 55], hihatStyle: "trap-rolls", melodySpeed: 1 },
      { bpm: 120, bassStyle: "smooth-trap", chordProgression: [50, 53, 55, 57], hihatStyle: "straight-8th", melodySpeed: 1 },
      { bpm: 95, bassStyle: "melodic", chordProgression: [57, 57, 53, 52], hihatStyle: "dotted", melodySpeed: 0.5 },
      { bpm: 145, bassStyle: "fast-double", chordProgression: [50, 50, 50, 50], hihatStyle: "trap-rolls", melodySpeed: 2 }
    ];
    const picked = fallbackPresets[themeIdx] || fallbackPresets[0];
    setAiPreset(picked);
    setBpm(picked.bpm);
  };

  const handlePublish = async () => {
    if (!lyricsText) return;
    setIsSavingTrack(true);

    try {
      const trackData = {
        id: Date.now().toString(),
        name: songName,
        lyrics: lyricsText,
        bpm: bpm,
        bass: bassLevel,
        synth: synthVol,
        reverb: reverbValue,
        createdAt: Date.now(),
        ownerId: auth.currentUser?.uid || 'anonymous'
      };

      // Save privately to Firestore
      if (auth.currentUser) {
        const trackRef = doc(db, 'users', auth.currentUser.uid, 'tracks', trackData.id);
        await setDoc(trackRef, trackData);
      }

      // Save publicly 
      await addDoc(collection(db, 'public_tracks'), trackData);

      // Refresh other dashboard stats nicely
      window.dispatchEvent(new CustomEvent('aiTrackAdded', { detail: trackData }));
      
      // Calculate fame and listener rewards based on stats
      const luck = Math.floor(Math.random() * 20) + 10;
      const baseGain = (player.flow + player.lyrics + player.rhythm) * (bpm / 10) + luck;

      // Update actual career stats
      updateStat('monthly_listeners', baseGain * 15);

      notify(`"${songName}" başarıyla yayınlandı! +${(baseGain * 15).toLocaleString()} Yeni Dinleyici kazanıldı!`, 'success');
      
      // Clear up states
      stopSynthesizer();
      setPhase('setup');
      setSongName('');
      setStoryPrompt('');
      setSelectedThemeIdx(null);
    } catch (err) {
      console.error(err);
      notify("Yayınlanırken bir hata oluştu.", 'error');
    } finally {
      setIsSavingTrack(false);
    }
  };

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden font-sans">
      {/* HEADER BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex justify-between items-center z-[150] bg-[#090909]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-spotify-green animate-pulse shadow-[0_0_12px_#1DB954]"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.40em] italic leading-none">
            FLOWIFY STUDIO
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
            <CoinIcon className="w-3 h-3 text-spotify-green" />
            <span className="text-xs font-black text-white tabular-nums italic">
              ₺{player.cash.toLocaleString()}
            </span>
          </div>

          {onClose && (
            <button
              onClick={() => {
                stopSynthesizer();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border border-white/5 text-white/50 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-20 pb-24">
        <AnimatePresence mode="wait">
          {/* PHASE 1: SETUP CARD */}
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="px-6 flex flex-col items-center justify-center min-h-[85vh] w-full max-w-sm sm:max-w-md mx-auto py-6"
            >
              {/* BRAND PROMO */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spotify-green/5 border border-spotify-green/10 text-spotify-green text-[10px] font-bold tracking-tight lowercase mb-3">
                  <SparklesIcon className="w-3 h-3" />
                  hit jeneratörü & lirik modelleme.
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter lowercase leading-none">
                  stüdyo kaydı<span className="text-spotify-green">.</span>
                </h2>
                <p className="text-neutral-500 text-[11px] tracking-tight lowercase font-semibold mt-2">
                  lirik sentezi ve analog synth mikseri ile kariyerine yön ver.
                </p>
              </div>

              {/* INPUT CONTAINER */}
              <div className="w-full bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-6 shadow-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#1DB954]/5 blur-3xl rounded-full"></div>
                
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 tracking-tight block lowercase mb-2">şarkının ismi.</label>
                  <input
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    placeholder="yeni hit şarkına bir başlık ver..."
                    className="w-full bg-[#050505] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-semibold focus:border-spotify-green/30 outline-none transition-all placeholder:text-neutral-700"
                  />
                </div>

                {/* Custom direction */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 tracking-tight block lowercase mb-2">şarkının hikayesi veya konusu.</label>
                  <textarea
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    placeholder="sokak kültürü, lüks hayat, dostluklar veya rakiplere diss..."
                    className="w-full bg-[#050505] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-medium focus:border-spotify-green/30 outline-none h-24 resize-none transition-all placeholder:text-neutral-700"
                  />
                </div>

                {/* Selectable directions */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 tracking-tight block lowercase">ritim & lirik konseptleri.</span>
                  <div className="grid grid-cols-2 gap-35">
                    {SPEC_THEMES.map((theme, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectRecipe(idx)}
                        className={`p-3.5 border rounded-2xl text-left transition-all active:scale-95 ${selectedThemeIdx === idx ? 'bg-spotify-green/10 border-spotify-green/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs">{theme.icon}</span>
                          <span className={`text-[11px] font-black tracking-tight lowercase ${selectedThemeIdx === idx ? 'text-spotify-green' : 'text-white'}`}>{theme.title.toLowerCase()}.</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 leading-normal font-semibold lowercase line-clamp-2">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fire Studio */}
                <button
                  onClick={handleGenerate}
                  className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs tracking-tight lowercase mt-2 cursor-pointer duration-200"
                >
                  stüdyoyu ateşle (₺{ECONOMY.LYRIA_COST.toLocaleString()}).
                </button>
              </div>

              {/* STATS MATRIX */}
              <div className="grid grid-cols-3 gap-3 w-full mt-6">
                <div className="bg-[#0a0a0a] p-3.5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[9px] text-neutral-500 font-bold mb-1 tracking-tight lowercase">flow.</div>
                  <div className="text-white font-black text-base">{player.flow}</div>
                </div>
                <div className="bg-[#0a0a0a] p-3.5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[9px] text-neutral-500 font-bold mb-1 tracking-tight lowercase">lirik.</div>
                  <div className="text-white font-black text-base">{player.lyrics}</div>
                </div>
                <div className="bg-[#0a0a0a] p-3.5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[9px] text-neutral-500 font-bold mb-1 tracking-tight lowercase">ritim.</div>
                  <div className="text-white font-black text-base">{player.rhythm}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PHASE 2: GENERATING SCREEN */}
          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 flex flex-col items-center justify-center min-h-[85vh] text-center space-y-8"
            >
              {/* Disc animation */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-spotify-green/15 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative w-40 h-40 bg-zinc-950 border-8 border-white/5 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(29,185,84,0.15)] animate-spin-slow">
                  <DiscIcon className="w-16 h-16 text-spotify-green" />
                  <div className="w-12 h-12 bg-black rounded-full absolute border-4 border-[#111] flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white shadow-[0_0_10px_white]" />
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 max-w-sm mx-auto">
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">SES KAYDI ALINIYOR</h3>
                <p className="text-spotify-green text-[10px] font-black uppercase tracking-[0.2em] h-8 italic">
                  {PROCESSING_STEPS[currentStepIndex]}
                </p>

                {/* Dynamic Loading */}
                <div className="w-36 h-0.5 bg-white/5 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-spotify-green w-1/2 animate-[loading_1.5s_infinite]"></div>
                </div>
              </div>

              {/* Live Waveform graphics */}
              <div className="h-8 flex items-center justify-center gap-1 opacity-40">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-spotify-green rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 80}%`,
                      animationDuration: `${0.3 + Math.random() * 0.7}s`
                    }}
                  ></div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PHASE 3: PLAYBACK AND MIXING PANEL */}
          {phase === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="px-6 flex flex-col items-center justify-center min-h-[85vh] w-full max-w-md mx-auto py-4"
            >
              <div className="w-full bg-gradient-to-b from-[#111] to-[#070707] border border-white/5 rounded-[3rem] p-6 shadow-3xl relative overflow-hidden flex flex-col items-center space-y-6">
                <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-br from-green-500/5 via-blue-500/5 to-transparent pointer-events-none"></div>

                {/* MIX PLAYER CONTROLLER AT TOP */}
                <div className="relative flex flex-col items-center w-full">
                  <div className="relative mb-4 group cursor-pointer" onClick={handleTogglePlay}>
                    <div className={`absolute inset-0 bg-spotify-green/20 rounded-full blur-2xl transition-opacity ${isPlaying ? 'opacity-70' : 'opacity-20'}`}></div>
                    <div className={`relative w-24 h-24 bg-black border-4 border-white/5 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 duration-1000 ${isPlaying ? 'animate-spin-slow border-spotify-green/30' : 'rotate-12 hover:border-white/20'}`}>
                      <div className="w-10 h-10 bg-[#1e1e1e] rounded-full absolute border-3 border-black flex items-center justify-center z-10 shadow-inner">
                        {isPlaying ? (
                          <PauseIcon className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <PlayIcon className="w-3.5 h-3.5 text-spotify-green ml-0.5" />
                        )}
                      </div>
                      <div className="absolute inset-3 border-2 border-white/5 rounded-full opacity-60"></div>
                      <div className="absolute inset-6 border border-white/5 rounded-full opacity-30"></div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tighter lowercase leading-none">{songName.toLowerCase()}.</h2>
                  <p className="text-spotify-green text-[10px] font-bold tracking-tight mt-2 lowercase">flowify analog gold mixing master</p>
                </div>

                {/* LIVE DYNAMIC AUDIO VISUALIZER */}
                <div className="w-full bg-black border border-white/5 rounded-[2rem] p-2 overflow-hidden relative" id="live-frequency-visualizer">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-14 rounded-2xl block cursor-pointer transition-opacity bg-black"
                    width={320}
                    height={70}
                    onClick={handleTogglePlay}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
                      <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest animate-pulse">
                        Ritim Başlatıldığında Dalga Etkinleşir
                      </span>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE SOUND PADS (FLOWPADS) */}
                <div className="w-full" id="flowpads-sfx-soundboard">
                  <div className="text-[10px] text-neutral-500 font-bold tracking-tight mb-2.5 block lowercase text-left">flowpads (canlı overlay ses efektleri)</div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { type: '808', label: '808 🔊', color: 'hover:bg-emerald-500/10 border-emerald-500/15 text-emerald-400 active:bg-emerald-500/20' },
                      { type: 'snare', label: 'snr 🥁', color: 'hover:bg-sky-500/10 border-sky-500/15 text-sky-400 active:bg-sky-500/20' },
                      { type: 'scratch', label: 'scr 💿', color: 'hover:bg-indigo-500/10 border-indigo-500/15 text-indigo-400 active:bg-indigo-500/20' },
                      { type: 'horn', label: 'hrn 🎺', color: 'hover:bg-red-500/10 border-red-500/15 text-red-400 active:bg-red-500/20' },
                      { type: 'yeah', label: 'yah 🗣️', color: 'hover:bg-yellow-500/10 border-yellow-500/15 text-yellow-400 active:bg-yellow-500/20' }
                    ].map((pad) => (
                      <button
                        key={pad.type}
                        onClick={() => playLiveSFX(pad.type)}
                        className={`py-3.5 px-0.5 border rounded-2xl bg-[#090909]/60 text-[9px] font-black tracking-tighter text-center active:scale-90 duration-75 uppercase transition-all shadow-inner cursor-pointer ${pad.color}`}
                        id={`sfx-pad-${pad.type}`}
                      >
                        {pad.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HYBRID INTERACTIVE MIXER BOARD */}
                <div className="w-full bg-black border border-white/5 rounded-[2rem] p-5 space-y-4 relative z-10">
                  <div className="text-[10px] text-neutral-500 font-bold tracking-tight lowercase mb-1 block">dinamik ritim & ses mikseri</div>
                  
                  {/* Tempo BPM slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-tight lowercase text-neutral-400">
                      <span>bpm / şarkı hızı</span>
                      <span className="text-spotify-green tabular-nums">{bpm} bpm</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="165"
                      value={bpm}
                      onChange={(e) => {
                        setBpm(parseInt(e.target.value));
                        if(isPlaying) {
                          setTimeout(startSynthesizer, 30);
                        }
                      }}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-spotify-green"
                    />
                  </div>

                  {/* 808 Bass Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-tight lowercase text-neutral-400">
                      <span>808 bass derinliği</span>
                      <span className="text-spotify-green tabular-nums">%{bassLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bassLevel}
                      onChange={(e) => setBassLevel(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-spotify-green"
                    />
                  </div>

                  {/* Synth melody level slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-tight lowercase text-neutral-400">
                      <span>sentezleyici melodi</span>
                      <span className="text-spotify-green tabular-nums">%{synthVol}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={synthVol}
                      onChange={(e) => setSynthVol(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-spotify-green"
                    />
                  </div>

                  {/* Reverb simulator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-tight lowercase text-neutral-400">
                      <span>reverb / mekan derinliği</span>
                      <span className="text-spotify-green tabular-nums">%{reverbValue}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={reverbValue}
                      onChange={(e) => setReverbValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-spotify-green"
                    />
                  </div>
                </div>

                {/* FLOATING TEXT SÖZLER */}
                <div className="w-full bg-black border border-white/5 p-5 rounded-[2rem]">
                  <span className="text-[10px] text-neutral-500 font-bold tracking-tight block mb-2 lowercase">lirik akışı.</span>
                  <div className="max-h-[140px] overflow-y-auto pr-1 no-scrollbar text-sm lowercase text-white/90 leading-relaxed font-bold space-y-2.5 text-center">
                    {lyricsText.split('\n').map((line, i) => (
                      <p key={i} className="mb-1 text-center">
                        {line.trim() ? line.toLowerCase() : '🎵'}
                      </p>
                    ))}
                  </div>
                </div>

                {/* DECISION ACTION HUB GRID */}
                <div className="grid grid-cols-2 gap-3.5 w-full relative z-10">
                  <button
                    onClick={() => {
                      stopSynthesizer();
                      setPhase('setup');
                    }}
                    className="py-4.5 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 font-bold text-xs lowercase tracking-tight hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-center"
                  >
                    yeniden yaz.
                  </button>
                  
                  <button
                    onClick={handlePublish}
                    disabled={isSavingTrack || !songName.trim()}
                    className="py-4.5 rounded-2xl bg-spotify-green text-black font-black text-xs lowercase tracking-tight shadow-[0_10px_30px_rgba(29,185,84,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    {isSavingTrack ? 'yayınlanıyor...' : 'yayınla gitsin.'}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
