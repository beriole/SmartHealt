const request = require('supertest');
const { prisma } = require('../services/database');

// Compteur pour garantir des emails/téléphones uniques entre les appels,
// évitant toute collision (les tests réutilisent les mêmes emails pour des rôles différents).
let compteur = 0;

/**
 * Enregistre un nouvel utilisateur (email unique généré) et le connecte.
 * En environnement de test, la connexion ne requiert pas la vérification d'email.
 *
 * @param {object} app - l'application Express
 * @param {object} userData - données d'inscription (nom, prenom, type_utilisateur, sexe, etc.)
 * @returns {Promise<{token, id_utilisateur, type_utilisateur, utilisateur, email}|null>}
 */
async function registerAndLogin(app, userData) {
  compteur++;
  const unique = `${Date.now()}${compteur}`;
  // Domaine non-gmail pour éviter la normalisation (suppression des +tags/points) du validateur.
  const email = `qa.${unique}@smarthealth.test`;
  const telephone = `t${unique}`.slice(0, 20);
  const mot_de_passe = userData.mot_de_passe || 'Password123!';

  const payload = { ...userData, email, telephone, mot_de_passe };

  // Les professionnels de santé nécessitent un numero_ordre unique (+ spécialité).
  if (['MEDECIN', 'INFIRMIER'].includes(userData.type_utilisateur)) {
    payload.numero_ordre = `ORD-${unique}`;
    if (!payload.specialite) payload.specialite = 'Médecine générale';
    if (!payload.structure_exercice) payload.structure_exercice = 'Hôpital Test';
  }

  const reg = await request(app).post('/api/auth/register').send(payload);
  if (reg.statusCode !== 201) {
    console.error(`registerAndLogin: échec inscription (${reg.statusCode})`, JSON.stringify(reg.body));
    return null;
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, mot_de_passe });
  if (!loginRes.body?.data?.token) {
    console.error('registerAndLogin: échec connexion', JSON.stringify(loginRes.body));
    return null;
  }

  return {
    token: loginRes.body.data.token,
    id_utilisateur: loginRes.body.data.utilisateur.id_utilisateur,
    type_utilisateur: loginRes.body.data.utilisateur.type_utilisateur,
    utilisateur: loginRes.body.data.utilisateur,
    email,
  };
}

/**
 * Connecte un utilisateur déjà existant.
 */
async function login(app, email, mot_de_passe) {
  const loginRes = await request(app).post('/api/auth/login').send({ email, mot_de_passe });
  if (loginRes.body?.success && loginRes.body?.data?.token) {
    return {
      token: loginRes.body.data.token,
      id_utilisateur: loginRes.body.data.utilisateur.id_utilisateur,
      type_utilisateur: loginRes.body.data.utilisateur.type_utilisateur,
      utilisateur: loginRes.body.data.utilisateur,
    };
  }
  console.error(`Login failed for ${email}:`, JSON.stringify(loginRes.body));
  return null;
}

/**
 * Récupère l'identifiant de profil métier (patient/professionnel/livreur) d'un utilisateur.
 */
async function getProfileId(type, id_utilisateur) {
  switch (type) {
    case 'PATIENT': {
      const p = await prisma.patient.findFirst({ where: { id_utilisateur } });
      return p?.id_patient;
    }
    case 'MEDECIN':
    case 'INFIRMIER': {
      const p = await prisma.professionnelSante.findFirst({ where: { id_utilisateur } });
      return p?.id_professionnel;
    }
    case 'LIVREUR': {
      const p = await prisma.livreur.findFirst({ where: { id_utilisateur } });
      return p?.id_livreur;
    }
    default:
      return null;
  }
}

module.exports = { registerAndLogin, login, getProfileId };
