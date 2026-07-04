import { Pharmacie } from './models';
import { Professionnel } from './services';

/** Statistiques du tableau de bord médecin / infirmier (GET /professionnels/me). */
export interface ProfessionnelStats {
  consultations_total: number;
  consultations_aujourdhui: number;
  ordonnances_total: number;
}

export interface AgendaConsultation {
  id_consultation: string;
  date_consultation: string;
  motif: string;
  statut: string;
  patient?: { utilisateur?: { nom: string; prenom: string } };
}

/** Réponse de GET /professionnels/me : profil + stats + agenda du jour. */
export interface ProfessionnelMe extends Professionnel {
  numero_ordre?: string | null;
  stats: ProfessionnelStats;
  agenda: AgendaConsultation[];
}

/** Statistiques du tableau de bord pharmacien (GET /pharmacies/mine). */
export interface PharmacieStats {
  commandes_en_attente: number;
  commandes_a_confirmer: number;
  commandes_en_livraison: number;
  ca_jour_fcfa: number;
  nb_references: number;
  nb_alertes: number;
}

/** Réponse de GET /pharmacies/mine : pharmacie + stats. */
export interface PharmacieMine extends Pharmacie {
  numero_autorisation?: string | null;
  horaires_ouverture?: unknown;
  statut_verification?: string;
  stats: PharmacieStats;
}

/** Alertes de stock (GET /stocks/alertes). */
export interface AlertesStock {
  ruptures: {
    id_stock: string;
    medicament: string;
    quantite_disponible: number;
    seuil_alerte: number;
  }[];
  peremptions: {
    id_stock: string;
    medicament: string;
    date_peremption: string;
    deja_perime: boolean;
  }[];
}
