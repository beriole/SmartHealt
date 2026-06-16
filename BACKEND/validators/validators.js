const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../errors/AppError');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ValidationError('Validation failed', errorDetails);
  };
};

const utilisateurValidation = {
  register: [
    body('nom').trim().notEmpty().withMessage('Le nom est requis'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('telephone').trim().notEmpty().withMessage('Le téléphone est requis'),
    body('mot_de_passe').isLength({ min: 8 }).withMessage('Mot de passe min 8 caractères'),
    body('type_utilisateur').isIn(['PATIENT', 'MEDECIN', 'PHARMACIEN', 'INFIRMIER', 'LIVREUR', 'TUTEUR', 'ADMIN']).withMessage('Type invalide'),
    body('sexe').isIn(['M', 'F', 'AUTRE']).withMessage('Sexe invalide'),
    // Validation conditionnelle pour les professionnels de santé (MEDECIN, INFIRMIER)
    body('numero_ordre').if(body('type_utilisateur').isIn(['MEDECIN', 'INFIRMIER'])).trim().notEmpty().withMessage('Le numéro d\'ordre est requis pour les professionnels de santé'),
    body('specialite').if(body('type_utilisateur').equals('MEDECIN')).trim().notEmpty().withMessage('La spécialité est requise pour les médecins'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('mot_de_passe').notEmpty().withMessage('Mot de passe requis'),
  ],
};

const patientValidation = {
  create: [
    body('id_utilisateur').isUUID().withMessage('ID utilisateur invalide'),
    body('numero_carnet').trim().notEmpty().withMessage('Numéro de carnet requis'),
    body('groupe_sanguin').optional().isIn(['A_PLUS', 'A_MOINS', 'B_PLUS', 'B_MOINS', 'AB_PLUS', 'AB_MOINS', 'O_PLUS', 'O_MOINS']),
  ],
};

const medicamentValidation = {
  create: [
    body('nom_commercial').trim().notEmpty().withMessage('Nom commercial requis'),
    body('dci').trim().notEmpty().withMessage('DCI requis'),
    body('forme_galenique').isIn(['comprime', 'sirop', 'injection', 'creme', 'suppositoire', 'pommade']).withMessage('Forme galénique invalide'),
    body('dosage').trim().notEmpty().withMessage('Dosage requis'),
    body('categorie').isIn(['antibiotique', 'antalgique', 'antiparasitaire', 'vaccin', 'autre']).withMessage('Catégorie invalide'),
  ],
};

const consultationValidation = {
  create: [
    body('id_patient').isUUID().withMessage('ID patient invalide'),
    body('id_carnet').optional().isUUID().withMessage('ID carnet invalide'),
    body('date_consultation').isISO8601().withMessage('Date invalide'),
    body('motif').trim().notEmpty().withMessage('Motif requis'),
    body('type_consultation').isIn(['presentiel', 'teleconsultation', 'domicile']).withMessage('Type invalide'),
  ],
};

const pharmacieValidation = {
  create: [
    body('nom_pharmacie').trim().notEmpty().withMessage('Nom de pharmacie requis'),
    body('numero_autorisation').trim().notEmpty().withMessage('Numéro d\'autorisation requis'),
    body('adresse').trim().notEmpty().withMessage('Adresse requise'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide'),
    body('telephone').trim().notEmpty().withMessage('Téléphone requis'),
  ],
};

const commandeValidation = {
  // Le patient est déduit du token et le montant est calculé côté serveur :
  // ils ne doivent pas être acceptés depuis le client.
  create: [
    body('id_pharmacie').isUUID().withMessage('ID pharmacie invalide'),
    body('type_livraison').isIn(['retrait_en_pharmacie', 'livraison_domicile']).withMessage('Type livraison invalide'),
    body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne de commande est requise'),
    body('lignes.*.id_stock').isUUID().withMessage('ID stock invalide'),
    body('lignes.*.quantite_commandee').isInt({ min: 1 }).withMessage('Quantité invalide'),
  ],
};

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  validate,
  utilisateurValidation,
  patientValidation,
  medicamentValidation,
  consultationValidation,
  pharmacieValidation,
  commandeValidation,
  paginationValidation,
};
