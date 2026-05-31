
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckIcon, SkullIcon } from '../components/Icons';

// --- TYPES ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmModalData {
  title: string;
  message: string;
  onConfirm: () => void;
  isOpen: boolean;
}

interface UIContextType {
  showToast: (message: string, type: ToastType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useGameUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useGameUI must be used within UIProvider");
  return context;
};

// --- COMPONENTS ---

// Updated to display only ONE sleek iOS-style notification banner sliding from the top
const CenteredToast: React.FC<{ toast: Toast | null }> = ({ toast }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const accentColor = isSuccess ? '#1DB954' : isError ? '#ef4444' : '#3b82f6';

  return (
    <>
      <style>{`
        @keyframes ios-slide-down {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-ios-banner {
          animation: ios-slide-down 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] w-[92%] max-w-[360px] pointer-events-none select-none font-sans">
        <div 
          key={toast.id}
          className="pointer-events-auto w-full animate-ios-banner shadow-[0_12px_45px_rgba(0,0,0,0.6)]"
        >
          {/* iOS Dynamic Island / Slim Pill shape */}
          <div className="bg-[#121213]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden">
            {/* Animated Glow Accent to the side */}
            <div 
              className="absolute -right-12 -top-12 w-24 h-24 rounded-full blur-[40px] opacity-15 pointer-events-none"
              style={{ backgroundColor: accentColor }}
            ></div>

            {/* Left iOS Stylized App/Status Icon Square with rounded corners */}
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5 bg-black/60 shadow-inner"
              style={{ color: accentColor }}
            >
               {isSuccess ? <CheckIcon className="w-5 h-5 fill-current text-[#1DB954]" /> : 
                isError ? <SkullIcon className="w-5 h-5 fill-current text-red-500 animate-pulse" /> : 
                <span className="font-extrabold text-sm text-blue-400">!</span>}
            </div>

            {/* Middle and Right: Title & Message Layout */}
            <div className="flex-1 min-w-0 pr-1 text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-500 block mb-0.5">
                {isSuccess ? 'BAŞARILI' : isError ? 'BİLGİ / DURUM' : 'BİLDİRİM'}
              </span>
              <p className="text-white text-xs font-bold leading-tight lowercase">
                {toast.message.toLowerCase()}
              </p>
            </div>

            {/* Tiny iOS 'şimdi' marker */}
            <span className="text-[8.5px] font-black text-neutral-500 whitespace-nowrap uppercase tracking-wider self-start mt-0.5">
              şimdi
            </span>

            {/* Bottom Accent line representing dynamic state */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
                <div 
                  className="h-full animate-progress-shrink origin-left"
                  style={{ backgroundColor: accentColor, animationDuration: '2.5s' }}
                ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const CyberConfirmModal: React.FC<{ data: ConfirmModalData | null, onClose: () => void }> = ({ data, onClose }) => {
    if (!data || !data.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in font-sans select-none">
            <div className="w-full max-w-[320px] bg-[#050505] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.7)] rounded-[2.5rem] p-8 flex flex-col items-center gap-6 text-center relative overflow-hidden animate-zoom-in">
                
                {/* Question Icon */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border border-white/5 bg-[#0a0a0a] text-neutral-400">
                   <span className="text-2xl font-bold tracking-tighter">?</span>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-[10px] font-bold tracking-tight lowercase mb-3 text-neutral-500">
                      {data.title.toLowerCase()}
                  </h4>
                  <p className="text-white font-bold text-base tracking-tight leading-snug lowercase">
                    {data.message.toLowerCase()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full mt-2">
                    <button 
                        onClick={() => { data.onConfirm(); onClose(); }}
                        className="w-full py-4 bg-white text-black font-extrabold rounded-[2rem] hover:brightness-90 transition-all text-xs tracking-tight lowercase"
                    >
                        onayla
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-transparent border border-white/5 text-neutral-500 font-extrabold rounded-[2rem] hover:bg-white/5 transition-colors text-xs tracking-tight lowercase"
                    >
                        iptal
                    </button>
                </div>

            </div>
        </div>
    );
};

// --- PROVIDER ---

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    // Clear previous timer to prevent overlapping removal
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    const id = toastIdRef.current++;
    setToast({ id, message, type });
    
    // Auto dismiss
    toastTimerRef.current = setTimeout(() => {
        setToast(null);
    }, 2500);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
      setConfirmModal({ title, message, onConfirm, isOpen: true });
  }, []);

  const closeConfirm = useCallback(() => {
      setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
  }, []);

  return (
    <UIContext.Provider value={{ showToast, showConfirm, closeConfirm }}>
      {children}
      <CenteredToast toast={toast} />
      <CyberConfirmModal data={confirmModal} onClose={closeConfirm} />
    </UIContext.Provider>
  );
};
