import { StatutOrdonnance, StatutPrise, StatutRappel } from './enums';
import { Medicament } from './models';

// ---- Carnet de santé ----
export interface CarnetConsultation {
  id_consultation: string;
  date_consultation: string;
  motif: string;
  diagnostic?: string | null;
  professionnel?: { utilisateur?: { nom: string; prenom: string } } | null;
}

export interface Carnet {
  id_carnet: string;
  id_patient: string;
  qr_code_token: string;
  vaccinations?: unknown;
  date_creation: string;
  derniere_mise_a_jour: string;
  acces_actif: boolean;
  patient?: {
    numero_carnet?: string;
    groupe_sanguin?: string | null;
    allergies_connues?: string | null;
    utilisateur?: {
      nom: string;
      prenom: string;
      sexe?: string;
      date_naissance?: string | null;
    };
  };
  consultations?: CarnetConsultation[];
}

// ---- Ordonnances ----
export interface LigneOrdonnance {
  id_ligne: string;
  id_medicament: string;
  quantite: number;
  duree_traitement_jours: number;
  posologie: string;
  servi: boolean;
  medicament?: Medicament;
}

export interface Ordonnance {
  id_ordonnance: string;
  id_patient: string;
  date_emission: string;
  date_expiration: string;
  statut: StatutOrdonnance;
  notes_pharmacien?: string | null;
  signature_numerique?: string;
  patient?: { utilisateur?: { nom: string; prenom: string } };
  lignes?: LigneOrdonnance[];
}

// ---- Rappels & prises ----
export interface Rappel {
  id_rappel: string;
  id_ordonnance: string;
  id_medicament: string;
  frequence: unknown;
  heure_prise: string[];
  date_debut: string;
  date_fin: string;
  canal_notification: string;
  alerte_tuteur_active: boolean;
  statut: StatutRappel;
  medicament?: Medicament;
}

export interface Prise {
  id_prise: string;
  id_rappel: string;
  date_heure_prevue: string;
  date_heure_reelle?: string | null;
  statut_prise: StatutPrise;
  commentaire?: string | null;
  rappel?: { medicament?: Medicament };
}

export interface StatsObservance {
  total_prises_passees: number;
  prises_effectuees: number;
  prises_manquees: number;
  taux_observance_pourcentage: number;
}
