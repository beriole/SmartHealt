import {
  TypeUtilisateur,
  Sexe,
  Langue,
  StatutCompte,
  TypeLivraison,
  StatutPaiement,
  ModePaiement,
  StatutCommande,
} from './enums';

export interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_utilisateur: TypeUtilisateur;
  date_naissance?: string | null;
  sexe: Sexe;
  photo_profil?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  langue_preferee: Langue;
  statut_compte: StatutCompte;
  date_creation: string;
  derniere_connexion?: string | null;
  email_verifie?: string | null;
}

/** Jetons d'authentification renvoyés par /auth/login et /auth/refresh. */
export interface AuthTokens {
  /** Access token (alias de `accessToken`, conservé pour rétrocompatibilité). */
  token: string;
  accessToken: string;
  refreshToken: string;
}

/** Réponse complète de /auth/login. */
export interface LoginResult extends AuthTokens {
  utilisateur: Utilisateur;
}

export interface Medicament {
  id_medicament: string;
  nom_commercial: string;
  dci: string;
  forme_galenique: string;
  dosage: string;
  categorie: string;
  est_generique: boolean;
  necessite_ordonnance: boolean;
  prix_indicatif_fcfa?: string | null;
  image_url?: string | null;
  statut: string;
}

export interface Pharmacie {
  id_pharmacie: string;
  nom_pharmacie: string;
  adresse: string;
  telephone: string;
  latitude: number;
  longitude: number;
  note_moyenne: string;
  image_url?: string | null;
  livraison_disponible: boolean;
  rayon_livraison_km?: string | null;
  statut: string;
  stocks?: StockItem[];
}

/** Pharmacie partielle renvoyée dans les résultats de recherche de stock. */
export interface PharmacieResume {
  id_pharmacie: string;
  nom_pharmacie: string;
  adresse: string;
  telephone: string;
  note_moyenne: string;
  latitude: number;
  longitude: number;
  livraison_disponible: boolean;
}

/** Une ligne de stock (un médicament disponible dans une pharmacie à un prix). */
export interface StockItem {
  id_stock: string;
  id_pharmacie: string;
  id_medicament: string;
  quantite_disponible: number;
  prix_vente_fcfa: string;
  seuil_alerte?: number;
  date_peremption?: string | null;
  medicament: Medicament;
  pharmacie?: PharmacieResume;
}

export interface LigneCommande {
  id_ligne_cmd: string;
  quantite_commandee: number;
  prix_unitaire_fcfa: string;
  sous_total_fcfa: string;
  stock?: { medicament?: Medicament };
}

/** Patient résumé renvoyé dans une commande (côté pharmacien / livreur). */
export interface PatientResume {
  id_patient: string;
  utilisateur?: { nom: string; prenom: string; telephone?: string };
}

export interface Commande {
  id_commande: string;
  id_patient: string;
  id_pharmacie: string;
  id_ordonnance?: string | null;
  type_livraison: TypeLivraison;
  adresse_livraison?: string | null;
  montant_total_fcfa: string;
  statut_paiement: StatutPaiement;
  mode_paiement?: ModePaiement | null;
  statut_commande: StatutCommande;
  date_commande: string;
  date_livraison_prevue?: string | null;
  date_livraison_effective?: string | null;
  code_validation_livraison?: string | null;
  note_livraison?: number | null;
  note_pharmacie?: number | null;
  patient?: PatientResume;
  pharmacie?: Pharmacie;
  lignes?: LigneCommande[];
}
