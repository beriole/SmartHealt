import { env } from '@/config/env';

// Host du backend sans le suffixe /api (les fichiers sont servis sur /uploads).
const host = env.API_URL.replace(/\/api\/?$/, '');

/**
 * Résout une URL d'image renvoyée par le backend.
 * Les chemins relatifs (/uploads/...) sont préfixés par l'host ; les URLs
 * absolues sont laissées telles quelles.
 */
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}
