import api from '@/lib/axios';
import { useEffect, useState } from 'react';

export interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  is_admin: boolean;
  avatar: string | null;
}

/**
 * Profile is requested by several components on the same screen
 * (ProtectedRoute, Navbar / AdminNavbar). Keep one shared cache + one in-flight
 * request so a page load costs a single `/accounts/profile/` call.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProfile: UserProfileData | null = null;
let cachedAt = 0;
let cachedToken: string | null = null;
let inflight: Promise<UserProfileData | null> | null = null;

const currentToken = (): string | null => {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

const normalizeProfile = (raw: any): UserProfileData | null => {
  if (!raw || raw.id === undefined || raw.id === null) return null;
  if (typeof raw.is_admin !== 'boolean') return null;
  return {
    id: String(raw.id),
    full_name: typeof raw.full_name === 'string' ? raw.full_name : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    phone_number: typeof raw.phone_number === 'string' ? raw.phone_number : '',
    is_admin: raw.is_admin,
    avatar: typeof raw.avatar === 'string' && raw.avatar ? raw.avatar : null,
  };
};

/** Instant profile from the last login response, so a reload does not flash a blank screen. */
const readStoredProfile = (): UserProfileData | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
};

const seedProfile = (): UserProfileData | null => {
  const token = currentToken();
  if (!token) {
    cachedProfile = null;
    cachedAt = 0;
    cachedToken = null;
    return null;
  }
  if (cachedProfile && cachedToken === token) return cachedProfile;

  const stored = readStoredProfile();
  if (stored) {
    cachedProfile = stored;
    cachedAt = Date.now();
    cachedToken = token;
  }
  return stored;
};

const fetchProfile = (): Promise<UserProfileData | null> => {
  const token = currentToken();
  if (!token) return Promise.resolve(null);

  if (cachedProfile && cachedToken === token && Date.now() - cachedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedProfile);
  }
  if (inflight) return inflight;

  inflight = api
    .get('/accounts/profile/')
    .then((res) => {
      const profile = normalizeProfile(res.data);
      if (profile) {
        cachedProfile = profile;
        cachedAt = Date.now();
        cachedToken = currentToken();
      }
      return profile;
    })
    .catch((err) => {
      console.error('Profile fetch failed:', err);
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

export const useUserProfile = () => {
  const [user, setUser] = useState<UserProfileData | null>(() => seedProfile());
  const [loading, setLoading] = useState<boolean>(() => !seedProfile() && !!currentToken());

  useEffect(() => {
    let active = true;

    const cached = seedProfile();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    fetchProfile().then((profile) => {
      if (!active) return;
      if (profile) setUser(profile);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return {
    user,
    loading,
    id: user?.id,
    full_name: user?.full_name,
    email: user?.email,
    is_admin: user?.is_admin,
    avatar: user?.avatar,
  };
};
