
import React, { useMemo } from 'react';
import { CharacterAppearance, Gender } from '../types';
import { HEAD_OPTIONS } from '../constants';

interface AvatarProps {
  appearance: CharacterAppearance;
  gender?: Gender;
  className?: string;
  size?: number; 
}

export const Avatar: React.FC<AvatarProps> = ({ appearance, gender = 'male', className, size = 300 }) => {
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

  return (
    <div 
      className={`relative flex flex-col items-center justify-end ${className}`}
      style={{ 
        height: size, 
        width: size * 0.8,
        filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.6))' 
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

              {/* Lighting Overlay for 3D volume */}
              <filter id={`lighting-${uid}`}>
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
                  <feSpecularLighting in="blur" surfaceScale="3" specularConstant=".5" specularExponent="15" lightingColor="#ffffff" result="specOut">
                      <fePointLight x="-5000" y="-10000" z="20000"/>
                  </feSpecularLighting>
                  <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
                  <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0"/>
              </filter>
          </defs>

          {/* FLOOR SHADOW */}
          <ellipse cx="100" cy="380" rx="60" ry="10" fill="black" opacity="0.5" filter="blur(4px)" />

          {/* POSITIONING GROUP - SCALED DOWN FURTHER (0.75) AND CENTERED */}
          <g transform="translate(100, 390) scale(0.75)">
              
              <g className="animate-breathe">

                  {/* --- PANTS (BOTTOMS) --- */}
                  <g transform="translate(0, -140)">
                      {/* 0: JEANS (Merged Crotch) */}
                      {pantsInt === 0 && (
                          <g>
                              <path d="M -38 0 L 0 0 L -5 35 L -22 135 L -48 135 L -38 0 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M 38 0 L 0 0 L 5 35 L 22 135 L 48 135 L 38 0 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -5 30 L 5 30 L 0 40 Z" fill={pantsColor} />
                              <path d="M -35 45 L -10 50" stroke="black" strokeOpacity="0.2" fill="none" />
                              <path d="M 35 45 L 10 50" stroke="black" strokeOpacity="0.2" fill="none" />
                          </g>
                      )}
                      
                      {/* 1: SWEATPANTS */}
                      {pantsInt === 1 && (
                          <g>
                              <path d="M -42 0 L 0 0 L -8 40 L -18 125 Q -30 140 -50 125 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M 42 0 L 0 0 L 8 40 L 18 125 Q 30 140 50 125 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -8 35 Q 0 50 8 35" fill={pantsColor} />
                              <rect x="-48" y="123" width="28" height="14" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" />
                              <rect x="20" y="123" width="28" height="14" rx="3" fill={pantsColor} stroke="black" strokeWidth="0.5" />
                              <path d="M -4 0 L -4 25" stroke="white" strokeWidth="2" />
                              <path d="M 4 0 L 4 25" stroke="white" strokeWidth="2" />
                          </g>
                      )}

                      {/* 2: CARGO PANTS */}
                      {pantsInt === 2 && (
                          <g>
                              <path d="M -45 0 L 0 0 L -8 45 L -25 130 L -55 130 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M 45 0 L 0 0 L 8 45 L 25 130 L 55 130 Z" fill={pantsColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -8 40 Q 0 55 8 40" fill={pantsColor} />
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

                  {/* --- TORSO & TOPS --- */}
                  <g transform="translate(0, -250)">
                      {styleInt === 0 && ( // T-SHIRT
                          <g>
                              <path d="M -48 0 L 48 0 L 42 125 L -42 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -20 0 Q 0 20 20 0" stroke="black" strokeOpacity="0.2" strokeWidth="2" fill="none" />
                              <path d="M -30 30 Q -20 50 -35 70" stroke="black" strokeOpacity="0.1" fill="none" />
                              <path d="M 30 30 Q 20 50 35 70" stroke="black" strokeOpacity="0.1" fill="none" />
                          </g>
                      )}
                      {styleInt === 1 && ( // HOODIE
                          <g>
                              <path d="M -28 -12 L 28 -12 L 40 10 L -40 10 Z" fill={shirtColor} filter="brightness(0.8)" />
                              <path d="M -52 0 L 52 0 L 46 122 L -46 122 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -28 75 L 28 75 L 32 105 L -32 105 Z" fill="black" fillOpacity="0.2" />
                              <path d="M -12 5 Q -15 35 -12 50" stroke="#ddd" strokeWidth="2.5" fill="none" />
                              <path d="M 12 5 Q 15 35 12 50" stroke="#ddd" strokeWidth="2.5" fill="none" />
                          </g>
                      )}
                      {styleInt === 2 && ( // JACKET
                          <g>
                              <path d="M -32 0 L 32 0 L 30 115 L -30 115 Z" fill="#eee" />
                              <path d="M -55 -5 L -18 -5 L -20 120 L -48 115 Q -60 50 -55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M 55 -5 L 18 -5 L 20 120 L 48 115 Q 60 50 55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <line x1="-55" y1="30" x2="-18" y2="35" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                              <line x1="-53" y1="70" x2="-19" y2="75" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                              <line x1="55" y1="30" x2="18" y2="35" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                              <line x1="53" y1="70" x2="19" y2="75" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                          </g>
                      )}
                      {styleInt === 3 && ( // SHIRT
                          <g>
                              <path d="M -45 0 L 45 0 L 40 125 L -40 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <rect x="-3" y="0" width="6" height="125" fill="black" fillOpacity="0.1" />
                              <circle cx="0" cy="20" r="2" fill="white" />
                              <circle cx="0" cy="50" r="2" fill="white" />
                              <circle cx="0" cy="80" r="2" fill="white" />
                              <path d="M -22 0 L -10 18 L 0 8 L 10 18 L 22 0" fill={shirtColor} stroke="black" strokeWidth="0.5" filter="brightness(1.2)" />
                          </g>
                      )}
                      {styleInt === 4 && ( // JERSEY
                          <g>
                              <path d="M -48 0 L -42 20 L -30 0 Z" fill={`url(#skin-${uid})`} />
                              <path d="M 48 0 L 42 20 L 30 0 Z" fill={`url(#skin-${uid})`} />
                              <path d="M -45 0 L 45 0 L 42 125 L -42 125 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -22 0 Q 0 25 22 0" stroke="white" strokeWidth="3" fill="none" />
                              <path d="M -45 0 L -45 35" stroke="white" strokeWidth="3" />
                              <path d="M 45 0 L 45 35" stroke="white" strokeWidth="3" />
                              <text x="0" y="80" textAnchor="middle" fontSize="48" fontWeight="900" fill="white" fontFamily="Arial" opacity="0.9" style={{filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.3))'}}>23</text>
                          </g>
                      )}
                      {styleInt === 5 && ( // LEATHER
                          <g>
                              <path d="M -22 0 L 22 0 L 22 115 L -22 115 Z" fill="#1a1a1a" />
                              <path d="M -55 -5 L -12 -5 L -18 110 L -50 105 Q -58 50 -55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M 55 -5 L 12 -5 L 18 110 L 50 105 Q 58 50 55 -5 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path d="M -38 0 L -18 25 L -48 30 Z" fill={shirtColor} stroke="#111" strokeWidth="1" filter="brightness(1.3)" />
                              <path d="M 38 0 L 18 25 L 48 30 Z" fill={shirtColor} stroke="#111" strokeWidth="1" filter="brightness(1.3)" />
                              <line x1="15" y1="25" x2="-15" y2="110" stroke="#ccc" strokeWidth="2.5" strokeDasharray="2,1" />
                              <circle cx="15" cy="25" r="3" fill="#fff" />
                          </g>
                      )}
                  </g>

                  {/* --- ARMS --- */}
                  <g transform="translate(0, -245)">
                      {styleInt === 4 ? ( // Jersey (Bare Arms)
                          <g>
                              <path transform="rotate(5, -45, 10)" d="M -45 5 L -65 5 L -60 95 L -40 95 Z" fill={`url(#skin-${uid})`} filter={`url(#lighting-${uid})`} />
                              <path transform="rotate(5, -45, 10)" d="M -60 95 L -40 95 L -42 115 L -58 115 Z" fill={`url(#skin-${uid})`} />
                              <path transform="rotate(-5, 45, 10)" d="M 45 5 L 65 5 L 60 95 L 40 95 Z" fill={`url(#skin-${uid})`} filter={`url(#lighting-${uid})`} />
                              <path transform="rotate(-5, 45, 10)" d="M 60 95 L 40 95 L 42 115 L 58 115 Z" fill={`url(#skin-${uid})`} />
                          </g>
                      ) : styleInt === 5 || styleInt === 2 ? ( // Jackets (Thicker Arms)
                          <g>
                              <path transform="rotate(8, -45, 10)" d="M -48 -5 L -75 0 L -70 95 L -42 90 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <path transform="rotate(-8, 45, 10)" d="M 48 -5 L 75 0 L 70 95 L 42 90 Z" fill={shirtColor} filter={`url(#lighting-${uid})`} />
                              <rect x="-70" y="85" width="28" height="12" transform="rotate(8, -45, 10)" fill={`url(#skin-${uid})`} />
                              <rect x="42" y="85" width="28" height="12" transform="rotate(-8, 45, 10)" fill={`url(#skin-${uid})`} />
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
