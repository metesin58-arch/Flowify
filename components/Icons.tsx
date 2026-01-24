
import React from 'react';

// Common props
interface IconProps { className?: string, dir?: 'left' | 'down' | 'up' | 'right' }

export const HomeIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

export const MicIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
);

export const TrophyIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export const DiscIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
);

export const PlayIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

export const CheckIcon = ({ className }: IconProps) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

export const CloudIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.1-1.3-.8-2.5-2-3.2-1.2-.7-2.6-.7-3.8 0-1.2.7-1.9 1.9-2 3.2H4.5c-1.7 0-3 1.3-3 3s1.3 3 3 3h13c1.7 0 3-1.3 3-3z"/></svg>
);

export const CloudOffIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

export const CoinIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
);

export const SkullIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
);

export const SwordIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
);

export const ClockIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export const MaleIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="10" cy="14" r="5"/><path d="M15 9l5-5"/><path d="M15 4h5v5"/></svg>
);

export const FemaleIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="9" r="5"/><path d="M12 14v7"/><path d="M9 18h6"/></svg>
);

export const SendIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

export const MoonIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

export const SunIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);

export const DollarIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export const HeavyDollarIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C12.5523 2 13 2.44772 13 3V4.06249C15.3537 4.50974 17 6.69466 17 9.25C17 12.1248 14.8322 13.626 12.8711 14.391L12.655 14.4746C11.396 14.9566 11 15.3469 11 16.25C11 17.2023 11.7222 17.7725 12.569 17.962L12.7937 18.0016C13.841 18.1249 14.8016 17.5701 15.3789 16.7915C15.7107 16.344 16.3415 16.2512 16.789 16.583C17.2365 16.9147 17.3293 17.5456 16.9976 17.993C16.0354 19.2908 14.5029 20.1511 13 20.428V22C13 22.5523 12.5523 23 12 23C11.4477 23 11 22.5523 11 22V20.9375C8.64633 20.4903 7 18.3053 7 15.75C7 12.8752 9.16777 11.374 11.1289 10.609L11.345 10.5254C12.604 10.0434 13 9.65314 13 8.75C13 7.7977 12.2778 7.22754 11.431 7.03803L11.2063 6.99839C10.159 6.87514 9.19839 7.42986 8.62111 8.20847C8.28934 8.65602 7.65851 8.74878 7.21096 8.41701C6.76341 8.08524 6.67065 7.45442 7.00242 7.00696C7.96464 5.70919 9.49712 4.84885 11 4.57197V3C11 2.44772 11.4477 2 12 2Z"/>
    </svg>
);

export const XIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
        <path d="M20.4853 4.92893C20.8758 4.53841 20.8758 3.90524 20.4853 3.51472C20.0948 3.12419 19.4616 3.12419 19.0711 3.51472L12 10.5858L4.92893 3.51472C4.53841 3.12419 3.90524 3.12419 3.51472 3.51472C3.12419 3.90524 3.12419 4.53841 3.51472 4.92893L10.5858 12L3.51472 19.0711C3.12419 19.4616 3.12419 20.0948 3.51472 20.4853C3.90524 20.8758 4.53841 20.8758 4.92893 20.4853L12 13.4142L19.0711 20.4853C19.4616 20.8758 20.0948 20.8758 20.4853 20.4853C20.8758 20.0948 20.8758 19.4616 20.4853 19.0711L13.4142 12L20.4853 4.92893Z"/>
    </svg>
);

export const SpadeCardIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 2C2.89543 2 2 2.89543 2 4V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V4C22 2.89543 21.1046 2 20 2H4ZM12 6C12 6 15 10 15 12.5C15 14.5 13.5 15.5 12.5 15.5H13.5L14 17.5H10L10.5 15.5H11.5C10.5 15.5 9 14.5 9 12.5C9 10 12 6 12 6ZM5.5 5.5H7.5V7.5H5.5V5.5ZM16.5 16.5H18.5V18.5H16.5V16.5Z" />
    </svg>
);

export const ArrowUpDownIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L16 6H13V12H11V6H8L12 2Z" />
        <path d="M12 22L8 18H11V12H13V18H16L12 22Z" />
    </svg>
);

export const MicFilledIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
);

export const CordedMicIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <rect x="11" y="19" width="2" height="3" />
        <path d="M12 22c0 2-2 2-3 2s-3-2-5-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const FistIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
       <path d="M20 12v-3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v3h-1v-3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v3H8v-3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1h1a2 2 0 0 0 2-2z" />
    </svg>
);

export const BlackjackCardsIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16.5 4.5h-9a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25Z" fill="#333" stroke="currentColor" strokeWidth="1" transform="rotate(-10 12 12) translate(-2 -1)" />
        <rect x="7" y="6" width="12" height="15" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" transform="rotate(10 12 12)" />
        <path d="M11 11.5c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1.5-1.5 2.5-2 3.5-.5-1-2-2-2-3.5Z" fill="currentColor" transform="rotate(10 12 12)" />
        <path d="M12.5 15l1 1.5h-2l1-1.5Z" fill="currentColor" transform="rotate(10 12 12)" />
    </svg>
);

