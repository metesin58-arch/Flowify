
import React, { useState } from 'react';
import { loginGuest, loginEmail, registerEmail, loginGoogle } from '../services/authService';
import { playClickSound } from '../services/sfx';

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
      console.error("Auth error:", e);
      let msg = "Bir hata oluştu.";
      if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/admin-restricted-operation') {
        msg = "E-posta/Şifre girişi şu an devre dışı. Lütfen Firebase Console üzerinden etkinleştirin.";
      } else if (e.code === 'auth/email-already-in-use') {
        msg = "Bu e-posta adresi zaten kullanımda.";
      } else if (e.code === 'auth/invalid-email') {
        msg = "Geçersiz e-posta adresi.";
      } else if (e.code === 'auth/weak-password') {
        msg = "Şifre çok zayıf (en az 6 karakter).";
      } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = "E-posta veya şifre hatalı.";
      } else if (e.message) {
        msg = e.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      await loginGuest();
    } catch (e: any) {
      console.error("Guest login error:", e);
      let msg = "Misafir girişi başarısız.";
      if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/admin-restricted-operation') {
        msg = "Misafir girişi (Anonymous Auth) şu an devre dışı. Lütfen Firebase Console (Authentication > Sign-in method) üzerinden etkinleştirin.";
      } else if (e.code === 'auth/network-request-failed') {
        msg = "İnternet bağlantınızı kontrol edin.";
      } else if (e.message) {
        msg = e.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginGoogle();
    } catch (e: any) {
      console.error("Google login error:", e);
      let msg = "Google girişi başarısız.";
      if (e.message) msg = e.message;
      setError(msg);
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
        <div className="mb-14 text-center animate-fade-in-up select-none">
            <span className="text-white text-4xl font-black tracking-tighter lowercase leading-none">
              flowify<span className="text-[#1DB954]">.</span>
            </span>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl mb-6 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <div className="text-red-500 text-[10px] font-bold lowercase text-center">
                    ⚠ {error.toLowerCase()}
                </div>
            </div>
        )}

        {/* MODE: WELCOME */}
        {mode === 'welcome' && (
            <div className="w-full space-y-4 animate-fade-in flex flex-col items-center">
                <button 
                    onClick={() => { playClickSound(); setMode('login'); }}
                    className="w-full bg-white text-black font-semibold lowercase tracking-tight py-4 rounded-3xl hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
                >
                    giriş yap.
                </button>
                
                <button 
                    onClick={() => { playClickSound(); setMode('register'); }}
                    className="w-full bg-transparent border border-white/5 text-neutral-400 font-medium lowercase tracking-tight py-4 rounded-3xl hover:bg-white/5 hover:text-white active:scale-95 transition-all text-sm"
                >
                    kayıt ol.
                </button>

                <button 
                    onClick={() => { playClickSound(); handleGoogle(); }}
                    disabled={loading}
                    className="w-full bg-[#ea4335] text-white font-semibold lowercase tracking-tight py-4 rounded-3xl hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_10px_30px_rgba(234,67,53,0.15)] flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.08 4.48-1.12 1.12-2.8 2.32-5.76 2.32-4.88 0-8.72-3.92-8.72-8.8s3.84-8.8 8.72-8.8c2.64 0 4.56 1.04 6 2.4l2.32-2.32C18.48 1.28 15.68 0 12.48 0 6.48 0 1.6 4.8 1.6 10.8s4.88 10.8 10.88 10.8c3.24 0 5.72-1.08 7.6-3.08 1.96-1.96 2.56-4.76 2.56-7.04 0-.52-.04-1.04-.12-1.56H12.48z"/>
                    </svg>
                    google ile giriş.
                </button>

                {/* DEV SKIP BUTTON */}
                <button 
                    onClick={() => { playClickSound(); handleGuest(); }}
                    disabled={loading}
                    className="w-full mt-8 bg-purple-500/5 border border-purple-500/10 text-purple-400 font-semibold lowercase tracking-tight py-3.5 rounded-3xl hover:bg-purple-500/10 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group"
                >
                    <span className="group-hover:animate-pulse">{loading ? 'bağlanıyor...' : 'hızlı giriş.'}</span>
                </button>
            </div>
        )}

        {/* MODE: LOGIN / REGISTER */}
        {(mode === 'login' || mode === 'register') && (
            <div className="w-full animate-fade-in">
                <h2 className="text-white text-md font-bold text-center mb-8 lowercase tracking-tight opacity-80">
                    {mode === 'login' ? 'giriş.' : 'kayıt.'}
                </h2>

                <div className="space-y-6 mb-10">
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e-posta adresi"
                        className="w-full bg-transparent border-b border-white/5 text-white text-center placeholder-neutral-600 focus:border-purple-500/30 focus:outline-none py-3 text-xs font-semibold tracking-tight lowercase transition-colors"
                    />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="şifre"
                        className="w-full bg-transparent border-b border-white/5 text-white text-center placeholder-neutral-600 focus:border-purple-500/30 focus:outline-none py-3 text-xs font-semibold tracking-tight lowercase transition-colors"
                    />
                </div>

                <button 
                    onClick={() => handleAuth(mode === 'register')}
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold lowercase tracking-tight py-4 rounded-3xl hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_10px_35px_rgba(255,255,255,0.15)] disabled:opacity-50"
                >
                    {loading ? 'bekle...' : 'devam et.'}
                </button>

                <button 
                    onClick={handleBack}
                    className="w-full text-neutral-500 text-xs font-semibold lowercase tracking-tight mt-6 hover:text-white transition-colors text-center block"
                >
                    geri dön.
                </button>
            </div>
        )}

      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[10px] text-white/60 font-black lowercase tracking-tight">
          flowify engine<span className="text-[#1DB954]">.</span>
      </div>

    </div>
  );
};
