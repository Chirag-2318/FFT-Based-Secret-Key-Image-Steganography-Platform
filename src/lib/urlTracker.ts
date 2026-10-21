/**
 * Object URL Tracker (src/lib/urlTracker.ts)
 * Dev-only memory hygiene tracker that monitors created vs revoked object URLs
 * and warns about leaked URLs when components unmount or reset.
 */

const activeUrls = new Set<string>();
let totalCreated = 0;
let totalRevoked = 0;

export function createTrackedObjectURL(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  activeUrls.add(url);
  totalCreated++;
  return url;
}

export function revokeTrackedObjectURL(url: string | null | undefined): void {
  if (!url) return;
  if (activeUrls.has(url)) {
    URL.revokeObjectURL(url);
    activeUrls.delete(url);
    totalRevoked++;
  } else {
    // Revoke anyway in case it was created elsewhere
    URL.revokeObjectURL(url);
  }
}

export function revokeAllTrackedObjectURLs(): void {
  activeUrls.forEach((url) => {
    URL.revokeObjectURL(url);
    totalRevoked++;
  });
  activeUrls.clear();
}

export function getActiveTrackedUrlsCount(): number {
  return activeUrls.size;
}

export function getUrlStats(): { created: number; revoked: number; active: number } {
  return {
    created: totalCreated,
    revoked: totalRevoked,
    active: activeUrls.size,
  };
}
