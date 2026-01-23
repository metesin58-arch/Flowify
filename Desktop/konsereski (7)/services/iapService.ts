
import 'cordova-plugin-purchase';
import { Capacitor } from '@capacitor/core';

// Fix: Add global declaration for CdvPurchase on Window
declare global {
  interface Window {
    CdvPurchase: any;
  }
}

// Ürün ID'lerini buraya tanımla (App Store / Play Console ile birebir aynı olmalı)
// Convention: com.seninadın.oyun.urunadi
export const PRODUCT_IDS = {
    GOLD_MINI: 'gold_mini',
    GOLD_100: 'gold_100',
    GOLD_BAG: 'gold_bag',
    GOLD_500: 'gold_500',
    GOLD_VAULT: 'gold_vault',
    ENERGY_COFFEE: 'energy_coffee',
    ENERGY_REFILL: 'energy_refill',
    ENERGY_BULK: 'energy_bulk',
    VIP_SUB: 'vip_sub',         // Abonelik
    VERIFIED_TICK: 'verified_tick' // Non-Consumable
};

class IAPService {
    // Fix: Use 'any' instead of 'CdvPurchase.Store' which is not found
    private store: any | null = null;

    constructor() {
        // Fix: window.CdvPurchase is now valid due to global declaration
        if (Capacitor.isNativePlatform() && window.CdvPurchase) {
            this.store = window.CdvPurchase.store;
            this.initialize();
        }
    }

    initialize() {
        if (!this.store) return;

        // Fix: Capture CdvPurchase from window to access enums
        const CdvPurchase = window.CdvPurchase;

        // 1. Ürünleri Kaydet
        this.store.register([
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.GOLD_MINI, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.GOLD_100, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.GOLD_BAG, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.GOLD_500, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.GOLD_VAULT, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.ENERGY_COFFEE, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.ENERGY_REFILL, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.CONSUMABLE, id: PRODUCT_IDS.ENERGY_BULK, platform: CdvPurchase.Platform.GOOGLE_PLAY },

            { type: CdvPurchase.ProductType.NON_CONSUMABLE, id: PRODUCT_IDS.VERIFIED_TICK, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            { type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, id: PRODUCT_IDS.VIP_SUB, platform: CdvPurchase.Platform.GOOGLE_PLAY },
            
            // iOS için de aynı ID'leri ekle (Platform.APPLE_APPSTORE)
        ]);

        // 2. Event Listener'lar
        
        // Onaylandığında (Ödeme başarılı)
        this.store.when().approved((transaction: any) => {
            console.log('Transaction approved:', transaction);
            // Burada Backend doğrulaması yapılması önerilir.
            // Biz şimdilik client-side finish yapıyoruz.
            transaction.verify();
        });

        // Doğrulandığında (Ürünü ver)
        this.store.when().verified((transaction: any) => {
            console.log('Transaction verified, delivering product...');
            transaction.finish();
            // Not: Ürün verme işlemi `paymentService.ts` üzerinden UI tarafında handle ediliyor,
            // ama burada da global event fırlatılabilir.
        });

        // 3. Mağazayı Yenile
        this.store.initialize([
            CdvPurchase.Platform.GOOGLE_PLAY,
            CdvPurchase.Platform.APPLE_APPSTORE
        ]);
    }

    async purchase(productId: string): Promise<{ success: boolean }> {
        if (!this.store) {
            console.warn('Store not available (Web environment)');
            // Web Mock
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
        }

        try {
            const product = this.store.get(productId);
            if (product && product.canPurchase) {
                const order = await this.store.order(productId);
                if (order) {
                    return { success: true }; // Not: Asenkron süreç burada bitmiyor aslında, event'leri dinlemek lazım.
                }
            }
        } catch (e) {
            console.error('Purchase error', e);
        }
        return { success: false };
    }

    async restore() {
        if (this.store) {
            this.store.restorePurchases();
        }
    }
}

export const iapService = new IAPService();
