const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.registerLivreur = async (req, res, next) => {
  try {
    const { vehicule_type, plaque_immatriculation } = req.body;
    
    // Le livreur s'inscrit s'il a au moins un compte 'LIVREUR'
    // ou bien l'admin l'inscrit manuellement
    let id_utilisateur = req.user.id;
    
    // On vérifie s'il n'existe pas déjà
    const existing = await prisma.livreur.findUnique({ where: { id_utilisateur }});
    if (existing) throw new ValidationError('Profil logistique déjà existant pour cet utilisateur');

    const livreur = await prisma.livreur.create({
      data: {
        id_utilisateur,
        vehicule_type,
        plaque_immatriculation
      }
    });

    res.status(201).json({ success: true, message: 'Profil livreur créé', data: livreur });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('Aucun fichier (permis, pièce d\'identité) uploadé');
    const document_verification_url = `/uploads/${req.file.filename}`;

    const livreur = await prisma.livreur.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!livreur) throw new NotFoundError('Profil livreur non trouvé');

    const updated = await prisma.livreur.update({
      where: { id_livreur: livreur.id_livreur },
      data: { 
        document_verification_url, 
        statut_verification: 'en_attente' 
      }
    });

    res.json({ success: true, message: 'Documents de vérification uploadés', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const { statut_verification, notes_verification } = req.body;
    
    if (!['verifie', 'rejete'].includes(statut_verification)) {
      throw new ValidationError('Statut invalide');
    }

    const updated = await prisma.livreur.update({
      where: { id_livreur: req.params.id },
      data: { statut_verification, notes_verification }
    });

    res.json({ success: true, message: `Profil Livreur ${statut_verification}`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Mise à jour de la position GPS du livreur (suivi temps réel).
 */
exports.updatePosition = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      throw new ValidationError('latitude et longitude sont requis');
    }

    const livreur = await prisma.livreur.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!livreur) throw new NotFoundError('Profil livreur');

    const updated = await prisma.livreur.update({
      where: { id_livreur: livreur.id_livreur },
      data: {
        latitude_actuelle: Number(latitude),
        longitude_actuelle: Number(longitude),
      },
    });

    res.json({ success: true, message: 'Position mise à jour', data: { latitude: updated.latitude_actuelle, longitude: updated.longitude_actuelle } });
  } catch (error) {
    next(error);
  }
};

/**
 * Activation / désactivation de la disponibilité du livreur.
 */
exports.setDisponibilite = async (req, res, next) => {
  try {
    const { disponible } = req.body;
    if (typeof disponible !== 'boolean') {
      throw new ValidationError('Le champ disponible (booléen) est requis');
    }

    const livreur = await prisma.livreur.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!livreur) throw new NotFoundError('Profil livreur');

    const updated = await prisma.livreur.update({
      where: { id_livreur: livreur.id_livreur },
      data: { disponible },
    });

    res.json({ success: true, message: `Vous êtes maintenant ${disponible ? 'disponible' : 'indisponible'}`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Liste des livreurs (administration) avec filtres.
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut_verification, disponible } = req.query;

    const where = {};
    if (statut_verification) where.statut_verification = statut_verification;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const [data, total] = await Promise.all([
      prisma.livreur.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true, statut_compte: true } } },
        orderBy: { total_livraisons: 'desc' },
      }),
      prisma.livreur.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const livreur = await prisma.livreur.findUnique({
      where: { id_utilisateur: req.user.id },
      include: {
        commandes_livrees: {
          take: 10,
          orderBy: { date_livraison_effective: 'desc' },
          where: { statut_commande: 'livree' }
        }
      }
    });

    if (!livreur) throw new NotFoundError('Profil livreur introuvable');

    res.json({ success: true, data: livreur });
  } catch (error) {
    next(error);
  }
};
