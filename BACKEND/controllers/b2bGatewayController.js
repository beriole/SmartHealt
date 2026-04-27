const { UnauthorizedError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.generateToken = async (req, res, next) => {
  try {
    const { client_id, client_secret } = req.body;

    if (!client_id || !client_secret) {
      throw new UnauthorizedError('client_id et client_secret requis');
    }

    const partenaire = await prisma.partenaireB2B.findUnique({
      where: { client_id }
    });

    if (!partenaire) {
      throw new UnauthorizedError('Identifiants invalides');
    }

    if (partenaire.statut_agrement !== 'valide') {
      throw new UnauthorizedError('Accès refusé. Compte partenaire inactif ou révoqué.');
    }

    const isMatch = await bcrypt.compare(client_secret, partenaire.client_secret_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Identifiants invalides');
    }

    // Génération du JWT B2B
    const payload = {
      type: 'B2B',
      id_partenaire: partenaire.id_partenaire,
      nom_structure: partenaire.nom_structure,
      scopes: partenaire.scopes_autorises
    };

    // Le token B2B peut expirer plus vite pour la sécurité (ex: 1h)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      scopes: partenaire.scopes_autorises
    });
  } catch (error) {
    next(error);
  }
};
