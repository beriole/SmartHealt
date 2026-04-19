module.exports = {
  authenticate: require('./auth').authenticate,
  authorize: require('./auth').authorize,
  checkPatientOwnership: require('./auth').checkPatientOwnership,
  upload: require('./upload'),
  requestLogger: require('./requestLogger'),
};
