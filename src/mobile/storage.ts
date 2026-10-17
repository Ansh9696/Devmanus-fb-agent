import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

export async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  // 1. Native Mobile (Capacitor Preferences)
  if (isNativeMobile()) {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return JSON.parse(value) as T;
      }
    } catch {
      /* fallback */
    }
    return defaultValue;
  }

  // 2. Chrome Extension storage
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => {
        if (res && res[key] !== undefined) {
          resolve(res[key] as T);
        } else {
          resolve(defaultValue);
        }
      });
    });
  }

  // 3. Fallback to localStorage
  try {
    const raw = localStorage.getItem(`devmanus_${key}`);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    /* fallback */
  }

  return defaultValue;
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  // 1. Native Mobile (Capacitor Preferences)
  if (isNativeMobile()) {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      });
    } catch {
      /* ignored */
    }
    return;
  }

  // 2. Chrome Extension storage
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  }

  // 3. Fallback to localStorage
  try {
    localStorage.setItem(`devmanus_${key}`, JSON.stringify(value));
  } catch {
    /* ignored */
  }
}
