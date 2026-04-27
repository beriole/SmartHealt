const { NotFoundError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, specialite, statut_verification, disponible_domicile } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (specialite) where.specialite = specialite;
    if (statut_verification) where.statut_verification = statut_verification;
    if (disponible_domicile !== undefined) {
      where.disponible_domicile = disponible_domicile === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.professionnelSante.findMany({
        where,
        skip,
        take: Number(limit),
        include: { utilisateur: true },
        orderBy: { note_moyenne: 'desc' },
      }),
      prisma.professionnelSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const professionnel = await prisma.professionnelSante.findUnique({
      where: { id_professionnel: req.params.id },
      include: {
        utilisateur: true,
        consultations: { take: 10, orderBy: { date_consultation: 'desc' } },
      },
    });

    if (!professionnel) throw new NotFoundError('Professionnel');
    res.json({ success: true, data: professionnel });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('Aucun fichier uploadé');
    const document_verification_url = `/uploads/${req.file.filename}`;
    
    // Vérification droits (le pro lui-même ou admin)
    const professionnel = await prisma.professionnelSante.findUnique({
      where: { id_professionnel: req.params.id }
    });

    if (!professionnel) throw new NotFoundError('Professionnel');
    if (req.user.type !== 'ADMIN' && professionnel.id_utilisateur !== req.user.id) {
      const { ForbiddenError } = require('../errors/AppError');
      throw new ForbiddenError('Vous ne pouvez modifier que votre propre profil');
    }

    const updated = await prisma.professionnelSante.update({
      where: { id_professionnel: req.params.id },
      data: { 
        document_verification_url, 
        statut_verification: 'en_attente' // Repasse en attente de validation
      }
    });

    res.json({ success: true, message: 'Document uploadé', data: updated });
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

    const updated = await prisma.professionnelSante.update({
      where: { id_professionnel: req.params.id },
      data: { statut_verification, notes_verification }
    });

    res.json({ success: true, message: `Professionnel ${statut_verification}`, data: updated });
  } catch (error) {
    next(error);
  }
};
