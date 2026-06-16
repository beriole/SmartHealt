const { prisma } = require('./database');

const { generateNumeroCarnet, generateUUID } = require('../utils/helpers');

class UtilisateurService {
  async create(userData, roleData = {}) {
    return prisma.$transaction(async (tx) => {
      // 1. Créer l'utilisateur
      const utilisateur = await tx.utilisateur.create({
        data: userData,
      });

      // 2. Créer le profil spécifique selon le type
      if (utilisateur.type_utilisateur === 'PATIENT') {
        const numeroCarnet = generateNumeroCarnet();

        const patient = await tx.patient.create({
          data: {
            id_utilisateur: utilisateur.id_utilisateur,
            numero_carnet: numeroCarnet,
            groupe_sanguin: roleData.groupe_sanguin || null,
          },
        });

        // 3. Phase 2 : Créer le carnet de santé automatiquement
        await tx.carnetSante.create({
          data: {
            id_patient: patient.id_patient,
            qr_code_token: generateUUID(),
            acces_actif: true,
          },
        });
      } else if (['MEDECIN', 'INFIRMIER'].includes(utilisateur.type_utilisateur)) {
        // Les médecins ET les infirmiers ont un profil professionnel de santé
        // (les interventions à domicile référencent ProfessionnelSante).
        await tx.professionnelSante.create({
          data: {
            id_utilisateur: utilisateur.id_utilisateur,
            numero_ordre: roleData.numero_ordre,
            specialite: roleData.specialite || (utilisateur.type_utilisateur === 'INFIRMIER' ? 'Soins infirmiers' : 'Médecine générale'),
            structure_exercice: roleData.structure_exercice || 'Non précisé',
            statut_verification: 'en_attente',
          },
        });
      } else if (utilisateur.type_utilisateur === 'LIVREUR') {
        await tx.livreur.create({
          data: {
            id_utilisateur: utilisateur.id_utilisateur,
            vehicule_type: roleData.vehicule_type || null,
            plaque_immatriculation: roleData.plaque_immatriculation || null,
          },
        });
      }

      return utilisateur;
    });
  }

  async findById(id) {
    return prisma.utilisateur.findUnique({ where: { id_utilisateur: id } });
  }

  async findByEmail(email) {
    return prisma.utilisateur.findUnique({ where: { email } });
  }

  async findByTelephone(telephone) {
    return prisma.utilisateur.findUnique({ where: { telephone } });
  }

  async update(id, data) {
    return prisma.utilisateur.update({ where: { id_utilisateur: id }, data });
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 20, type_utilisateur, statut_compte, recherche } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (type_utilisateur) where.type_utilisateur = type_utilisateur;
    if (statut_compte) where.statut_compte = statut_compte;
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche, mode: 'insensitive' } },
        { prenom: { contains: recherche, mode: 'insensitive' } },
        { email: { contains: recherche, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.utilisateur.findMany({ where, skip, take: Number(limit), orderBy: { date_creation: 'desc' } }),
      prisma.utilisateur.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new UtilisateurService();
