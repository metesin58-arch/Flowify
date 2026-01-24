
import 'cordova-plugin-purchase';
import { Capacitor } from '@capacitor/core';

declare global {
    interface Window {
        CdvPurchase: any;
    }
}

export const PRODUCT_IDS = {
    GOLD_MINI: 'gold_mini',
    GOLD_100: 'gold_100',
    GOLD_BAG: 'gold_bag',
    GOLD_500: 'gold_500',
    GOLD_VAULT: 'gold_vault',
    ENERGY_COFFEE: 'energy_coffee',
    ENERGY_REFILL: 'energy_refill',
    ENERGY_BULK: 'energy_bulk',
    VIP_SUB: 'vip_sub',
    VERIFIED_TICK: 'verified_tick'
};

class IAPService {
    private store: any | null = null;

    constructor() {
        if (Capacitor.isNativePlatform() && window.CdvPurchase) {
            this.store = window.CdvPurchase.store;
            this.initialize();
        }
    }

    initialize() {
        if (!this.store) return;
        const CdvPurchase = window.CdvPurchase;

        const products = [
            { id: PRODUCT_IDS.GOLD_MINI, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.GOLD_100, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.GOLD_BAG, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.GOLD_500, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.GOLD_VAULT, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.ENERGY_COFFEE, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.ENERGY_REFILL, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.ENERGY_BULK, type: CdvPurchase.ProductType.CONSUMABLE },
            { id: PRODUCT_IDS.VERIFIED_TICK, type: CdvPurchase.ProductType.NON_CONSUMABLE },
            { id: PRODUCT_IDS.VIP_SUB, type: CdvPurchase.ProductType.PAID_SUBSCRIPTION },
        ];

        this.store.register(products.flatMap(p => [
            { ...p, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { ...p, platform: CdvPurchase.Platform.APPLE_APPSTORE }
        ]));

        this.store.when().approved((transaction: any) => {
            console.log('Transaction approved:', transaction);
            transaction.verify();
        });

        this.store.when().verified((transaction: any) => {
            console.log('Transaction verified, finishing...');
            transaction.finish();
        });

        this.store.initialize([
            CdvPurchase.Platform.GOOGLE_PLAY,
            CdvPurchase.Platform.APPLE_APPSTORE
        ]);
    }

    async purchase(productId: string): Promise<{ success: boolean }> {
        if (!this.store) {
            console.warn('Store not available');
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
        }

        try {
            const product = this.store.get(productId);
            if (product && product.canPurchase) {
                const order = await this.store.order(productId);
                return { success: !!order };
            }
        } catch (e) {
            console.error('Purchase error', e);
        }
        return { success: false };
    }

    async restore() {
        if (this.store) this.store.restorePurchases();
    }
}

export const iapService = new IAPService();
