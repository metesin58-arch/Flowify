
import React, { useState } from 'react';

interface Props {
  onComplete: () => void;
}

export const ManagerTutorial: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: "🤵‍♂️",
      title: "MENAJER",
      text: "Hoş geldin evlat. Ben senin menajerinim. Bu yolda seni zirveye taşıyacak kişi benim. Kuralları ben koyarım, sen uygularsın."
    },
    {
      icon: "⚡",
      title: "ENERJİ & HYPE",
      text: "Sahneye çıkmak yetmez. Enerjini korumalısın. Konser öncesi karşına çıkan olaylarda doğru kararı ver. Yanlış bir cevap kariyerini bitirebilir."
    },
    {
      icon: "🎛️",
      title: "DJ SET-UP",
      text: "Konserden önce çalacağın parçaları seçmelisin. Seyirciyi coşturmak için doğru zamanda doğru plağı döndür."
    }
  ];

  const current = slides[step];

  return (
    <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 animate-fade-in text-center font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center">
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1ed760] to-cyan-600 p-[2px] mb-6 shadow-[0_0_30px_rgba(30,215,96,0.3)]">
              <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-5xl">
                  {current.icon}
              </div>
          </div>

          <h2 className="text-3xl font-black text-white italic mb-4 tracking-tighter drop-shadow-md">{current.title}</h2>
          
          <div className="min-h-[100px] flex items-center justify-center mb-8">
              <p className="text-neutral-300 text-sm leading-relaxed font-medium">
                  {current.text}
              </p>
          </div>
          
          {/* Progress Dots */}
          <div className="flex gap-2 mb-8">
              {slides.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#1ed760]' : 'w-2 bg-white/20'}`}></div>
              ))}
          </div>

          <button 
              onClick={() => {
                  if (step < slides.length - 1) setStep(s => s + 1);
                  else onComplete();
              }}
              className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-lg"
          >
              {step < slides.length - 1 ? 'DEVAM ET' : 'ANLAŞILDI'}
          </button>
      </div>
    </div>
  );
};
