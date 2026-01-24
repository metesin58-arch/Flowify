
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../../types';
import { CoinIcon } from '../Icons';
import { HEAD_OPTIONS } from '../../constants';

interface Props {
  player: PlayerStats;
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  onExit: () => void;
  cashType: 'cash' | 'careerCash'; // SEPARATION
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

export const BattleBetGame: React.FC<Props> = ({ player, updateStat, onExit, cashType }) => {
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
    if (currentBalance < betAmount) { alert("Yetersiz bakiye"); return; }

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
          setLogs(prev => [`🏆 KAZANDIN! +₺${payout}`, ...prev]);
      } else {
          setLogs(prev => ["❌ KAYBETTİN...", ...prev]);
      }
  };

  if (!fighter1 || !fighter2) return <div className="h-full bg-black flex items-center justify-center text-orange-500 font-bold">Yükleniyor...</div>;

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
         <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none"></div>
         
         {/* Compact Header */}
         <div className="relative z-[150] flex justify-between items-center px-4 pt-6 pb-2 bg-gradient-to-b from-black via-black/80 to-transparent">
            <button onClick={onExit} className="bg-neutral-800 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-neutral-700 transition-colors border border-white/10">ÇIKIŞ</button>
            <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">BATTLE BET</div>
            <div className="flex items-center gap-1 text-white font-mono font-bold bg-[#111] px-2 py-0.5 rounded-full border border-white/10 text-xs">
                <CoinIcon className="w-3 h-3 text-orange-500" />
                {currentBalance.toLocaleString()}
            </div>
        </div>

        {/* COMPACT BATTLE ARENA */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 space-y-4">
            
            <div className="flex justify-between items-stretch w-full max-w-md gap-2 h-32">
                {/* FIGHTER 1 */}
                <div 
                    onClick={() => phase === 'betting' && setSelectedFighter(1)}
                    className={`flex-1 relative rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer ${
                        selectedFighter === 1 ? 'ring-1 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border border-white/5 bg-[#111]'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10"></div>
                    <img src={HEAD_OPTIONS[fighter1.headIndex]} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20 flex flex-col items-center">
                        <div className="font-black text-white text-xs uppercase text-center">{fighter1.name}</div>
                        <div className="bg-orange-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5">x{odds.f1}</div>
                    </div>

                    <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 z-20">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${(fighter1.hp / fighter1.maxHp) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* VS */}
                <div className="flex flex-col justify-center items-center">
                    <div className="text-xl font-black text-white italic animate-pulse">VS</div>
                </div>

                {/* FIGHTER 2 */}
                <div 
                    onClick={() => phase === 'betting' && setSelectedFighter(2)}
                    className={`flex-1 relative rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer ${
                        selectedFighter === 2 ? 'ring-1 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border border-white/5 bg-[#111]'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10"></div>
                    <img src={HEAD_OPTIONS[fighter2.headIndex]} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-20 flex flex-col items-center">
                        <div className="font-black text-white text-xs uppercase text-center">{fighter2.name}</div>
                        <div className="bg-orange-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5">x{odds.f2}</div>
                    </div>

                    <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 z-20">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${(fighter2.hp / fighter2.maxHp) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* LOGS */}
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-xl border border-white/5 p-2 min-h-[80px]">
                {logs.length === 0 ? (
                    <div className="text-neutral-600 text-[10px] text-center italic mt-2">Maç bekleniyor...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`text-[10px] mb-1 font-medium tracking-wide ${i===0 ? 'text-white' : 'text-neutral-500'}`}>
                            {i===0 && <span className="text-orange-500 mr-1">➜</span>}{log}
                        </div>
                    ))
                )}
            </div>

        </div>

        {/* CONTROLS */}
        <div className="bg-[#0a0a0a] border-t border-white/10 p-4 pb-safe z-20">
            {phase === 'betting' ? (
                 <div className="flex flex-col gap-3 max-w-md mx-auto">
                     
                     {/* Updated Betting UI */}
                     <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/5">
                         <button onClick={() => setBetAmount(Math.max(10, betAmount - 50))} className="w-12 h-12 rounded-lg bg-[#222] text-white font-black text-xl hover:bg-[#333] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5">-</button>
                         
                         <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                             <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-widest">BAHİS</span>
                             <div className="text-2xl font-mono font-black text-white tracking-widest">₺{betAmount}</div>
                         </div>

                         <button onClick={() => setBetAmount(Math.min(currentBalance, betAmount + 50))} className="w-12 h-12 rounded-lg bg-[#222] text-white font-black text-xl hover:bg-[#333] transition-colors active:scale-95 flex items-center justify-center shrink-0 border border-white/5">+</button>
                     </div>

                     <button 
                        onClick={startSimulation}
                        disabled={!selectedFighter}
                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg ${
                            selectedFighter 
                            ? 'bg-orange-500 text-black hover:scale-[1.01]' 
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                     >
                         {selectedFighter ? `${selectedFighter === 1 ? fighter1.name : fighter2.name} OYNA` : 'TARAF SEÇ'}
                     </button>
                </div>
            ) : phase === 'simulation' ? (
                <div className="w-full flex items-center justify-center gap-2 py-4">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                    <div className="text-center text-white font-bold text-xs uppercase tracking-widest ml-1">KAPIŞMA SÜRÜYOR</div>
                </div>
            ) : (
                <button 
                    onClick={generateMatchup}
                    className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:scale-[1.01] transition-transform max-w-md mx-auto block shadow-lg"
                >
                    YENİ MAÇ
                </button>
            )}
        </div>
    </div>
  );
};
