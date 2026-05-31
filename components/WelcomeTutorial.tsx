
import React, { useState } from 'react';
import { MicIcon, UsersIcon, TrophyIcon } from './Icons';

interface Props {
  onComplete: () => void;
}

export const WelcomeTutorial: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: "🎧",
      title: "MİKROFON SENDE",
      desc: "Flowify'a hoş geldin. Burası sıradan bir oyun değil, bir kariyer simülasyonu. Yeraltından başlayıp listeleri alt üst etmeye hazır mısın?",
      sub: "HİKAYEN ŞİMDİ BAŞLIYOR"
    },
    {
      icon: <UsersIcon className="w-12 h-12 text-[#1ed760]" />,
      title: "FAN = SEVİYE",
      desc: "Bu oyunda en önemli şey Fan (XP) kazanmaktır. Konser vererek veya Arcade oyunları oynayarak Fan kitleni büyüt. Fan sayın arttıkça seviye atlarsın.",
      sub: "HEDEF: SEVİYE ATLA, ŞEHİRLERİ AÇ"
    },
    {
      icon: <TrophyIcon className="w-12 h-12 text-yellow-500" />,
      title: "HER YERDE KAZAN",
      desc: "Sadece konser vermek zorunda değilsin. Arcade salonundaki mini oyunlarda yüksek skor yaparak da Fan ve Nakit kazanabilirsin. Kendini her alanda geliştir.",
      sub: "ARCADE OYNA, KENDİNİ GELİŞTİR"
    }
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
        
        {/* Background FX */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000_100%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-[280px] bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 shadow-2xl flex flex-col items-center text-center">
            
            {/* Step Indicators */}
            <div className="flex gap-1 mb-6">
                {slides.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`}
                    ></div>
                ))}
            </div>

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-tr from-white/10 to-white/5 rounded-full flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4 ring-1 ring-white/10">
                {current.icon}
            </div>

            {/* Content */}
            <h2 className="text-lg font-black text-white italic tracking-tighter mb-3 uppercase">{current.title}</h2>
            <p className="text-neutral-300 text-[11px] font-medium leading-relaxed mb-3 min-h-[60px]">
                {current.desc}
            </p>
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 mb-6">
                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">{current.sub}</span>
            </div>

            {/* Buttons */}
            <button 
                onClick={() => {
                    if (step < slides.length - 1) {
                        setStep(s => s + 1);
                    } else {
                        onComplete();
                    }
                }}
                className="w-full bg-white text-black font-black py-3 rounded-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                {step < slides.length - 1 ? 'DEVAM ET' : 'BAŞLAYALIM'}
            </button>

        </div>
    </div>
  );
};
