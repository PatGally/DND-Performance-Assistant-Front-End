const CACHE_PREFIX = 'drive-img:';

export async function warmDriveImageCache(maplink: string): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${maplink}`;
    if (sessionStorage.getItem(cacheKey)) return;

    console.log('[DriveImage] Warming:', maplink);

    try {
        const response = await fetch(maplink); // ← fetch directly, no extraction needed
        console.log('[DriveImage] Response status:', response.status);

        if (!response.ok) return;

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        sessionStorage.setItem(cacheKey, base64);
        console.log('[DriveImage] Cached successfully:', cacheKey);
    } catch (err) {
        console.error('[DriveImage] Cache warm failed:', err);
    }
}

export function getCachedDriveImage(maplink: string): string | null {
    return sessionStorage.getItem(`${CACHE_PREFIX}${maplink}`);
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}