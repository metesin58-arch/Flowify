
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../types';
import { CoinIcon, UsersIcon, TrophyIcon } from './Icons';
import { playClickSound } from '../services/sfx';

interface Venue {
    id: string;
    name: string;
    capacity: number;
    rentCost: number;
    prestige: number; // 1-5 stars
    difficulty: number; // Affects mini-game difficulty or hype decay
}

interface Props {
    player: PlayerStats;
    onConfirm: (venue: Venue, ticketPrice: number) => void;
    onBack: () => void;
}

// Türkçe İsimler
const VENUE_PREFIXES = ['Kulüp', 'Sahne', 'Arena', 'Salon', 'Teras', 'Stadyum', 'Park', 'Meydan', 'Bar', 'Hangar'];
const VENUE_SUFFIXES = ['Yeraltı', 'Elit', 'Merkez', 'Cadde', 'Yıldız', 'Liman', 'Kule', 'Vadi', 'Sokak', 'Rıhtım'];

export const VenueSelection: React.FC<Props> = ({ player, onConfirm, onBack }) => {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
    const [ticketPrice, setTicketPrice] = useState(50); // Default ticket price

    useEffect(() => {
        generateVenues();
    }, [player.careerLevel]);

    const generateVenues = () => {
        const level = player.careerLevel || 1;
        const baseCap = level * 100; 
        
        const newVenues: Venue[] = Array.from({ length: 3 }).map((_, i) => {
            const qualityMod = 1 + (i * 0.5); // 1x, 1.5x, 2x tiers
            const capacity = Math.floor(baseCap * qualityMod * (0.8 + Math.random() * 0.4));
            
            // EXPONENTIAL RENT LOGIC
            // Index 0 (Easy): Cheap (~100-200)
            // Index 1 (Medium): Moderate (~800-1500)
            // Index 2 (Hard): Expensive (~5000+)
            
            // Base Calculation
            let baseRent = 100 * Math.pow(5, i); 
            // Random variation +/- 10%
            let rent = Math.floor(baseRent * (0.9 + Math.random() * 0.2));
            
            // Safety cap for level 1 to avoid unplayable state if bad RNG
            if (level === 1 && i === 0 && rent > 200) rent = 100; 

            // RENT DOUBLING AFTER 1ST CONCERT (If week > 1)
            if (player.week > 1) {
                rent *= 2;
            }

            const p1 = VENUE_PREFIXES[Math.floor(Math.random() * VENUE_PREFIXES.length)];
            const p2 = VENUE_SUFFIXES[Math.floor(Math.random() * VENUE_SUFFIXES.length)];

            return {
                id: `venue_${Date.now()}_${i}`,
                name: `${p1} ${p2}`,
                capacity: capacity,
                rentCost: rent,
                prestige: Math.min(5, Math.floor(level / 5) + i + 1),
                difficulty: i + 1
            };
        });
        setVenues(newVenues);
    };

    const handleConfirm = () => {
        playClickSound();
        const venue = venues.find(v => v.id === selectedVenueId);
        if (venue) {
            if (player.careerCash < venue.rentCost) {
                // This shouldn't happen due to disabled button, but as a safety check
                return;
            }
            onConfirm(venue, ticketPrice);
        }
    };

    const handleBack = () => {
        playClickSound();
        onBack();
    };

    const handleSelect = (id: string) => {
        playClickSound();
        setSelectedVenueId(id);
    };

    const selectedVenue = venues.find(v => v.id === selectedVenueId);
    const canAfford = selectedVenue ? player.careerCash >= selectedVenue.rentCost : false;
    
    // Calculate Potentials
    const maxRevenue = selectedVenue ? (selectedVenue.capacity * ticketPrice) - selectedVenue.rentCost : 0;
    // Basic logic: Higher price = Lower fill rate (simplified)
    const estimatedFillRate = Math.max(0.3, Math.min(1.0, 1.0 - ((ticketPrice - 50) / 200))); 
    const estimatedRevenue = selectedVenue ? Math.floor(((selectedVenue.capacity * estimatedFillRate) * ticketPrice) - selectedVenue.rentCost) : 0;

    return (
        <div className="h-full bg-black flex flex-col relative overflow-hidden animate-fade-in font-sans">
            
            {/* Header - Fixed Padding */}
            <div className="pt-safe-top mt-8 px-6 pb-6 bg-black/80 backdrop-blur-xl border-b border-white/5 z-20">
                <h1 className="text-2xl font-black text-white tracking-tighter lowercase">mekan seçimi<span className="text-[#1DB954]">.</span></h1>
                <p className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight">turne hazırlığı • bütçen: ₺{player.careerCash.toLocaleString()}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-48 no-scrollbar">
                
                {/* Cards */}
                <div className="space-y-4">
                    {venues.map((venue, idx) => {
                        const isSelected = selectedVenueId === venue.id;
                        let tierColor = 'text-[#1DB954]';
                        if(idx === 1) tierColor = 'text-yellow-500';
                        if(idx === 2) tierColor = 'text-red-500';

                        return (
                            <button
                                key={venue.id}
                                onClick={() => handleSelect(venue.id)}
                                className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group active:scale-[0.98] ${isSelected ? 'bg-white/5 border-[#1DB954] shadow-[0_0_40px_rgba(29,185,84,0.1)]' : 'bg-[#050505] border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div>
                                        <div className="text-base font-extrabold text-white lowercase tracking-tight leading-tight">{venue.name.toLowerCase()}</div>
                                        <div className="text-[10px] text-neutral-500 font-bold lowercase tracking-tight mt-1">
                                            {venue.capacity.toLocaleString()} kapasite.
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-red-500 font-mono font-bold text-xs">-₺{venue.rentCost.toLocaleString()}</div>
                                        <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full bg-black/40 ${tierColor} mt-2 tracking-tight border border-white/5`}>
                                            {idx === 0 ? 'normal.' : idx === 1 ? 'zorlu.' : 'efsane.'}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Prestige Stars */}
                                <div className="flex gap-1 relative z-10 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <React.Fragment key={i}>
                                            <TrophyIcon className={`w-2.5 h-2.5 ${i < venue.prestige ? 'text-yellow-500' : 'text-white/10'}`} />
                                        </React.Fragment>
                                    ))}
                                </div>

                                {isSelected && (
                                    <div className="absolute right-[-5%] bottom-[-5%] opacity-5 rotate-12 transition-transform duration-700 group-hover:scale-110">
                                        <UsersIcon className="w-32 h-32 text-[#1DB954]" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Ticket Pricing Controls - Integrated and Premium */}
                {selectedVenue && (
                    <div className="bg-[#050505] border border-white/5 p-6 rounded-[2rem] animate-fade-in shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DB954]/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-neutral-400 lowercase tracking-tight">bilet fiyatı.</span>
                                <span className="text-[9px] text-neutral-500 font-medium lowercase tracking-tight">kâr marjı ayarla.</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-mono font-black text-[#1DB954] drop-shadow-[0_0_15px_rgba(29,185,84,0.2)]">₺{ticketPrice}</span>
                            </div>
                        </div>
                        
                        <div className="relative h-12 flex items-center mb-8 px-1">
                            <input 
                                type="range" 
                                min="10" 
                                max="500" 
                                step="10" 
                                value={ticketPrice} 
                                onChange={(e) => setTicketPrice(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer z-10 shadow-inner accent-[#1DB954]"
                            />
                            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                                {[...Array(15)].map((_, i) => (
                                    <div key={i} className="w-px h-1.5 bg-white/10"></div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 relative z-10">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <div className="text-[9px] text-neutral-500 font-bold lowercase tracking-tight mb-1.5">tahmini doluluk.</div>
                                <div className={`text-sm font-black lowercase ${estimatedFillRate > 0.8 ? 'text-[#1DB954]' : estimatedFillRate > 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    %{Math.floor(estimatedFillRate * 100)}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm text-right">
                                <div className="text-[9px] text-neutral-500 font-bold lowercase tracking-tight mb-1.5">tahmini kâr.</div>
                                <div className={`text-sm font-black font-mono lowercase ${estimatedRevenue > 0 ? 'text-[#1DB954]' : 'text-red-500'}`}>
                                    {estimatedRevenue > 0 ? '+' : ''}₺{estimatedRevenue.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-8 bg-black border-t border-white/5 z-30 flex gap-4 pb-safe">
                <button 
                    onClick={handleBack}
                    className="flex-1 bg-white/5 text-white font-semibold py-4 rounded-2xl border border-white/5 text-[11px] lowercase tracking-tight transition-all active:scale-95"
                >
                    iptal.
                </button>
                <button 
                    onClick={handleConfirm}
                    disabled={!selectedVenue || !canAfford}
                    className={`flex-[2] font-extrabold py-4 rounded-2xl text-[11px] lowercase tracking-tight shadow-2xl transition-all active:scale-95 ${selectedVenue && canAfford ? 'bg-[#1DB954] text-black' : 'bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed'}`}
                >
                    {selectedVenue && !canAfford ? 'yetersiz bakiye.' : 'devam et.'}
                </button>
            </div>
        </div>
    );
};
