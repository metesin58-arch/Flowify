
import { AdMob, RewardAdOptions, AdLoadInfo, RewardAdPluginEvents, AdMobRewardItem, AdMobError, InterstitialAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// GERÇEK ADMOB ID'LERİ
const AD_UNIT_IDS = {
    // Platform kontrolü: iOS ise iOS ID'leri, Android ise Android ID'leri (Burada sadece Android istendiği için Android ID'leri girildi)
    android: {
        APP_ID: 'ca-app-pub-4965929442860631~8109023834',
        INTERSTITIAL: 'ca-app-pub-4965929442860631/7302035167',
        REWARDED: 'ca-app-pub-4965929442860631/4632813259'
    },
    ios: {
        APP_ID: 'ca-app-pub-4965929442860631~8109023834', // iOS ID'si varsa buraya girilmeli
        INTERSTITIAL: 'ca-app-pub-4965929442860631/7302035167',
        REWARDED: 'ca-app-pub-4965929442860631/4632813259'
    }
};

const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
const UNITS = AD_UNIT_IDS[platform];

class AdMobService {
    private isInitialized = false;
    private isInterstitialLoaded = false;
    private isRewardedLoaded = false;

    constructor() {
        this.initialize();
    }

    async initialize() {
        if (!Capacitor.isNativePlatform()) return;
        
        try {
            await AdMob.initialize({
                initializeForTesting: false, // GERÇEK REKLAMLAR İÇİN FALSE
            });
            this.isInitialized = true;
            console.log('AdMob Initialized');

            // İlk açılışta reklamları önceden yükle
            this.prepareInterstitial();
            this.prepareRewarded();

        } catch (e) {
            console.error('AdMob Init Error:', e);
        }
    }

    // --- INTERSTITIAL (GEÇİŞ REKLAMI) ---

    async prepareInterstitial() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const options: AdOptions = {
                adId: UNITS.INTERSTITIAL,
                isTesting: false // PRODUCTION
            };
            await AdMob.prepareInterstitial(options);
            this.isInterstitialLoaded = true;
            console.log('Interstitial Prepared');
        } catch (e) {
            console.error('Interstitial Prepare Error:', e);
            this.isInterstitialLoaded = false;
        }
    }

    async showInterstitial(): Promise<boolean> {
        // Web ortamı simülasyonu
        if (!Capacitor.isNativePlatform()) {
            console.log('Web: Interstitial Shown (Simulated)');
            return true;
        }

        try {
            // Eğer reklam hazır değilse, yüklemeyi dene ama kullanıcıyı bekletmemek için gösterme
            if (!this.isInterstitialLoaded) {
                console.log('Interstitial not ready, preparing for next time.');
                this.prepareInterstitial();
                return false;
            }

            // Reklam kapatıldığında bir sonrakini hazırla
            const dismissListener = await AdMob.addListener(
                InterstitialAdPluginEvents.Dismissed,
                () => {
                    this.isInterstitialLoaded = false;
                    this.prepareInterstitial(); // Bir sonraki tur için hazırla
                    dismissListener.remove();
                }
            );

            await AdMob.showInterstitial();
            return true;
        } catch (e) {
            console.error('Show Interstitial Error:', e);
            return false;
        }
    }

    // --- REWARDED (ÖDÜLLÜ REKLAM) ---

    async prepareRewarded() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const options: RewardAdOptions = {
                adId: UNITS.REWARDED,
                isTesting: false // PRODUCTION
            };
            await AdMob.prepareRewardVideoAd(options);
            this.isRewardedLoaded = true;
            console.log('Rewarded Prepared');
        } catch (e) {
            console.error('Rewarded Prepare Error:', e);
            this.isRewardedLoaded = false;
        }
    }

    // İSİM GÜNCELLENDİ: showRewardVideo -> reklami_baslat
    async reklami_baslat(): Promise<boolean> {
        // --- SENARYO 1: WEB / PWA ---
        if (!Capacitor.isNativePlatform()) {
            console.log('Web environment: Simulating Ad (reklami_baslat)...');
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 3000);
            });
        }

        // --- SENARYO 2: NATIVE (AdMob) ---
        return new Promise(async (resolve) => {
            try {
                // Eğer yüklü değilse anlık yüklemeyi dene
                if (!this.isRewardedLoaded) {
                    await this.prepareRewarded();
                }

                const rewardListener = await AdMob.addListener(
                    RewardAdPluginEvents.Rewarded,
                    (reward: AdMobRewardItem) => {
                        console.log('User rewarded via reklami_baslat:', reward);
                        resolve(true);
                    }
                );

                const dismissListener = await AdMob.addListener(
                    RewardAdPluginEvents.Dismissed,
                    () => {
                        this.isRewardedLoaded = false;
                        this.prepareRewarded(); // Bir sonraki için hazırla
                        
                        setTimeout(() => {
                            rewardListener.remove();
                            dismissListener.remove();
                        }, 500);
                    }
                );

                const failedListener = await AdMob.addListener(
                    RewardAdPluginEvents.FailedToLoad,
                    (error: AdMobError) => {
                        console.error('Ad Failed to Load', error);
                        resolve(false);
                    }
                );

                await AdMob.showRewardVideoAd();

            } catch (e) {
                console.error('Ad Show Error (reklami_baslat):', e);
                resolve(false);
            }
        });
    }
}

export const adMobService = new AdMobService();
