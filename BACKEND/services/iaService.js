const Groq = require('groq-sdk');
const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger');

// Modèle Groq par défaut : Llama 3.3 70B (gratuit, rapide, bon en français).
// Surchargez via GROQ_MODEL dans le .env si besoin.
const MODELE_IA = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let client = null;
function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError(
      "Le module IA n'est pas configuré : la variable d'environnement GROQ_API_KEY est manquante. Créez une clé gratuite sur https://console.groq.com.",
      503,
      'IA_NON_CONFIGUREE'
    );
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const DISCLAIMER = "⚠️ Cette analyse est générée par une intelligence artificielle à titre d'aide à la décision. Elle ne remplace en aucun cas un avis, un diagnostic ou une prescription émis par un professionnel de santé qualifié. En cas d'urgence, contactez immédiatement un médecin ou les services d'urgence.";

/**
 * Validation légère du résultat contre le JSON Schema fourni :
 * vérifie la présence des champs requis au premier niveau.
 */
function verifierChampsRequis(objet, schema) {
  const manquants = (schema.required || []).filter(champ => objet[champ] === undefined);
  if (manquants.length > 0) {
    throw new Error(`Champs manquants dans la réponse IA : ${manquants.join(', ')}`);
  }
}

/**
 * Appel générique à l'IA (Groq) avec sortie JSON structurée.
 * Le schéma est imposé via le mode JSON natif de Groq + injection du schéma
 * dans le prompt système, puis validé côté serveur.
 *
 * @param {object} opts
 * @param {string} opts.system  Prompt système (rôle de l'IA)
 * @param {string} opts.prompt  Contenu utilisateur (contexte médical + question)
 * @param {object} opts.schema  JSON Schema de la réponse attendue
 * @returns {object} L'objet JSON conforme au schéma
 */
async function analyseStructuree({ system, prompt, schema }) {
  const groq = getClient();

  const systemComplet = `${system}

Tu réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte autour), strictement conforme à ce JSON Schema :
${JSON.stringify(schema, null, 2)}

Toutes les valeurs textuelles doivent être rédigées en français.`;

  let derniereErreur = null;

  // Jusqu'à 2 tentatives : les modèles open-source peuvent occasionnellement
  // produire un JSON incomplet ; on redemande une fois avant d'abandonner.
  for (let tentative = 1; tentative <= 2; tentative++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODELE_IA,
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemComplet },
          { role: 'user', content: prompt },
        ],
      });

      const texte = completion.choices?.[0]?.message?.content;
      if (!texte) throw new Error('Réponse IA vide');

      const resultat = JSON.parse(texte);
      verifierChampsRequis(resultat, schema);
      return resultat;
    } catch (error) {
      derniereErreur = error;
      logger.warn(`Tentative IA ${tentative}/2 échouée : ${error.message}`);

      // Erreurs API non récupérables : on remonte immédiatement
      if (error.status === 401) {
        throw new AppError('Clé GROQ_API_KEY invalide.', 503, 'IA_NON_CONFIGUREE');
      }
      if (error.status === 429) {
        throw new AppError("Quota IA temporairement dépassé (limite gratuite Groq). Réessayez dans quelques instants.", 429, 'IA_QUOTA');
      }
    }
  }

  logger.error(`Échec analyse IA après 2 tentatives : ${derniereErreur?.message}`);
  throw new AppError("La réponse de l'IA n'a pas pu être interprétée. Réessayez.", 502, 'IA_REPONSE_INVALIDE');
}

/**
 * Formate le contexte médical d'un patient en texte structuré pour l'IA.
 */
function formaterContextePatient(contexte) {
  const u = contexte.utilisateur || {};
  const age = u.date_naissance
    ? Math.floor((Date.now() - new Date(u.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const lignes = [
    '## Profil du patient',
    `- Sexe : ${u.sexe || 'inconnu'}`,
    `- Âge : ${age != null ? age + ' ans' : 'inconnu'}`,
    `- Groupe sanguin : ${contexte.groupe_sanguin || 'inconnu'}`,
    `- Poids : ${contexte.poids_kg ? contexte.poids_kg + ' kg' : 'inconnu'}`,
    `- Taille : ${contexte.taille_cm ? contexte.taille_cm + ' cm' : 'inconnue'}`,
    `- Allergies connues : ${contexte.allergies_connues || 'aucune renseignée'}`,
    `- Antécédents médicaux : ${contexte.antecedents_medicaux || 'aucun renseigné'}`,
    `- Maladies chroniques : ${contexte.maladies_chroniques ? JSON.stringify(contexte.maladies_chroniques) : 'aucune renseignée'}`,
  ];

  if (contexte.vaccinations) {
    lignes.push(`- Vaccinations : ${JSON.stringify(contexte.vaccinations)}`);
  }

  if (contexte.traitements_en_cours?.length) {
    lignes.push('', '## Traitements en cours (rappels actifs)');
    for (const t of contexte.traitements_en_cours) {
      lignes.push(`- ${t.medicament} (${t.dci || 'DCI inconnue'}) — du ${t.date_debut} au ${t.date_fin}`);
    }
  } else {
    lignes.push('', '## Traitements en cours', '- Aucun traitement actif enregistré');
  }

  if (contexte.consultations_recentes?.length) {
    lignes.push('', '## Historique des consultations (les plus récentes)');
    for (const c of contexte.consultations_recentes) {
      lignes.push(`- ${c.date} | Motif : ${c.motif} | Diagnostic : ${c.diagnostic || 'non renseigné'} | CIM-10 : ${(c.codes_cim10 || []).join(', ') || 'n/a'}`);
    }
  }

  if (contexte.ordonnances_recentes?.length) {
    lignes.push('', '## Médicaments prescrits récemment');
    for (const o of contexte.ordonnances_recentes) {
      lignes.push(`- ${o.date} : ${o.medicaments.join(', ')}`);
    }
  }

  return lignes.join('\n');
}

module.exports = {
  analyseStructuree,
  formaterContextePatient,
  MODELE_IA,
  DISCLAIMER,
};
