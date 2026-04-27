const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { utilisateurValidation } = require('../validators/validators');
const authController = require('../controllers/authController');

const authLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite à 5 requêtes par IP
  message: { success: false, message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate(utilisateurValidation.register), authController.register);
router.post('/login', authLimiter, validate(utilisateurValidation.login), authController.login);
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
