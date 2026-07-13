
import { Howl, Howler } from 'howler';
import { assetCache } from './assetCache';

// Ses Kaynakları (Yerel/Bundled Klasöründeki Dosyalar)
export const SOUND_SOURCES = {
    click: '/sounds/click.mp3',
    back: '/sounds/back.mp3',
    money: '/sounds/money.mp3',
    success: '/sounds/success.mp3', 
    error: '/sounds/error.mp3', 
    go: '/sounds/go.mp3', 
    tick: '/sounds/tick.mp3',
    rhythm_twister: '/sounds/rhythm_twister.mp3',
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    scratch: '/sounds/scratch.mp3'
};

// Ses Bankası
const sounds: Record<string, Howl> = {};

/**
 * Tüm sesleri önceden yükler (Preload).
 * Cache sistemini kullanır.
 */
export const preloadAllSounds = async (onProgress: (progress: number) => void): Promise<void> => {
    const keys = Object.keys(SOUND_SOURCES);
    const urls = Object.values(SOUND_SOURCES);
    const total = keys.length;
    let loaded = 0;

    // 1. Cache assets first (background) with a timeout
    await Promise.race([
        assetCache.cacheAssets(urls),
        new Promise(resolve => setTimeout(resolve, 2000))
    ]).catch(e => console.warn("[SFX] Cache timeout/error:", e));

    return new Promise((resolve) => {
        if (total === 0) {
            onProgress(100);
            resolve();
            return;
        }

        // 2. Load into Howler (using cache if possible)
        const loadSound = async (key: string, url: string) => {
            // Get Blob URL from cache if available, else original URL
            const finalUrl = await assetCache.getAssetUrl(url);

            sounds[key] = new Howl({
                src: [finalUrl],
                preload: true,
                html5: false, // Force Web Audio API for responsiveness
                loop: false, 
                volume: 1.0, 
                format: ['mp3'], // Hint format since blob urls don't have extension
                onload: () => {
                    loaded++;
                    onProgress(Math.floor((loaded / total) * 100));
                    if (loaded === total) resolve();
                },
                onloaderror: (id, err) => {
                    console.warn(`[SFX] Failed to load ${key}:`, err);
                    loaded++; // Count as loaded to not block app
                    onProgress(Math.floor((loaded / total) * 100));
                    if (loaded === total) resolve();
                }
            });
        };

        // Trigger loads
        keys.forEach(key => {
            const url = SOUND_SOURCES[key as keyof typeof SOUND_SOURCES];
            loadSound(key, url);
        });

        // Safety Timeout (3s)
        setTimeout(() => {
            if (loaded < total) {
                console.warn("[SFX] Timeout reached, forcing start.");
                onProgress(100);
                resolve();
            }
        }, 3000);
    });
};

export const initAudioContext = () => {
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
    }
};

export const playSound = (key: string, volume: number = 1.0) => {
    try {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
        }

        const sound = sounds[key];
        if (sound) {
            sound.volume(volume);
            if (key === 'scratch') {
                 const id = sound.play();
                 sound.rate(0.8 + Math.random() * 0.4, id); 
            } else {
                 sound.play();
            }
        }
    } catch (e) {
        console.warn('[SFX] Playback error:', e);
    }
};

export const playMusic = () => {};
export const stopMusic = () => {};
export const toggleMusic = (): boolean => false;
export const getMusicEnabled = (): boolean => false;
export const isMusicPlaying = (): boolean => false;

export const playClickSound = () => playSound('click', 0.8);
export const playBackSound = () => playSound('back', 0.6);
export const playMoneySound = () => playSound('money', 0.6);
export const playWinSound = () => playSound('success', 0.6);
export const playErrorSound = () => playSound('error', 0.4);
export const playGoSound = () => playSound('go', 0.7);
export const playCountdownTick = () => playSound('tick', 0.5);
export const playCorrectSound = () => playSound('correct', 0.7);
export const playWrongSound = () => playSound('wrong', 0.5);
export const playScratchSound = () => playSound('scratch', 0.4);
