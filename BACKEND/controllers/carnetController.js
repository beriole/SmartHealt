const { NotFoundError, ForbiddenError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const carnetService = require('../services/carnetService');
const { generateUUID } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;

    const [data, total] = await Promise.all([
      prisma.carnetSante.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: { include: { utilisateur: true } },
          consultations: true,
        },
        orderBy: { date_creation: 'desc' },
      }),
      prisma.carnetSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const carnet = await prisma.carnetSante.findUnique({
      where: { id_carnet: req.params.id },
      include: {
        patient: { include: { utilisateur: true } },
        consultations: {
          include: { professionnel: { include: { utilisateur: true } } },
          orderBy: { date_consultation: 'desc' },
        },
        acces: { orderBy: { date_acces: 'desc' } },
      },
    });

    if (!carnet) throw new NotFoundError('Carnet de santé');
    res.json({ success: true, data: carnet });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { vaccinations, acces_actif, qr_code_token } = req.body;

    const carnet = await prisma.carnetSante.update({
      where: { id_carnet: req.params.id },
      data: { vaccinations, acces_actif, qr_code_token },
    });

    res.json({ success: true, data: carnet });
  } catch (error) {
    next(error);
  }
};

exports.getMyCarnet = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!patient) throw new NotFoundError('Patient introuvable pour cet utilisateur');

    const carnet = await prisma.carnetSante.findUnique({
      where: { id_patient: patient.id_patient },
      include: {
        patient: { 
          include: { utilisateur: { select: { nom: true, prenom: true, sexe: true, date_naissance: true } } }
        },
        consultations: {
          include: { professionnel: { include: { utilisateur: { select: { nom: true, prenom: true } } } } },
          orderBy: { date_consultation: 'desc' },
          take: 5
        }
      }
    });

    if (!carnet) throw new NotFoundError('Carnet de santé introuvable');
    if (!carnet.acces_actif) throw new ForbiddenError('L\'accès à ce carnet a été désactivé');

    res.json({ success: true, data: carnet });
  } catch (error) {
    next(error);
  }
};

exports.scanQrCode = async (req, res, next) => {
  try {
    const { qrToken } = req.params;

    const carnet = await prisma.carnetSante.findUnique({
      where: { qr_code_token: qrToken },
      include: {
        patient: { 
          include: { utilisateur: { select: { nom: true, prenom: true, sexe: true, date_naissance: true, photo_profil: true } } }
        }
      }
    });

    if (!carnet) throw new NotFoundError('QR Code invalide ou Carnet introuvable');
    if (!carnet.acces_actif) throw new ForbiddenError('L\'accès à ce carnet est actuellement désactivé par le patient');

    // Audit Log: on enregistre qui a scanné le carnet
    await carnetService.logAccess(
      carnet.id_carnet,
      req.user.id, // L'ID du professionnel connecté
      'qr_code',
      req.ip || req.connection.remoteAddress,
      true
    );

    res.json({
      success: true,
      message: 'Accès autorisé au dossier médical',
      data: carnet,
    });
  } catch (error) {
    next(error);
  }
};

exports.regenerateQrCode = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!patient) throw new NotFoundError('Patient introuvable');

    const newQrToken = `QR-${generateUUID()}`;

    const carnet = await prisma.carnetSante.update({
      where: { id_patient: patient.id_patient },
      data: { qr_code_token: newQrToken }
    });

    res.json({
      success: true,
      message: 'QR Code regénéré avec succès',
      data: { qr_code_token: carnet.qr_code_token }
    });
  } catch (error) {
    next(error);
  }
};
