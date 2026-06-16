import * as Keychain from 'react-native-keychain';

/**
 * Stockage chiffré des jetons d'authentification (Keystore Android / Keychain iOS).
 * Les deux tokens sont stockés ensemble sous un service dédié.
 */
const TOKEN_SERVICE = 'smarthealth.auth';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword(
    'auth',
    JSON.stringify(tokens),
    { service: TOKEN_SERVICE },
  );
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const creds = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
  if (!creds) {
    return null;
  }
  try {
    return JSON.parse(creds.password) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}
