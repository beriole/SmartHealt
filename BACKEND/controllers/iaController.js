const { prisma } = require('../services/database');
const { NotFoundError, ValidationError, ForbiddenError } = require('../errors/AppError');
const { analyseStructuree, formaterContextePatient, MODELE_IA, DISCLAIMER } = require('../services/iaService');
const { predictDiagnostic, predictRisques } = require('../services/mlService');
const { logAction } = require('../services/auditService');

// ============================================================
// Helpers
// ============================================================

/**
 * Résout le patient ciblé : un PATIENT agit sur son propre dossier,
 * un MEDECIN/ADMIN doit fournir id_patient.
 */
async function resoudrePatient(req) {
  if (req.user.type === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!patient) throw new NotFoundError('Profil patient');
    return patient;
  }
  const { id_patient } = req.body;
  if (!id_patient) throw new ValidationError('id_patient est requis pour un professionnel de santé');
  const patient = await prisma.patient.findUnique({ where: { id_patient } });
  if (!patient) throw new NotFoundError('Patient');
  return patient;
}

/**
 * Collecte l'ensemble du contexte médical du patient (carnet, antécédents,
 * traitements en cours, consultations et prescriptions récentes).
 */
async function collecterContexte(id_patient) {
  const patient = await prisma.patient.findUnique({
    where: { id_patient },
    include: {
      utilisateur: { select: { sexe: true, date_naissance: true } },
      carnet: true,
      consultations: {
        take: 10,
        orderBy: { date_consultation: 'desc' },
        select: { date_consultation: true, motif: true, diagnostic: true, codes_cim10: true },
      },
      ordonnances: {
        take: 5,
        orderBy: { date_emission: 'desc' },
        include: { lignes: { include: { medicament: true } } },
      },
      rappels: {
        where: { statut: 'actif' },
        include: { medicament: true },
      },
    },
  });

  return {
    utilisateur: patient.utilisateur,
    groupe_sanguin: patient.groupe_sanguin,
    poids_kg: patient.poids_kg,
    taille_cm: patient.taille_cm,
    allergies_connues: patient.allergies_connues,
    antecedents_medicaux: patient.antecedents_medicaux,
    maladies_chroniques: patient.maladies_chroniques,
    vaccinations: patient.carnet?.vaccinations || null,
    traitements_en_cours: patient.rappels.map(r => ({
      medicament: r.medicament.nom_commercial,
      dci: r.medicament.dci,
      date_debut: r.date_debut?.toISOString().slice(0, 10),
      date_fin: r.date_fin?.toISOString().slice(0, 10),
    })),
    consultations_recentes: patient.consultations.map(c => ({
      date: c.date_consultation?.toISOString().slice(0, 10),
      motif: c.motif,
      diagnostic: c.diagnostic,
      codes_cim10: c.codes_cim10,
    })),
    ordonnances_recentes: patient.ordonnances.map(o => ({
      date: o.date_emission?.toISOString().slice(0, 10),
      medicaments: o.lignes.map(l => `${l.medicament.nom_commercial} (${l.posologie})`),
    })),
  };
}

async function sauvegarderAnalyse({ id_patient, type_analyse, donnees_entree, resultat, modele_ia = MODELE_IA }) {
  return prisma.analyseIa.create({
    data: { id_patient, type_analyse, donnees_entree, resultat, modele_ia },
  });
}

/**
 * Médicaments actifs réellement en stock sur la plateforme, avec la liste des
 * pharmacies qui les détiennent (triées par prix croissant).
 * Sert à la fois pour la recommandation de traitements et le diagnostic enrichi.
 */
