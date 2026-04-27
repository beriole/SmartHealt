const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

const authenticateB2B = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Accès B2B refusé. Token manquant.'));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'B2B') {
      throw new ForbiddenError('Ce token n\'est pas un token B2B valide.');
    }
    req.partenaire = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Token B2B invalide ou expiré.'));
  }
};

const requireScope = (scope) => {
  return (req, res, next) => {
    if (!req.partenaire || !req.partenaire.scopes) {
      return next(new ForbiddenError('Accès interdit. Aucun scope défini.'));
    }
    if (!req.partenaire.scopes.includes(scope)) {
      return next(new ForbiddenError(`Accès interdit. Nécessite le scope : ${scope}`));
    }
    next();
  };
};

module.exports = { authenticateB2B, requireScope };
