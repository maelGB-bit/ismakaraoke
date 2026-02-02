import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  name: string;
  phone?: string;
  email?: string;
}

const STORAGE_KEY = 'karaoke_user_profile';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Initialize from localStorage synchronously to prevent flash
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Double-check localStorage on mount (for SSR compatibility)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      } catch {
        setProfile(null);
      }
    }
    setLoading(false);
  }, []);

  const saveProfile = useCallback((newProfile: UserProfile) => {
    // Save to localStorage immediately and synchronously
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    // Then update React state
    setProfile(newProfile);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  return { profile, loading, saveProfile, clearProfile };
}