async function getMedicamentsDisponibles(limit = 100) {
  return prisma.medicament.findMany({
    where: {
      statut: 'actif',
      stocks: { some: { quantite_disponible: { gt: 0 }, pharmacie: { statut: 'active' } } },
    },
    take: limit,
    select: {
      id_medicament: true,
      nom_commercial: true,
      dci: true,
      forme_galenique: true,
      dosage: true,
      categorie: true,
      necessite_ordonnance: true,
      stocks: {
        where: { quantite_disponible: { gt: 0 }, pharmacie: { statut: 'active' } },
        orderBy: { prix_vente_fcfa: 'asc' },
        select: {
          id_stock: true,
          prix_vente_fcfa: true,
          quantite_disponible: true,
          pharmacie: { select: { id_pharmacie: true, nom_pharmacie: true, adresse: true, telephone: true, latitude: true, longitude: true } },
        },
      },
    },
  });
}

/** Construit le bloc catalogue (texte) injecté dans le prompt IA. */
function catalogueTexte(medicaments) {
  return medicaments
    .map(m => `- id: ${m.id_medicament} | ${m.nom_commercial} | DCI: ${m.dci} | ${m.forme_galenique} ${m.dosage} | ${m.categorie} | ordonnance: ${m.necessite_ordonnance ? 'oui' : 'non'}`)
    .join('\n');
}

/** Top-N pharmacies (les moins chères) détenant un médicament donné. */
function disponibilitePharmacies(medicament, max = 3) {
  return (medicament.stocks || []).slice(0, max).map(s => ({
    id_stock: s.id_stock,
    id_pharmacie: s.pharmacie.id_pharmacie,
    pharmacie: s.pharmacie.nom_pharmacie,
    adresse: s.pharmacie.adresse,
    telephone: s.pharmacie.telephone,
    prix_fcfa: s.prix_vente_fcfa,
    quantite_disponible: s.quantite_disponible,
  }));
}

// ============================================================
// 1. Analyse de compatibilité d'un médicament avec le profil patient
// ============================================================

const SCHEMA_COMPATIBILITE = {
  type: 'object',
  properties: {
    niveau_compatibilite: {
      type: 'string',
      enum: ['compatible', 'compatible_avec_precautions', 'non_recommande', 'dangereux'],
    },
    score_risque: { type: 'integer', description: 'Score de risque de 0 (aucun) à 100 (critique)' },
    contre_indications: { type: 'array', items: { type: 'string' } },
    interactions_medicamenteuses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          medicament_concerne: { type: 'string' },
          description: { type: 'string' },
          severite: { type: 'string', enum: ['faible', 'moderee', 'grave'] },
        },
        required: ['medicament_concerne', 'description', 'severite'],
        additionalProperties: false,
      },
    },
    effets_secondaires_a_risque: { type: 'array', items: { type: 'string' } },
    precautions: { type: 'array', items: { type: 'string' } },
    rapport_detaille: { type: 'string', description: 'Rapport complet en français expliquant les risques détectés' },
  },
  required: ['niveau_compatibilite', 'score_risque', 'contre_indications', 'interactions_medicamenteuses', 'effets_secondaires_a_risque', 'precautions', 'rapport_detaille'],
  additionalProperties: false,
};

