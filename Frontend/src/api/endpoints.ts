/** Chemins de l'API backend (préfixe /api déjà dans baseURL). */
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: (token: string) => `/auth/reset-password/${token}`,
    resendVerification: '/auth/resend-verification',
  },
  utilisateurs: {
    me: '/utilisateurs/me',
    byId: (id: string) => `/utilisateurs/${id}`,
    avatar: (id: string) => `/utilisateurs/${id}/avatar`,
  },
  professionnels: {
    list: '/professionnels',
    byId: (id: string) => `/professionnels/${id}`,
  },
  interventions: {
    list: '/interventions',
    create: '/interventions',
    byId: (id: string) => `/interventions/${id}`,
    updateStatus: (id: string) => `/interventions/${id}/status`,
  },
  b2b: {
    genererPin: '/b2b/patient/generer-pin',
  },
  pharmacies: {
    list: '/pharmacies',
    byId: (id: string) => `/pharmacies/${id}`,
  },
  stocks: {
    search: '/stocks/search',
  },
  medicaments: {
    list: '/medicaments',
    byId: (id: string) => `/medicaments/${id}`,
  },
  commandes: {
    list: '/commandes',
    byId: (id: string) => `/commandes/${id}`,
    create: '/commandes',
    fromOrdonnance: '/commandes/from-ordonnance',
    payer: (id: string) => `/commandes/${id}/payer`,
    paymentStatus: (id: string) => `/commandes/${id}/payment-status`,
    validerLivraison: (id: string) => `/commandes/${id}/valider-livraison`,
    evaluer: (id: string) => `/commandes/${id}/evaluer`,
    disponiblesLivraison: '/commandes/disponibles-livraison',
    assignerLivreur: (id: string) => `/commandes/${id}/assigner-livreur`,
  },
  livreurs: {
    dashboard: '/livreurs/dashboard',
    disponibilite: '/livreurs/disponibilite',
    position: '/livreurs/position',
  },
  ordonnances: {
    list: '/ordonnances',
    byId: (id: string) => `/ordonnances/${id}`,
    create: '/ordonnances',
  },
  consultations: {
    list: '/consultations',
    byId: (id: string) => `/consultations/${id}`,
    create: '/consultations',
  },
  rappels: {
    list: '/rappels',
    create: '/rappels',
    prisesDuJour: '/rappels/prises-du-jour',
    marquerPrise: (id: string) => `/rappels/prises/${id}`,
    statsGlobales: '/rappels/stats/globales',
  },
  carnets: {
    mine: '/carnets/my-carnet',
    regenerateQr: '/carnets/my-carnet/regenerate-qr',
    scan: (token: string) => `/carnets/scan/${token}`,
  },
  triage: '/triage',
  ia: {
    diagnostic: '/ia/diagnostic',
    compatibiliteMedicament: '/ia/compatibilite-medicament',
    analysePredictive: '/ia/analyse-predictive',
    recommandationTraitement: '/ia/recommandation-traitement',
    medecineTraditionnelle: '/ia/medecine-traditionnelle',
    historique: '/ia/historique',
    analyseById: (id: string) => `/ia/analyses/${id}`,
  },
  articles: {
    list: '/articles',
    byId: (id: string) => `/articles/${id}`,
  },
} as const;
