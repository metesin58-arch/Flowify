
import { AdMob, RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem, AdMobError, InterstitialAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Fix: Global declaration
declare global {
    interface Window {
        odulVer: (productId?: string) => void;
    }
}

// GERÇEK ADMOB ID'LERİ
const AD_UNIT_IDS = {
    android: {
        APP_ID: 'ca-app-pub-4965929442860631~8109023834',
        INTERSTITIAL: 'ca-app-pub-4965929442860631/7302035167',
        REWARDED: 'ca-app-pub-4965929442860631/4632813259'
    },
    ios: {
        APP_ID: 'ca-app-pub-4965929442860631~8109023834',
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
                initializeForTesting: false,
            });
            this.isInitialized = true;
            console.log('AdMob Initialized');

            this.prepareInterstitial();
            this.prepareRewarded();

        } catch (e) {
            console.error('AdMob Init Error:', e);
        }
    }

    async prepareInterstitial() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const options: AdOptions = {
                adId: UNITS.INTERSTITIAL,
                isTesting: false
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
        if (!Capacitor.isNativePlatform()) {
            console.log('Web: Interstitial Shown (Simulated)');
            return true;
        }

        try {
            if (!this.isInterstitialLoaded) {
                console.log('Interstitial not ready, preparing for next time.');
                this.prepareInterstitial();
                return false;
            }

            const dismissListener = await AdMob.addListener(
                InterstitialAdPluginEvents.Dismissed,
                () => {
                    this.isInterstitialLoaded = false;
                    this.prepareInterstitial();
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

    async prepareRewarded() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const options: RewardAdOptions = {
                adId: UNITS.REWARDED,
                isTesting: false
            };
            await AdMob.prepareRewardVideoAd(options);
            this.isRewardedLoaded = true;
            console.log('Rewarded Prepared');
        } catch (e) {
            console.error('Rewarded Prepare Error:', e);
            this.isRewardedLoaded = false;
        }
    }

    async reklami_baslat(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            console.log('Web environment: Simulating Ad...');
            return new Promise((resolve) => {
                setTimeout(() => resolve(true), 3000);
            });
        }

        return new Promise(async (resolve) => {
            try {
                if (!this.isRewardedLoaded) {
                    await this.prepareRewarded();
                }

                const rewardListener = await AdMob.addListener(
                    RewardAdPluginEvents.Rewarded,
                    (reward: AdMobRewardItem) => {
                        console.log('User rewarded:', reward);
                        resolve(true);
                    }
                );

                const dismissListener = await AdMob.addListener(
                    RewardAdPluginEvents.Dismissed,
                    () => {
                        this.isRewardedLoaded = false;
                        this.prepareRewarded();
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
                        failedListener.remove();
                        resolve(false);
                    }
                );

                await AdMob.showRewardVideoAd();

            } catch (e) {
                console.error('Ad Show Error:', e);
                resolve(false);
            }
        });
    }
}

export const adMobService = new AdMobService();