exports.compatibiliteMedicament = async (req, res, next) => {
  try {
    const { id_medicament } = req.body;
    if (!id_medicament) throw new ValidationError('id_medicament est requis');

    const patient = await resoudrePatient(req);
    const medicament = await prisma.medicament.findUnique({ where: { id_medicament } });
    if (!medicament) throw new NotFoundError('Médicament');

    const contexte = await collecterContexte(patient.id_patient);

    const resultat = await analyseStructuree({
      system: "Tu es un assistant pharmacologique expert intégré à la plateforme de santé SmartHealth (contexte : Afrique centrale, Cameroun). Tu analyses la compatibilité d'un médicament avec le dossier médical complet d'un patient : allergies, antécédents, maladies chroniques, traitements en cours et interactions médicamenteuses. Tu es prudent : en cas de doute, tu privilégies la sécurité du patient et recommandes l'avis d'un professionnel.",
      prompt: `${formaterContextePatient(contexte)}

## Médicament à évaluer
- Nom commercial : ${medicament.nom_commercial}
- DCI (principe actif) : ${medicament.dci}
- Forme galénique : ${medicament.forme_galenique}
- Dosage : ${medicament.dosage}
- Catégorie : ${medicament.categorie}
- Nécessite une ordonnance : ${medicament.necessite_ordonnance ? 'oui' : 'non'}

Analyse la compatibilité de ce médicament avec ce patient : contre-indications, interactions avec ses traitements en cours, risques d'effets secondaires graves compte tenu de son profil. Rends un rapport détaillé en français.`,
      schema: SCHEMA_COMPATIBILITE,
    });

    const analyse = await sauvegarderAnalyse({
      id_patient: patient.id_patient,
      type_analyse: 'compatibilite_medicament',
      donnees_entree: { id_medicament, nom: medicament.nom_commercial },
      resultat,
    });

    logAction({ id_utilisateur: req.user.id, action: 'IA_COMPATIBILITE', ressource: 'analyse_ia', id_ressource: analyse.id_analyse, req });

    res.json({ success: true, data: { id_analyse: analyse.id_analyse, medicament: medicament.nom_commercial, ...resultat, disclaimer: DISCLAIMER } });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 2. Analyse prédictive du carnet médical
// ============================================================

const SCHEMA_PREDICTIF = {
  type: 'object',
  properties: {
    risques_identifies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          maladie: { type: 'string' },
          niveau_risque: { type: 'string', enum: ['faible', 'modere', 'eleve', 'tres_eleve'] },
          justification: { type: 'string' },
        },
        required: ['maladie', 'niveau_risque', 'justification'],
        additionalProperties: false,
      },
    },
    tendances_inquietantes: { type: 'array', items: { type: 'string' } },
    recommandations_preventives: { type: 'array', items: { type: 'string' } },
    examens_suggeres: { type: 'array', items: { type: 'string' } },
    synthese: { type: 'string', description: 'Synthèse globale en français de l\'état de santé et des risques' },
  },
  required: ['risques_identifies', 'tendances_inquietantes', 'recommandations_preventives', 'examens_suggeres', 'synthese'],
  additionalProperties: false,
};

