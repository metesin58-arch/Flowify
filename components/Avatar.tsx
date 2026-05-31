
import React, { useMemo } from 'react';
import { CharacterAppearance, Gender } from '../types';
import { HEAD_OPTIONS } from '../constants';

interface AvatarProps {
  appearance: CharacterAppearance;
  gender?: Gender;
  className?: string;
  size?: number; 
  headOnly?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ appearance, gender = 'male', className, size = 300, headOnly = false }) => {
  // Safety check
  const safeAppearance = appearance || {
    headIndex: 0,
    skinColor: '#f1c27d',
    shirtColor: '#333333',
    pantsColor: '#1a1a1a',
    shoesColor: '#ffffff',
    clothingStyle: 0,
    pantsStyle: 0,
    hatIndex: 0,
    chainIndex: 0,
    shoeStyle: 0
  };

  const { 
      headIndex, skinColor, shirtColor, pantsColor, shoesColor, clothingStyle, pantsStyle,
      hatIndex = 0, chainIndex = 0, shoeStyle = 0
  } = safeAppearance;
  
  const styleInt = typeof clothingStyle === 'number' ? clothingStyle : 0;
  const pantsInt = typeof pantsStyle === 'number' ? pantsStyle : 0;
  const shoeInt = typeof shoeStyle === 'number' ? shoeStyle : 0;
  
  const headImageSrc = HEAD_OPTIONS[headIndex] || HEAD_OPTIONS[0];
  const uid = useMemo(() => 'grad-' + Math.random().toString(36).substr(2, 9), []);

  // Adjust Y position for specific heads to fix floating issue
  const getHeadYOffset = (index: number) => {
      if (index === 1) return 10; // HEAD 2 (kafairem)
      if (index === 5) return 8;  // HEAD 6 (head6)
      return 0;
  };

  const headY = -110 + getHeadYOffset(headIndex);

  const isMobileClient = typeof window !== 'undefined' && 
    (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);

  return (
    <div 
      className={`relative flex flex-col items-center justify-end ${className}`}
      style={{ 
        height: size, 
        width: size * 0.8,
        filter: isMobileClient ? 'none' : 'drop-shadow(0px 10px 15px rgba(0,0,0,0.6))' 
      }}
    >
      <svg 
          viewBox="0 0 200 400" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMax meet"
      >
          <defs>
              {/* --- LIGHTING & EFFECTS ONLY (No color gradients) --- */}
              
              {/* Skin Tone Gradient (Subtle) */}
              <linearGradient id={`skin-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={skinColor} style={{filter: 'brightness(0.9)'}} />
                  <stop offset="40%" stopColor={skinColor} style={{filter: 'brightness(1.1)'}} />
                  <stop offset="100%" stopColor={skinColor} style={{filter: 'brightness(0.8)'}} /> 
              </linearGradient>

              {/* Jewelry Gradients */}
              <linearGradient id={`gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FDB931" />
                  <stop offset="100%" stopColor="#996515" />
              </linearGradient>

              <linearGradient id={`silver-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="50%" stopColor="#e0e0e0" />
                  <stop offset="100%" stopColor="#757575" />
              </linearGradient>

              {/* Lighting Overlay for 3D volume - Optimized for mobile */}
              {isMobileClient ? (
                  <filter id={`lighting-${uid}`}>
                      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                  </filter>
              ) : (
                  <filter id={`lighting-${uid}`}>
                      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
                      <feSpecularLighting in="blur" surfaceScale="3" specularConstant=".5" specularExponent="15" lightingColor="#ffffff" result="specOut">
                          <fePointLight x="-5000" y="-10000" z="20000"/>
                      </feSpecularLighting>
                      <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
                      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0"/>
                  </filter>
              )}
          </defs>

          {/* FLOOR SHADOW */}
          <ellipse cx="100" cy="380" rx="60" ry="10" fill="black" opacity="0.5" filter="blur(4px)" />

          {/* POSITIONING GROUP - SCALED DOWN FURTHER (0.75) AND CENTERED */}
          <g transform={headOnly ? "translate(100, 620) scale(1.4)" : "translate(100, 390) scale(0.75)"}>
              
              <g className={headOnly ? "" : "animate-breathe"}>

                  {/* --- PANTS (BOTTOMS) --- */}
                  {!headOnly && (
                    <g transform="translate(0, -140)">
                        {/* 0: JEANS (Refined Crotch) */}
                        {pantsInt === 0 && (
                             <g>
                                 <path d="M -40 0 L 40 0 L 48 135 L 18 135 L 10 45 Q 0 35 -10 45 L -18 135 L -48 135 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                                 <path d="M -35 45 L -10 50" stroke="black" strokeOpacity="0.2" fill="none" />
                                 <path d="M 35 45 L 10 50" stroke="black" strokeOpacity="0.2" fill="none" />
                             </g>
                        )}
                      
                        {/* 1: SWEATPANTS (Refined) */}
                        {pantsInt === 1 && (
                            <g>
                                <path d="M -44 0 L 44 0 L 52 125 Q 30 140 18 125 L 10 45 Q 0 35 -10 45 L -18 125 Q -30 140 -52 125 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                                <rect x="-48" y="123" width="28" height="14" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" />
                                <rect x="20" y="123" width="28" height="14" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" />
                                <path d="M -4 0 L -4 25" stroke="white" strokeWidth="2" />
                                <path d="M 4 0 L 4 25" stroke="white" strokeWidth="2" />
                            </g>
                        )}
                      
                        {/* 2: CARGO PANTS (Refined) */}
                        {pantsInt === 2 && (
                            <g>
                                <path d="M -48 0 L 48 0 L 58 130 L 22 130 L 10 45 Q 0 35 -10 45 L -22 130 L -58 130 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                                <rect x="-58" y="45" width="16" height="40" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" filter="brightness(0.9)" />
                                <rect x="42" y="45" width="16" height="40" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" filter="brightness(0.9)" />
                            </g>
                        )}

                      {/* --- DETAILED SHOES --- */}
                      <g transform="translate(0, 10)"> 
                          {shoeInt === 0 && ( // Sneaker
                              <g>
                                  <path d="M -50 120 L -20 120 L -20 138 Q -22 145 -50 142 Z" fill={shoesColor} />
                                  <path d="M -52 140 L -18 140 L -18 148 L -52 148 Z" fill="#eee" /> 
                                  <path d="M -45 122 L -30 122 M -45 126 L -30 126 M -45 130 L -30 130" stroke="#ccc" strokeWidth="2" /> 
                                  <path d="M 20 120 L 50 120 L 50 138 Q 22 145 20 142 Z" fill={shoesColor} />
                                  <path d="M 18 140 L 52 140 L 52 148 L 18 148 Z" fill="#eee" />
                                  <path d="M 30 122 L 45 122 M 30 126 L 45 126 M 30 130 L 45 130" stroke="#ccc" strokeWidth="2" />
                              </g>
                          )}
                          {shoeInt === 1 && ( // Boot
                              <g>
                                  <path d="M -52 115 L -18 115 L -16 145 L -54 145 Z" fill={shoesColor} stroke="black" strokeWidth="0.5"/>
                                  <path d="M -55 145 L -15 145 L -15 152 L -55 152 Z" fill="#333" />
                                  <path d="M 18 115 L 52 115 L 54 145 L 16 145 Z" fill={shoesColor} stroke="black" strokeWidth="0.5"/>
                                  <path d="M 15 145 L 55 145 L 55 152 L 15 152 Z" fill="#333" />
                              </g>
                          )}
                          {shoeInt === 2 && ( // Loafer
                              <g>
                                  <path d="M -48 125 L -20 125 L -18 142 L -50 142 Z" fill={shoesColor} filter="brightness(1.3)" />
                                  <rect x="-42" y="125" width="14" height="5" fill="#ffd700" />
                                  <path d="M 20 125 L 48 125 L 50 142 L 18 142 Z" fill={shoesColor} filter="brightness(1.3)" />
                                  <rect x="28" y="125" width="14" height="5" fill="#ffd700" />
                              </g>
                          )}
                      </g>
                    </g>
                  )}

                  {/* --- TORSO & TOPS --- */}
                  {!headOnly && (
                    <g transform="translate(0, -250)">
                        {styleInt === 0 && ( // T-SHIRT (Renewed with visual detail)
                            <g>
                                <path d="M -48 0 L 48 0 L 42 125 L -42 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                {/* Neckline and collar shadow */}
                                <path d="M -20 0 Q 0 15 20 0" stroke="rgba(0,0,0,0.3)" strokeWidth="3" fill="none" />
                                {/* Cool center streetwear emblem */}
                                <g transform="translate(0, 60) scale(0.9)">
                                    {/* Abstract Graffiti Spray Background */}
                                    <circle cx="0" cy="0" r="18" fill="#1DB954" opacity="0.15" filter="blur(2px)" />
                                    {/* Star / Sparkle */}
                                    <path d="M 0 -15 L 3 -3 L 15 0 L 3 3 L 0 15 L -3 3 L -15 0 L -3 -3 Z" fill="#1DB954" opacity="0.8" />
                                    <text x="0" y="25" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff" letterSpacing="1" fontFamily="Impact, Arial Black" opacity="0.85">FLOW</text>
                                </g>
                            </g>
                        )}
                        {styleInt === 1 && ( // HOODIE (Renewed)
                            <g>
                                {/* Hoodie Hood */}
                                <path d="M -28 -12 Q 0 -35 28 -12 L 32 10 L -32 10 Z" fill={shirtColor} filter="brightness(0.75)" />
                                {/* Hoodie Main Body */}
                                <path d="M -52 0 L 52 0 L 46 122 L -46 122 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                
                                {/* Ribbed Bottom Cuff */}
                                <path d="M -46 112 L 46 112 L 46 122 L -46 122 Z" fill={shirtColor} filter="brightness(0.85)" />
                                {/* Kangaroo Pocket on Front */}
                                <path d="M -25 70 L 25 70 L 32 105 L -32 105 Z" fill={shirtColor} filter="brightness(0.9)" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="1.5" />
                                <path d="M -25 70 L -32 105 M 25 70 L 32 105" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                                
                                {/* Deluxe Braided Drawstrings with Gold Tips */}
                                <path d="M -12 2 Q -18 30 -14 55" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <circle cx="-14" cy="55" r="2.5" fill="#D4AF37" />
                                <path d="M 12 2 Q 6 25 10 50" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <circle cx="10" cy="50" r="2.5" fill="#D4AF37" />
                            </g>
                        )}
                        {styleInt === 2 && ( // MONT / JACKET (Renewed)
                            <g>
                                {/* Inner Black Collar/Tee */}
                                <path d="M -30 0 L 30 0 L 26 115 L -26 115 Z" fill="#151515" />
                                <path d="M -30 0 Q 0 16 30 0" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
                                {/* Left Jacket Front */}
                                <path d="M -55 -5 L -12 -5 L -16 120 L -48 115 Q -60 50 -55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                {/* Right Jacket Front */}
                                <path d="M 55 -5 L 12 -5 L 16 120 L 48 115 Q 58 50 55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                
                                {/* Puffer Puffy Stitching Lines */}
                                <path d="M -53 30 Q -32 32 -14 30" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />
                                <path d="M -51 65 Q -32 68 -15 65" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />
                                <path d="M -49 95 Q -32 98 -16 95" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />

                                <path d="M 53 30 Q 32 32 14 30" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />
                                <path d="M 51 65 Q 32 68 15 65" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />
                                <path d="M 49 95 Q 32 98 16 95" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" fill="none" />
                                
                                {/* Zipper track & hardware */}
                                <path d="M -12 -5 L -16 120 M 12 -5 L 16 120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <rect x="-4" y="20" width="8" height="12" rx="1.5" fill="#C0C0C0" stroke="#333" strokeWidth="0.5" />
                                <rect x="-1" y="32" width="2" height="10" rx="0.5" fill="#888" />
                            </g>
                        )}
                        {styleInt === 3 && ( // SHIRT (Renewed Lumberjack Plaid)
                            <g>
                                <path d="M -45 0 L 45 0 L 40 125 L -40 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                {/* Flannel Plaid Overlay Checks */}
                                <g opacity="0.15">
                                    <line x1="-42" y1="20" x2="42" y2="20" stroke="#fff" strokeWidth="4" />
                                    <line x1="-41" y1="50" x2="41" y2="50" stroke="#fff" strokeWidth="4" />
                                    <line x1="-40" y1="80" x2="40" y2="80" stroke="#fff" strokeWidth="4" />
                                    <line x1="-40" y1="110" x2="40" y2="110" stroke="#fff" strokeWidth="4" />
                                    
                                    <line x1="-30" y1="0" x2="-30" y2="125" stroke="#fff" strokeWidth="4" />
                                    <line x1="-15" y1="0" x2="-15" y2="125" stroke="#fff" strokeWidth="4" />
                                    <line x1="15" y1="0" x2="15" y2="125" stroke="#fff" strokeWidth="4" />
                                    <line x1="30" y1="0" x2="30" y2="125" stroke="#fff" strokeWidth="4" />
                                </g>
                                {/* Placket down center */}
                                <rect x="-4" y="0" width="8" height="125" fill="rgba(0,0,0,0.18)" />
                                {/* Premium Wooden/Bone Buttons */}
                                <circle cx="0" cy="25" r="3.5" fill="#8B5A2B" stroke="#4a2f15" strokeWidth="0.5" />
                                <circle cx="0" cy="55" r="3.5" fill="#8B5A2B" stroke="#4a2f15" strokeWidth="0.5" />
                                <circle cx="0" cy="85" r="3.5" fill="#8B5A2B" stroke="#4a2f15" strokeWidth="0.5" />
                                <circle cx="0" cy="115" r="3.5" fill="#8B5A2B" stroke="#4a2f15" strokeWidth="0.5" />
                                
                                {/* Refined Dual Collar flaps */}
                                <path d="M -22 0 L -8 18 L 0 4 M 22 0 L 8 18 L 0 4" fill={shirtColor} stroke="rgba(0,0,0,0.3)" strokeWidth="1" filter="brightness(1.15)" />
                            </g>
                        )}
                        {styleInt === 4 && ( // JERSEY (Renewed)
                            <g>
                                <path d="M -48 0 L -42 20 L -30 0 Z" fill={`url(#skin-${uid})`} />
                                <path d="M 48 0 L 42 20 L 30 0 Z" fill={`url(#skin-${uid})`} />
                                <path d="M -45 0 L 45 0 L 42 125 L -42 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                {/* Contrasting Sporty Side Panels */}
                                <path d="M -45 0 L -39 0 L -36 125 L -42 125 Z" fill="rgba(0,0,0,0.3)" />
                                <path d="M 45 0 L 39 0 L 36 125 L 42 125 Z" fill="rgba(0,0,0,0.3)" />
                                
                                {/* Neck Trim and Armhole Trim */}
                                <path d="M -22 0 Q 0 24 22 0" stroke="#FFD700" strokeWidth="3.5" fill="none" />
                                <path d="M -45 0 Q -41 22 -37 0" stroke="#FFD700" strokeWidth="2.5" fill="none" />
                                <path d="M 45 0 Q 41 22 37 0" stroke="#FFD700" strokeWidth="2.5" fill="none" />
                                
                                <text x="0" y="45" textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFD700" letterSpacing="1" fontFamily="Impact, Arial Black" opacity="0.95">FLOW_CITY</text>
                                <text x="0" y="90" textAnchor="middle" fontSize="42" fontWeight="950" fill="white" fontFamily="Impact, Arial Black" style={{filter: 'drop-shadow(2px 3px 0px rgba(0,0,0,0.45))'}}>99</text>
                                
                                <path d="M -8 105 L 0 98 L 8 105" stroke="#FFD700" strokeWidth="1.5" fill="none" />
                            </g>
                        )}
                        {styleInt === 5 && ( // LEATHER (Renewed Studded Punk Leather)
                            <g>
                                {/* Inner Red Hoodie or Grey Tee under Leather */}
                                <path d="M -22 0 L 22 0 L 22 115 L -22 115 Z" fill="#8b0000" />
                                {/* Left Jacket Front */}
                                <path d="M -55 -5 L -12 -5 L -18 110 L -50 105 Q -58 50 -55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                {/* Right Jacket Front */}
                                <path d="M 55 -5 L 12 -5 L 18 110 L 50 105 Q 58 50 55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                
                                {/* Metallic Off-Center Main Heavy Zipper */}
                                <line x1="12" y1="5" x2="-14" y2="110" stroke="#fff" strokeWidth="2.5" strokeDasharray="3,1.5" />
                                <rect x="-6" y="55" width="8" height="12" rx="1.5" fill="#e0e0e0" stroke="#222" strokeWidth="0.5" />
                                
                                {/* Bold Double Lapels Left & Right with Silver snaps */}
                                <path d="M -48 -5 L -20 28 L -48 34 Z" fill="#111111" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <path d="M 48 -5 L 20 28 L 48 34 Z" fill="#111111" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                <circle cx="-38" cy="18" r="2.5" fill="#fff" stroke="#333" strokeWidth="0.5" />
                                <circle cx="38" cy="18" r="2.5" fill="#fff" stroke="#333" strokeWidth="0.5" />
                                
                                {/* Shoulder Epaulet Straps */}
                                <path d="M -53 -5 L -35 -2 L -36 5 L -54 2 Z" fill="#1a1a1a" />
                                <circle cx="-40" cy="0" r="1.5" fill="#eee" />
                                <path d="M 53 -5 L 35 -2 L 36 5 L 54 2 Z" fill="#1a1a1a" />
                                <circle cx="40" cy="0" r="1.5" fill="#eee" />

                                {/* Zipper Chest Pocket */}
                                <line x1="-35" y1="45" x2="-18" y2="40" stroke="#fff" strokeWidth="2" />
                            </g>
                        )}
                        {styleInt === 6 && ( // TECHWEAR VEST (New 6)
                            <g>
                                {/* Inner Neon Orange Mock-neck Tee */}
                                <path d="M -26 -2 L 26 -2 L 22 125 L -22 125 Z" fill="#FF5500" filter={`url(#lighting-${uid})`} />
                                {/* Tactical Vest Main Body */}
                                <path d="M -48 10 L 48 10 L 42 122 L -42 122 Z" fill="#111111" />
                                {/* V-Neck cut of the vest */}
                                <path d="M -22 10 L 0 50 L 22 10" stroke="#333" strokeWidth="2" fill="none" />
                                
                                {/* Tactical Chest Pocket Left */}
                                <rect x="-35" y="45" width="14" height="22" rx="2" fill="#222" stroke="#444" strokeWidth="1" />
                                <rect x="-35" y="45" width="14" height="6" fill="#FF5500" opacity="0.8" />
                                
                                {/* Tactical Chest Pocket Right */}
                                <rect x="21" y="45" width="14" height="22" rx="2" fill="#222" stroke="#444" strokeWidth="1" />
                                <rect x="21" y="45" width="14" height="6" fill="#FF5500" opacity="0.8" />
                                
                                {/* Technical Webbing Straps Across Chest */}
                                <line x1="-38" y1="80" x2="38" y2="80" stroke="#FF5500" strokeWidth="2" />
                                <line x1="-38" y1="95" x2="38" y2="95" stroke="#FF5500" strokeWidth="2" />
                                
                                {/* Center release utility buckles */}
                                <rect x="-6" y="75" width="12" height="10" rx="1.5" fill="#222" stroke="#444" strokeWidth="1" />
                                <rect x="-6" y="90" width="12" height="10" rx="1.5" fill="#222" stroke="#444" strokeWidth="1" />
                            </g>
                        )}
                        {styleInt === 7 && ( // SAGO STYLE HOODIE (New 7)
                            <g>
                                {/* Immersive Wide Hood */}
                                <path d="M -34 -15 Q 0 -45 34 -15 Q 40 15 25 10 Q 0 -5 -25 10 Q -40 15 -34 -15 Z" fill="#1a1c2e" filter={`url(#lighting-${uid})`} />
                                {/* Mystical Oversized Body */}
                                <path d="M -54 0 L 54 0 L 48 123 L -48 123 Z" fill="#141520" />
                                
                                {/* Large Mystical Crescent Moon Print */}
                                <path d="M -15 65 A 15 15 0 1 0 15 65 A 12 12 0 1 1 -15 65 Z" fill="#b0c4de" opacity="0.85" filter="drop-shadow(0 0 6px #87cefa)" />
                                
                                {/* Mystical Geometry Lines */}
                                <line x1="0" y1="36" x2="0" y2="105" stroke="#4682b4" strokeWidth="1.5" opacity="0.5" />
                                <circle cx="0" cy="40" r="3" fill="#fff" />
                                <circle cx="0" cy="95" r="3" fill="#fff" />
                                
                                {/* Wide Cuffs */}
                                <path d="M -48 113 L 48 113 L 48 123 L -48 123 Z" fill="#0d0e15" />
                            </g>
                        )}
                        {styleInt === 8 && ( // SILVER DRILL PUFFER (New 8)
                            <g>
                                {/* High standing puffer collar */}
                                <path d="M -26 -8 Q 0 -20 26 -8 L 30 15 L -30 15 Z" fill="#d0d5dd" filter="brightness(1.15)" />
                                {/* Main Metallic Body */}
                                <path d="M -53 5 L 53 5 L 46 122 L -46 122 Z" fill="#e4e7ec" filter={`url(#lighting-${uid})`} />
                                
                                {/* Volumetric Stitching Segments with reflective gloss sweeps */}
                                <path d="M -52 35 Q 0 42 52 35" stroke="rgba(255,255,255,0.7)" strokeWidth="4.5" fill="none" opacity="0.4" />
                                <path d="M -52 35 Q 0 42 52 35" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" fill="none" />
                                
                                <path d="M -50 68 Q 0 75 50 68" stroke="rgba(255,255,255,0.7)" strokeWidth="4.5" fill="none" opacity="0.4" />
                                <path d="M -50 68 Q 0 75 50 68" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" fill="none" />
                                
                                <path d="M -48 98 Q 0 105 48 98" stroke="rgba(255,255,255,0.7)" strokeWidth="4.5" fill="none" opacity="0.4" />
                                <path d="M -48 98 Q 0 105 48 98" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" fill="none" />

                                {/* Glowing Cyan Street Badge for Drill brand style */}
                                <rect x="-24" y="50" width="10" height="10" rx="1.5" fill="#111" stroke="#00ffff" strokeWidth="1" />
                                <circle cx="-19" cy="55" r="2" fill="#00ffff" />
                            </g>
                        )}
                        {styleInt === 9 && ( // RETRO 90S SWEATER (New 9)
                            <g>
                                {/* Colorblock Base Body */}
                                <path d="M -46 0 L 46 0 L 42 122 L -42 122 Z" fill="#8a2be2" filter={`url(#lighting-${uid})`} /> {/* Purple block */}
                                
                                {/* Diagonal Teal block on top left */}
                                <path d="M -46 0 L 10 0 L -18 80 L -44 80 Z" fill="#008080" />
                                
                                {/* Accent Magenta Stripe */}
                                <path d="M 10 0 L 22 0 L -10 90 L -22 90 Z" fill="#ff1493" />
                                
                                {/* Loose collar ribbing */}
                                <path d="M -18 0 Q 0 14 18 0" stroke="#ffeb3b" strokeWidth="3" fill="none" />
                                
                                {/* Yellow retro typography overlay */}
                                <text x="12" y="75" textAnchor="middle" fontSize="11" fontWeight="900" fill="#ffeb3b" transform="rotate(-15)" fontFamily="Impact, Arial Black" letterSpacing="0.5">HIP HOP</text>
                            </g>
                        )}
                        {styleInt === 10 && ( // PHARAOH GOLDEN JERSEY (New 10)
                            <g>
                                <path d="M -48 0 L -42 20 L -30 0 Z" fill={`url(#skin-${uid})`} />
                                <path d="M 48 0 L 42 20 L 30 0 Z" fill={`url(#skin-${uid})`} />
                                <path d="M -45 0 L 45 0 L 42 125 L -42 125 Z" fill="#0f0f12" filter={`url(#lighting-${uid})`} />
                                
                                {/* Golden Wings Sweep on sides */}
                                <path d="M -45 20 Q -25 50 -41 125 L -42 125 Z" fill="#D4AF37" opacity="0.25" />
                                <path d="M 45 20 Q 25 50 41 125 L 42 125 Z" fill="#D4AF37" opacity="0.25" />
                                
                                {/* Ancient Egyptian Collar/Neckpiece Border */}
                                <path d="M -22 0 Q 0 35 22 0" fill="none" stroke="#D4AF37" strokeWidth="5" />
                                <path d="M -18 3 Q 0 26 18 3" fill="none" stroke="#fff" strokeWidth="1" />
                                
                                {/* Golden Ankh / Eye of Horus Hieroglyph in Center */}
                                <g transform="translate(0, 68) scale(0.7)">
                                    {/* Ankh symbol */}
                                    <circle cx="0" cy="-18" r="8" fill="none" stroke="#D4AF37" strokeWidth="3" />
                                    <line x1="0" y1="-10" x2="0" y2="15" stroke="#D4AF37" strokeWidth="3.5" />
                                    <line x1="-12" y1="-5" x2="12" y2="-5" stroke="#D4AF37" strokeWidth="3.5" />
                                </g>
                                
                                <text x="0" y="112" textAnchor="middle" fontSize="14" fontWeight="950" fill="#D4AF37" fontFamily="Impact, Arial Black" letterSpacing="2">KINGS</text>
                            </g>
                        )}
                    </g>
                  )}

                  {/* --- ARMS --- */}
                  {!headOnly && (
                    <g transform="translate(0, -245)">
                        {styleInt === 4 || styleInt === 10 ? ( // Jerseys (Bare Arms)
                            <g>
                                <path transform="rotate(5, -45, 10)" d="M -45 5 L -65 5 L -60 95 L -40 95 Z" fill={`url(#skin-${uid})`} filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(5, -45, 10)" d="M -60 95 L -40 95 L -42 115 L -58 115 Z" fill={`url(#skin-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 45 5 L 65 5 L 60 95 L 40 95 Z" fill={`url(#skin-${uid})`} filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 60 95 L 40 95 L 42 115 L 58 115 Z" fill={`url(#skin-${uid})`} />
                            </g>
                        ) : styleInt === 5 || styleInt === 2 || styleInt === 8 ? ( // Jackets & Puffers (Thicker Arms)
                            <g>
                                <path transform="rotate(8, -45, 10)" d="M -48 -5 L -75 0 L -70 95 L -42 90 Z" fill={styleInt === 8 ? "#e4e7ec" : shirtColor} filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-8, 45, 10)" d="M 48 -5 L 75 0 L 70 95 L 42 90 Z" fill={styleInt === 8 ? "#e4e7ec" : shirtColor} filter={`url(#lighting-${uid})`} />
                                <rect x="-70" y="85" width="28" height="12" transform="rotate(8, -45, 10)" fill={`url(#skin-${uid})`} />
                                <rect x="42" y="85" width="28" height="12" transform="rotate(-8, 45, 10)" fill={`url(#skin-${uid})`} />
                            </g>
                        ) : styleInt === 6 ? ( // Techwear Neon Orange sleeves
                            <g>
                                <path transform="rotate(5, -45, 10)" d="M -48 0 L -68 0 L -62 90 L -42 90 Z" fill="#FF5500" filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(5, -45, 10)" d="M -62 90 L -42 90 L -44 110 L -60 110 Z" fill={`url(#skin-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 48 0 L 68 0 L 62 90 L 42 90 Z" fill="#FF5500" filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 62 90 L 42 90 L 44 110 L 60 110 Z" fill={`url(#skin-${uid})`} />
                            </g>
                        ) : styleInt === 7 ? ( // Mystical hoodie oversized sleeves
                            <g>
                                <path transform="rotate(7, -45, 10)" d="M -48 -3 L -72 -2 L -66 92 L -42 90 Z" fill="#141520" filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-7, 45, 10)" d="M 48 -3 L 72 -2 L 66 92 L 42 90 Z" fill="#141520" filter={`url(#lighting-${uid})`} />
                                <rect x="-68" y="86" width="26" height="12" transform="rotate(7, -45, 10)" fill={`url(#skin-${uid})`} />
                                <rect x="42" y="86" width="26" height="12" transform="rotate(-7, 45, 10)" fill={`url(#skin-${uid})`} />
                            </g>
                        ) : styleInt === 9 ? ( // Retro colorblock sleeves (Teal vs Purple)
                            <g>
                                <path transform="rotate(5, -45, 10)" d="M -48 0 L -68 0 L -62 90 L -42 90 Z" fill="#008080" filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(5, -45, 10)" d="M -62 90 L -42 90 L -44 110 L -60 110 Z" fill={`url(#skin-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 48 0 L 68 0 L 62 90 L 42 90 Z" fill="#8a2be2" filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 62 90 L 42 90 L 44 110 L 60 110 Z" fill={`url(#skin-${uid})`} />
                            </g>
                        ) : ( // Standard Sleeve
                            <g>
                                <path transform="rotate(5, -45, 10)" d="M -48 0 L -68 0 L -62 90 L -42 90 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(5, -45, 10)" d="M -62 90 L -42 90 L -44 110 L -60 110 Z" fill={`url(#skin-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 48 0 L 68 0 L 62 90 L 42 90 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                                <path transform="rotate(-5, 45, 10)" d="M 62 90 L 42 90 L 44 110 L 60 110 Z" fill={`url(#skin-${uid})`} />
                            </g>
                        )}
                    </g>
                  )}

                  {/* --- CHAINS --- */}
                  <g transform="translate(0, -250)">
                      {chainIndex === 1 && <path d="M -18 0 Q 0 45 18 0" stroke={`url(#gold-${uid})`} strokeWidth="3" fill="none" filter="drop-shadow(0 1px 1px black)" />}
                      {chainIndex === 2 && <path d="M -22 0 Q 0 55 22 0" stroke={`url(#gold-${uid})`} strokeWidth="7" fill="none" filter="drop-shadow(0 2px 2px black)" />}
                      {chainIndex === 3 && (
                          <g>
                              <path d="M -24 0 Q 0 65 24 0" stroke={`url(#silver-${uid})`} strokeWidth="6" fill="none" filter="drop-shadow(0 2px 2px black)" />
                              <circle cx="0" cy="35" r="12" fill="#b0e0e6" stroke="#fff" strokeWidth="1" filter="url(#lighting-${uid})" />
                          </g>
                      )}
                      {chainIndex === 4 && <path d="M -20 0 Q 0 50 20 0" stroke="white" strokeWidth="5" strokeDasharray="5,2" fill="none" filter="drop-shadow(0 1px 1px black)" />}
                      {chainIndex === 5 && <path d="M -22 0 Q 0 60 22 0" stroke="#8b4513" strokeWidth="5" fill="none" filter="drop-shadow(0 1px 1px black)" />}
                  </g>

                  {/* --- HEAD & HATS --- */}
                  <g transform="translate(0, -250)">
                      {/* Neck */}
                      <rect x="-14" y="-15" width="28" height="20" fill={`url(#skin-${uid})`} filter="brightness(0.8)" />
                      <ellipse cx="0" cy="-5" rx="14" ry="5" fill="black" opacity="0.4" />

                      {/* Head Image - With Y offset application */}
                      <image
                          href={headImageSrc}
                          xlinkHref={headImageSrc}
                          x="-55"
                          y={headY}
                          width="110"
                          height="110"
                          preserveAspectRatio="xMidYMax meet"
                          style={{ filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.4))' }}
                      />

                      {/* HATS - Revised Positioning & Styles */}
                      {hatIndex > 0 && (
                          <g transform="translate(0, -112) scale(1.65)">
                              {hatIndex === 1 && ( // Kırmızı Bere (Red Beanie)
                                  <g>
                                      <path d="M -32 8 Q 0 -35 32 8" fill="#DC2626" /> {/* Main Red */}
                                      <path d="M -33 8 L 33 8 L 33 20 L -33 20 Z" fill="#991B1B" /> {/* Darker Rim */}
                                  </g>
                              )}
                              {hatIndex === 2 && ( // Bucket Hat
                                  <g transform="translate(0, 5)"> 
                                      <path d="M -25 -10 L 25 -10 L 30 10 L -30 10 Z" fill="#eee" />
                                      <path d="M -40 10 L 40 10 L 32 0 L -32 0 Z" fill="#ccc" />
                                  </g>
                              )}
                              {hatIndex === 3 && ( // NEW: Pembe Toka (Pink Hairclip)
                                  <g transform="translate(18, 15) scale(0.6)"> 
                                      <rect x="0" y="0" width="20" height="8" rx="2" fill="#ec4899" transform="rotate(-15)" />
                                      <circle cx="2" cy="4" r="3" fill="#db2777" transform="rotate(-15)" />
                                  </g>
                              )}
                          </g>
                      )}
                  </g>
                  
              </g> 
          </g>
      </svg>
    </div>
  );
};
