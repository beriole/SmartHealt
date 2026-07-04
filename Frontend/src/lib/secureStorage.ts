import * as SecureStore from 'expo-secure-store';

/**
 * Stockage chiffré des jetons (Keystore Android / Keychain iOS via expo-secure-store).
 * Fonctionne dans Expo Go. Interface stable consommée par api/tokenManager.
 */
const TOKENS_KEY = 'smarthealth_auth_tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}
