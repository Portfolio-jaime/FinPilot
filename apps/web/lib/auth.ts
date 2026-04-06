'use client';
import { create } from 'zustand';
import Cookies from 'js-cookie';

interface AuthState {
  accessToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: typeof window !== 'undefined' ? Cookies.get('accessToken') ?? null : null,
  setTokens: (accessToken, refreshToken) => {
    Cookies.set('accessToken', accessToken, { expires: 1 / 96 }); // 15 min
    Cookies.set('refreshToken', refreshToken, { expires: 30 });
    set({ accessToken });
  },
  clear: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ accessToken: null });
  },
}));
