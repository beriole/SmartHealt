import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

/** Deep-linking : smarthealth://… et https://app.smarthealth.cm/… */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['smarthealth://', 'https://app.smarthealth.cm'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          VerifyEmailNotice: 'verify-email',
          ResetPassword: 'reset-password/:token',
        },
      },
      Patient: {
        screens: {
          Accueil: {
            screens: {
              AccueilHome: 'accueil',
              ArticleDetail: 'article/:id',
            },
          },
          Pharmacie: {
            screens: {
              PharmacieHome: 'pharmacie',
              MedicamentDetail: 'medicament/:id',
              PharmacieList: 'pharmacies',
              PharmacieDetail: 'pharmacie-detail/:id',
              Cart: 'panier',
              Checkout: 'checkout',
              Payment: 'paiement',
            },
          },
          Sante: {
            screens: {
              SanteHome: 'sante',
              Triage: 'sante/triage',
              MedecineTraditionnelle: 'sante/medecine-traditionnelle',
              Compatibilite: 'sante/compatibilite',
              HistoriqueIa: 'sante/historique',
              AnalyseDetail: 'sante/analyse/:id',
              Carnet: 'sante/carnet',
              Ordonnances: 'sante/ordonnances',
              OrdonnanceDetail: 'sante/ordonnance/:id',
              Rappels: 'sante/rappels',
              NouveauRappel: 'sante/rappels/nouveau',
            },
          },
          Commandes: {
            screens: {
              CommandesList: 'commandes',
              CommandeDetail: 'commande/:id',
            },
          },
          Profil: {
            screens: {
              ProfilHome: 'profil',
              EditProfil: 'profil/edit',
              Interventions: 'profil/interventions',
              InterventionDetail: 'profil/intervention/:id',
              NouvelleIntervention: 'profil/intervention-nouvelle',
              PartageDossier: 'profil/partage',
            },
          },
        },
      },
      Livreur: {
        screens: {
          Dashboard: 'livreur',
          Courses: 'livreur/courses',
          Livraisons: {
            screens: {
              LivraisonsList: 'livreur/livraisons',
              ValiderLivraison: 'livreur/livraison/:id/valider',
            },
          },
          ProfilLivreur: 'livreur/profil',
        },
      },
      Pro: {
        screens: {
          Dossier: {
            screens: {
              ScanCarnet: 'pro/scan',
              DossierPatient: 'pro/dossier/:token',
              NouvelleConsultation: 'pro/consultation-nouvelle',
              NouvelleOrdonnance: 'pro/ordonnance-nouvelle',
            },
          },
          InterventionsPro: {
            screens: {
              InterventionsProList: 'pro/interventions',
              TerminerIntervention: 'pro/intervention/:id/terminer',
            },
          },
          ProfilPro: 'pro/profil',
        },
      },
    },
  },
};
