const { ForbiddenError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const crypto = require('crypto');

exports.genererPinConsentement = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!patient) {
      throw new ForbiddenError('Accès réservé aux patients.');
    }

    // Générer un PIN à 6 chiffres
    const code_pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration dans 2 heures
    const date_expiration = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const pin = await prisma.pinConsentement.create({
      data: {
        id_patient: patient.id_patient,
        code_pin,
        date_expiration,
        est_actif: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Code PIN généré avec succès. Il est valable 2 heures.',
      data: {
        code_pin: pin.code_pin,
        date_expiration: pin.date_expiration
      }
    });
  } catch (error) {
    next(error);
  }
};
