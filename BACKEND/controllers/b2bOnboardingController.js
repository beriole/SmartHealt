const { ConflictError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.demanderAgrement = async (req, res, next) => {
  try {
    const { nom_structure, email_contact, telephone_contact } = req.body;
    
    if (!req.file) {
      throw new ValidationError("Les documents légaux (Kbis, Agrément) sont obligatoires.");
    }

    const existing = await prisma.partenaireB2B.findUnique({
      where: { email_contact }
    });

    if (existing) {
      throw new ConflictError("Une demande d'agrément existe déjà avec cet email.");
    }

    const documents_legaux_url = `/uploads/${req.file.filename}`;

    const partenaire = await prisma.partenaireB2B.create({
      data: {
        nom_structure,
        email_contact,
        telephone_contact,
        documents_legaux_url
      }
    });

    res.status(201).json({
      success: true,
      message: "Demande soumise avec succès. Elle est en attente de validation par un administrateur.",
      data: {
        id_partenaire: partenaire.id_partenaire,
        statut: partenaire.statut_agrement
      }
    });
  } catch (error) {
    next(error);
  }
};
