import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Props {
  onComplete: (score: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const DJScratch: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);

  // Turntable physics states
  const isDragging = useRef(false);
  const currentAngle = useRef(0); // Current angle of the vinyl (0 to 2PI)
  const lastMouseAngle = useRef(0);
  const velocity = useRef(0); // Rotational velocity
  const friction = 0.96; // Inertia friction

  // Beat zone parameters
  const targetZoneAngle = useRef(0); // Center angle of the moving green zone
  const zoneSize = useRef(Math.PI / 2.6); // Wedge size of the green sweet segment (~70 degrees, much more prominent!)
  const zoneVelocity = useRef(0.006); // Extremely slow starting speed
  const nextChangeTime = useRef(0);

  // Tracking metrics
  const totalTicks = useRef(0);
  const correctTicks = useRef(0);
  const particles = useRef<Particle[]>([]);
  const flashes = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);
  const animationFrameId = useRef<number>(0);
  const lastVelocities = useRef<number[]>([]);

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
      totalTicks.current += 1;

      // 1. Kinetic physics for the vinyl record
      if (!isDragging.current) {
        currentAngle.current += velocity.current;
        velocity.current *= friction;
      } else {
        // Momentum calculation during drag
        velocity.current *= 0.5;
      }

      // Record velocities to track dynamic back-and-forth scrubbing
      if (isDragging.current) {
        lastVelocities.current.push(velocity.current);
      } else {
        lastVelocities.current.push(0);
      }
      if (lastVelocities.current.length > 20) {
        lastVelocities.current.shift();
      }

      // Assess raw scratching gesture: there must be clear forward (+) and backward (-) shifts
      let maxPositive = 0;
      let maxNegative = 0;
      lastVelocities.current.forEach(v => {
        if (v > 0.003) maxPositive = Math.max(maxPositive, v);
        if (v < -0.003) maxNegative = Math.max(maxNegative, -v);
      });
      // A genuine manual scratch implies rapid sign-reversals in velocity
      const isActuallyScratching = maxPositive > 0.006 && maxNegative > 0.006;

      // Keep angles in [0, 2*PI] boundary range
      currentAngle.current = (currentAngle.current + Math.PI * 2) % (Math.PI * 2);

      // 2. Drive the target green sector drift with slower, more deliberate and highly visible movements
      const now = performance.now();
      if (now > nextChangeTime.current) {
        const rand = Math.random();
        if (rand < 0.4) {
          // Slow reverse scratch drift
          zoneVelocity.current = -0.007 - Math.random() * 0.005;
          nextChangeTime.current = now + 1200 + Math.random() * 1000;
        } else if (rand < 0.8) {
          // Slow forward scratch drift
          zoneVelocity.current = 0.007 + Math.random() * 0.005;
          nextChangeTime.current = now + 1200 + Math.random() * 1000;
        } else {
          // Organic tiny sway
          zoneVelocity.current = (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003);
          nextChangeTime.current = now + 2000 + Math.random() * 1500;
        }
      }

      targetZoneAngle.current += zoneVelocity.current;
      targetZoneAngle.current = (targetZoneAngle.current + Math.PI * 2) % (Math.PI * 2);

      // 3. Collision / Alignment checking
      // Detect if user's touch (lastMouseAngle) is inside the moving highlighted target zone wedge
      let fingerAngle = lastMouseAngle.current;
      fingerAngle = (fingerAngle + Math.PI * 2) % (Math.PI * 2);

      let angleDiff = Math.abs(fingerAngle - targetZoneAngle.current);
      if (angleDiff > Math.PI) {
        angleDiff = Math.PI * 2 - angleDiff;
      }

      const isFingerInZone = angleDiff <= zoneSize.current / 2;
      const inZone = isDragging.current && isFingerInZone && isActuallyScratching;

      // Update scoring
      if (inZone) {
        correctTicks.current += 1.5; // Slightly faster accumulation when perfectly tracking
      }
      
      const currentAccuracy = Math.min(100, Math.floor((correctTicks.current / totalTicks.current) * 100));
      setScore(currentAccuracy);

      if (inZone) {
        // Emit high-fidelity sparks from under player's current dragging finger position
        const w = canvas.width;
        const h = canvas.height;
        const cX = w / 2;
        const cY = h / 2 + (h * 10 / 580);
        const minDim = Math.min(w, h);
        const rVinyl = minDim * 0.302;
        
        // Spawn sparks locally near finger radius
        const fX = cX + Math.cos(fingerAngle) * (rVinyl * 0.82);
        const fY = cY + Math.sin(fingerAngle) * (rVinyl * 0.82);

        if (Math.random() > 0.2) {
          spawnSparks(fX, fY);
        }
      }

      // Update camera flashes inside the loop
      const w = canvas.width;
      const h = canvas.height;
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

      // 4. Render Deck & Audio Visual elements
      drawDeck(ctx, canvas.width, canvas.height, inZone);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      clearInterval(gameTimer);
    };
  }, [gameState]);

  // Handle completion on expiration
  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      setGameState('ended');
      const finalPercentageScore = Math.min(100, Math.floor((correctTicks.current / totalTicks.current) * 100));
      setTimeout(() => {
        onComplete(finalPercentageScore);
      }, 0);
    }
  }, [timeLeft, gameState, onComplete]);

  // Helper Spark emitter
  const spawnSparks = (x: number, y: number) => {
    const activeColors = ['#ec4899', '#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 4.2;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: activeColors[Math.floor(Math.random() * activeColors.length)],
        size: 1.5 + Math.random() * 2.5,
        alpha: 1.0,
      });
    }
  };

  const getAngle = (clientX: number, clientY: number): number => {
    if (!canvasRef.current) return 0;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2 + 10;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    return Math.atan2(y, x);
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== 'playing') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const angle = getAngle(clientX, clientY);
    isDragging.current = true;
    lastMouseAngle.current = angle;
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || gameState !== 'playing') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const angle = getAngle(clientX, clientY);
    let diff = angle - lastMouseAngle.current;

    // Handle jump-over-boundary angles
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    currentAngle.current = (currentAngle.current + diff + Math.PI * 2) % (Math.PI * 2);
    velocity.current = diff; // rotational momentum momentum
    lastMouseAngle.current = angle;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Turn Deck drawing function
  const drawDeck = (ctx: CanvasRenderingContext2D, w: number, h: number, inZone: boolean) => {
    // 1. Premium deep carbon-black chassis background
    ctx.fillStyle = '#010102';
    ctx.fillRect(0, 0, w, h);

    // Decorative grid markings for an industrial, structural tech look
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.015)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // 2. Beautiful faint matrix/digital lines (replacing graffiti tags)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#10b981'; // subtle green digital rails
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.12); ctx.lineTo(w * 0.08, h * 0.22);
    ctx.moveTo(w * 0.08, h * 0.12); ctx.lineTo(w * 0.24, h * 0.12);
    ctx.moveTo(w * 0.18, h * 0.22); ctx.lineTo(w * 0.24, h * 0.22);
    ctx.stroke();
    ctx.restore();

    // 3. Render exploding green camera flashes
    flashes.current.forEach(f => {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      const flashGlow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size);
      flashGlow.addColorStop(0, '#ffffff');
      flashGlow.addColorStop(0.3, 'rgba(16, 185, 129, 0.8)');
      flashGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flashGlow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const cX = w / 2;
    const cY = h / 2 - 12;
    const minDim = Math.min(w, h);
    
    // Proportional dimensions
    const rPlatter = minDim * 0.36; 
    const rVinyl = minDim * 0.315;
    const rLabel = minDim * 0.088; 

    // Sound Equalizer Bars (Left & Right reactive indicators in emerald green)
    ctx.save();
    ctx.fillStyle = inZone ? 'rgba(0, 255, 136, 0.18)' : 'rgba(16, 185, 129, 0.06)';
    for (let i = 0; i < 16; i++) {
      const barHeight = 4 + Math.abs(Math.sin(i * 0.35 + performance.now() * (inZone ? 0.015 : 0.004))) * (inZone ? 45 : 12);
      // Left bars
      ctx.fillRect(8, h * 0.24 + i * 16, barHeight, 4);
      // Right bars
      ctx.fillRect(w - 8 - barHeight, h * 0.24 + i * 16, barHeight, 4);
    }
    ctx.restore();

    // 4. Draw outer glowing metal platter ring
    ctx.save();
    ctx.shadowBlur = inZone ? 24 : 12;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#08080a';
    ctx.strokeStyle = inZone ? '#00ff88' : 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cX, cY, rPlatter, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Platter metallic outer frame details
    ctx.strokeStyle = '#141416';
    ctx.lineWidth = 2;
    ctx.strokeRect(cX - rPlatter - 12, cY - rPlatter - 12, (rPlatter + 12) * 2, (rPlatter + 12) * 2);

    // Dynamic pitch slider control
    ctx.fillStyle = '#101012';
    ctx.fillRect(cX + rPlatter * 0.84, cY - rPlatter * 0.65, 14, rPlatter * 1.3);
    const sliderPos = cY - rPlatter * 0.3 + Math.sin(performance.now() * 0.003) * (rPlatter * 0.2);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cX + rPlatter * 0.84 - 2, sliderPos, 18, 10);

    // 5. Draw Active Highlighting Scratch Wedge (Slower & Highly Prominent Neon Target Corridor)
    ctx.save();
    const zoneCenter = targetZoneAngle.current;
    const hSize = zoneSize.current / 2;

    const zoneGradient = ctx.createRadialGradient(cX, cY, rVinyl * 0.3, cX, cY, rVinyl);
    zoneGradient.addColorStop(0, 'rgba(16, 185, 129, 0.01)');
    zoneGradient.addColorStop(0.5, inZone ? 'rgba(0, 255, 136, 0.45)' : 'rgba(16, 185, 129, 0.32)');
    zoneGradient.addColorStop(1, inZone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.08)');

    ctx.fillStyle = zoneGradient;
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.arc(cX, cY, rVinyl, zoneCenter - hSize, zoneCenter + hSize);
    ctx.closePath();
    ctx.fill();

    // Glowing Neon borders for zone wedge (Emerald Theme)
    ctx.strokeStyle = inZone ? '#00ff88' : '#10b981';
    ctx.lineWidth = 6; // Thicker border for better visibility
    ctx.beginPath();
    ctx.arc(cX, cY, rVinyl, zoneCenter - hSize, zoneCenter + hSize);
    ctx.stroke();

    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = inZone ? '#a6ffc9' : '#55f0b5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(cX + Math.cos(zoneCenter - hSize) * rVinyl, cY + Math.sin(zoneCenter - hSize) * rVinyl);
    ctx.moveTo(cX, cY);
    ctx.lineTo(cX + Math.cos(zoneCenter + hSize) * rVinyl, cY + Math.sin(zoneCenter + hSize) * rVinyl);
    ctx.stroke();
    ctx.restore();

    // 6. Draw 3D Grooved Vinyl Record Platter
    ctx.save();
    const radVinylGrad = ctx.createRadialGradient(cX, cY, rLabel, cX, cY, rVinyl);
    radVinylGrad.addColorStop(0, '#020202');
    radVinylGrad.addColorStop(0.85, '#0a0a0d');
    radVinylGrad.addColorStop(0.97, '#121217');
    radVinylGrad.addColorStop(1, '#020203');
    ctx.fillStyle = radVinylGrad;
    ctx.beginPath();
    ctx.arc(cX, cY, rVinyl, 0, Math.PI * 2);
    ctx.fill();

    // Stylized fine circular grooves on record
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    for (let g = rLabel + 4; g < rVinyl - 4; g += 3.5) {
      ctx.lineWidth = g % 7 === 0 ? 0.8 : 0.3;
      ctx.beginPath();
      ctx.arc(cX, cY, g, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dynamic rotating metallic cones reflecting light
    const rotRef = currentAngle.current;
    for (let i = 0; i < 4; i++) {
      const angle = rotRef + (i * Math.PI) / 2;
      ctx.save();
      const coneGrad = ctx.createLinearGradient(
        cX, cY, 
        cX + Math.cos(angle) * rVinyl, 
        cY + Math.sin(angle) * rVinyl
      );
      coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
      coneGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      coneGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = coneGrad;

      ctx.beginPath();
      ctx.moveTo(cX, cY);
      ctx.arc(cX, cY, rVinyl, angle - 0.2, angle + 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 7. Center Record Sticker Label (Green themed without text)
    ctx.fillStyle = inZone ? '#00ff88' : '#10b981';
    ctx.beginPath();
    ctx.arc(cX, cY, rLabel, 0, Math.PI * 2);
    ctx.fill();

    // Label geometric design lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cX, cY, rLabel * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // Center shiny steel spindle core
    ctx.fillStyle = '#020204';
    ctx.beginPath();
    ctx.arc(cX, cY, minDim * 0.016, 0, Math.PI * 2);
    ctx.fill();

    const pegGrad = ctx.createRadialGradient(cX - 2, cY - 2, 1, cX, cY, minDim * 0.016);
    pegGrad.addColorStop(0, '#ffffff');
    pegGrad.addColorStop(1, '#4b5563');
    ctx.fillStyle = pegGrad;
    ctx.beginPath();
    ctx.arc(cX, cY, minDim * 0.011, 0, Math.PI * 2);
    ctx.fill();

    // Radial tracker indicator marker line on the record (with no branding words)
    const needleAngle = currentAngle.current;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cX + Math.cos(needleAngle) * rLabel, cY + Math.sin(needleAngle) * rLabel);
    ctx.lineTo(cX + Math.cos(needleAngle) * rVinyl * 0.98, cY + Math.sin(needleAngle) * rVinyl * 0.98);
    ctx.stroke();
    ctx.restore();

    // 8. Visual Finger Print locator glow when dragging (styled in bright emerald green)
    if (isDragging.current) {
      ctx.save();
      const dragAngle = lastMouseAngle.current;
      const fingerRadius = rVinyl * 0.78;
      const fX = cX + Math.cos(dragAngle) * fingerRadius;
      const fY = cY + Math.sin(dragAngle) * fingerRadius;

      const fGlow = ctx.createRadialGradient(fX, fY, 2, fX, fY, rLabel * 0.95);
      fGlow.addColorStop(0, '#00ff88');
      fGlow.addColorStop(0.35, 'rgba(16, 185, 129, 0.5)');
      fGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fGlow;
      ctx.beginPath();
      ctx.arc(fX, fY, rLabel * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Curved Premium Tonearm (S-Arm style)
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#9ca3af'; // metallic silver
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    const armBaseX = cX + rPlatter * 0.95;
    const armBaseY = cY - rPlatter * 0.95;
    ctx.moveTo(armBaseX, armBaseY);
    // Smooth custom s-curve down onto record outer groove
    ctx.quadraticCurveTo(armBaseX - 35, armBaseY + 110, cX + rPlatter * 0.64, cY + rPlatter * 0.18);
    ctx.stroke();

    // Cartridge headshell assembly
    ctx.fillStyle = '#101014'; // carbon dark frame
    ctx.fillRect(cX + rPlatter * 0.60, cY + rPlatter * 0.14, 15, 11);
    ctx.fillStyle = inZone ? '#00ff88' : '#047857'; // active tracking laser LED status
    ctx.fillRect(cX + rPlatter * 0.60 + 3, cY + rPlatter * 0.14 + 7, 3, 3);
    ctx.restore();

    // 10. Reactive Sound Waveform in Emerald Green (No text here)
    ctx.save();
    ctx.strokeStyle = inZone ? '#00ff88' : 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let xOffset = 0; xOffset < w; xOffset += 6) {
      const heightAmp = inZone ? 24 : 3;
      const speedScale = inZone ? 0.035 : 0.007;
      const wavY = (h - 90) + Math.sin(xOffset * 0.07 + performance.now() * speedScale) * heightAmp;
      if (xOffset === 0) {
        ctx.moveTo(xOffset, wavY);
      } else {
        ctx.lineTo(xOffset, wavY);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Spark Particles system
    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.022;
      if (p.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    particles.current = particles.current.filter(p => p.alpha > 0);

    // 11. Solid Audience silhouette layering + glowing neon stage rails
    ctx.fillStyle = '#020203';
    ctx.fillRect(0, h - 55, w, 55);

    // Glowing stage lights behind crowd
    const stageGlow = ctx.createLinearGradient(0, h - 55, 0, h);
    stageGlow.addColorStop(0, inZone ? 'rgba(0, 255, 136, 0.15)' : 'rgba(16, 185, 129, 0.05)');
    stageGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = stageGlow;
    ctx.fillRect(0, h - 55, w, 55);

    ctx.fillStyle = '#000001'; 
    for (let x = 8; x < w; x += 22) {
      const swingH = Math.sin(x * 0.12 + performance.now() * 0.003) * 14 + 18;
      ctx.beginPath();
      ctx.ellipse(x, h - 15, 7, swingH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic warning border flash on fail
    if (isDragging.current && !inZone) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.02)';
      ctx.fillRect(0, 0, w, h);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center overflow-hidden touch-none select-none font-sans">
      {gameState === 'intro' ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-950 via-black to-black">
          <span className="text-8xl font-black text-[#10b981] mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.65)]">{countdown}</span>
          <h2 className="text-2xl font-black text-white leading-none tracking-tight mb-2 uppercase">STÜDYO DJ SCRATCH!</h2>
          <p className="text-neutral-400 text-xs font-bold leading-relaxed max-w-xs uppercase tracking-widest">
            YEŞİL HEDEF BÖLGEYE DOKUN VE <br/>
            PARMAĞINI HIZLICA <span className="text-[#10b981]">BİR İLERİ BİR GERİ SÜRT!</span>
          </p>
        </div>
      ) : (
        <>
          {/* Active play HUD overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10 font-sans">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 tracking-tight lowercase">mini-game • turntable scratch master</span>
              <h2 className="text-xl font-extrabold text-white tracking-tighter leading-none lowercase">
                stüdyo scratch şov.
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-[#10b981] leading-none">{timeLeft}s</div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">STÜDYO ENERJİSİ: %{score}</span>
            </div>
          </div>
        </>
      )}

      <canvas
        ref={canvasRef}
        width={380}
        height={580}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full max-w-md max-h-[800px] border border-white/5 rounded-3xl overflow-hidden bg-black shadow-2xl"
      />
    </div>
  );
};
