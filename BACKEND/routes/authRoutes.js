const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { utilisateurValidation } = require('../validators/validators');
const authController = require('../controllers/authController');

router.post('/register', validate(utilisateurValidation.register), authController.register);
router.post('/login', validate(utilisateurValidation.login), authController.login);
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
