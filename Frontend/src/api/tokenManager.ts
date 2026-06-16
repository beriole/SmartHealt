import { loadTokens, saveTokens, clearTokens, StoredTokens } from '@/lib/secureStorage';

/**
 * Cache en mémoire des jetons pour un accès synchrone dans les intercepteurs,
 * synchronisé avec le Keychain.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  setTokens(tokens: StoredTokens) {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    return saveTokens(tokens);
  },

  async loadFromStorage(): Promise<StoredTokens | null> {
    const tokens = await loadTokens();
    if (tokens) {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    }
    return tokens;
  },

  async clear() {
    accessToken = null;
    refreshToken = null;
    await clearTokens();
  },
};
