const { generateToken, verifyToken, hashPassword, comparePassword } = require('../utils/helpers');
const { ValidationError, UnauthorizedError } = require('../errors/AppError');
const utilisateurService = require('../services/utilisateurService');
const { sendVerificationEmail } = require('../utils/email');

exports.register = async (req, res, next) => {
  try {
    const { 
      email, telephone, mot_de_passe, 
      numero_ordre, specialite, structure_exercice, groupe_sanguin,
      ...userData 
    } = req.body;

    const existingEmail = await utilisateurService.findByEmail(email);
    if (existingEmail) throw new ValidationError('Email déjà utilisé');

    const existingTel = await utilisateurService.findByTelephone(telephone);
    if (existingTel) throw new ValidationError('Téléphone déjà utilisé');

    const hashedPassword = await hashPassword(mot_de_passe);

    // Extraction des données spécifiques au rôle
    const roleData = { numero_ordre, specialite, structure_exercice, groupe_sanguin };

    // Transaction Prisma
    const utilisateur = await utilisateurService.create({
      ...userData,
      email,
      telephone,
      mot_de_passe_hash: hashedPassword,
    }, roleData);

    // Génération du token de vérification (expire dans 24h)
    const verificationToken = generateToken({ email: utilisateur.email, purpose: 'email_verification' });
    
    // Envoi de l'email asynchrone (non-bloquant idéalement, mais ici on attend pour renvoyer une erreur si problème de conf SMTP)
    await sendVerificationEmail(utilisateur.email, verificationToken, utilisateur.prenom);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre boîte mail pour activer votre compte.',
      data: {
        id_utilisateur: utilisateur.id_utilisateur,
        email: utilisateur.email,
        type: utilisateur.type_utilisateur
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

    // Mise à jour de l'utilisateur
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

exports.login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;

    const utilisateur = await utilisateurService.findByEmail(email);
    if (!utilisateur) throw new UnauthorizedError('Identifiants invalides');

    const isValidPassword = await comparePassword(mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!isValidPassword) throw new UnauthorizedError('Identifiants invalides');

    if (!utilisateur.email_verifie) {
      throw new UnauthorizedError('Veuillez vérifier votre email avant de vous connecter.');
    }

    if (utilisateur.statut_compte !== 'actif') {
      throw new UnauthorizedError('Compte suspendu ou désactivé');
    }

    await utilisateurService.update(utilisateur.id_utilisateur, {
      derniere_connexion: new Date(),
    });

    const token = generateToken({
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      type: utilisateur.type_utilisateur,
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: { utilisateur, token },
    });
  } catch (error) {
    next(error);
  }
};
