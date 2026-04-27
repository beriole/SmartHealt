const { NotFoundError, ForbiddenError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendB2bValidationEmail, sendB2bRejectionEmail } = require('../utils/email');

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

exports.listerDemandes = async (req, res, next) => {
  try {
    const { statut } = req.query;
    const where = statut ? { statut_agrement: statut } : {};
    
    const partenaires = await prisma.partenaireB2B.findMany({
      where,
      orderBy: { date_inscription: 'desc' }
    });
    res.json({ success: true, data: partenaires });
  } catch (error) {
    next(error);
  }
};

exports.validerPartenaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scopes_autorises } = req.body; // e.g. ["ordonnance:write", "carnet:read"]

    const partenaire = await prisma.partenaireB2B.findUnique({ where: { id_partenaire: id } });
    if (!partenaire) throw new NotFoundError('Partenaire B2B');

    // Génération des identifiants API forts
    const clientId = `b2b_${generateRandomString(8)}`;
    const clientSecret = generateRandomString(32); // A ne retourner qu'une seule fois !
    const salt = await bcrypt.genSalt(10);
    const clientSecretHash = await bcrypt.hash(clientSecret, salt);

    const updated = await prisma.partenaireB2B.update({
      where: { id_partenaire: id },
      data: {
        statut_agrement: 'valide',
        date_validation: new Date(),
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        scopes_autorises: scopes_autorises || []
      }
    });

    // Envoi de l'email avec les identifiants
    await sendB2bValidationEmail(updated.email_contact, updated.nom_structure, clientId, clientSecret);

    res.json({
      success: true,
      message: 'Partenaire validé. Les identifiants API ont été envoyés par email.',
      data: {
        nom_structure: updated.nom_structure,
        client_id: updated.client_id,
        scopes: updated.scopes_autorises
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.rejeterPartenaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const partenaire = await prisma.partenaireB2B.findUnique({ where: { id_partenaire: id } });
    if (!partenaire) throw new NotFoundError('Partenaire B2B');

    const updated = await prisma.partenaireB2B.update({
      where: { id_partenaire: id },
      data: {
        statut_agrement: 'rejete'
      }
    });

    // Envoi de l'email de refus
    await sendB2bRejectionEmail(updated.email_contact, updated.nom_structure);

    res.json({ success: true, message: 'La demande de partenariat a été refusée. Un email a été envoyé.' });
  } catch (error) {
    next(error);
  }
};

exports.revoquerPartenaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const partenaire = await prisma.partenaireB2B.findUnique({ where: { id_partenaire: id } });
    if (!partenaire) throw new NotFoundError('Partenaire B2B');

    // Révocation (Kill Switch)
    await prisma.partenaireB2B.update({
      where: { id_partenaire: id },
      data: {
        statut_agrement: 'revoque',
        // Optionnel : nullifier le secret pour être sûr, mais le statut bloque déjà
      }
    });

    res.json({ success: true, message: 'La clé API du partenaire a été révoquée immédiatement.' });
  } catch (error) {
    next(error);
  }
};
