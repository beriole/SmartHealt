const { NotFoundError, ForbiddenError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const crypto = require('crypto');
const { sendOrdonnanceNotification } = require('../utils/email');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, statut } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      prisma.ordonnance.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: true,
          professionnel: true,
          lignes: { include: { medicament: true } },
        },
        orderBy: { date_emission: 'desc' },
      }),
      prisma.ordonnance.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id_ordonnance: req.params.id },
      include: {
        patient: true,
        professionnel: true,
        consultation: true,
        lignes: { include: { medicament: true } },
      },
    });
    if (!ordonnance) throw new NotFoundError('Ordonnance');
    res.json({ success: true, data: ordonnance });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const professionnel = await prisma.professionnelSante.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!professionnel) {
      throw new ForbiddenError('Seul un Professionnel de Santé peut émettre une ordonnance.');
    }

    const { lignes, id_patient, ...ordonnanceData } = req.body;

    // Récupérer le patient pour récupérer son e-mail
    const patient = await prisma.patient.findUnique({
      where: { id_patient },
      include: { utilisateur: true }
    });

    if (!patient) throw new NotFoundError('Patient introuvable.');

    // Générer un hash pour la signature numérique anti-fraude
    const dateEmission = new Date();
    const payloadToHash = `${professionnel.id_professionnel}-${id_patient}-${dateEmission.toISOString()}-${JSON.stringify(lignes)}`;
    const signature_numerique = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const dataToCreate = {
      ...ordonnanceData,
      id_patient,
      id_professionnel: professionnel.id_professionnel,
      date_emission: dateEmission,
      signature_numerique
    };

    const result = await prisma.$transaction(async (tx) => {
      const ordonnance = await tx.ordonnance.create({ data: dataToCreate });

      if (lignes && lignes.length > 0) {
        await tx.ligneOrdonnance.createMany({
          data: lignes.map((ligne) => ({
            ...ligne,
            id_ordonnance: ordonnance.id_ordonnance,
          })),
        });
      }

      return ordonnance;
    });

    // Envoi de la notification asynchrone par email
    sendOrdonnanceNotification(
      patient.utilisateur.email,
      `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`,
      signature_numerique,
      result.date_expiration,
      result.id_ordonnance
    );

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { lignes, ...ordonnanceData } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const ordonnance = await tx.ordonnance.update({
        where: { id_ordonnance: req.params.id },
        data: ordonnanceData,
      });

      if (lignes) {
        await tx.ligneOrdonnance.deleteMany({ where: { id_ordonnance: req.params.id } });
        if (lignes.length > 0) {
          await tx.ligneOrdonnance.createMany({
            data: lignes.map((ligne) => ({ ...ligne, id_ordonnance: req.params.id })),
          });
        }
      }

      return ordonnance;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
