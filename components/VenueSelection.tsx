
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
            // Allows negative balance (Debt System)
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
    
    // Calculate Potentials
    const maxRevenue = selectedVenue ? (selectedVenue.capacity * ticketPrice) - selectedVenue.rentCost : 0;
    // Basic logic: Higher price = Lower fill rate (simplified)
    const estimatedFillRate = Math.max(0.3, Math.min(1.0, 1.0 - ((ticketPrice - 50) / 200))); 
    const estimatedRevenue = selectedVenue ? Math.floor(((selectedVenue.capacity * estimatedFillRate) * ticketPrice) - selectedVenue.rentCost) : 0;

    return (
        <div className="h-full bg-[#050505] flex flex-col relative overflow-hidden animate-slide-in-right font-sans">
            
            {/* Header - Fixed Padding */}
            <div className="pt-safe-top mt-8 px-6 pb-4 bg-black/80 backdrop-blur-md border-b border-white/10 z-20">
                <h1 className="text-2xl font-black text-white italic tracking-tighter">MEKAN SEÇİMİ</h1>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Turne Hazırlığı • Kariyer Bütçesi: ₺{player.careerCash.toLocaleString()}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                
                {/* Cards */}
                <div className="space-y-4">
                    {venues.map((venue, idx) => {
                        const isSelected = selectedVenueId === venue.id;
                        let tierColor = 'text-green-500';
                        if(idx === 1) tierColor = 'text-yellow-500';
                        if(idx === 2) tierColor = 'text-red-500';

                        return (
                            <button
                                key={venue.id}
                                onClick={() => handleSelect(venue.id)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${isSelected ? 'bg-white/10 border-[#1ed760] shadow-[0_0_20px_rgba(30,215,96,0.1)]' : 'bg-[#111] border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div>
                                        <div className="text-lg font-black text-white uppercase italic">{venue.name}</div>
                                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                                            Kapasite: {venue.capacity.toLocaleString()} Kişi
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-red-400 font-mono font-bold text-sm">-₺{venue.rentCost.toLocaleString()}</div>
                                        <div className={`text-[9px] uppercase font-bold ${tierColor}`}>
                                            {idx === 0 ? 'Normal' : idx === 1 ? 'Zorlu' : 'Efsane'}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Prestige Stars */}
                                <div className="flex gap-1 relative z-10">
                                    {[...Array(5)].map((_, i) => (
                                        <React.Fragment key={i}>
                                            <TrophyIcon className={`w-3 h-3 ${i < venue.prestige ? 'text-yellow-500' : 'text-neutral-800'}`} />
                                        </React.Fragment>
                                    ))}
                                </div>

                                {isSelected && (
                                    <div className="absolute right-0 bottom-0 p-4 opacity-10">
                                        <UsersIcon className="w-24 h-24 text-[#1ed760]" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Ticket Pricing Controls */}
                {selectedVenue && (
                    <div className="bg-[#111] border border-white/10 p-5 rounded-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Bilet Fiyatı</span>
                            <span className="text-xl font-mono font-black text-[#1ed760]">₺{ticketPrice}</span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="10" 
                            max="500" 
                            step="10" 
                            value={ticketPrice} 
                            onChange={(e) => setTicketPrice(parseInt(e.target.value))}
                            className="w-full accent-[#1ed760] h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer mb-6"
                        />

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase font-bold">Tahmini Doluluk</div>
                                <div className={`text-sm font-black ${estimatedFillRate > 0.8 ? 'text-green-500' : estimatedFillRate > 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    %{Math.floor(estimatedFillRate * 100)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold">Tahmini Kâr</div>
                                <div className={`text-sm font-black font-mono ${estimatedRevenue > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                    {estimatedRevenue > 0 ? '+' : ''}₺{estimatedRevenue.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-6 bg-black/90 border-t border-white/10 z-30 flex gap-3">
                <button 
                    onClick={handleBack}
                    className="flex-1 bg-[#222] text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-[#333]"
                >
                    İptal
                </button>
                <button 
                    onClick={handleConfirm}
                    disabled={!selectedVenue}
                    className={`flex-[2] font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all ${selectedVenue ? 'bg-[#1ed760] text-black hover:scale-[1.02]' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                >
                    DEVAM ET
                </button>
            </div>
        </div>
    );
};
