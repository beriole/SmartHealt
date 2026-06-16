const { NotFoundError, ValidationError } = require('../errors/AppError');
const utilisateurService = require('../services/utilisateurService');

// Champs modifiables par un utilisateur sur son propre profil.
// Les champs sensibles (mot_de_passe_hash, type_utilisateur, email_verifie, statut_compte)
// ne doivent jamais être modifiables via cette route.
const UPDATABLE_FIELDS = [
  'nom', 'prenom', 'telephone', 'date_naissance', 'sexe',
  'latitude', 'longitude', 'langue_preferee', 'photo_profil',
];
const ADMIN_ONLY_FIELDS = ['statut_compte'];

function sanitize(utilisateur) {
  if (!utilisateur) return utilisateur;
  const { mot_de_passe_hash, ...safe } = utilisateur;
  return safe;
}

exports.getAll = async (req, res, next) => {
  try {
    const result = await utilisateurService.findAll(req.query);
    result.data = result.data.map(sanitize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const utilisateur = await utilisateurService.findById(req.user.id);
    if (!utilisateur) throw new NotFoundError('Utilisateur');
    res.json({ success: true, data: sanitize(utilisateur) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const utilisateur = await utilisateurService.findById(req.params.id);
    if (!utilisateur) throw new NotFoundError('Utilisateur');
    res.json({ success: true, data: sanitize(utilisateur) });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const allowed = req.user.type === 'ADMIN'
      ? [...UPDATABLE_FIELDS, ...ADMIN_ONLY_FIELDS]
      : UPDATABLE_FIELDS;

    const data = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (data.date_naissance) data.date_naissance = new Date(data.date_naissance);

    if (Object.keys(data).length === 0) {
      throw new ValidationError('Aucun champ modifiable fourni');
    }

    const utilisateur = await utilisateurService.update(req.params.id, data);
    res.json({ success: true, data: sanitize(utilisateur) });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const utilisateur = await utilisateurService.update(req.params.id, { photo_profil: imageUrl });
    res.json({ success: true, data: sanitize(utilisateur) });
  } catch (error) {
    next(error);
  }
};

exports.deleteUtilisateur = async (req, res, next) => {
  try {
    const utilisateur = await utilisateurService.findById(req.params.id);
    if (!utilisateur) throw new NotFoundError('Utilisateur');

    const updated = await utilisateurService.update(req.params.id, { statut_compte: 'inactif_archive' });
    res.json({ success: true, message: 'Utilisateur archivé (Soft-Delete) avec succès', data: sanitize(updated) });
  } catch (error) {
    next(error);
  }
};
