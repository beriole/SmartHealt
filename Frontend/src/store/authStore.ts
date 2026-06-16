import { create } from 'zustand';
import { Utilisateur } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: Utilisateur | null;
  setUser: (user: Utilisateur) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

/**
 * Session en mémoire. Les jetons sont conservés dans le Keychain
 * (cf. lib/secureStorage) ; ce store ne contient que l'utilisateur courant
 * et l'état d'authentification, utilisés par la navigation.
 */
export const useAuthStore = create<AuthState>(set => ({
  status: 'loading',
  user: null,
  setUser: user => set({ user, status: 'authenticated' }),
  setStatus: status => set({ status }),
  clear: () => set({ user: null, status: 'unauthenticated' }),
}));
