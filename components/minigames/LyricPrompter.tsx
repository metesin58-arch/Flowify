
import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from '../Icons';

interface Props {
  onComplete: (score: number) => void;
}

// Updated with 35 sentence-length iconic lyrics for variety
const LYRIC_POOL = [
  "BURASI İSTANBUL BURDA HERKESİN BİR DERDİ VAR",
  "SUSAMAM DEDİM VE BİR SABAH UYANDIM HER ŞEY AYNI",
  "NEYİM VAR Kİ RAPTEN GARİ BU BİR YOLCULUK",
  "SAVAŞ ÇOCUKLARI İÇİN BARIŞ HEMEN ŞİMDİ",
  "HAYAT ZOR BİR SINAV VE KOPYA ÇEKMEK SERBEST DEĞİL",
  "GÖLGE HARAMİLERİ BU GECE ŞEHRİ TESLİM ALACAK",
  "BİR PESİMİSTİN GÖZYAŞLARI DÜŞER YERE DAMLA DAMLA",
  "YERLİ PLAKA ÜSTÜNDE MİKROFON ELİMDE HAZIRIM",
  "KAFAMA SIKAR GİDERİM DİYENLERİN HEPSİ BURADA",
  "BENİMLE DANS ETMEK İSTERSEN RİTMİ YAKALA",
  "SOKAKLARIN DİLİ OLSA DA KONUŞSA ANLATSA DERDİNİ",
  "RAPİN OĞLU GELDİ GERİ ÇEKİLİN ÖNÜMDEN",
  "MEDCEZİR GELİR GİDER AKLIMDAKİLER HİÇ BİTMEZ",
  "SAYGI BEKLEME SAYGI GÖSTER ÖNCE KENDİNE",
  "HOLOCAUST GİBİ YAKAR GEÇERİM ALAYINI",
  "BURALAR ESKİDEN HEP DUTLUKTU ŞİMDİ BETON",
  "KARANLIK ÇÖKÜNCE SOKAKLARIN DİLİ ÇÖZÜLÜR",
  "HAYAT BİR KUMARSA ZARLAR BENİM ELİMDE",
  "DÜŞMEM BEN YİNE KALKARIM HER SEFERİNDE DAHA GÜÇLÜ",
  "GÖKYÜZÜNDE YILDIZLAR KADAR UZAK HAYALLERİM",
  "SUSMA SUSTUKÇA SIRA SANA GELECEK UNUTMA",
  "BU ŞEHİR BENİ YUTAMAZ BEN BU ŞEHRİN KENDİSİYİM",
  "MİKROFON BENİM SİLAHIM KELİMELER MERMİM",
  "DOSTUNU YAKIN TUT DÜŞMANINI DAHA YAKIN",
  "ZAMAN AKIP GİDERKEN GERİYE SADECE ANILAR KALIR",
  "BİR GÜN HERKES GİDER GERİYE SADECE ŞARKILAR KALIR",
  "SOKAK LAMBALARI ALTINDA YAZILDI BU SATIRLAR",
  "HAYALLER PARİS GERÇEKLER EMİNÖNÜ",
  "BİZİMKİSİ BİR AŞK HİKAYESİ DEĞİL BİR YAŞAM MÜCADELESİ",
  "SEN AĞLAMA DAYANAMAM GÖZYAŞIN OLURUM",
  "CEZA SAHASI İÇİNDE HERKES KENDİ KALESİNİ KORUR",
  "YALAN DÜNYA DÖNER DURUR BİZ İSE SADECE İZLERİZ",
  "KADERİNİ KENDİN YAZ BAŞKASININ KALEMİYLE DEĞİL",
  "BU YOLUN SONU YOK SADECE YENİ BAŞLANGIÇLAR VAR",
  "RAP BENİM İÇİN BİR MÜZİK DEĞİL BİR YAŞAM TARZI"
];

