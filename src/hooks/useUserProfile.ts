import { useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  phone?: string;
  email?: string;
}

const STORAGE_KEY = 'karaoke_user_profile';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        setProfile(null);
      }
    }
    setLoading(false);
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  return { profile, loading, saveProfile, clearProfile };
}
