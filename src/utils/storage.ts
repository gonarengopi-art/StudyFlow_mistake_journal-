/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robust LocalStorage helpers with QuotaExceededError protection,
 * automatic base64 image stripping for offline cache, and graceful fallbacks.
 */

/**
 * Safely writes to localStorage.
 * If quota is exceeded (e.g. user attached screenshots/photos as base64),
 * it strips heavy image payloads from the offline cache copy to retain the
 * structural data without exceeding the 5MB browser quota.
 */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    return;
  } catch (primaryErr) {
    console.warn(`[safeSetItem] Direct write failed for "${key}". Attempting quota recovery...`, primaryErr);
  }

  try {
    // 1. If key stores mistakes, strip bulky base64 data URLs from offline cache
    if (key.includes('mistakes')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const stripped = parsed.map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const copy = { ...item };
            if (typeof copy.image === 'string' && copy.image.startsWith('data:')) {
              copy.image = ''; // Retain empty string in offline cache, original remains in memory/Firestore
            }
            if (typeof copy.solutionImage === 'string' && copy.solutionImage.startsWith('data:')) {
              copy.solutionImage = '';
            }
            return copy;
          });
          const sanitizedStr = JSON.stringify(stripped);
          localStorage.setItem(key, sanitizedStr);
          console.info(`[safeSetItem] Successfully cached "${key}" after stripping base64 images.`);
          return;
        }
      } catch {
        // Fall through to cleanup
      }
    }

    // 2. Free up space by removing older ephemeral keys
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (
          k &&
          k !== key &&
          (k.startsWith('studyflow_quota_') ||
            k.startsWith('studyflow_supporter_') ||
            k.startsWith('studyflow_pending_'))
        ) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }

    // 3. Retry setting original value
    localStorage.setItem(key, value);
  } catch (finalErr) {
    // Never allow QuotaExceededError to crash Firestore sync, listeners, or state mutations
    console.warn(
      `[safeSetItem] Storage quota exhausted for "${key}". Offline cache skipped safely:`,
      finalErr
    );
  }
}

/**
 * Safely reads an item from localStorage
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[safeGetItem] Failed to read "${key}":`, e);
    return null;
  }
}

/**
 * Safely removes an item from localStorage
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[safeRemoveItem] Failed to remove "${key}":`, e);
  }
}
