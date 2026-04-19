const { NotFoundError, ConflictError } = require('../errors/AppError');
const patientService = require('../services/patientService');
const { generateNumeroCarnet } = require('../utils/helpers');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const result = await patientService.findAll(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const patient = await patientService.findById(req.params.id);
    if (!patient) throw new NotFoundError('Patient');
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { id_utilisateur } = req.body;

    const utilisateur = await utilisateurService.findById(id_utilisateur);
    if (!utilisateur) throw new NotFoundError('Utilisateur');
    if (utilisateur.type_utilisateur !== 'PATIENT') {
      throw new ConflictError("L'utilisateur doit être de type PATIENT");
    }

    const existingPatient = await patientService.findByUtilisateurId(id_utilisateur);
    if (existingPatient) throw new ConflictError('Ce patient existe déjà');

    const numero_carnet = generateNumeroCarnet();

    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: { id_utilisateur, numero_carnet, ...req.body },
      });

      await tx.carnetSante.create({
        data: {
          id_patient: patient.id_patient,
          qr_code_token: `QR-${patient.id_patient}`,
        },
      });

      return patient;
    });

    res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await patientService.update(req.params.id, req.body);
    if (!patient) throw new NotFoundError('Patient');
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};
