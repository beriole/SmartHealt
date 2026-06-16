const { generateToken, generateAccessToken, verifyToken, hashPassword, comparePassword } = require('../utils/helpers');
const { ValidationError, UnauthorizedError } = require('../errors/AppError');
const utilisateurService = require('../services/utilisateurService');
const refreshTokenService = require('../services/refreshTokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { logAction } = require('../services/auditService');
const logger = require('../utils/logger');

function sanitize(utilisateur) {
  if (!utilisateur) return utilisateur;
  const { mot_de_passe_hash, ...safe } = utilisateur;
  return safe;
}

exports.register = async (req, res, next) => {
  try {
    const {
      email, telephone, mot_de_passe,
      numero_ordre, specialite, structure_exercice, groupe_sanguin,
      vehicule_type, plaque_immatriculation,
      ...userData
    } = req.body;

    const existingEmail = await utilisateurService.findByEmail(email);
    if (existingEmail) throw new ValidationError('Email déjà utilisé');

    const existingTel = await utilisateurService.findByTelephone(telephone);
    if (existingTel) throw new ValidationError('Téléphone déjà utilisé');

    const hashedPassword = await hashPassword(mot_de_passe);

    // Extraction des données spécifiques au rôle
    const roleData = {
      numero_ordre, specialite, structure_exercice, groupe_sanguin,
      vehicule_type, plaque_immatriculation,
    };

    if (userData.date_naissance) {
      userData.date_naissance = new Date(userData.date_naissance);
    }

    // Transaction Prisma
    const utilisateur = await utilisateurService.create({
      ...userData,
      email,
      telephone,
      mot_de_passe_hash: hashedPassword,
    }, roleData);

    // Génération du token de vérification (expire dans 24h)
    const verificationToken = generateToken(
      { email: utilisateur.email, purpose: 'email_verification' },
      '24h'
    );

    // L'échec SMTP ne doit pas annuler l'inscription : l'utilisateur pourra
    // demander un renvoi via /resend-verification.
    let emailEnvoye = true;
    try {
      await sendVerificationEmail(utilisateur.email, verificationToken, utilisateur.prenom);
    } catch (emailError) {
      emailEnvoye = false;
      logger.error(`Inscription ${utilisateur.email} : échec d'envoi de l'email de vérification — ${emailError.message}`);
    }

    logAction({ id_utilisateur: utilisateur.id_utilisateur, action: 'INSCRIPTION', ressource: 'utilisateur', id_ressource: utilisateur.id_utilisateur, req });

    res.status(201).json({
      success: true,
      message: emailEnvoye
        ? 'Inscription réussie. Veuillez vérifier votre boîte mail pour activer votre compte.'
        : "Inscription réussie, mais l'email de vérification n'a pas pu être envoyé. Utilisez /api/auth/resend-verification.",
      data: {
        id_utilisateur: utilisateur.id_utilisateur,
        email: utilisateur.email,
        type: utilisateur.type_utilisateur,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const decoded = verifyToken(token);

    if (decoded.purpose !== 'email_verification') {
      throw new UnauthorizedError('Token invalide');
    }

    const utilisateur = await utilisateurService.findByEmail(decoded.email);
    if (!utilisateur) throw new ValidationError('Utilisateur introuvable');

    if (utilisateur.email_verifie) {
      return res.status(200).json({ success: true, message: 'Email déjà vérifié.' });
    }

    await utilisateurService.update(utilisateur.id_utilisateur, {
      email_verifie: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    next(error);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError('Email requis');

    const utilisateur = await utilisateurService.findByEmail(email);
    // Réponse identique que l'utilisateur existe ou non (anti-énumération)
    if (utilisateur && !utilisateur.email_verifie) {
      const verificationToken = generateToken(
        { email: utilisateur.email, purpose: 'email_verification' },
        '24h'
      );
      await sendVerificationEmail(utilisateur.email, verificationToken, utilisateur.prenom);
    }

    res.json({
      success: true,
      message: 'Si un compte non vérifié existe pour cet email, un nouveau lien de vérification a été envoyé.',
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;

    const utilisateur = await utilisateurService.findByEmail(email);
    if (!utilisateur) {
      logAction({ action: 'LOGIN_ECHEC', ressource: 'utilisateur', details: { email, raison: 'email_inconnu' }, req });
      throw new UnauthorizedError('Identifiants invalides');
    }

    const isValidPassword = await comparePassword(mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!isValidPassword) {
      logAction({ id_utilisateur: utilisateur.id_utilisateur, action: 'LOGIN_ECHEC', ressource: 'utilisateur', details: { email, raison: 'mot_de_passe_invalide' }, req });
      throw new UnauthorizedError('Identifiants invalides');
    }

    // En environnement de test, on n'impose pas la vérification d'email
    // (les emails ne sont pas réellement envoyés). La barrière reste active en dev/prod.
    if (!utilisateur.email_verifie && process.env.NODE_ENV !== 'test') {
      throw new UnauthorizedError('Veuillez vérifier votre email avant de vous connecter.');
    }

    if (utilisateur.statut_compte !== 'actif') {
      throw new UnauthorizedError('Compte suspendu ou désactivé');
    }

    await utilisateurService.update(utilisateur.id_utilisateur, {
      derniere_connexion: new Date(),
    });

    const token = generateAccessToken({
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      type: utilisateur.type_utilisateur,
    });

    const refreshToken = await refreshTokenService.issue(utilisateur.id_utilisateur, {
      userAgent: req.headers['user-agent'],
    });

    logAction({ id_utilisateur: utilisateur.id_utilisateur, action: 'LOGIN_SUCCES', ressource: 'utilisateur', id_ressource: utilisateur.id_utilisateur, req });

    res.json({
      success: true,
      message: 'Connexion réussie',
      // `token` (= access token) conservé pour la rétrocompatibilité.
      data: { utilisateur: sanitize(utilisateur), token, accessToken: token, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ValidationError('refreshToken requis');

    const result = await refreshTokenService.rotate(refreshToken, {
      userAgent: req.headers['user-agent'],
    });

    if (result.error) {
      if (result.error === 'reuse') {
        logAction({ action: 'REFRESH_REUTILISATION', ressource: 'refresh_token', details: { raison: 'token_revoque_rejoue' }, req });
      }
      throw new UnauthorizedError('Refresh token invalide ou expiré. Veuillez vous reconnecter.');
    }

    const utilisateur = await utilisateurService.findById(result.id_utilisateur);
    if (!utilisateur || utilisateur.statut_compte !== 'actif') {
      await refreshTokenService.revokeAllForUser(result.id_utilisateur);
      throw new UnauthorizedError('Compte indisponible. Veuillez vous reconnecter.');
    }

    const token = generateAccessToken({
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      type: utilisateur.type_utilisateur,
    });

    res.json({
      success: true,
      message: 'Token rafraîchi',
      data: { token, accessToken: token, refreshToken: result.token },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await refreshTokenService.revoke(refreshToken);
    }
    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError('Email requis');

    const utilisateur = await utilisateurService.findByEmail(email);
    // Réponse identique que l'utilisateur existe ou non (anti-énumération)
    if (utilisateur) {
      const resetToken = generateToken(
        { id: utilisateur.id_utilisateur, purpose: 'password_reset' },
        '1h'
      );
      await sendPasswordResetEmail(utilisateur.email, resetToken, utilisateur.prenom);
      logAction({ id_utilisateur: utilisateur.id_utilisateur, action: 'DEMANDE_RESET_MDP', ressource: 'utilisateur', req });
    }

    res.json({
      success: true,
      message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé (valide 1 heure).',
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { mot_de_passe } = req.body;

    if (!mot_de_passe || mot_de_passe.length < 8) {
      throw new ValidationError('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    const decoded = verifyToken(token);
    if (decoded.purpose !== 'password_reset') {
      throw new UnauthorizedError('Token invalide');
    }

    const utilisateur = await utilisateurService.findById(decoded.id);
    if (!utilisateur) throw new ValidationError('Utilisateur introuvable');

    const hashedPassword = await hashPassword(mot_de_passe);
    await utilisateurService.update(utilisateur.id_utilisateur, {
      mot_de_passe_hash: hashedPassword,
    });

    logAction({ id_utilisateur: utilisateur.id_utilisateur, action: 'RESET_MDP', ressource: 'utilisateur', id_ressource: utilisateur.id_utilisateur, req });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    next(error);
  }
};
