
// Browser Cache API Wrapper
const CACHE_NAME = 'flowify-assets-v1';

export const assetCache = {
    // Cache a list of URLs
    cacheAssets: async (urls: string[]) => {
        try {
            const cache = await caches.open(CACHE_NAME);
            const promises = urls.map(async (url) => {
                const match = await cache.match(url);
                if (!match) {
                    try {
                        await cache.add(url);
                        console.log(`[Cache] Added: ${url}`);
                    } catch (e) {
                        console.warn(`[Cache] Failed to add ${url}`, e);
                    }
                }
            });
            await Promise.all(promises);
        } catch (e) {
            console.error("[Cache] Error opening cache", e);
        }
    },

    // Check if asset is cached
    isCached: async (url: string): Promise<boolean> => {
        try {
            const cache = await caches.open(CACHE_NAME);
            const match = await cache.match(url);
            return !!match;
        } catch {
            return false;
        }
    },

    // Get asset blob URL (for fast Howler loading)
    getAssetUrl: async (url: string): Promise<string> => {
        try {
            const cache = await caches.open(CACHE_NAME);
            const response = await cache.match(url);
            if (response) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) {
            console.warn(`[Cache] Cache miss for ${url}`);
        }
        return url; // Fallback to network URL
    }
};
