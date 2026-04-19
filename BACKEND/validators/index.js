const validate = require('./validate');

const utilisateurValidation = require('./validators').utilisateurValidation;
const patientValidation = require('./validators').patientValidation;
const medicamentValidation = require('./validators').medicamentValidation;
const consultationValidation = require('./validators').consultationValidation;
const pharmacieValidation = require('./validators').pharmacieValidation;
const commandeValidation = require('./validators').commandeValidation;
const paginationValidation = require('./validators').paginationValidation;

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
