
import { Capacitor } from '@capacitor/core';
import { iapService } from './iapService';

/**
 * ÖDEME YÖNETİCİSİ (HİBRİT YAPI)
 * --------------------------------------------
 * Native (Capacitor/Cordova): Apple/Google IAP kullanır.
 * Flutter Webview: window.FlutterPay üzerinden sinyal gönderir.
 * Web (Dev/Test): Simülasyon yapar.
 */

export interface PurchaseResult {
    success: boolean;
    productId: string;
    transactionId?: string;
    error?: string;
}

export const PaymentManager = {
    
    // Satın alım işlemini başlat
    performPurchase: async (productId: string): Promise<PurchaseResult> => {
        console.log(`Purchase initiated for: ${productId} on platform: ${Capacitor.getPlatform()}`);

        // --- SENARYO 1: FLUTTER WEBVIEW (ÖNCELİKLİ) ---
        // Eğer uygulama Flutter Webview içinde çalışıyorsa ve JavascriptChannel tanımlıysa
        if (window.FlutterPay) {
            console.log("Flutter Bridge Detected. Sending signal to native...");
            
            // Flutter'a mesaj gönder: "purchase:gold_100" gibi
            window.FlutterPay.postMessage(productId);

            // Web tarafında işlemi "başarılı" olarak işaretlemiyoruz çünkü
            // gerçek başarı sinyali Flutter'dan 'window.odulVer' çağrısı ile gelecek.
            // UI'da "İşlem Başlatıldı" hissiyatı vermek için true dönüyoruz ama ödülü hemen vermiyoruz.
            return { success: true, productId, transactionId: 'pending_flutter' };
        }

        // --- SENARYO 2: NATIVE (CAPACITOR/CORDOVA) ---
        if (Capacitor.isNativePlatform()) {
            try {
                localStorage.setItem('last_purchase_attempt', productId);
                const result = await iapService.purchase(productId);
                
                if (result.success) {
                    return { success: true, productId, transactionId: `native_${Date.now()}` };
                } else {
                    return { success: false, productId, error: "Mağaza işlemi başlatılamadı." };
                }
            } catch (e: any) {
                console.error("Native Payment Error:", e);
                return { success: false, productId, error: e.message };
            }
        } 
        
        // --- SENARYO 3: STANDARD WEB (DEV/TEST) ---
        else {
            // Web ortamında test için simülasyon
            console.log("Web Simulation: Payment processed immediately.");
            localStorage.setItem('last_purchase_attempt', productId);

            return new Promise((resolve) => {
                setTimeout(() => {
                    if (window.odulVer) {
                        window.odulVer(productId);
                    }
                    resolve({ success: true, productId, transactionId: `web_direct_${Date.now()}` });
                }, 500);
            });
        }
    },

    // Geçmiş satın alımları geri yükle
    restorePurchases: async () => {
        if (window.FlutterPay) {
            // Flutter tarafında restore komutu
            window.FlutterPay.postMessage("RESTORE_PURCHASES");
            return true;
        }
        
        if (Capacitor.isNativePlatform()) {
            await iapService.restore();
        } else {
            console.log("Web sürümünde geri yükleme işlemi yapıldı.");
        }
        return true;
    }
};
