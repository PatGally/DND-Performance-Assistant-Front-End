// export async function getCachedDriveImage(maplink: string): Promise<string> {
//     const cacheKey = `drive-img:${maplink}`;
//
//     // Return cached blob URL if it exists
//     const cached = sessionStorage.getItem(cacheKey);
//     if (cached) return cached;
//
//     // Fetch through your backend proxy
//     const fileId = extractDriveFileId(maplink);
//     if (!fileId) return maplink;
//
//     const response = await fetch(`/api/drive-image/${fileId}`);
//     const blob = await response.blob();
//     const blobUrl = URL.createObjectURL(blob);
//
//     sessionStorage.setItem(cacheKey, blobUrl);
//     return blobUrl;
// }
//
// function extractDriveFileId(url: string): string | null {
//     const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//     return match ? match[1] : null;
// }

// export async function getCachedDriveImage(maplink: string): Promise<string | null> {
//     const cacheKey = `drive-img:${maplink}`;
//
//     const cached = sessionStorage.getItem(cacheKey);
//     if (cached) return cached;
//
//     const fileId = extractDriveFileId(maplink);
//     if (!fileId) {
//         console.error("[DriveImage] Could not extract file ID from:", maplink);
//         return null;
//     }
//
//     try {
//         const response = await fetch(`/api/drive-image/${fileId}`);
//         console.log("Response: ",response);
//
//         if (!response.ok) {
//             console.error(`[DriveImage] Backend returned ${response.status} for file ID: ${fileId}`);
//             return null;
//         }
//
//         const blob = await response.blob();
//         const blobUrl = URL.createObjectURL(blob);
//         sessionStorage.setItem(cacheKey, blobUrl);
//         return blobUrl;
//
//     } catch (err) {
//         console.error("[DriveImage] Fetch failed:", err);
//         return null;
//     }
// }
//
// function extractDriveFileId(url: string): string | null {
//     const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//     return match ? match[1] : null;
// }

export function getDriveImageUrl(maplink: string): string | null {
    const fileId = extractDriveFileId(maplink);
    if (!fileId) {
        console.error("[DriveImage] Could not extract file ID from:", maplink);
        return null;
    }
    return `/api/drive-image/${fileId}`;
}

function extractDriveFileId(url: string): string | null {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}