export const GameControllerIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 6h-14c-2.2 0-4 1.8-4 4v4c0 2.2 1.8 4 4 4h14c2.2 0 4-1.8 4-4v-4c0-2.2-1.8-4-4-4z" />
    <path d="M8 10v4" />
    <path d="M6 12h4" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="10" r="1" fill="currentColor" stroke="none" />
    <path d="M12 6v-1a2 2 0 0 1 2-2h-4a2 2 0 0 1 2 2v1" opacity="0.6"/>
  </svg>
);

export const MicSuitIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z" /><path d="M5 10C5 9.44772 5.44772 9 6 9C6.55228 9 7 9.44772 7 10C7 12.7614 9.23858 15 12 15C14.7614 15 17 12.7614 17 10C17 9.44772 17.4477 9 18 9C18.5523 9 19 9.44772 19 10C19 13.5362 16.3768 16.4576 13 16.92V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V16.92C7.62319 16.4576 5 13.5362 5 10Z" /></svg>
);

export const ChainSuitIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M7 6C7 3.23858 9.23858 1 12 1C14.7614 1 17 3.23858 17 6V18C17 20.7614 14.7614 23 12 23C9.23858 23 7 20.7614 7 18V6ZM12 3C10.3431 3 9 4.34315 9 6V18C9 19.6569 10.3431 21 12 21C13.6569 21 15 19.6569 15 18V6C15 4.34315 13.6569 3 12 3Z" /></svg>
);

export const RecordSuitIcon = ({ className }: IconProps) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="black"/></svg>
);

export const SpraySuitIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M9 11h6v8h-6z"/><path d="M12 2l-2 3h4z" /></svg>
);

export const ArrowIcon = ({ className, dir }: { className?: string, dir: 'left' | 'down' | 'up' | 'right' }) => {
    let rotation = '';
    switch (dir) {
        case 'left': rotation = '-rotate-90'; break;
        case 'right': rotation = 'rotate-90'; break;
        case 'down': rotation = 'rotate-180'; break;
        default: rotation = '';
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} transform ${rotation}`}>
            <path d="M12 2L2 12h7v10h6V12h7L12 2z" />
        </svg>
    );
};

export const CrownIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
    </svg>
);

export const DiamondIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.82397 12L12 19.176L19.176 12L12 4.82397L4.82397 12ZM2.55673 10.4433C1.69677 11.3032 1.69677 12.6968 2.55673 13.5567L10.4433 21.4433C11.3032 22.3032 12.6968 22.3032 13.5567 21.4433L21.4433 13.5567C22.3032 12.6968 22.3032 11.3032 21.4433 10.4433L13.5567 2.55673C12.6968 1.69677 11.3032 1.69677 10.4433 2.55673L2.55673 10.4433Z" />
    </svg>
);

export const PlusIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const MusicIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

export const MusicOffIcon = ({ className }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v9" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        <path d="M21 5l-2-2v9" />
    </svg>
);

export const BoomboxIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    <path d="M2 9h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />
    <circle cx="8" cy="15" r="2" />
    <circle cx="16" cy="15" r="2" />
    <path d="M12 12h.01" />
    <path d="M12 18h.01" />
  </svg>
);

export const FourArrowsIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L9 5h2v4H7V7l-3 3 3 3v-2h4v4H9l3 3 3-3h-2v-4h4v2l3-3-3-3v2h-4V5h2l-3-3z" />
  </svg>
);

export const ShoutingSilhouetteIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z" opacity="0" /> {/* Placeholder opacity 0 */}
    <path d="M15.5 12c0-1.74-1.07-3.23-2.6-3.78-.24-.09-.5.06-.5.31v6.94c0 .26.27.4.5.31 1.53-.55 2.6-2.04 2.6-3.78z" />
    <path d="M12.5 5.5v13c0 .35.36.58.67.43 2.87-1.42 4.83-4.38 4.83-7.93s-1.96-6.51-4.83-7.93c-.31-.15-.67.08-.67.43zM9 9v6c0 .55-.45 1-1 1H6v-8h2c.55 0 1 .45 1 1z"/>
  </svg>
);

export const SpectrumIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 14v-4" />
    <path d="M7 17v-10" />
    <path d="M11 20v-16" />
    <path d="M15 17v-10" />
    <path d="M19 14v-4" />
  </svg>
);

export const BreakdanceIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="7" r="2" />
    <path d="M12 9v4l-3 3-2-2" />
    <path d="M12 13l3 3 2-2" />
    <path d="M5 21l3-3" />
    <path d="M19 21l-3-3" />
    <path d="M9 14l-4-4" />
    <path d="M15 14l4-4" />
  </svg>
);

export const QuestionMarkIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

export const HexagonIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

export const RocketIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

export const StarIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);