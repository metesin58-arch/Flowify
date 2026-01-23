
import React from 'react';
import { Enemy, PlayerStats } from '../types';
import { ProgressBar } from './ProgressBar';
import { SkullIcon, CoinIcon } from './Icons';

interface GameViewProps {
  player: PlayerStats;
  enemy: Enemy;
  onAttack: () => void;
  damageAnim: number | null; // Value to show floating text
}

export const GameView: React.FC<GameViewProps> = ({ player, enemy, onAttack, damageAnim }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative space-y-6">
      
      {/* Monster Area */}
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <div className="mb-2 w-full flex justify-between text-slate-400 text-sm font-semibold uppercase tracking-wider">
          <span>{enemy.name}</span>
          <span className="text-red-400">Lv.{enemy.level}</span>
        </div>
        
        {/* Monster Image Container */}
        <div 
          onClick={onAttack}
          className="relative group cursor-pointer w-64 h-64 bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden transition-transform active:scale-95 hover:border-slate-600"
        >
          <img 
            src={`https://picsum.photos/seed/${enemy.imageSeed}/256/256`} 
            alt="Monster"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          
          {/* Click Effect Overlay */}
          <div className="absolute inset-0 bg-red-500 opacity-0 active:opacity-20 transition-opacity pointer-events-none"></div>

          {/* Floating Damage Number */}
          {damageAnim !== null && (
            <div 
                key={Math.random()} // Force re-render for animation
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(220,38,38,0.8)] pointer-events-none animate-bounce"
            >
              {damageAnim}
            </div>
          )}
        </div>

        {/* Health Bar */}
        <div className="w-full max-w-[280px] mt-4 -mb-2 z-10">
           <ProgressBar current={enemy.currentHp} max={enemy.maxHp} colorClass="bg-red-600" label="HP" />
        </div>
      </div>

      {/* Player Stats (Visual Only) */}
      <div className="w-full max-w-sm bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm border border-slate-700/50 flex justify-around items-center">
         <div className="flex flex-col items-center">
             <span className="text-slate-400 text-xs uppercase">Flow</span>
             <span className="text-xl font-bold text-blue-400">{player.flow}</span>
         </div>
         <div className="h-8 w-px bg-slate-700"></div>
         <div className="flex flex-col items-center">
             <span className="text-slate-400 text-xs uppercase">Lyrics</span>
             <span className="text-xl font-bold text-orange-400">{player.lyrics}</span>
         </div>
         <div className="h-8 w-px bg-slate-700"></div>
         <div className="flex flex-col items-center">
             <span className="text-slate-400 text-xs uppercase">Cash</span>
             <div className="flex items-center space-x-1">
                <CoinIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-xl font-bold text-yellow-400">₺{player.cash.toLocaleString()}</span>
             </div>
         </div>
      </div>

    </div>
  );
};
