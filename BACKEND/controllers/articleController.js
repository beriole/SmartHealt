const { prisma } = require('../services/database');
const { NotFoundError, ValidationError } = require('../errors/AppError');
const { logAction } = require('../services/auditService');

/**
 * Liste publique des articles publiés (actualités, conseils médicaux,
 * sensibilisation, articles de santé).
 */
exports.getPublies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categorie, recherche } = req.query;

    const where = { statut: 'publie' };
    if (categorie) where.categorie = categorie;
    if (recherche) where.titre = { contains: recherche, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.articleSante.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_publication: 'desc' },
        include: { auteur: { select: { nom: true, prenom: true } } },
      }),
      prisma.articleSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const article = await prisma.articleSante.findUnique({
      where: { id_article: req.params.id },
      include: { auteur: { select: { nom: true, prenom: true } } },
    });
    if (!article) throw new NotFoundError('Article');
    // Un article non publié n'est visible que par un admin
    if (article.statut !== 'publie' && req.user?.type !== 'ADMIN') {
      throw new NotFoundError('Article');
    }
    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

/** Liste complète (admin) y compris brouillons et archivés. */
exports.getAllAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, categorie } = req.query;
    const where = {};
    if (statut) where.statut = statut;
    if (categorie) where.categorie = categorie;

    const [data, total] = await Promise.all([
      prisma.articleSante.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_creation: 'desc' },
        include: { auteur: { select: { nom: true, prenom: true } } },
      }),
      prisma.articleSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { titre, contenu, categorie, statut } = req.body;
    if (!titre || !contenu) throw new ValidationError('titre et contenu sont requis');

    const data = {
      titre,
      contenu,
      categorie: categorie || 'article_sante',
      statut: statut || 'brouillon',
      id_auteur: req.user.id,
    };
    if (data.statut === 'publie') data.date_publication = new Date();
    if (req.file) data.image_url = `/uploads/${req.file.filename}`;

    const article = await prisma.articleSante.create({ data });

    logAction({ id_utilisateur: req.user.id, action: 'CREATION_ARTICLE', ressource: 'article_sante', id_ressource: article.id_article, req });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existant = await prisma.articleSante.findUnique({ where: { id_article: req.params.id } });
    if (!existant) throw new NotFoundError('Article');

    const data = {};
    for (const field of ['titre', 'contenu', 'categorie', 'statut']) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (req.file) data.image_url = `/uploads/${req.file.filename}`;
    // Première publication : on fige la date
    if (data.statut === 'publie' && existant.statut !== 'publie') {
      data.date_publication = new Date();
    }

    const article = await prisma.articleSante.update({
      where: { id_article: req.params.id },
      data,
    });

    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existant = await prisma.articleSante.findUnique({ where: { id_article: req.params.id } });
    if (!existant) throw new NotFoundError('Article');

    // Soft-delete : archivage
    const article = await prisma.articleSante.update({
      where: { id_article: req.params.id },
      data: { statut: 'archive' },
    });

    logAction({ id_utilisateur: req.user.id, action: 'ARCHIVAGE_ARTICLE', ressource: 'article_sante', id_ressource: req.params.id, req });

    res.json({ success: true, message: 'Article archivé', data: article });
  } catch (error) {
    next(error);
  }
};
