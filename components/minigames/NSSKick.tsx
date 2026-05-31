import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playWinSound, playErrorSound } from '../../services/sfx';

interface Props {
  onComplete: (score: number) => void;
}

interface FloatingBubble {
  id: number;
  word: string;
  isCorrect: boolean;
  xPercent: number; // 0 to 100
  y: number; // pixels up from bottom
  speedY: number;
  size: number;
  color: string;
  scale: number;
  angle: number;
  rotSpeed: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

// Creative turkish hiphop ryhming presets
interface RhymePreset {
  targetWord: string;
  suffix: string; // Turkish rhyme suffix definition
  correctWords: string[];
  incorrectWords: string[];
}

const RHYME_PRESETS: RhymePreset[] = [
  {
    targetWord: "sokak (ends with -ak)",
    suffix: "-ak",
    correctWords: ["durak", "yasak", "uzak", "tuzak", "kuşak", "kazak", "bıçak", "uçak", "korkak", "alçak"],
    incorrectWords: ["kral", "kalem", "ritim", "gece", "flow", "mic", "sahne", "konser", "para", "hece"]
  },
  {
    targetWord: "kral (ends with -al)",
    suffix: "-al",
    correctWords: ["kural", "masal", "kartal", "sanal", "kanal", "çatal", "sakal", "daral", "legal", "çalan"],
    incorrectWords: ["sokak", "durak", "uzak", "kalem", "ritim", "gece", "tempo", "melodi", "büyük", "flex"]
  },
  {
    targetWord: "gece (ends with -ece)",
    suffix: "-ece",
    correctWords: ["hece", "bilmece", "derece", "sadece", "bence", "türkçe", "gerekçe", "ince", "önce"],
    incorrectWords: ["sokak", "kral", "rap", "beat", "şov", "tempo", "para", "altın", "zincir", "tuzak"]
  },
  {
    targetWord: "sanat (ends with -at)",
    suffix: "-at",
    correctWords: ["fırsat", "hayat", "rahat", "bizzat", "katbat", "ruhsat", "vaat", "fayda", "saat"],
    incorrectWords: ["sokak", "hece", "zincir", "ritim", "parlak", "mikrofon", "stüdyo", "bass", "sound", "bar"]
  }
];

export const NSSKick: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0); // overall percentage
  const [streak, setStreak] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'perfect' | 'miss' | ''>('');

  // Suffix/rhyme parameters for current session
  const [currentPreset, setCurrentPreset] = useState<RhymePreset>(RHYME_PRESETS[0]);

  // Bubble states
  const bubbles = useRef<FloatingBubble[]>([]);
  const sparks = useRef<Spark[]>([]);
  const bubbleIdCounter = useRef(0);
  const animationFrameId = useRef<number>(0);
  const strokeOffset = useRef(0);
  const flashes = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);

  // Gameplay metrics
  const correctHits = useRef(0);
  const totalCorrectSpawns = useRef(0);

  // Choose preset once on component mount
  useEffect(() => {
    const randomPreset = RHYME_PRESETS[Math.floor(Math.random() * RHYME_PRESETS.length)];
    setCurrentPreset(randomPreset);
  }, []);

  // Intro countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Main gameplay loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Timer countdown
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;
      const now = performance.now();
      strokeOffset.current = now * 0.0035;

      // 1. Spawning dynamic word bubbles
      if (Math.random() < 0.04 && bubbles.current.length < 7) {
        const isTarget = Math.random() < 0.45; // 45% chance to spawn rhyming word
        let selectedWordIndex = 0;
        let word = "";

        if (isTarget) {
          selectedWordIndex = Math.floor(Math.random() * currentPreset.correctWords.length);
          word = currentPreset.correctWords[selectedWordIndex];
          totalCorrectSpawns.current += 1;
        } else {
          selectedWordIndex = Math.floor(Math.random() * currentPreset.incorrectWords.length);
          word = currentPreset.incorrectWords[selectedWordIndex];
        }

        bubbleIdCounter.current += 1;
        
        // Random neon color sets
        const neonColors = [
          'rgba(168, 85, 247, 0.85)', // purple
          'rgba(34, 211, 238, 0.85)',  // cyan
          'rgba(236, 72, 153, 0.85)',  // pink
          'rgba(245, 158, 11, 0.85)'   // amber
        ];
        const bubbleColor = isTarget ? 'rgba(16, 185, 129, 0.9)' : neonColors[Math.floor(Math.random() * neonColors.length)];

        bubbles.current.push({
          id: bubbleIdCounter.current,
          word,
          isCorrect: isTarget,
          xPercent: 12 + Math.random() * 76,
          y: h + 30, // start just below the canvas edge
          speedY: 1.8 + Math.random() * 2.1,
          size: 44 + Math.max(0, word.length * 3.5), // fit padding
          color: bubbleColor,
          scale: 1,
          angle: (Math.random() - 0.5) * 0.3,
          rotSpeed: (Math.random() - 0.5) * 0.03
        });
      }

      // 2. Drive Bubble physics upward
      bubbles.current.forEach((bub, idx) => {
        bub.y -= bub.speedY; // move up!
        bub.angle += bub.rotSpeed;

        // Auto remove when off the top edge
        if (bub.y < -60) {
          if (bub.isCorrect) {
            // Lost a valid correct rhyme, lose trace streak
            setStreak(0);
          }
          bubbles.current.splice(idx, 1);
        }
      });

      // 3. Drive burst sparks/particles
      sparks.current.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05; // gravity on sparks
        s.alpha -= 0.025;
      });
      sparks.current = sparks.current.filter(s => s.alpha > 0);

      // Procedural flashes from back crowds
      if (Math.random() > 0.94) {
        flashes.current.push({
          x: Math.random() * w,
          y: h * 0.1 + Math.random() * h * 0.35,
          size: 15 + Math.random() * 20,
          alpha: 1.0,
        });
      }
      flashes.current.forEach(f => {
        f.alpha -= 0.05;
      });
      flashes.current = flashes.current.filter(f => f.alpha > 0);

      // 4. Draw concert visual background & game scene
      drawScene(ctx, w, h);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      clearInterval(gameTimer);
    };
  }, [gameState, currentPreset]);

  // Final performance score calculator
  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      setGameState('ended');
      playWinSound();
      
      // Calculate realistic final performance accuracy percentage
      const finalPercentage = Math.min(100, Math.max(10, correctHits.current * 10));
      setTimeout(() => {
        onComplete(finalPercentage);
      }, 100);
    }
  }, [timeLeft, gameState, onComplete]);

  // Click & Tap bubble popping detector
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let cx = 0;
    let cy = 0;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else if ('clientX' in e) {
      cx = (e as React.MouseEvent).clientX - rect.left;
      cy = (e as React.MouseEvent).clientY - rect.top;
    } else {
      return;
    }

    // Scale back coordinates from physical display size to proportional canvas scale
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tapX = cx * scaleX;
    const tapY = cy * scaleY;

    // Check hit intersections with active bubbles
    let hitIndex = -1;
    for (let i = bubbles.current.length - 1; i >= 0; i--) {
      const bub = bubbles.current[i];
      const bubXPix = (bub.xPercent / 100) * canvas.width;
      
      const dx = tapX - bubXPix;
      const dy = tapY - bub.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Hit hitbox is slightly expanded for comfortable mobile tapping
      if (distance < bub.size + 15) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      const popped = bubbles.current[hitIndex];
      bubbles.current.splice(hitIndex, 1); // remove the popped bubble

      const bubXPix = (popped.xPercent / 100) * canvas.width;

      if (popped.isCorrect) {
        // CORRECT RHYME DETECTED!
        playClickSound();
        correctHits.current += 1;
        setStreak(prev => prev + 1);
        setLastFeedback('perfect');
        
        // Accumulate active rating score
        const newScore = Math.min(100, correctHits.current * 10);
        setScore(newScore);

        // Generate glowing matching GREEN burst physics particles
        spawnSparks(bubXPix, popped.y, '#10b981', 18);
        spawnSparks(bubXPix, popped.y, '#34d399', 10);
      } else {
        // WRONG RHYME MISSED FAILURE!
        playErrorSound();
        setStreak(0);
        setLastFeedback('miss');

        // Generate RED failure dust clouds
        spawnSparks(bubXPix, popped.y, '#f43f5e', 14);
        spawnSparks(bubXPix, popped.y, '#e11d48', 8);
      }

      // Brief visual toast feedback timer reset
      const timeout = setTimeout(() => {
        setLastFeedback('');
      }, 700);
      return () => clearTimeout(timeout);
    }
  };

  const spawnSparks = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        sparks.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0, 
          color,
          size: 1.8 + Math.random() * 3.2,
          alpha: 0.95
        });
    }
  };

  const drawScene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const now = performance.now();

    // 1. Stage Lighting Ambient Backdrop
    // Unified black background, graffitis, and camera flashes
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, w, h);

    // 2. Faint Graffiti (subtle urban look, low opacity)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#a855f7'; // purple tags
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw tag: "FLOW" on left side (height around 15% - 30%)
    ctx.beginPath();
    // F
    ctx.moveTo(w * 0.1, h * 0.15); ctx.lineTo(w * 0.1, h * 0.27);
    ctx.moveTo(w * 0.1, h * 0.15); ctx.lineTo(w * 0.18, h * 0.15);
    ctx.moveTo(w * 0.1, h * 0.21); ctx.lineTo(w * 0.16, h * 0.21);
    // L
    ctx.moveTo(w * 0.22, h * 0.15); ctx.lineTo(w * 0.22, h * 0.27); ctx.lineTo(w * 0.28, h * 0.27);
    // O (Rough circle)
    ctx.moveTo(w * 0.36, h * 0.21);
    ctx.arc(w * 0.36, h * 0.21, 25, 0, Math.PI * 2);
    // W
    ctx.moveTo(w * 0.44, h * 0.15);
    ctx.lineTo(w * 0.46, h * 0.27);
    ctx.lineTo(w * 0.49, h * 0.20);
    ctx.lineTo(w * 0.52, h * 0.27);
    ctx.lineTo(w * 0.54, h * 0.15);
    ctx.stroke();

    // Draw tag: "RAP" on right side (height around 40% - 55%)
    ctx.strokeStyle = '#3b82f6'; // blue tags
    ctx.lineWidth = 7;
    ctx.beginPath();
    // R
    ctx.moveTo(w * 0.58, h * 0.4); ctx.lineTo(w * 0.58, h * 0.52);
    ctx.moveTo(w * 0.58, h * 0.4); ctx.bezierCurveTo(w * 0.68, h * 0.38, w * 0.68, h * 0.46, w * 0.58, h * 0.46);
    ctx.moveTo(w * 0.60, h * 0.46); ctx.lineTo(w * 0.67, h * 0.52);
    // A
    ctx.moveTo(w * 0.72, h * 0.52); ctx.lineTo(w * 0.77, h * 0.4); ctx.lineTo(w * 0.82, h * 0.52);
    ctx.moveTo(w * 0.74, h * 0.47); ctx.lineTo(w * 0.80, h * 0.47);
    // P
    ctx.moveTo(w * 0.86, h * 0.4); ctx.lineTo(w * 0.86, h * 0.52);
    ctx.moveTo(w * 0.86, h * 0.4); ctx.bezierCurveTo(w * 0.96, h * 0.38, w * 0.96, h * 0.46, w * 0.86, h * 0.46);
    ctx.stroke();

    // Abstract cool crown
    ctx.strokeStyle = '#fbbf24'; // gold crown
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.31);
    ctx.lineTo(w * 0.42, h * 0.35);
    ctx.lineTo(w * 0.50, h * 0.32);
    ctx.lineTo(w * 0.58, h * 0.35);
    ctx.lineTo(w * 0.55, h * 0.31);
    ctx.lineTo(w * 0.45, h * 0.31);
    ctx.stroke();
    ctx.restore();

    // 3. Render exploding camera flashes
    flashes.current.forEach(f => {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      const flashGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size);
      flashGlow.addColorStop(0, '#ffffff');
      flashGlow.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
      flashGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = flashGlow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Solid Crowd silhouette + hands waving
    ctx.fillStyle = '#0a0a0c'; // Solid dark silhouette color
    ctx.fillRect(0, h - 55, w, 55);

    ctx.fillStyle = '#050507'; // Foreground black crowd layering
    for (let x = 8; x < w; x += 22) {
      const swingHeight = Math.sin(x * 0.1 + strokeOffset.current * 1.6) * 12 + 18;
      ctx.beginPath();
      ctx.ellipse(x, h - 15, 6, swingHeight, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Flying Sparks/Particles of popped actions
    sparks.current.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Render Lyric Bubbles
    bubbles.current.forEach(bub => {
      ctx.save();
      const bX = (bub.xPercent / 100) * w;

      ctx.translate(bX, bub.y);
      ctx.rotate(bub.angle);

      // Bubble Capsule background
      ctx.shadowBlur = 15;
      ctx.shadowColor = bub.color;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeStyle = bub.color;
      ctx.lineWidth = 2.5;

      const cardWidth = bub.size * 1.8;
      const cardHeight = 32;

      ctx.beginPath();
      ctx.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);
      ctx.fill();
      ctx.stroke();

      // Shiny glare highlight on bubble top
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-cardWidth/2 + 4, -cardHeight/2 + 2, cardWidth - 8, 4, 8);
      ctx.stroke();

      // Lyric word typography
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Courier, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0; // reset shadow details for sharp text
      ctx.fillText(bub.word.toUpperCase(), 0, 0.5);

      ctx.restore();
    });

    // 4. Score Combo banner top visual
    if (gameState === 'playing' && streak > 1) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#10b981';
      ctx.fillText(`✖${streak} KAFİYE COMBO!`, w / 2, h - 70);
      ctx.restore();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center overflow-hidden touch-none select-none font-sans">
      {gameState === 'intro' ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-black to-black">
          <span className="text-8xl font-black text-emerald-400 mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(52,211,153,0.65)]">{countdown}</span>
          <h2 className="text-3xl font-black text-white leading-none tracking-tight mb-2 uppercase">KAFİYE AVCISI!</h2>
          <p className="text-neutral-400 text-xs font-bold leading-relaxed max-w-xs uppercase tracking-widest leading-loose">
            Hızla yükselen kelimelere dikkat et! <br />
            Yalnızca başlığa ve ritme <span className="text-emerald-400 font-extrabold">UYGUN OLAN KAFİYELİ KELİMELERİ 🟩</span> patlat! <br />
            Alakasız veya yanlış kelimelere tıklamaktan kaçın!
          </p>
        </div>
      ) : (
        <>
          {/* Active play HUD overlays */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10 select-none">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 tracking-tight uppercase">flow-game • rhyme pop</span>
              <h2 className="text-sm font-extrabold text-white tracking-widest leading-none uppercase flex items-center gap-1">
                KAFİYE ARANAN: <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-black text-xs">{currentPreset.targetWord.toUpperCase()}</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-emerald-400 leading-none">{timeLeft}s</div>
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">skor: %{score}</span>
            </div>
          </div>

          {/* Interactive feedback visual text toasts */}
          {lastFeedback === 'perfect' && (
            <motion.div 
              key={`perf-${now()}`}
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1.2, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 text-emerald-400 font-black text-2xl tracking-tighter select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)] uppercase"
            >
              KAFİYE PATLADI! 💥🎤
            </motion.div>
          )}

          {lastFeedback === 'miss' && (
            <motion.div 
              key={`miss-${now()}`}
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 text-rose-500 font-black text-xl tracking-tighter select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)] uppercase"
            >
              DETONE / KAFİYESİZ! ❌🤦‍♂️
            </motion.div>
          )}
        </>
      )}

      <canvas 
        ref={canvasRef}
        width={380}
        height={580}
        onMouseDown={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="w-full h-full max-w-md max-h-[800px] border border-white/5 rounded-3xl overflow-hidden bg-black shadow-2xlCursor"
      />
    </div>
  );
};

// Simple visual helper function to trigger unique key changes
function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
