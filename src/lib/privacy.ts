/**
 * Privacy Hygiene Utilities (AGENTS.md & design.md Section 1.3/5.5)
 *
 * STANDING PRIVACY RULES:
 * 1. Zero client-side persistence: no localStorage, sessionStorage, IndexedDB, or cookies.
 * 2. Never log secret keys, payload messages, or image blobs to the console.
 * 3. Never put secret keys or payload data in URLs or query parameters.
 * 4. Never register service workers that cache image uploads or decrypted messages.
 */

let isStorageGuarded = false;

/**
 * Dev-time guard that wraps Storage.prototype.setItem to throw a loud error
 * if any code or third-party dependency attempts to persist data.
 */
export function assertNoStorage(): void {
  if (typeof window === 'undefined' || isStorageGuarded) {
    return;
  }

  isStorageGuarded = true;

  const originalLocalSetItem = window.localStorage?.setItem;
  const originalSessionSetItem = window.sessionStorage?.setItem;

  const throwPrivacyViolation = (storageType: string, key: string) => {
    const errorMsg = `[PRIVACY VIOLATION] Attempted to call ${storageType}.setItem("${key}"). Veil operates under strict zero-persistence rules: no images, messages, or keys may be stored in browser storage.`;
    // In dev mode, throw an explicit error to halt the offending caller
    throw new Error(errorMsg);
  };

  try {
    if (window.localStorage) {
      window.localStorage.setItem = function (key: string, value: string) {
        throwPrivacyViolation('localStorage', key);
        originalLocalSetItem?.call(window.localStorage, key, value);
      };
    }

    if (window.sessionStorage) {
      window.sessionStorage.setItem = function (key: string, value: string) {
        throwPrivacyViolation('sessionStorage', key);
        originalSessionSetItem?.call(window.sessionStorage, key, value);
      };
    }
  } catch {
    // Graceful fallback if storage access is restricted by browser security policies
  }
}
