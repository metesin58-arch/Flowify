
import React, { useState, useEffect } from 'react';
import { CheckIcon, SkullIcon } from './Icons';

export interface NotificationEvent {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const NotificationToast: React.FC = () => {
  const [notification, setNotification] = useState<NotificationEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleNotify = (e: CustomEvent) => {
      setNotification(e.detail);
      setVisible(true);

      // Display duration
      setTimeout(() => {
        setVisible(false);
      }, 2500);
      
      // Cleanup data after animation
      setTimeout(() => {
        setNotification(null);
      }, 2800);
    };

    window.addEventListener('flowify-notify', handleNotify as EventListener);
    return () => window.removeEventListener('flowify-notify', handleNotify as EventListener);
  }, []);

  if (!notification) return null;

  // Determine colors based on type
  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';
  
  const borderColor = isSuccess ? 'border-[#1ed760]' : isError ? 'border-red-500' : 'border-blue-500';
  const glowColor = isSuccess ? 'shadow-[0_0_50px_rgba(30,215,96,0.4)]' : isError ? 'shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'shadow-[0_0_50px_rgba(59,130,246,0.4)]';
  const iconBg = isSuccess ? 'bg-[#1ed760]' : isError ? 'bg-red-500' : 'bg-blue-500';
  const textColor = isSuccess ? 'text-[#1ed760]' : isError ? 'text-red-500' : 'text-blue-400';

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-all duration-200 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      {/* Central Aesthetic Card */}
      <div className={`pointer-events-auto bg-[#121212]/95 backdrop-blur-xl border-2 ${borderColor} ${glowColor} rounded-2xl p-6 flex flex-col items-center gap-4 min-w-[280px] max-w-[320px] text-center shadow-2xl relative overflow-hidden animate-bounce-subtle`}>
        
        {/* Animated Background Line */}
        <div className={`absolute top-0 left-0 w-full h-1 ${iconBg} animate-[pulse_2s_infinite]`}></div>

        {/* Big Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner border-4 border-[#000] ${iconBg}`}>
           {isSuccess ? <CheckIcon className="w-8 h-8 text-black" /> : 
            isError ? <SkullIcon className="w-8 h-8 text-white" /> : 
            <span className="text-2xl font-black text-white">i</span>}
        </div>

        {/* Content */}
        <div>
          <h4 className={`text-sm font-black tracking-[0.2em] uppercase mb-1 ${textColor}`}>
              {isSuccess ? 'BAŞARILI' : isError ? 'HATA' : 'BİLGİ'}
          </h4>
          <p className="text-white font-bold text-sm leading-snug">
            {notification.message}
          </p>
        </div>

      </div>
    </div>
  );
};
