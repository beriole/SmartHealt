const { NotFoundError } = require('../errors/AppError');
const utilisateurService = require('../services/utilisateurService');

exports.getAll = async (req, res, next) => {
  try {
    const result = await utilisateurService.findAll(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const utilisateur = await utilisateurService.findById(req.params.id);
    if (!utilisateur) throw new NotFoundError('Utilisateur');
    res.json({ success: true, data: utilisateur });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const utilisateur = await utilisateurService.update(req.params.id, req.body);
    if (!utilisateur) throw new NotFoundError('Utilisateur');
    res.json({ success: true, data: utilisateur });
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
    res.json({ success: true, data: utilisateur });
  } catch (error) {
    next(error);
  }
};

