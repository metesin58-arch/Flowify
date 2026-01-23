
import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

export const CareerTutorial: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: "🏙️",
      title: "KARİYER YOLCULUĞU",
      desc: "Sokaklardan zirveye tırmanış başlıyor. Eskişehir'de küçük bir stüdyoda başlıyorsun. Amacın İstanbul'un kralı olmak.",
      tip: "Her şehrin kendine özel bir kilidi vardır (Örn: Bursa için Araba sahibi olmalısın)."
    },
    {
      icon: "⚡",
      title: "ENERJİ & PARA",
      desc: "Her eylem (Kayıt, Konser, Antrenman) enerji harcar. Enerjin biterse Market'ten içecek al veya dinlen.",
      tip: "Paranı dikkatli harca! Kirayı ödeyemezsen borca batarsın."
    },
    {
      icon: "🚗",
      title: "SAHİSİNDEN & SWAG",
      desc: "Araba almak sadece ulaşım değil, itibar meselesidir. 'Sahisinden' üzerinden araba al-sat yaparak kâr edebilirsin.",
      tip: "Daha iyi arabalar = Daha fazla Swag = Daha fazla gelir."
    },
    {
      icon: "🎙️",
      title: "HİT ŞARKI YAPMAK",
      desc: "Stüdyoya girip hit şarkı yapmadan büyük şehirlere gidemezsin. Flow ve Lirik yeteneklerini geliştirerek şansını artır.",
      tip: "Şarkı yayınladığında pasif gelir elde etmeye başlarsın."
    },
    {
      icon: "🎤",
      title: "KONSER & KRİZLER",
      desc: "En büyük gelir kaynağın konserlerdir. Sahneye çıktığında karşına çıkan krizleri doğru yönet.",
      tip: "Doğru kararlar fan kitleni artırır, yanlış kararlar konseri iptal ettirir."
    }
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
        
        {/* Background FX */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-green-900/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-sm bg-[#121212] border border-purple-500/30 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center">
            
            <div className="flex gap-1.5 mb-8">
                {slides.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-purple-500' : 'w-2 bg-white/20'}`}></div>
                ))}
            </div>

            <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(147,51,234,0.5)] mb-6 ring-4 ring-purple-500/20">
                {current.icon}
            </div>

            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">{current.title}</h2>
            <p className="text-neutral-300 text-sm font-medium leading-relaxed mb-6 min-h-[80px]">
                {current.desc}
            </p>

            <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 text-left w-full rounded-r-xl mb-8">
                <span className="text-purple-400 text-[10px] font-black uppercase tracking-wider block mb-1">İPUCU</span>
                <span className="text-neutral-400 text-xs italic font-medium">{current.tip}</span>
            </div>

            <button 
                onClick={() => {
                    if (step < slides.length - 1) setStep(s => s + 1);
                    else onClose();
                }}
                className="w-full bg-purple-600 text-white font-black py-4 rounded-xl hover:bg-purple-500 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-lg"
            >
                {step < slides.length - 1 ? 'DEVAM ET' : 'ANLAŞILDI'}
            </button>

        </div>
    </div>
  );
};
