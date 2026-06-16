import {
  CategorieArticle,
  TypeActe,
  StatutIntervention,
  TypeUtilisateur,
  TypeConsultation,
  StatutConsultation,
} from './enums';

export interface Article {
  id_article: string;
  titre: string;
  contenu: string;
  categorie: CategorieArticle;
  image_url?: string | null;
  statut: string;
  date_publication?: string | null;
  date_creation: string;
  auteur?: { nom: string; prenom: string };
}

export interface Professionnel {
  id_professionnel: string;
  id_utilisateur: string;
  specialite: string;
  structure_exercice: string;
  tarif_consultation?: string | null;
  disponible_domicile: boolean;
  note_moyenne: string;
  statut_verification: string;
  utilisateur?: {
    nom: string;
    prenom: string;
    type_utilisateur?: TypeUtilisateur;
    telephone?: string;
  };
}

export interface Consultation {
  id_consultation: string;
  id_patient: string;
  id_professionnel: string;
  id_carnet: string;
  date_consultation: string;
  motif: string;
  diagnostic?: string | null;
  observations?: string | null;
  type_consultation: TypeConsultation;
  statut: StatutConsultation;
  professionnel?: Professionnel;
  patient?: { utilisateur?: { nom: string; prenom: string } };
  ordonnances?: { id_ordonnance: string }[];
}

export interface Intervention {
  id_intervention: string;
  id_patient: string;
  id_infirmier: string;
  type_acte: TypeActe;
  date_planifiee: string;
  date_effective?: string | null;
  adresse_intervention: string;
  cout_fcfa: string;
  compte_rendu?: string | null;
  statut: StatutIntervention;
  note_patient?: number | null;
  infirmier?: Professionnel;
  patient?: {
    utilisateur?: { nom: string; prenom: string; telephone?: string };
  };
}
