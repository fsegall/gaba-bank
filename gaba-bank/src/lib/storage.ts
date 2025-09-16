// localStorage utilities for persistent data storage

import type { OnboardingData } from "../contexts/OnboardingContext";
import type { WalletState } from "../contexts/WalletContext";

const STORAGE_KEYS = {
  ONBOARDING_DATA: "gababank_onboarding_data",
  WALLET_STATE: "gababank_wallet_state",
  USER_PREFERENCES: "gababank_user_preferences",
} as const;

interface UserPreferences {
  theme?: "light" | "dark" | "system";
  language?: string;
  notifications?: boolean;
}

// Generic localStorage utilities
export const storage = {
  set: <T>(key: string, value: T): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  },

  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return defaultValue;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  },
};

// Specific storage functions for onboarding data
export const onboardingStorage = {
  save: (data: OnboardingData): void => {
    // Convert Date objects to ISO strings for serialization
    const serializable = {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        dateOfBirth: data.personalInfo.dateOfBirth?.toISOString() || null,
      },
    };
    storage.set(STORAGE_KEYS.ONBOARDING_DATA, serializable);
  },

  load: (): OnboardingData | null => {
    const data = storage.get<OnboardingData | null>(
      STORAGE_KEYS.ONBOARDING_DATA,
      null,
    );
    if (!data) return null;

    // Convert ISO strings back to Date objects
    return {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        dateOfBirth: data.personalInfo.dateOfBirth
          ? new Date(data.personalInfo.dateOfBirth)
          : null,
      },
    };
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.ONBOARDING_DATA);
  },
};

// Specific storage functions for wallet state
export const walletStorage = {
  save: (walletState: WalletState): void => {
    storage.set(STORAGE_KEYS.WALLET_STATE, walletState);
  },

  load: (): WalletState | null => {
    return storage.get<WalletState | null>(STORAGE_KEYS.WALLET_STATE, null);
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.WALLET_STATE);
  },
};

// User preferences storage
export const preferencesStorage = {
  save: (preferences: UserPreferences): void => {
    storage.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  load: (): UserPreferences => {
    return storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {});
  },

  clear: (): void => {
    storage.remove(STORAGE_KEYS.USER_PREFERENCES);
  },
};
