
export interface CharacterAppearance {
  headIndex: number;
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  shoesColor: string;
  clothingStyle: number; // 0: Tshirt, 1: Hoodie, 2: Jacket, 3: Shirt, 4: Jersey, 5: Leather
  pantsStyle: number; // 0: Slim Jeans, 1: Sweatpants, 2: Cargo, 3: Shorts
  // New Customizations
  hatIndex: number; // 0: None, 1: Cap, 2: Beanie, 3: Bucket
  chainIndex: number; // 0: None, 1: Thin, 2: Thick, 3: Iced, 4: Pearl, 5: Rope
  shoeStyle: number; // 0: Sneaker, 1: Boot, 2: Loafer
  hairColor?: string; 
}

export type Gender = 'male' | 'female';

export type ProductionPhase = 'idle' | 'recording' | 'mixing' | 'ready';

export interface SongDraft {
  id: string;
  name: string;
  quality: number; // 0-100 (determined by mini-game)
  startTime: number;
  finishTime: number; // For mixing phase
  potentialListeners: number; // Replaced Hype
}

export interface ReleasedSong {
  id: string;
  name: string;
  quality: number;
  releasedAt: number;
  popularityScore: number;
  totalEarnings: number;
}

// --- CITY & PROGRESSION TYPES ---
export type CityKey = 'eskisehir' | 'bursa' | 'ankara' | 'izmir' | 'istanbul';

export interface CityConfig {
  id: CityKey;
  name: string;
  tier: number;
  basePay: number; // NEW: Base concert income before multipliers
  multiplier: number; // Legacy multiplier (kept for UI visuals if needed, but logic uses basePay)
  weeklyCost: number; // Cost deducted every week
  unlockRequirements: {
    description: string;
    check: (stats: PlayerStats) => boolean;
  };
}

export interface PlayerStats {
  name: string;
  
  // Resources
  energy: number; // 0-100 (Critical Resource)
  maxEnergy: number;
  
  // Economies (SEPARATED)
  cash: number; // ONLINE CASH (PvP, Shop)
  careerCash: number; // CAREER CASH (Earned from concerts, used for lifestyle)
  
  // PvE Metric (Career)
  monthly_listeners: number; 
  
  // PvP Metric (Online)
  respect: number; // Online Trophies (Kupa)
  
  // NSS STYLE RELATIONSHIPS (0-100)
  rel_manager: number; // Concert availability
  rel_team: number; // Studio/Stage performance buff
  rel_fans: number; // Revenue multiplier
  rel_partner: number; // Energy regen / Mental health

  // Career Mode Stats
  week: number;
  careerLevel: number; // Determines venue difficulty

  lastEnergyUpdate: number; // Timestamp for regeneration
  
  // New Economy
  pendingCash: number; // Pasif gelir havuzu (Toplanmayı bekleyen)
  
  // Skills (Training affects these)
  flow: number;
  lyrics: number;
  rhythm: number;
  charisma: number; // Swag
  
  // Inventory/Progress
  songsReleased: number;
  battlesWon: number;
  ownedUpgrades: Record<string, number>; // PERSISTENT UPGRADES

  // --- NEW PROGRESSION FIELDS ---
  currentCity: CityKey;
  unlockedCities: CityKey[];
  inventory: {
    vehicles: string[]; // Array of vehicle IDs
  };
  career: {
    hasHitSong: boolean;
    managerTier: number;
  };

  // Monetization
  isVip?: boolean;

  // Appearance
  appearance: CharacterAppearance;
  gender: Gender;
  
  // Identity
  favoriteSong?: SongTrack;

  // Production System
  activeProduction: SongDraft | null;
  discography: ReleasedSong[];
}

export type TabType = 'hub' | 'arcade' | 'online' | 'nightlife' | 'social';

export interface SocialPost {
  id: number;
  author: string;
  content: string;
  likes: number;
  isPlayer?: boolean;
}

export interface UpgradeItem {
  id: string;
  name: string;
  type: 'equipment' | 'marketing' | 'consumable';
  baseCost: number;
  costMultiplier: number; // 1 for one-time purchases
  description: string;
  effectBonus: number;
  skillAffected?: keyof PlayerStats;
  iconName?: string;
}

// Sub-Game Types
export interface SongTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl: string;
  artworkUrl100: string;
  releaseYear: number;
}

export interface GameSequence {
  startSong: SongTrack;
  targetSongs: SongTrack[];
}

export interface TriviaQuestion {
  correctSong: SongTrack;
  options: SongTrack[];
}

export interface OnlineUser {
  uid: string;
  name: string;
  monthly_listeners: number;
  respect: number; // For Leaderboard
  level: number;
  lastActive: number;
  appearance?: CharacterAppearance; 
  currentAction?: string; // New: Tracking what they are doing
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Enemy {
  name: string;
  level: number;
  imageSeed: string;
  currentHp: number;
  maxHp: number;
}

export interface LeaderboardEntry {
  uid: string;
  name: string;
  score: number;
  timestamp: number;
}

// --- NEW FLOW BATTLE TYPES ---
export interface ArrowNote {
  id: number;
  direction: 'left' | 'down' | 'up' | 'right';
  y: number; // Vertical position (0 to 100%)
  hit: boolean;
  laneIndex: number; // 0, 1, 2, 3
}

export interface FlowBattleState {
  gameId: string;
  playerScore: number;
  opponentScore: number;
  momentum: number; // -50 (enemy winning) to +50 (you winning)
  timeLeft: number;
}

// Add global declaration for the callback function
declare global {
  interface Window {
    odulVer: (productId?: string) => void;
    CdvPurchase: any;
    // Flutter Bridge Interface
    FlutterPay?: {
      postMessage: (message: string) => void;
    };
  }
}
