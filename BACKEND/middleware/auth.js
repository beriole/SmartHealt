const { verifyToken } = require('../utils/helpers');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const { prisma } = require('../services/database');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token requis');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

function authorize(...types) {
  return (req, res, next) => {
    if (!types.includes(req.user.type)) {
      throw new ForbiddenError('Accès non autorisé pour ce type d\'utilisateur');
    }
    next();
  };w
}

async function checkPatientOwnership(req, res, next) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id_patient: req.params.id || req.body.id_patient },
    });

    if (!patient) {
      throw new UnauthorizedError('Patient non trouvé');
    }

    if (req.user.type !== 'ADMIN' && patient.id_utilisateur !== req.user.id) {
      throw new ForbiddenError('Vous n\'avez pas accès à ce patient');
    }

    req.patient = patient;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  authorize,
  checkPatientOwnership,
};
