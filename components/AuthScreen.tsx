
import React, { useState } from 'react';
import { loginGuest, loginEmail, registerEmail } from '../services/authService';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (isRegister: boolean) => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (e: any) {
      setError(e.message || "Bir hata oluştu.");
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginGuest();
    } catch (e: any) {
      setError("Misafir girişi başarısız.");
      setLoading(false);
    }
  };

  const handleBack = () => {
      setMode('welcome');
      setError('');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[280px] flex flex-col items-center">
        
        {/* LOGO */}
        <div className="mb-16 text-center animate-fade-in-up">
            <img 
                src="https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png" 
                alt="Flowify Logo" 
                className="w-36 h-auto mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] opacity-90"
            />
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="w-full text-red-500 text-[10px] font-bold uppercase tracking-widest mb-6 text-center animate-bounce">
                ⚠ {error}
            </div>
        )}

        {/* MODE: WELCOME */}
        {mode === 'welcome' && (
            <div className="w-full space-y-4 animate-fade-in flex flex-col items-center">
                <button 
                    onClick={() => setMode('login')}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 rounded-full hover:scale-105 active:scale-95 transition-all text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    GİRİŞ YAP
                </button>
                
                <button 
                    onClick={() => setMode('register')}
                    className="w-full bg-transparent border border-white/20 text-white font-bold uppercase tracking-[0.2em] py-4 rounded-full hover:bg-white/5 active:scale-95 transition-all text-xs"
                >
                    KAYIT OL
                </button>

                <button 
                    onClick={handleGuest}
                    disabled={loading}
                    className="mt-4 text-neutral-500 text-[9px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                    {loading ? 'YÜKLENİYOR...' : 'MİSAFİR GİRİŞİ'}
                </button>
            </div>
        )}

        {/* MODE: LOGIN / REGISTER */}
        {(mode === 'login' || mode === 'register') && (
            <div className="w-full animate-fade-in">
                <h2 className="text-white text-sm font-black text-center mb-8 uppercase tracking-[0.4em] opacity-80">
                    {mode === 'login' ? 'Giriş' : 'Kayıt'}
                </h2>

                <div className="space-y-6 mb-10">
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-POSTA"
                        className="w-full bg-transparent border-b border-white/20 text-white text-center placeholder-neutral-600 focus:border-white focus:outline-none py-3 text-xs font-bold tracking-widest uppercase transition-colors"
                    />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="ŞİFRE"
                        className="w-full bg-transparent border-b border-white/20 text-white text-center placeholder-neutral-600 focus:border-white focus:outline-none py-3 text-xs font-bold tracking-widest uppercase transition-colors"
                    />
                </div>

                <button 
                    onClick={() => handleAuth(mode === 'register')}
                    disabled={loading}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 rounded-full hover:scale-105 active:scale-95 transition-all text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                    {loading ? 'BEKLE...' : 'DEVAM ET'}
                </button>

                <button 
                    onClick={handleBack}
                    className="w-full text-neutral-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-6 hover:text-white transition-colors text-center block"
                >
                    GERİ DÖN
                </button>
            </div>
        )}

      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[8px] text-neutral-800 font-bold uppercase tracking-[0.3em]">
          FLOWIFY ENGINE
      </div>

    </div>
  );
};
