import { useMutation, useQuery } from '@tanstack/react-query';
import { tokenManager } from '@/api/tokenManager';
import { useAuthStore } from '@/store/authStore';
import { NormalizedError } from '@/types';
import * as authApi from './auth.api';
import { LoginPayload, RegisterPayload } from './auth.api';

/** Connexion : stocke les jetons (Keychain) puis l'utilisateur (store). */
export function useLogin() {
  const setUser = useAuthStore(s => s.setUser);
  return useMutation<Awaited<ReturnType<typeof authApi.login>>, NormalizedError, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: async result => {
      await tokenManager.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      setUser(result.utilisateur);
    },
  });
}

export function useRegister() {
  return useMutation<unknown, NormalizedError, RegisterPayload>({
    mutationFn: authApi.register,
  });
}

/** Déconnexion : révoque le refresh côté serveur puis purge la session. */
export function useLogout() {
  const clear = useAuthStore(s => s.clear);
  return useMutation<void, NormalizedError, void>({
    mutationFn: async () => {
      await authApi.logout(tokenManager.getRefreshToken());
    },
    onSettled: async () => {
      await tokenManager.clear();
      clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation<unknown, NormalizedError, string>({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResendVerification() {
  return useMutation<unknown, NormalizedError, string>({
    mutationFn: authApi.resendVerification,
  });
}

export function useResetPassword() {
  return useMutation<
    unknown,
    NormalizedError,
    { token: string; mot_de_passe: string }
  >({
    mutationFn: ({ token, mot_de_passe }) =>
      authApi.resetPassword(token, mot_de_passe),
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled,
  });
}
