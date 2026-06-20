
import { UpgradeItem, CityConfig, CityKey, PlayerStats } from './types';

export const SAVE_KEY = 'flowify_tr_save_v25'; // Version Up

// --- CENTRALIZED ECONOMY CONFIG ---
export const ECONOMY = {
    MAX_ENERGY: 100,
    REGEN_TIME_MS: 60000, // 1 Minute (60 * 1000) for faster regen
    AD_REWARD_ENERGY: 30, // Increased coffee/ad reward
    COST: {
        CONCERT: 15, // Was 25
        ONLINE_MATCH: 10,
        OFFLINE_GAME: 5, // Was 8
        TRAINING: 10, // Was 20
        RELATIONSHIP: 10, // Was 20
        STUDIO: 20 // Was 30
    },
    TRAINING_PRICE: 2000, // Slightly reduced to allow smoother early progression
    STUDIO_RENT: 4000,
    MANAGER_TIER_1: 15000,
    MANAGER_TIER_2: 300000,
    DATING_COST: 30000,
    RELATIONSHIP_GAIN: 15,
    LYRIA_COST: 350,
};

export const MANAGERS = [
    { id: 'm1', name: 'Selo Dayı', tier: 1, description: 'Sokakların sesi, konser gelirini %10 artırır.' },
    { id: 'm2', name: 'Baron Kerem', tier: 2, description: 'Piyasanın devi, konser gelirini %25, fan artışını %15 artırır.' }
];

export const POTENTIAL_PARTNERS = [
    { id: 'p1', name: 'Ece', personality: 'Tatlı ve destekleyici', description: 'Moda ikonu, enerjini %20 daha hızlı doldurur.' },
    { id: 'p2', name: 'Selin', personality: 'Hırslı ve zeki', description: 'İş kadını, konser gelirini %5 artırır.' },
    { id: 'p3', name: 'Merve', personality: 'Eğlenceli ve çılgın', description: 'Parti kızı, saygınlığını %10 artırır.' }
];

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
      description: '10K+ Fan ve 10+ Saygınlık',
      check: (s: PlayerStats) => s.monthly_listeners >= 10000 && s.respect >= 10
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

export const getAdjustedCities = (startingCity?: CityKey): Record<CityKey, CityConfig> => {
    if (!startingCity || startingCity === 'eskisehir') {
        return CITIES;
    }

    const result = {} as Record<CityKey, CityConfig>;
    const keys = Object.keys(CITIES) as CityKey[];
    
    for (const key of keys) {
        result[key] = { 
            ...CITIES[key],
            unlockRequirements: { ...CITIES[key].unlockRequirements }
        };
    }

    const targetCity = startingCity;
    const baseCity = 'eskisehir' as CityKey;

    const targetTemplate = CITIES[targetCity];
    const baseTemplate = CITIES[baseCity];

    // Swapping metrics:
    // Selected starting city becomes the new starter (Tier 1 metrics)
    result[targetCity] = {
        ...result[targetCity],
        tier: baseTemplate.tier,
        basePay: baseTemplate.basePay,
        multiplier: baseTemplate.multiplier,
        weeklyCost: baseTemplate.weeklyCost,
        unlockRequirements: {
            description: 'başlangıç bölgesi.',
            check: () => true
        }
    };

    // Eskişehir becomes the advanced city, inheriting selected city's requirements and multipliers
    result[baseCity] = {
        ...result[baseCity],
        tier: targetTemplate.tier,
        basePay: targetTemplate.basePay,
        multiplier: targetTemplate.multiplier,
        weeklyCost: targetTemplate.weeklyCost,
        unlockRequirements: {
            description: targetTemplate.unlockRequirements.description,
            check: targetTemplate.unlockRequirements.check
        }
    };

    return result;
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
  startingCity: 'eskisehir',
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

  // Social
  followingCount: 0,
  followersCount: 0,

  vocalStyle: 'raw',
  backstory: 'street',
  personality: 'humble',

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
  { id: 'ati242', label: 'ATI242', query: 'ati242' },
  { id: 'baneva', label: 'BANEVA', query: 'baneva' },
  { id: 'sam', label: 'ŞAM', query: 'sam' }
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
  { author: "SokakRuhu", content: "Gerçek rap sokakta başlar, stüdyoda biter." },
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
export const CLOTHING_STYLES = ['T-Shirt', 'Hoodie', 'Mont', 'Gömlek', 'Forma', 'Deri Ceket', 'Techwear Yelek', 'Sago Kapüşonlu', 'Gümüş Puffer', '90lar Retro', 'Firavun Forma'];
export const PANTS_STYLES = ['Kot', 'Eşofman', 'Kargo']; 

// SKIN COLORS
export const SKIN_COLORS = ['#f1c27d', '#e0ac69', '#8d5524', '#c68642', '#3e2723', '#f5f5f5'];

// UPDATED COLOR PALETTES - VIBRANT STREETWEAR TONES
export const SHIRT_COLORS = [
    '#000000', // Jet Black
    '#FFFFFF', // Pure White
    '#FF0000', // Racing Red
    '#00FF00', // Neon Green
    '#0000FF', // Electric Blue
    '#FFFF00', // Cyber Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF8800', // Safety Orange
    '#8800FF', // Deep Purple
    '#555555', // Slate Gray
    '#D4AF37', // Metallic Gold
    '#C0C0C0', // Silver
    '#4B5320', // Army Olive
];

export const PANTS_COLORS = [
    '#000000', // Black
    '#1A1A1A', // Dark Charcoal
    '#2B3E50', // Denim Blue
    '#4B5320', // Khaki Olive
    '#8B4513', // Saddle Brown
    '#FFFFFF', // White
    '#FF0000', // Red
    '#0000FF', // Blue
    '#555555', // Gray
    '#FFD700', // Gold
];

export const SHOE_COLORS = [
    '#FFFFFF', // White
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Neon
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#888888', // Gray
    '#FF8800', // Orange
];
