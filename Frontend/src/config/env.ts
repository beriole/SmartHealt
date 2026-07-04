/**
 * Variables d'environnement.
 * Expo expose les variables préfixées EXPO_PUBLIC_ via process.env au build.
 * - Émulateur Android : http://10.0.2.2:3000/api
 * - Appareil physique (Expo Go) : http://<IP_LAN_DE_LA_MACHINE_BACKEND>:3000/api
 */
export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api',
};
