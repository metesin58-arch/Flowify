
import React, { useState } from 'react';
import { GameControllerIcon, GlobeIcon, TrophyIcon } from './Icons';

interface Props {
  onClose: () => void;
}

export const HubTutorial: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: <GlobeIcon className="w-12 h-12 text-blue-400" />,
      title: "ONLINE HUB",
      desc: "Burası oyunun rekabet merkezi. Alt menüden 'Online' sekmesine geçerek gerçek oyuncularla eşleşebilirsin.",
      tip: "Online oyunları oynamak için önce biraz seviye atlamalısın."
    },
    {
      icon: <GameControllerIcon className="w-12 h-12 text-purple-400" />,
      title: "ARCADE SALONU",
      desc: "Beklemek istemiyor musun? 'Arcade' bölümündeki solo oyunları oyna. Hem kendini geliştir hem de Fan (XP) ve Nakit kazan.",
      tip: "Reflex veya Hexagon gibi oyunlar hızlı gelişim için idealdir."
    },
    {
      icon: <TrophyIcon className="w-12 h-12 text-yellow-500" />,
      title: "KUPA & LİDERLİK",
      desc: "Online maç kazandıkça 'Respect' (Kupa) puanın artar. En çok kupası olan MC, liderlik tablosunun tepesine oturur.",
      tip: "Kaybedersen kupaların düşer, dikkatli ol!"
    }
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
        <div className="relative z-10 w-full max-w-sm bg-[#121212] border border-blue-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col items-center text-center">
            
            <div className="flex gap-1.5 mb-8">
                {slides.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`}></div>
                ))}
            </div>

            <div className="w-24 h-24 bg-gradient-to-br from-blue-900/50 to-black rounded-full flex items-center justify-center mb-6 ring-2 ring-blue-500/50 shadow-lg">
                {current.icon}
            </div>

            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">{current.title}</h2>
            <p className="text-neutral-300 text-sm font-medium leading-relaxed mb-6 min-h-[80px]">
                {current.desc}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-8 w-full">
                <span className="text-blue-400 text-[9px] font-black uppercase tracking-wider block mb-1">İPUCU</span>
                <span className="text-neutral-400 text-xs italic">{current.tip}</span>
            </div>

            <button 
                onClick={() => {
                    if (step < slides.length - 1) setStep(s => s + 1);
                    else onClose();
                }}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-lg"
            >
                {step < slides.length - 1 ? 'DEVAM ET' : 'ANLAŞILDI'}
            </button>

        </div>
    </div>
  );
};
