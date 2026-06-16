import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmailNotice: { email: string };
  ResetPassword: { token: string };
};

export type PharmacieStackParamList = {
  PharmacieHome: undefined;
  MedicamentDetail: { id: string };
  PharmacieList: undefined;
  PharmacieDetail: { id: string; nom?: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: { id_commande: string; montant: number };
};

export type CommandesStackParamList = {
  CommandesList: undefined;
  CommandeDetail: { id: string };
  Payment: { id_commande: string; montant: number };
};

export type SanteStackParamList = {
  SanteHome: undefined;
  Triage: undefined;
  MedecineTraditionnelle: undefined;
  Compatibilite: undefined;
  HistoriqueIa: undefined;
  AnalyseDetail: { id: string };
  Carnet: undefined;
  Ordonnances: undefined;
  OrdonnanceDetail: { id: string };
  Rappels: undefined;
  NouveauRappel: {
    id_ordonnance: string;
    id_medicament: string;
    nom_medicament?: string;
  };
};

export type AccueilStackParamList = {
  AccueilHome: undefined;
  ArticleDetail: { id: string };
};

export type ProfilStackParamList = {
  ProfilHome: undefined;
  EditProfil: undefined;
  Interventions: undefined;
  InterventionDetail: { id: string };
  NouvelleIntervention: undefined;
  PartageDossier: undefined;
};

export type PatientTabParamList = {
  Accueil: NavigatorScreenParams<AccueilStackParamList>;
  Pharmacie: NavigatorScreenParams<PharmacieStackParamList>;
  Sante: NavigatorScreenParams<SanteStackParamList>;
  Commandes: NavigatorScreenParams<CommandesStackParamList>;
  Profil: NavigatorScreenParams<ProfilStackParamList>;
};

export type LivraisonsStackParamList = {
  LivraisonsList: undefined;
  ValiderLivraison: { id: string };
};

export type LivreurTabParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Livraisons: NavigatorScreenParams<LivraisonsStackParamList>;
  ProfilLivreur: undefined;
};

export type DossierStackParamList = {
  ScanCarnet: undefined;
  DossierPatient: { token: string };
  NouvelleConsultation: { id_patient: string; id_carnet: string };
  NouvelleOrdonnance: { id_consultation: string; id_patient: string };
};

export type InterventionsProStackParamList = {
  InterventionsProList: undefined;
  TerminerIntervention: { id: string };
};

export type ProTabParamList = {
  Dossier: NavigatorScreenParams<DossierStackParamList>;
  InterventionsPro: NavigatorScreenParams<InterventionsProStackParamList>;
  ProfilPro: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Patient: NavigatorScreenParams<PatientTabParamList>;
  Livreur: NavigatorScreenParams<LivreurTabParamList>;
  Pro: NavigatorScreenParams<ProTabParamList>;
};
