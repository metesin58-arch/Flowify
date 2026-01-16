
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

// Updated to display only ONE centered toast at a time
const CenteredToast: React.FC<{ toast: Toast | null }> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
        <div 
          key={toast.id} // Key change triggers re-animation
          className="pointer-events-auto w-[90%] max-w-[320px] animate-zoom-in transition-all duration-200"
        >
          <div className={`bg-[#121212]/95 backdrop-blur-xl border-2 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4 text-center relative overflow-hidden ${
            toast.type === 'success' ? 'border-[#1ed760] shadow-[#1ed760]/20' : 
            toast.type === 'error' ? 'border-red-500 shadow-red-500/20' : 'border-blue-500 shadow-blue-500/20'
          }`}>
            
            {/* Top Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
                toast.type === 'success' ? 'bg-[#1ed760]' : 
                toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>

            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-black shadow-inner ${
               toast.type === 'success' ? 'bg-[#1ed760] text-black' : 
               toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}>
               {toast.type === 'success' ? <CheckIcon className="w-6 h-6" /> : 
                toast.type === 'error' ? <SkullIcon className="w-6 h-6" /> : 
                <span className="font-black text-2xl">i</span>}
            </div>
            
            <div>
               <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                   toast.type === 'success' ? 'text-[#1ed760]' : 
                   toast.type === 'error' ? 'text-red-500' : 'text-blue-500'
               }`}>
                   {toast.type === 'success' ? 'BAŞARILI' : toast.type === 'error' ? 'HATA' : 'BİLGİ'}
               </div>
               <div className="text-white text-sm font-bold leading-snug">
                   {toast.message}
               </div>
            </div>
          </div>
        </div>
    </div>
  );
};

const CyberConfirmModal: React.FC<{ data: ConfirmModalData | null, onClose: () => void }> = ({ data, onClose }) => {
    if (!data || !data.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center pointer-events-none transition-all duration-300 ease-out">
            <div className="pointer-events-auto bg-[#121212]/95 backdrop-blur-xl border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.4)] rounded-2xl p-6 flex flex-col items-center gap-4 min-w-[280px] max-w-[320px] text-center shadow-2xl relative overflow-hidden animate-zoom-in">
                
                {/* Animated Background Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 animate-[pulse_2s_infinite]"></div>

                {/* Big Icon */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner border-4 border-[#000] bg-yellow-500">
                   <span className="text-3xl font-black text-black">?</span>
                </div>

                {/* Content */}
                <div className="mb-2">
                  <h4 className="text-sm font-black tracking-[0.2em] uppercase mb-2 text-yellow-500">
                      {data.title}
                  </h4>
                  <p className="text-white font-bold text-sm leading-snug">
                    {data.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-transparent border border-white/20 text-neutral-400 font-bold rounded-xl hover:bg-white/10 transition-colors uppercase text-[10px] tracking-widest"
                    >
                        İPTAL
                    </button>
                    <button 
                        onClick={() => { data.onConfirm(); onClose(); }}
                        className="flex-1 py-3 bg-yellow-500 text-black font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] uppercase text-[10px] tracking-widest"
                    >
                        ONAYLA
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
