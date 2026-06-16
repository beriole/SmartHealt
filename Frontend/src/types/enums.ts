/** Enums alignés sur le schéma Prisma du backend. */

export type TypeUtilisateur =
  | 'PATIENT'
  | 'MEDECIN'
  | 'PHARMACIEN'
  | 'INFIRMIER'
  | 'LIVREUR'
  | 'TUTEUR'
  | 'ADMIN';

export type Sexe = 'M' | 'F' | 'AUTRE';
export type Langue = 'fr' | 'en';
export type StatutCompte = 'actif' | 'suspendu' | 'desactive' | 'inactif_archive';

export type NiveauUrgence = 'faible' | 'modere' | 'urgent' | 'tres_urgent';

export type TypeLivraison = 'retrait_en_pharmacie' | 'livraison_domicile';
export type ModePaiement = 'mobile_money' | 'especes' | 'carte_bancaire';
export type StatutPaiement = 'en_attente' | 'paye' | 'rembourse' | 'echoue';
export type StatutCommande =
  | 'en_attente'
  | 'confirmee'
  | 'preparee'
  | 'en_livraison'
  | 'livree'
  | 'annulee';

export type StatutOrdonnance = 'active' | 'partiellement_servie' | 'servie' | 'expiree';
export type StatutRappel = 'actif' | 'pause' | 'termine' | 'abandonne';
export type StatutPrise = 'en_attente' | 'prise' | 'manquee' | 'reportee';

export type TypeActe =
  | 'injection'
  | 'pansement'
  | 'prise_sang'
  | 'perfusion'
  | 'autre';
export type StatutIntervention =
  | 'planifiee'
  | 'en_cours'
  | 'terminee'
  | 'annulee';
export type CategorieArticle =
  | 'actualite'
  | 'conseil_medical'
  | 'sensibilisation'
  | 'article_sante';

export type TypeConsultation = 'presentiel' | 'teleconsultation' | 'domicile';
export type StatutConsultation =
  | 'planifiee'
  | 'effectuee'
  | 'annulee'
  | 'no_show';
