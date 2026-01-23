
import { UpgradeItem, CityConfig, CityKey, PlayerStats } from './types';

export const SAVE_KEY = 'flowify_tr_save_v25'; // Version Up

// --- CENTRALIZED ECONOMY CONFIG ---
export const ECONOMY = {
    MAX_ENERGY: 100,
    REGEN_TIME_MS: 180000, // 3 Minutes (3 * 60 * 1000)
    AD_REWARD_ENERGY: 20,
    COST: {
        CONCERT: 25,
        ONLINE_MATCH: 10,
        OFFLINE_GAME: 8,
        TRAINING: 20,
        RELATIONSHIP: 20,
        STUDIO: 30
    },
    TRAINING_PRICE: 2500, 
    STUDIO_RENT: 5000,
    MANAGER_TIER_1: 20000,
    MANAGER_TIER_2: 500000,
};

// --- CITY CONFIGURATION DATABASE (TIER SYSTEM) ---
export const CITIES: Record<CityKey, CityConfig> = {
  eskisehir: {
    id: 'eskisehir',
    name: 'Eskişehir',
    tier: 1,
    basePay: 1500, // 1.5k
    multiplier: 1.0, // UI Display
    weeklyCost: 0, // Mom's house
    unlockRequirements: {
      description: 'Başlangıç Şehri',
      check: () => true
    }
  },
  bursa: {
    id: 'bursa',
    name: 'Bursa',
    tier: 2,
    basePay: 8000, // 8k
    multiplier: 5.0,
    weeklyCost: 2500, // Rent + Gas
    unlockRequirements: {
      description: 'Bir araba sahibi ol',
      check: (s: PlayerStats) => s.inventory.vehicles.length > 0
    }
  },
  ankara: {
    id: 'ankara',
    name: 'Ankara',
    tier: 3,
    basePay: 25000, // 25k
    multiplier: 15.0,
    weeklyCost: 10000, // Equipment + Rent
    unlockRequirements: {
      description: '50K+ Fan ve 60+ Lirik',
      check: (s: PlayerStats) => s.monthly_listeners > 50000 && s.lyrics > 60
    }
  },
  izmir: {
    id: 'izmir',
    name: 'İzmir',
    tier: 4,
    basePay: 75000, // 75k
    multiplier: 50.0,
    weeklyCost: 30000, // Luxury Life Start
    unlockRequirements: {
      description: 'Bir Hit Şarkı Sahibi Ol',
      check: (s: PlayerStats) => s.career.hasHitSong === true
    }
  },
  istanbul: {
    id: 'istanbul',
    name: 'İstanbul',
    tier: 5,
    basePay: 300000, // 300k
    multiplier: 200.0,
    weeklyCost: 150000, // Empire Cost
    unlockRequirements: {
      description: 'Menajer Seviyesi 2+ (İlişki > 80)',
      check: (s: PlayerStats) => s.career.managerTier >= 2 || s.rel_manager >= 80
    }
  }
};

export const INITIAL_STATS: PlayerStats = {
  name: '', 
  energy: 100, // Max Start
  maxEnergy: 100, 
  
  // Economy
  cash: 200, // Starts at 200
  careerCash: 200, // Starts at 200
  
  monthly_listeners: 0, 
  respect: 0, 
  
  // Relationships (Hard Start: 1)
  rel_manager: 1, 
  rel_team: 1,
  rel_fans: 1,
  rel_partner: 1,

  lastEnergyUpdate: Date.now(),
  
  week: 1,
  careerLevel: 1,

  pendingCash: 0, 

  // Base Skills (Hard Start: 3)
  flow: 3,
  lyrics: 3,
  rhythm: 3,
  charisma: 3,
  
  songsReleased: 0,
  battlesWon: 0,
  ownedUpgrades: {}, 
  
  // Progression
  currentCity: 'eskisehir',
  unlockedCities: ['eskisehir'],
  inventory: {
    vehicles: []
  },
  career: {
    hasHitSong: false,
    managerTier: 0
  },

  appearance: {
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
  },
  gender: 'male' as const,

  activeProduction: null,
  discography: []
};

export const GAME_CATEGORIES = [
  { id: 'general', label: 'GENEL TÜRKÇE RAP', query: 'turkce rap' },
  { id: 'sagopa', label: 'SAGOPA KAJMER', query: 'sagopa kajmer' },
  { id: 'ceza', label: 'CEZA', query: 'ceza' },
  { id: 'motive', label: 'MOTIVE', query: 'motive' },
  { id: 'allame', label: 'ALLAME', query: 'allame' },
  { id: 'killa', label: 'KILLA HAKAN', query: 'killa hakan' },
  { id: 'hidra', label: 'HİDRA', query: 'hidra' },
  { id: 'uzi', label: 'UZI', query: 'uzi' },
  { id: 'sefo', label: 'SEFO', query: 'sefo' },
  { id: 'lvbel', label: 'LVBEL C5', query: 'lvbel c5' },
  { id: 'cakal', label: 'CAKAL', query: 'cakal' },
  { id: 'khontkar', label: 'KHONTKAR', query: 'khontkar' },
  { id: 'gazapizm', label: 'GAZAPİZM', query: 'gazapizm' },
  { id: 'ati242', label: 'ATI242', query: 'ati242' }
];

