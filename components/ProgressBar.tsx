import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  colorClass?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  max, 
  colorClass = "bg-red-500",
  label
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full relative h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
      <div 
        className={`h-full transition-all duration-200 ease-out ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
        {label ? `${label} ` : ''}{current.toLocaleString()} / {max.toLocaleString()}
      </div>
    </div>
  );
};