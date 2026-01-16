
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

        <div className="relative z-10 w-full max-w-sm bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center">
            
            {/* Step Indicators */}
            <div className="flex gap-1.5 mb-8">
                {slides.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                    ></div>
                ))}
            </div>

            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-tr from-white/10 to-white/5 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6 ring-1 ring-white/10">
                {current.icon}
            </div>

            {/* Content */}
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">{current.title}</h2>
            <p className="text-neutral-300 text-sm font-medium leading-relaxed mb-4 min-h-[80px]">
                {current.desc}
            </p>
            <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/5 mb-8">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{current.sub}</span>
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
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                {step < slides.length - 1 ? 'DEVAM ET' : 'BAŞLAYALIM'}
            </button>

        </div>
    </div>
  );
};
