
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../../types';
import { CoinIcon } from '../Icons';
import { HEAD_OPTIONS } from '../../constants';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Fighter {
    id: number;
    name: string;
    headIndex: number;
    power: number; // 1-100
    hp: number;
    maxHp: number;
}

const NPC_NAMES = [
    "MC Gölge", "Ritim Kralı", "Flow Canavarı", "Yeraltı Prens", 
    "Sokak Şairi", "Beat Ustası", "Lirik Uzmanı", "Kara Ritim",
    "Ghetto Boss", "Rhyme Makinesi", "Darbe", "Nefes", "Sancak", "Vurgu"
];

const BATTLE_LOGS = [
    "{attacker} punchline attı!",
    "{attacker} annesine laf etti!",
    "{attacker} flowu hızlandırdı!",
    "{attacker} ritmi kaçırdı...",
    "{attacker} mikrofonu fırlattı!",
    "{attacker} sert gönderme yaptı.",
    "{attacker} double-time yaptı!",
    "{attacker} alkış aldı."
];

export const BattleBetGame: React.FC<Props> = ({ player, updateStat, onExit, cashType, showToast }) => {
  const [phase, setPhase] = useState<'betting' | 'simulation' | 'result'>('betting');
  const [fighter1, setFighter1] = useState<Fighter | null>(null);
  const [fighter2, setFighter2] = useState<Fighter | null>(null);
  
  const [selectedFighter, setSelectedFighter] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [odds, setOdds] = useState({ f1: 1.5, f2: 1.5 });
  
  const [logs, setLogs] = useState<string[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
 
  const timerRef = useRef<any>(null);
 
  // Helper to get current balance based on context
  const currentBalance = player[cashType];
 
  useEffect(() => {
    generateMatchup();
    return () => clearInterval(timerRef.current);
  }, []);
 
  const generateMatchup = () => {
    const f1Power = Math.floor(Math.random() * 50) + 50; 
    const f2Power = Math.floor(Math.random() * 50) + 50; 
    
    const totalPower = f1Power + f2Power;
    const f1Chance = f1Power / totalPower;
    
    const f1Odds = Math.max(1.1, parseFloat((1 / f1Chance * 0.9).toFixed(2)));
    const f2Odds = Math.max(1.1, parseFloat((1 / (1 - f1Chance) * 0.9).toFixed(2)));
 
    let name1 = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    let name2 = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    while (name1 === name2) {
        name2 = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    }
 
    setFighter1({
        id: 1,
        name: name1,
        headIndex: Math.floor(Math.random() * HEAD_OPTIONS.length),
        power: f1Power,
        hp: 100,
        maxHp: 100
    });
 
    setFighter2({
        id: 2,
        name: name2,
        headIndex: Math.floor(Math.random() * HEAD_OPTIONS.length),
        power: f2Power,
        hp: 100,
        maxHp: 100
    });
 
    setOdds({ f1: f1Odds, f2: f2Odds });
    setPhase('betting');
    setLogs([]);
    setWinnerId(null);
    setSelectedFighter(null);
  };
 
  const startSimulation = () => {
    if (!selectedFighter) return;
    if (currentBalance < betAmount) {
        showToast("yetersiz bakiye!", 'error');
        return;
    }
 
    updateStat(cashType, -betAmount);
    setPhase('simulation');
 
    timerRef.current = setInterval(() => {
        setFighter1(prev => {
            if (!prev) return null;
            return { ...prev }; 
        });
 
        const attacker = Math.random() > 0.5 ? 1 : 2;
        const damage = Math.floor(Math.random() * 20) + 5;
        
        let msg = BATTLE_LOGS[Math.floor(Math.random() * BATTLE_LOGS.length)];
        const attackerName = attacker === 1 ? fighter1!.name : fighter2!.name;
        msg = msg.replace("{attacker}", attackerName);
        setLogs(prev => [msg, ...prev].slice(0, 3));
 
        if (attacker === 1) {
             setFighter2(prev => {
                 if(!prev) return null;
                 const newHp = Math.max(0, prev.hp - damage);
                 if (newHp === 0) endGame(1);
                 return { ...prev, hp: newHp };
             });
        } else {
             setFighter1(prev => {
                 if(!prev) return null;
                 const newHp = Math.max(0, prev.hp - damage);
                 if (newHp === 0) endGame(2);
                 return { ...prev, hp: newHp };
             });
        }
 
    }, 800);
  };
 
  const endGame = (winner: number) => {
      clearInterval(timerRef.current);
      setWinnerId(winner);
      setPhase('result');
 
      const wonBet = winner === selectedFighter;
      const multiplier = winner === 1 ? odds.f1 : odds.f2;
      const payout = Math.floor(betAmount * multiplier);
 
      if (wonBet) {
          updateStat(cashType, payout);
          setLogs(prev => [`🏆 kazandın! +₺${payout.toLocaleString()}`, ...prev]);
      } else {
          setLogs(prev => ["❌ kaybettin...", ...prev]);
      }
  };
 
  if (!fighter1 || !fighter2) return <div className="h-full bg-black flex items-center justify-center text-orange-500 font-black tracking-tight lowercase">yükleniyor...</div>;
 
  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden font-sans select-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
         
         {/* Compact Header */}
         <div className="relative z-[150] flex justify-between items-center px-6 pt-12 pb-4 border-b border-white/5">
            <button 
                onClick={onExit} 
                className="bg-white/5 text-neutral-400 w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:text-white transition-colors active:scale-90"
            >
                ✕
            </button>
            <div className="flex flex-col items-center text-center">
                <div className="text-[10px] font-black text-neutral-500 lowercase tracking-tight mb-0.5">yeraltı arenası.</div>
                <div className="text-xl font-black text-white tracking-tighter lowercase">
                    battle bet<span className="text-orange-500">.</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-white/5 pl-2.5 pr-3.5 py-1.5 rounded-2xl shadow-md">
                <CoinIcon className="w-4 h-4 text-orange-400" />
                <span className="text-white font-black text-xs tabular-nums leading-none">
                    {currentBalance.toLocaleString()}
                </span>
            </div>
        </div>
 
        {/* COMPACT BATTLE ARENA */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 space-y-6">
            
            <div className="flex justify-between items-stretch w-full max-w-md gap-4 h-56">
                {/* FIGHTER 1 */}
                <div 
                    onClick={() => phase === 'betting' && setSelectedFighter(1)}
                    className={`flex-1 relative rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer flex flex-col justify-end p-4 border ${
                        selectedFighter === 1 
                        ? 'border-orange-500 bg-orange-950/20 shadow-[0_0_25px_rgba(249,115,22,0.25)] scale-[1.02]' 
                        : 'border-white/5 bg-[#070707] hover:border-white/10'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                    <img 
                      src={HEAD_OPTIONS[fighter1.headIndex]} 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-all duration-300 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="relative z-20 flex flex-col items-center text-center w-full gap-2">
                        <div className="font-black text-white text-xs lowercase tracking-tight truncate max-w-full">
                            {fighter1.name.toLowerCase()}
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                            x{odds.f1}
                        </div>
                        {/* High-Contrast Taraf Seç Button */}
                        <div className={`w-full py-2.5 rounded-xl text-[10px] font-black tracking-tight transition-all text-center select-none lowercase ${
                            selectedFighter === 1
                            ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                            : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white'
                        }`}>
                            {selectedFighter === 1 ? 'seçildi' : 'tarafı seç'}
                        </div>
                    </div>
 
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-900 z-20">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${(fighter1.hp / fighter1.maxHp) * 100}%` }}
                        ></div>
                    </div>
                </div>
 
                {/* VS */}
                <div className="flex flex-col justify-center items-center">
                    <span className="text-xl font-black text-neutral-600 italic">vs</span>
                </div>
 
                {/* FIGHTER 2 */}
                <div 
                    onClick={() => phase === 'betting' && setSelectedFighter(2)}
                    className={`flex-1 relative rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer flex flex-col justify-end p-4 border ${
                        selectedFighter === 2 
                        ? 'border-orange-500 bg-orange-950/20 shadow-[0_0_25px_rgba(249,115,22,0.25)] scale-[1.02]' 
                        : 'border-white/5 bg-[#070707] hover:border-white/10'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                    <img 
                      src={HEAD_OPTIONS[fighter2.headIndex]} 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-all duration-300 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="relative z-20 flex flex-col items-center text-center w-full gap-2">
                        <div className="font-black text-white text-xs lowercase tracking-tight truncate max-w-full">
                            {fighter2.name.toLowerCase()}
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                            x{odds.f2}
                        </div>
                        {/* High-Contrast Taraf Seç Button */}
                        <div className={`w-full py-2.5 rounded-xl text-[10px] font-black tracking-tight transition-all text-center select-none lowercase ${
                            selectedFighter === 2
                            ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                            : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white'
                        }`}>
                            {selectedFighter === 2 ? 'seçildi' : 'tarafı seç'}
                        </div>
                    </div>
 
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-900 z-20">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${(fighter2.hp / fighter2.maxHp) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
 
            {/* LOGS */}
            <div className="w-full max-w-md bg-[#050505]/60 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-5 min-h-[110px] shadow-2xl flex flex-col justify-center">
                {logs.length === 0 ? (
                    <div className="text-neutral-500 text-[10px] text-center font-black tracking-widest lowercase">düello bekleniyor...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`text-[11px] mb-1.5 font-bold tracking-tight lowercase ${i===0 ? 'text-white' : 'text-neutral-500'}`}>
                            {i===0 && <span className="text-orange-500 mr-2">➜</span>}{log.toLowerCase()}
                        </div>
                    ))
                )}
            </div>
 
        </div>
 
        {/* CONTROLS */}
        <div className="bg-black/95 border-t border-white/5 p-6 pb-safe z-20">
            {phase === 'betting' ? (
                 <div className="flex flex-col gap-4 max-w-md mx-auto">
                     
                     {/* Updated Betting UI */}
                     <div className="flex items-center gap-4 bg-[#050505] rounded-3xl p-2 border border-white/5 shadow-inner">
                         <button 
                             onClick={() => setBetAmount(Math.max(10, betAmount - 50))} 
                             className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5"
                         >
                             -
                         </button>
                         
                         <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                             <span className="text-[9px] text-neutral-500 font-extrabold tracking-tight mb-0.5 lowercase">bahis miktarı.</span>
                             <div className="text-2xl font-black text-white tracking-tight tabular-nums">₺{betAmount.toLocaleString()}</div>
                         </div>
 
                         <button 
                             onClick={() => setBetAmount(Math.min(currentBalance, betAmount + 50))} 
                             className="w-12 h-12 rounded-2xl bg-[#0e0e0e] text-white font-black hover:bg-[#121212] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5"
                         >
                             +
                         </button>
                     </div>
 
                     <button 
                        onClick={startSimulation}
                        disabled={!selectedFighter}
                        className={`w-full py-4.5 rounded-[2rem] font-black text-sm uppercase tracking-tight transition-all shadow-lg active:scale-95 lowercase ${
                            selectedFighter 
                            ? 'bg-orange-500 text-black hover:scale-[1.01] shadow-[0_0_25px_rgba(249,115,22,0.35)]' 
                            : 'bg-neutral-900 border border-white/5 text-neutral-600 cursor-not-allowed'
                        }`}
                     >
                          {selectedFighter ? `${selectedFighter === 1 ? fighter1.name : fighter2.name} tarafına yatır.` : 'rakibini seç.'}
                     </button>
                 </div>
            ) : phase === 'simulation' ? (
                <div className="w-full flex items-center justify-center gap-2 py-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <div className="text-center text-white font-black text-xs lowercase ml-1.5 leading-none">rap savaşı devam ediyor...</div>
                </div>
            ) : (
                <button 
                    onClick={generateMatchup}
                    className="w-full bg-white text-black font-black py-4.5 rounded-[2rem] text-sm hover:scale-[1.01] active:scale-95 transition-transform max-w-md mx-auto block shadow-2xl lowercase"
                >
                    başka maça geç.
                </button>
            )}
        </div>
    </div>
  );
};