export const UPGRADES: UpgradeItem[] = [
  // --- CONSUMABLES ---
  {
    id: 'energy_drink',
    name: 'Enerji İçeceği',
    type: 'consumable',
    baseCost: 500, // Increased price
    costMultiplier: 1,
    description: 'Enerjini tazeler (+25 Enerji).',
    effectBonus: 25, 
    iconName: 'energy'
  },

  // --- EQUIPMENT ---
  {
    id: 'notebook',
    name: 'Kafiye Defteri',
    type: 'equipment',
    baseCost: 1500,
    costMultiplier: 1.5,
    description: 'Söz yazma hızını artırır (+Lirik)',
    effectBonus: 5,
    skillAffected: 'lyrics',
    iconName: 'book'
  },
  {
    id: 'usb_mic',
    name: 'USB Mikrofon',
    type: 'equipment',
    baseCost: 3000,
    costMultiplier: 1.6,
    description: 'Ev kaydı için ideal (+Flow)',
    effectBonus: 5,
    skillAffected: 'flow',
    iconName: 'mic'
  },
];

export const FAKE_POSTS = [
  { author: "RapMagazineTR", content: "Yeraltından yeni sesler yükseliyor. Dikkat edin! 🔥" },
  { author: "HypeBeast", content: "Bu yeni tarz hiç fena değil." },
  { author: "OldSchool_King", content: "Autotune kullanan rapçi değildir. Nokta." },
  { author: "MelankoliaFan", content: "Duygusal parçalar bekliyoruz..." },
  { author: "KadıköyAcil", content: "Sokaklar bizimdir." }
];

// TOTAL 8 HEADS (2 Free + 6 Shop)
export const HEAD_OPTIONS = [
  // Free 1 (Index 0)
  "https://i.ibb.co/Z6skzDqn/kafamete.png", 
  // Free 2 (Index 1)
  "https://i.ibb.co/vC3JCvXD/kafairem.png", 
  // Shop 1 (Index 2)
  "https://i.ibb.co/bjkKyvKn/head3.png", 
  // Shop 2 (Index 3)
  "https://i.ibb.co/21sw0c1j/head4.png", 
  // Shop 3 (Index 4)
  "https://i.ibb.co/Pzmm5zzk/head5.png", 
  // Shop 4 (Index 5)
  "https://i.ibb.co/W1GN3Rn/head6.png",
  // Shop 5 (Index 6) - Placeholder/New
  "https://i.ibb.co/NdNP9BCy/head2.png", 
  // Shop 6 (Index 7) - Placeholder/New
  "https://i.ibb.co/dYM2p7q/head1.png", 
];

// UPDATED HAT STYLES (Added Pembe Toka)
export const HAT_STYLES = ['Yok', 'Kırmızı Bere', 'Bucket', 'Pembe Toka'];

// UPDATED CHAIN STYLES (Removed Tesbih)
export const CHAIN_STYLES = ['Yok', 'İnce', 'Kalın', 'Buzlu', 'İnci', 'Halat'];

export const SHOE_STYLES = ['Sneaker', 'Bot', 'Klasik'];
export const CLOTHING_STYLES = ['T-Shirt', 'Hoodie', 'Mont', 'Gömlek', 'Forma', 'Deri Ceket'];
export const PANTS_STYLES = ['Kot', 'Eşofman', 'Kargo']; 

// SKIN COLORS
export const SKIN_COLORS = ['#f1c27d', '#e0ac69', '#8d5524', '#c68642', '#3e2723', '#f5f5f5'];

// UPDATED COLOR PALETTES - MATTE & TEXTILE TONES
export const SHIRT_COLORS = [
    '#18181b', // Kömür Siyahı
    '#f4f4f5', // Kırık Beyaz
    '#dc2626', // Mat Kırmızı
    '#2563eb', // Koyu Mavi (Kot mavisi)
    '#16a34a', // Orman Yeşili
    '#ca8a04', // Hardal Sarısı
    '#ea580c', // Kiremit
    '#7e22ce', // Patlıcan Moru
    '#db2777', // Koyu Pembe
    '#52525b', // Antrasit Gri
];

export const PANTS_COLORS = [
    '#09090b', // Gece Siyahı
    '#e4e4e7', // Açık Gri
    '#b91c1c', // Bordo
    '#1e3a8a', // Lacivert
    '#14532d', // Asker Yeşili
    '#854d0e', // Taba
    '#c2410c', // Yanık Turuncu
    '#4c1d95', // Koyu Mor
    '#78350f', // Kahverengi
    '#3f3f46', // Beton Gri
];

export const SHOE_COLORS = [
    '#ffffff', // Beyaz
    '#18181b', // Siyah
    '#ef4444', // Spor Kırmızı
    '#3b82f6', // Spor Mavi
    '#fbbf24', // Amber
    '#22c55e', // Çimen Yeşili
    '#71717a', // Gri
];