exports.analysePredictive = async (req, res, next) => {
  try {
    const patient = await resoudrePatient(req);
    const contexte = await collecterContexte(patient.id_patient);
    const { antecedents_familiaux, habitudes_de_vie,
            glucose, tension_systolique, cholesterol, fumeur,
            antecedent_familial_diabete, antecedent_familial_cardiaque, hypertension } = req.body;

    // Étape 1 : les modèles de risque internes (RandomForest) estiment les probabilités
    // de diabète et de maladie cardiovasculaire à partir du profil clinique.
    const u = contexte.utilisateur || {};
    const age = u.date_naissance
      ? Math.floor((Date.now() - new Date(u.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;
    const predictionRisque = await predictRisques({
      age,
      sexe: u.sexe,
      poids_kg: contexte.poids_kg != null ? Number(contexte.poids_kg) : null,
      taille_cm: contexte.taille_cm,
      glucose, tension_systolique, cholesterol, fumeur,
      antecedent_familial_diabete, antecedent_familial_cardiaque, hypertension,
    });

    let blocRisque = '';
    if (predictionRisque?.risques?.length) {
      const lignes = predictionRisque.risques
        .map(r => `- Risque de ${r.type} : ${r.probabilite_pourcent}% (niveau ${r.niveau})${r.facteurs_contributifs?.length ? ' — facteurs : ' + r.facteurs_contributifs.join(', ') : ''}`)
        .join('\n');
      blocRisque = `\n## Estimation des modèles de risque internes (${predictionRisque.version})
Ces scores chiffrés proviennent de nos modèles entraînés. Intègre-les explicitement dans ton analyse et explique-les ; reste cohérent avec eux.
${lignes}`;
    }

    const resultat = await analyseStructuree({
      system: "Tu es un assistant de médecine préventive intégré à la plateforme SmartHealth (contexte : Afrique centrale, Cameroun — prends en compte les pathologies prévalentes localement : paludisme, typhoïde, hypertension, diabète, drépanocytose…). À partir du carnet médical complet d'un patient et, lorsqu'elles sont fournies, des estimations chiffrées de modèles de risque internes, tu identifies les risques de santé potentiels et les tendances inquiétantes, et tu proposes des recommandations préventives concrètes.",
      prompt: `${formaterContextePatient(contexte)}
${antecedents_familiaux ? `\n## Antécédents familiaux déclarés\n${antecedents_familiaux}` : ''}
${habitudes_de_vie ? `\n## Habitudes de vie déclarées\n${habitudes_de_vie}` : ''}
${blocRisque}

Réalise une analyse préventive complète : risques potentiels (diabète, hypertension, risque cardiovasculaire, obésité, complications chroniques, etc.), tendances inquiétantes dans l'historique, et recommandations préventives adaptées au contexte camerounais.`,
      schema: SCHEMA_PREDICTIF,
    });

    const modeleUtilise = predictionRisque ? `${predictionRisque.version} + ${MODELE_IA}` : MODELE_IA;

    const analyse = await sauvegarderAnalyse({
      id_patient: patient.id_patient,
      type_analyse: 'analyse_predictive',
      donnees_entree: { antecedents_familiaux: antecedents_familiaux || null, habitudes_de_vie: habitudes_de_vie || null },
      resultat,
      modele_ia: modeleUtilise,
    });

    logAction({ id_utilisateur: req.user.id, action: 'IA_ANALYSE_PREDICTIVE', ressource: 'analyse_ia', id_ressource: analyse.id_analyse, req });

    res.json({
      success: true,
      data: {
        id_analyse: analyse.id_analyse,
        scores_ml: predictionRisque?.risques || null,
        ...resultat,
        disclaimer: DISCLAIMER,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 3. Diagnostic intelligent à partir des symptômes (triage IA réel)
// ============================================================

const SCHEMA_DIAGNOSTIC = {
  type: 'object',
  properties: {
    maladies_probables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          maladie: { type: 'string' },
          probabilite_pourcent: { type: 'integer', description: 'Probabilité estimée en pourcentage (la somme doit approcher 100)' },
          justification: { type: 'string' },
        },
        required: ['maladie', 'probabilite_pourcent', 'justification'],
        additionalProperties: false,
      },
    },
    niveau_urgence: { type: 'string', enum: ['faible', 'modere', 'urgent', 'tres_urgent'] },
    specialite_recommandee: { type: 'string' },
    consultation_obligatoire: { type: 'boolean', description: "true si une consultation médicale est indispensable avant toute automédication (cas graves, urgents, ou diagnostic incertain)" },
    conduite_a_tenir: {
      type: 'array',
      items: { type: 'string' },
      description: 'Mesures non médicamenteuses et attitudes à adopter (repos, hydratation, alimentation, hygiène, surveillance…)',
    },
    conseils_immediats: { type: 'array', items: { type: 'string' } },
    traitements_recommandes: {
      type: 'array',
      description: 'Traitements proposés UNIQUEMENT parmi les médicaments disponibles fournis (recopier l\'id exact). Vide si consultation obligatoire ou aucun médicament adapté.',
      items: {
        type: 'object',
        properties: {
          id_medicament: { type: 'string', description: 'Identifiant exact du médicament dans la liste fournie' },
          nom_medicament: { type: 'string' },
          posologie_suggeree: { type: 'string' },
          duree_traitement_jours: { type: 'integer' },
          necessite_ordonnance: { type: 'boolean' },
          precautions: { type: 'array', items: { type: 'string' } },
          justification: { type: 'string' },
        },
        required: ['id_medicament', 'nom_medicament', 'posologie_suggeree', 'duree_traitement_jours', 'necessite_ordonnance', 'precautions', 'justification'],
        additionalProperties: false,
      },
    },
    signes_alarme: { type: 'array', items: { type: 'string' }, description: 'Signes qui doivent amener à consulter en urgence' },
    rapport_preliminaire: { type: 'string', description: 'Rapport médical préliminaire en français' },
  },
  required: ['maladies_probables', 'niveau_urgence', 'specialite_recommandee', 'consultation_obligatoire', 'conduite_a_tenir', 'conseils_immediats', 'traitements_recommandes', 'signes_alarme', 'rapport_preliminaire'],
  additionalProperties: false,
};

exports.diagnostic = async (req, res, next) => {
  try {
    const { symptomes, duree, intensite, mode_saisie, langue } = req.body;
    if (!Array.isArray(symptomes) || symptomes.length === 0) {
      throw new ValidationError('symptomes (tableau non vide) est requis');
    }

    const patient = await resoudrePatient(req);
    const contexte = await collecterContexte(patient.id_patient);

    // Étape 1 : le modèle ML interne (RandomForest) estime les probabilités.
    // S'il est indisponible, on bascule sur le LLM seul (dégradation gracieuse).
    const predictionMl = await predictDiagnostic(symptomes, 5);

    let blocMl = '';
    if (predictionMl?.maladies_probables?.length) {
      const lignes = predictionMl.maladies_probables
        .map(m => `- ${m.maladie} : ${m.probabilite_pourcent}% (urgence ${m.niveau_urgence}, spécialité ${m.specialite})`)
        .join('\n');
      blocMl = `\n## Estimation du modèle de Machine Learning interne (${predictionMl.version})
Ces probabilités ont été calculées par notre modèle entraîné sur des profils cliniques. Utilise-les comme base de référence ; tu peux les nuancer en fonction du dossier du patient mais reste cohérent avec elles.
${lignes}
${predictionMl.symptomes_inconnus?.length ? `\n(Symptômes non reconnus par le modèle, à intégrer par ton analyse : ${predictionMl.symptomes_inconnus.join(', ')})` : ''}`;
    }

    // Étape 2 : on fournit à l'IA le catalogue des médicaments réellement en stock,
    // pour qu'elle puisse proposer des traitements achetables sur la plateforme.
    const medicamentsDisponibles = await getMedicamentsDisponibles(100);
    const blocCatalogue = medicamentsDisponibles.length
      ? `\n## Médicaments disponibles sur la plateforme (pour la rubrique "traitements_recommandes", recopie UNIQUEMENT des id de cette liste)\n${catalogueTexte(medicamentsDisponibles)}`
      : "\n## Médicaments disponibles\nAucun médicament en stock sur la plateforme actuellement : laisse \"traitements_recommandes\" vide et oriente vers une consultation/pharmacie.";

    const resultat = await analyseStructuree({
      system: "Tu es un assistant de triage médical intégré à la plateforme SmartHealth (contexte : Afrique centrale, Cameroun — pense aux pathologies prévalentes : paludisme, typhoïde, infections respiratoires, parasitoses…). À partir des symptômes décrits, du dossier du patient et, lorsqu'elle est fournie, de l'estimation d'un modèle de Machine Learning interne, tu identifies les maladies probables, le niveau d'urgence, la conduite à tenir (mesures non médicamenteuses) et les traitements médicamenteux adaptés — UNIQUEMENT parmi les médicaments disponibles sur la plateforme fournis. RÈGLE IMPORTANTE : tu proposes TOUJOURS les traitements pertinents de la liste pour la maladie la plus probable (au moins le traitement de référence + un antalgique/antipyrétique si la fièvre est présente), même quand consultation_obligatoire est true. Le champ consultation_obligatoire (true pour les cas graves/urgents : paludisme, typhoïde, méningite, pneumonie, doute) signale au patient qu'il doit faire valider le traitement par un médecin ou via une ordonnance — il ne supprime PAS la proposition. Tu marques chaque médicament avec necessite_ordonnance et tu vérifies les contre-indications avec les allergies et traitements en cours du patient. Tu ne laisses traitements_recommandes vide QUE si aucun médicament de la liste n'est pertinent pour la pathologie. Tu rappelles systématiquement qu'il s'agit d'une aide au diagnostic, non d'un diagnostic médical définitif.",
      prompt: `${formaterContextePatient(contexte)}

## Symptômes déclarés
- Symptômes : ${symptomes.join(', ')}
- Durée : ${duree || 'non précisée'}
- Intensité : ${intensite || 'non précisée'}
${blocMl}
${blocCatalogue}

Réalise une analyse complète : (1) maladies probables avec probabilité, (2) niveau d'urgence et spécialité, (3) conduite à tenir non médicamenteuse, (4) traitements recommandés parmi les médicaments disponibles ci-dessus (en vérifiant les contre-indications du patient), (5) signes d'alarme, (6) rapport préliminaire. Si une consultation est indispensable avant toute automédication, mets consultation_obligatoire à true.`,
      schema: SCHEMA_DIAGNOSTIC,
    });

    // Garde-fou : on ne garde que les traitements dont l'id existe réellement,
    // et on y attache les pharmacies qui les détiennent (nom, prix, stock).
    const medById = new Map(medicamentsDisponibles.map(m => [m.id_medicament, m]));
    resultat.traitements_recommandes = (resultat.traitements_recommandes || [])
      .filter(t => medById.has(t.id_medicament))
      .map(t => ({
        ...t,
        disponibilite_pharmacies: disponibilitePharmacies(medById.get(t.id_medicament)),
      }));

    // Trace du ou des modèles ayant produit l'analyse
    const modeleUtilise = predictionMl ? `${predictionMl.version} + ${MODELE_IA}` : MODELE_IA;

    // Le diagnostic IA alimente le module de triage existant
    const triage = await prisma.triageIa.create({
      data: {
        id_patient: patient.id_patient,
        symptomes_declares: { symptomes, duree: duree || null, intensite: intensite || null },
        resultats_analyse: resultat.maladies_probables,
        recommandation: resultat.rapport_preliminaire,
        niveau_urgence: resultat.niveau_urgence,
        specialite_recommandee: resultat.specialite_recommandee,
        langue_session: langue === 'en' ? 'en' : 'fr',
        mode_saisie: mode_saisie === 'vocal' ? 'vocal' : 'texte',
      },
    });

    const analyse = await sauvegarderAnalyse({
      id_patient: patient.id_patient,
      type_analyse: 'diagnostic',
      donnees_entree: { symptomes, duree: duree || null, intensite: intensite || null },
      resultat,
      modele_ia: modeleUtilise,
    });

    logAction({ id_utilisateur: req.user.id, action: 'IA_DIAGNOSTIC', ressource: 'analyse_ia', id_ressource: analyse.id_analyse, req });

    res.json({
      success: true,
      data: {
        id_analyse: analyse.id_analyse,
        id_triage: triage.id_triage,
        modele_utilise: modeleUtilise,
        estimation_ml: predictionMl?.maladies_probables || null,
        ...resultat,
        disclaimer: DISCLAIMER,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 4. Recommandation automatique de traitements (médicaments de la plateforme)
// ============================================================

const SCHEMA_TRAITEMENT = {
  type: 'object',
  properties: {
    recommandations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id_medicament: { type: 'string', description: 'Identifiant du médicament choisi dans la liste fournie' },
          nom_medicament: { type: 'string' },
          posologie_suggeree: { type: 'string' },
          duree_traitement_jours: { type: 'integer' },
          precautions: { type: 'array', items: { type: 'string' } },
          necessite_ordonnance: { type: 'boolean' },
          justification: { type: 'string' },
        },
        required: ['id_medicament', 'nom_medicament', 'posologie_suggeree', 'duree_traitement_jours', 'precautions', 'necessite_ordonnance', 'justification'],
        additionalProperties: false,
      },
    },
    contre_indications_detectees: { type: 'array', items: { type: 'string' } },
    avertissements: { type: 'array', items: { type: 'string' } },
    conseil_general: { type: 'string' },
  },
  required: ['recommandations', 'contre_indications_detectees', 'avertissements', 'conseil_general'],
  additionalProperties: false,
};

exports.recommandationTraitement = async (req, res, next) => {
  try {
    const { maladie, id_analyse } = req.body;

    const patient = await resoudrePatient(req);

    // La pathologie cible vient soit du champ "maladie", soit d'un diagnostic IA précédent
    let pathologie = maladie;
    if (!pathologie && id_analyse) {
      const diag = await prisma.analyseIa.findUnique({ where: { id_analyse } });
      if (!diag || diag.id_patient !== patient.id_patient) throw new NotFoundError('Analyse de diagnostic');
      pathologie = diag.resultat?.maladies_probables?.[0]?.maladie;
    }
    if (!pathologie) throw new ValidationError('Fournissez "maladie" ou "id_analyse" (diagnostic IA précédent)');

    // Médicaments réellement disponibles sur la plateforme (stock > 0)
    const medicamentsDisponibles = await getMedicamentsDisponibles(100);

    if (medicamentsDisponibles.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun médicament en stock sur la plateforme actuellement.' });
    }

    const contexte = await collecterContexte(patient.id_patient);

    const catalogue = catalogueTexte(medicamentsDisponibles);

    const resultat = await analyseStructuree({
      system: "Tu es un assistant thérapeutique intégré à la plateforme SmartHealth. À partir d'un diagnostic et du dossier complet du patient (allergies, traitements en cours, maladies chroniques), tu recommandes des traitements UNIQUEMENT parmi les médicaments disponibles sur la plateforme (liste fournie, avec leurs identifiants exacts). Tu vérifies les contre-indications, les allergies et les interactions avant de recommander. Si aucun médicament de la liste n'est adapté ou si la pathologie exige impérativement une consultation, tu le dis clairement dans les avertissements et tu peux rendre une liste de recommandations vide.",
      prompt: `${formaterContextePatient(contexte)}

## Pathologie à traiter
${pathologie}

## Médicaments disponibles sur la plateforme (choisis UNIQUEMENT dans cette liste, en recopiant l'id exact)
${catalogue}

Recommande le ou les traitements adaptés (posologie, durée, précautions), en vérifiant les contre-indications avec le profil du patient.`,
      schema: SCHEMA_TRAITEMENT,
    });

    // Garde-fou : on ne conserve que les recommandations dont l'id existe vraiment,
    // et on attache les pharmacies qui détiennent chaque médicament.
    const medById = new Map(medicamentsDisponibles.map(m => [m.id_medicament, m]));
    resultat.recommandations = (resultat.recommandations || [])
      .filter(r => medById.has(r.id_medicament))
      .map(r => ({ ...r, disponibilite_pharmacies: disponibilitePharmacies(medById.get(r.id_medicament)) }));

    const analyse = await sauvegarderAnalyse({
      id_patient: patient.id_patient,
      type_analyse: 'recommandation_traitement',
      donnees_entree: { pathologie, id_analyse: id_analyse || null },
      resultat,
    });

    logAction({ id_utilisateur: req.user.id, action: 'IA_RECOMMANDATION_TRAITEMENT', ressource: 'analyse_ia', id_ressource: analyse.id_analyse, req });

    res.json({ success: true, data: { id_analyse: analyse.id_analyse, pathologie, ...resultat, disclaimer: DISCLAIMER } });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 5. Médecine traditionnelle et traitements naturels
// ============================================================

const SCHEMA_TRADITIONNEL = {
  type: 'object',
  properties: {
    remedes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          plantes_utilisees: { type: 'array', items: { type: 'string' } },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                quantite: { type: 'string' },
              },
              required: ['nom', 'quantite'],
              additionalProperties: false,
            },
          },
          preparation: { type: 'string', description: 'Méthode de préparation détaillée' },
          mode_utilisation: { type: 'string' },
          frequence: { type: 'string' },
          duree: { type: 'string' },
          precautions: { type: 'array', items: { type: 'string' } },
          contre_indications: { type: 'array', items: { type: 'string' } },
        },
        required: ['nom', 'plantes_utilisees', 'ingredients', 'preparation', 'mode_utilisation', 'frequence', 'duree', 'precautions', 'contre_indications'],
        additionalProperties: false,
      },
    },
    quand_consulter: { type: 'array', items: { type: 'string' }, description: 'Situations où la médecine traditionnelle ne suffit pas' },
    avertissement: { type: 'string' },
  },
  required: ['remedes', 'quand_consulter', 'avertissement'],
  additionalProperties: false,
};

exports.medecineTraditionnelle = async (req, res, next) => {
  try {
    const { symptomes, maladie } = req.body;
    if ((!Array.isArray(symptomes) || symptomes.length === 0) && !maladie) {
      throw new ValidationError('Fournissez "symptomes" (tableau) ou "maladie"');
    }

    const patient = await resoudrePatient(req);
    const contexte = await collecterContexte(patient.id_patient);

    const resultat = await analyseStructuree({
      system: "Tu es un assistant en phytothérapie et médecine traditionnelle africaine intégré à la plateforme SmartHealth (contexte : Cameroun / Afrique centrale). Tu proposes des remèdes naturels validés et sans danger à base de plantes médicinales reconnues (gingembre, citron, moringa, neem, ail, citronnelle, kinkeliba, artemisia, etc.) : ingrédients précis avec quantités, préparation, fréquence et précautions. Tu restes prudent : tu signales toujours les limites de ces remèdes, leurs contre-indications (grossesse, enfants, maladies chroniques, interactions avec les traitements en cours du patient) et les situations imposant une consultation médicale.",
      prompt: `${formaterContextePatient(contexte)}

## Demande
${maladie ? `Pathologie ciblée : ${maladie}` : ''}
${symptomes?.length ? `Symptômes : ${symptomes.join(', ')}` : ''}

Propose des remèdes traditionnels adaptés et sûrs pour ce patient, avec les ingrédients, quantités précises, méthode de préparation, fréquence d'utilisation et précautions d'emploi.`,
      schema: SCHEMA_TRADITIONNEL,
    });

    const analyse = await sauvegarderAnalyse({
      id_patient: patient.id_patient,
      type_analyse: 'medecine_traditionnelle',
      donnees_entree: { symptomes: symptomes || null, maladie: maladie || null },
      resultat,
    });

    logAction({ id_utilisateur: req.user.id, action: 'IA_MEDECINE_TRADITIONNELLE', ressource: 'analyse_ia', id_ressource: analyse.id_analyse, req });

    res.json({ success: true, data: { id_analyse: analyse.id_analyse, ...resultat, disclaimer: DISCLAIMER } });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Historique des analyses IA du patient
// ============================================================

exports.getHistorique = async (req, res, next) => {
  try {
    const patient = await resoudrePatient(req);
    const { type_analyse, page = 1, limit = 20 } = req.query;

    const where = { id_patient: patient.id_patient };
    if (type_analyse) where.type_analyse = type_analyse;

    const [data, total] = await Promise.all([
      prisma.analyseIa.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_analyse: 'desc' },
      }),
      prisma.analyseIa.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getAnalyseById = async (req, res, next) => {
  try {
    const analyse = await prisma.analyseIa.findUnique({
      where: { id_analyse: req.params.id },
      include: { patient: { select: { id_utilisateur: true } } },
    });
    if (!analyse) throw new NotFoundError('Analyse IA');

    if (req.user.type === 'PATIENT' && analyse.patient.id_utilisateur !== req.user.id) {
      throw new ForbiddenError('Cette analyse ne vous appartient pas');
    }

    res.json({ success: true, data: analyse });
  } catch (error) {
    next(error);
  }
};
