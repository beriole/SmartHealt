import { NiveauUrgence } from './enums';

/** Disponibilité d'un médicament recommandé dans une pharmacie. */
export interface DispoPharmacie {
  id_stock: string;
  id_pharmacie: string;
  pharmacie: string;
  adresse: string;
  telephone: string;
  prix_fcfa: string;
  quantite_disponible: number;
}

export interface MaladieProbable {
  maladie: string;
  probabilite_pourcent: number;
  justification: string;
}

export interface TraitementRecommande {
  id_medicament: string;
  nom_medicament: string;
  posologie_suggeree: string;
  duree_traitement_jours: number;
  necessite_ordonnance: boolean;
  precautions: string[];
  justification: string;
  disponibilite_pharmacies?: DispoPharmacie[];
}

/** Résultat de POST /ia/diagnostic. */
export interface DiagnosticResult {
  id_analyse: string;
  id_triage: string;
  modele_utilise?: string;
  maladies_probables: MaladieProbable[];
  niveau_urgence: NiveauUrgence;
  specialite_recommandee: string;
  consultation_obligatoire: boolean;
  conduite_a_tenir: string[];
  conseils_immediats: string[];
  traitements_recommandes: TraitementRecommande[];
  signes_alarme: string[];
  rapport_preliminaire: string;
  disclaimer?: string;
}

export type NiveauCompatibilite =
  | 'compatible'
  | 'compatible_avec_precautions'
  | 'non_recommande'
  | 'dangereux';

export interface InteractionMedicamenteuse {
  medicament_concerne: string;
  description: string;
  severite: 'faible' | 'moderee' | 'grave';
}

/** Résultat de POST /ia/compatibilite-medicament. */
export interface CompatibiliteResult {
  id_analyse: string;
  medicament: string;
  niveau_compatibilite: NiveauCompatibilite;
  score_risque: number;
  contre_indications: string[];
  interactions_medicamenteuses: InteractionMedicamenteuse[];
  effets_secondaires_a_risque: string[];
  precautions: string[];
  rapport_detaille: string;
  disclaimer?: string;
}

export interface IngredientRemede {
  nom: string;
  quantite: string;
}

export interface RemedeTraditionnel {
  nom: string;
  plantes_utilisees: string[];
  ingredients: IngredientRemede[];
  preparation: string;
  mode_utilisation: string;
  frequence: string;
  duree: string;
  precautions: string[];
  contre_indications: string[];
}

/** Résultat de POST /ia/medecine-traditionnelle. */
export interface MedecineTraditionnelleResult {
  id_analyse: string;
  remedes: RemedeTraditionnel[];
  quand_consulter: string[];
  avertissement: string;
  disclaimer?: string;
}

export type TypeAnalyseIa =
  | 'compatibilite_medicament'
  | 'analyse_predictive'
  | 'diagnostic'
  | 'recommandation_traitement'
  | 'medecine_traditionnelle';

/** Entrée d'historique (GET /ia/historique, GET /ia/analyses/:id). */
export interface AnalyseIa {
  id_analyse: string;
  id_patient: string;
  type_analyse: TypeAnalyseIa;
  donnees_entree: Record<string, unknown>;
  resultat: Record<string, unknown>;
  modele_ia: string;
  date_analyse: string;
}
