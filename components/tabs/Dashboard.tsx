
import React from 'react';
import { PlayerStats } from '../../types';

interface Props {
  player: PlayerStats;
  recoverEnergy: () => void;
}

export const Dashboard: React.FC<Props> = ({ player, recoverEnergy }) => {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <span className="text-2xl">🎤</span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase">{player.name}</h1>
          <p className="text-slate-400 text-sm">Upcoming Artist</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Flow" value={player.flow} color="text-blue-400" />
        <StatCard label="Lyrics" value={player.lyrics} color="text-green-400" />
        <StatCard label="Rhythm" value={player.rhythm} color="text-yellow-400" />
        <StatCard label="Charisma" value={player.charisma} color="text-purple-400" />
      </div>

      {/* Career Stats */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h3 className="text-slate-500 font-bold uppercase text-xs mb-3">Career Stats</h3>
        <div className="flex justify-between items-center mb-2">
          <span>Songs Released</span>
          <span className="font-bold">{player.songsReleased}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Battles Won</span>
          <span className="font-bold text-green-400">{player.battlesWon}</span>
        </div>
      </div>

      {/* Actions */}
      <button 
        onClick={recoverEnergy}
        className="w-full py-4 bg-slate-800 rounded-xl font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
      >
        💤 Sleep & Recover Energy
      </button>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
    <p className="text-slate-500 text-xs font-bold uppercase">{label}</p>
    <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
  </div>
);