// Helper to normalize Turkish characters for loose comparison
const normalizeText = (text: string) => {
    return text
        .replace(/İ/g, 'I').replace(/ı/g, 'I')
        .replace(/Ö/g, 'O').replace(/ö/g, 'O')
        .replace(/Ü/g, 'U').replace(/ü/g, 'U')
        .replace(/Ş/g, 'S').replace(/ş/g, 'S')
        .replace(/Ç/g, 'C').replace(/ç/g, 'C')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'G')
        .toUpperCase();
};

export const LyricPrompter: React.FC<Props> = ({ onComplete }) => {
  const [targetLyric, setTargetLyric] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(15); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFail, setIsFail] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // Init
  useEffect(() => {
    // Select random lyric
    const random = LYRIC_POOL[Math.floor(Math.random() * LYRIC_POOL.length)];
    setTargetLyric(random); // Already uppercase in pool

    // Auto focus
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, 100);

    // Timer
    timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                handleFail();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const handleFail = () => {
      clearInterval(timerRef.current);
      setIsFail(true);
      setTimeout(() => {
          onComplete(0);
      }, 1000);
  };

  const handleSuccess = () => {
      clearInterval(timerRef.current);
      setIsSuccess(true);
      setTimeout(() => {
          onComplete(100);
      }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isSuccess || isFail) return;
      
      // Store user input as is for display (but uppercase for visual consistency)
      const val = e.target.value.toUpperCase(); 
      setUserInput(val);

      // Compare normalized versions
      if (normalizeText(val) === normalizeText(targetLyric)) {
          handleSuccess();
      }
  };

  // Keep focus alive
  const keepFocus = () => {
      if(inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-start pt-20 p-6 font-sans" onClick={keepFocus}>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-red-600 flex justify-between items-center animate-pulse">
            <div className="flex items-center gap-2">
                <MicIcon className="w-6 h-6 text-white" />
                <span className="text-white font-black uppercase tracking-widest text-sm">CANLI YAYIN - PROMPTER</span>
            </div>
            <div className="font-mono text-xl font-black text-white">{timeLeft}s</div>
        </div>

        {/* Instructions */}
        <div className="mb-8 text-center mt-8">
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2">SÖZLERİ UNUTMA!</h2>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Aşağıdaki cümleyi aynen yaz</p>
        </div>

        {/* The Prompt Display */}
        <div className="w-full max-w-2xl bg-[#111] border border-white/20 rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%]"></div>
            
            {/* Target Text (Faded) */}
            <div className="relative z-10 text-xl md:text-2xl font-black text-white/40 tracking-wide select-none filter blur-[0.3px] leading-relaxed break-words">
                {targetLyric}
            </div>
            
            {/* Overlay Inputted Text for Visual Feedback (Typewriter effect) */}
            <div className="absolute inset-0 p-6 flex items-center justify-center pointer-events-none z-20">
                <span className={`text-xl md:text-2xl font-black tracking-wide leading-relaxed break-words text-center w-full ${isFail ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-white'}`}>
                    {userInput}
                    <span className="animate-pulse">|</span>
                </span>
            </div>
        </div>

        {/* Input Field (Hidden visually but functional) */}
        <input 
            ref={inputRef}
            type="text" 
            value={userInput} 
            onChange={handleChange}
            className="opacity-0 absolute top-0 left-0 h-full w-full cursor-default"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
        />

        {/* Keyboard Hint */}
        <div className="mt-auto mb-safe text-neutral-500 text-xs font-bold uppercase animate-bounce">
            KLAVYE AÇIK • YAZMAYA BAŞLA
        </div>

        {/* Status Overlay */}
        {isSuccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm z-30">
                <div className="bg-green-500 text-black font-black text-4xl px-8 py-4 rounded-xl transform -rotate-6 shadow-2xl">
                    HARİKA!
                </div>
            </div>
        )}

        {isFail && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm z-30">
                <div className="bg-red-600 text-white font-black text-4xl px-8 py-4 rounded-xl transform rotate-6 shadow-2xl">
                    UNUTTUN!
                </div>
            </div>
        )}

    </div>
  );
};
