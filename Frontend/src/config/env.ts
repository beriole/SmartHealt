import Config from 'react-native-config';

/**
 * Variables d'environnement (react-native-config).
 * En dev sur émulateur Android, le backend localhost est joignable via 10.0.2.2.
 * Sur appareil physique, remplacer par l'IP LAN de la machine backend.
 */
export const env = {
  API_URL: Config.API_URL ?? 'http://10.0.2.2:3000/api',
};
