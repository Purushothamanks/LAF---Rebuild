/**
 * LAF AI - Live Sync Engine & Immersive Mobile App Controller
 * Manages real-time live synchronization, version detection,
 * cache wiping, and Gemini-style edge-to-edge fullscreen execution.
 */

export const CURRENT_BUILD_ID = 'laf-live-sync-v151-fullscreen-native-20261113';
export const CURRENT_BUILD_TIMESTAMP = 1794500000000;

/**
 * Strictly identifies if the user is running inside the installed Mobile App
 * (PWA, WebAPK, standalone, iOS home screen, or explicit ?mode=app).
 * Returns FALSE for normal website/browser visitors.
 */
export function isMobileAppEnvironment() {
  if (typeof window === 'undefined') return false;

  try {
    // 1. WebAPK / Standalone PWA display mode
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    // 2. Fullscreen PWA display mode
    const isFullscreen = window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches;
    // 3. Minimal-UI display mode
    const isMinimalUi = window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches;
    // 4. iOS Safari standalone app mode
    const isIOSStandalone = window.navigator && window.navigator.standalone === true;
    // 5. Android WebAPK launch referrer
    const isAndroidReferrer = typeof document !== 'undefined' && Boolean(
      document.referrer && (
        document.referrer.includes('android-app://') ||
        document.referrer.includes('org.chromium.webapk')
      )
    );
    // 6. Explicit app parameter in URL
    const searchParams = new URLSearchParams(window.location.search);
    const isAppParam = searchParams.get('mode') === 'app' || searchParams.get('app') === 'true';

    return Boolean(isStandalone || isFullscreen || isMinimalUi || isIOSStandalone || isAndroidReferrer || isAppParam);
  } catch (e) {
    return false;
  }
}

/**
 * Fetches the latest published version metadata directly from the live server.
 * Bypasses all browser and CDN caches with explicit no-store headers and unique timestamp.
 */
export async function checkRemoteVersion() {
  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch(`/version.json?_sync=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Triggers native immersive fullscreen mode like Google Gemini mobile app.
 * Can be called safely on user gesture (tap/click).
 */
export async function requestAppFullscreen() {
  if (typeof document === 'undefined') return;

  try {
    const docEl = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    }
  } catch (e) {
    // Non-fatal if browser blocks or doesn't support
  }
}

/**
 * Toggles fullscreen mode between fullscreen and windowed.
 */
export async function toggleAppFullscreen() {
  if (typeof document === 'undefined') return;

  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      await requestAppFullscreen();
    }
  } catch (e) {}
}

/**
 * Performs an instant live app update:
 * 1. Requests immersive fullscreen
 * 2. Purges all CacheStorage caches
 * 3. Unregisters stale service workers
 * 4. Records new build ID
 * 5. Performs a hard replace with cache-buster into app mode
 */
export async function applyLiveAppUpdate(targetBuildId) {
  const buildToApply = targetBuildId || CURRENT_BUILD_ID;

  // 1. Immediately request fullscreen
  await requestAppFullscreen();

  // 2. Wipe CacheStorage
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
    } catch (e) {}
  }

  // 3. Unregister any Service Workers
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    } catch (e) {}
  }

  // 4. Record applied version in localStorage
  try {
    localStorage.setItem('laf_applied_mobile_build', buildToApply);
  } catch (e) {}

  // 5. Hard reload with cache buster into app mode
  const targetUrl = new URL(window.location.origin + '/?mode=app');
  targetUrl.searchParams.set('sync', Date.now().toString());
  window.location.replace(targetUrl.toString());
}
