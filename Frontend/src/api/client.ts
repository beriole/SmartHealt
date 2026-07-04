import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { NormalizedError } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { tokenManager } from './tokenManager';
import { endpoints } from './endpoints';

/** Instance principale, traversée par les intercepteurs. */
export const client: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/** Instance « brute » sans intercepteurs, pour l'appel de refresh. */
const raw: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | {
          message?: string;
          details?: { field?: string; message?: string }[];
        }
      | undefined;

    // Le backend renvoie les erreurs de validation sous forme
    // details: [{ field, message }] → on les regroupe par champ.
    let fields: Record<string, string> | undefined;
    if (Array.isArray(data?.details)) {
      fields = {};
      for (const d of data.details) {
        if (d?.field && d?.message) {
          fields[d.field] = d.message;
        }
      }
    }

    return {
      message: data?.message ?? error.message ?? 'Une erreur est survenue.',
      status,
      fields,
    };
  }
  return { message: 'Une erreur inattendue est survenue.' };
}

// --- Intercepteur de requête : injection de l'access token ---
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh automatique sur 401 avec file d'attente ---
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let waiters: ((token: string | null) => void)[] = [];

function flushWaiters(token: string | null) {
  waiters.forEach(resolve => resolve(token));
  waiters = [];
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const res = await raw.post(endpoints.auth.refresh, { refreshToken });
    const { accessToken, refreshToken: newRefresh } = res.data.data;
    await tokenManager.setTokens({ accessToken, refreshToken: newRefresh });
    return accessToken;
  } catch {
    return null;
  }
}

client.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthRoute =
      url.includes(endpoints.auth.refresh) ||
      url.includes(endpoints.auth.login);

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (isRefreshing) {
        // Attendre la fin du refresh en cours, puis rejouer.
        return new Promise((resolve, reject) => {
          waiters.push(token => {
            if (!token) {
              reject(normalizeError(error));
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }

      isRefreshing = true;
      const newToken = await performRefresh();
      isRefreshing = false;
      flushWaiters(newToken);

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      }

      // Refresh impossible → purge de session et retour à l'écran de connexion.
      await tokenManager.clear();
      useAuthStore.getState().clear();
    }

    return Promise.reject(normalizeError(error));
  },
);
