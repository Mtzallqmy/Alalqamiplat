import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SITE_BASE = 'https://moatazalalqami.online';

export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_USER_KEY = 'admin_user';

export type AdminUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type LoginResult = {
  success: boolean;
  token?: string | null;
  user?: AdminUser | null;
  message?: string;
  raw?: unknown;
};

interface AuthContextType {
  token: string | null;
  user: AdminUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token?: string | null, user?: AdminUser | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isValidToken(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function safeStoreString(key: string, value?: string | null) {
  if (isValidToken(value)) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.removeItem(key);
}

async function safeStoreJson(key: string, value?: unknown | null) {
  if (value === null || value === undefined) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function extractToken(payload: any): string | null {
  const token =
    payload?.token ??
    payload?.data?.token ??
    payload?.accessToken ??
    payload?.access_token ??
    payload?.data?.accessToken ??
    payload?.data?.access_token ??
    null;

  return isValidToken(token) ? token : null;
}

function extractUser(payload: any): AdminUser | null {
  const user = payload?.user ?? payload?.data?.user ?? payload?.data?.admin ?? payload?.admin ?? null;
  if (!user || typeof user !== 'object') return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStorageData() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(ADMIN_TOKEN_KEY),
          AsyncStorage.getItem(ADMIN_USER_KEY),
        ]);

        if (!mounted) return;

        setToken(isValidToken(storedToken) ? storedToken : null);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            await AsyncStorage.removeItem(ADMIN_USER_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadStorageData();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (newToken?: string | null, newUser?: AdminUser | null) => {
    const cleanToken = isValidToken(newToken) ? newToken : null;
    const cleanUser = newUser && typeof newUser === 'object' ? newUser : null;

    await Promise.all([
      safeStoreString(ADMIN_TOKEN_KEY, cleanToken),
      safeStoreJson(ADMIN_USER_KEY, cleanUser),
    ]);

    setToken(cleanToken);
    setUser(cleanUser);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([ADMIN_TOKEN_KEY, ADMIN_USER_KEY]);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, isLoggedIn: Boolean(token && user), isLoading, login, logout }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function getAdminSession() {
  const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  const userRaw = await AsyncStorage.getItem(ADMIN_USER_KEY);
  let user: AdminUser | null = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }

  return {
    token: isValidToken(token) ? token : null,
    user,
    isLoggedIn: Boolean(token && user),
  };
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${SITE_BASE}/api/mobile/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      return {
        success: false,
        message: payload?.error || payload?.message || 'بيانات الدخول غير صحيحة.',
        raw: payload,
      };
    }

    const token = extractToken(payload);
    const user = extractUser(payload);

    if (!token || !user) {
      return {
        success: false,
        message: 'تسجيل دخول التطبيق يحتاج token ومعلومات مستخدم من الموقع.',
        raw: payload,
      };
    }

    return {
      success: true,
      token,
      user,
      message: 'تم تسجيل الدخول بنجاح.',
      raw: payload,
    };
  } catch (error) {
    return {
      success: false,
      message: 'تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى.',
      raw: error,
    };
  }
}
