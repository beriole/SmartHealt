const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, recherche, livraison_disponible } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (recherche) where.nom_pharmacie = { contains: recherche, mode: 'insensitive' };
    if (livraison_disponible !== undefined) {
      where.livraison_disponible = livraison_disponible === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.pharmacie.findMany({
        where,
        skip,
        take: limit,
        include: { responsable: true },
        orderBy: { nom_pharmacie: 'asc' },
      }),
      prisma.pharmacie.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.findUnique({
      where: { id_pharmacie: req.params.id },
      include: { responsable: true, stocks: { include: { medicament: true } } },
    });
    if (!pharmacie) throw new NotFoundError('Pharmacie');
    res.json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.livraison_disponible === 'true') data.livraison_disponible = true;
    if (data.livraison_disponible === 'false') data.livraison_disponible = false;
    if (data.rayon_livraison_km) data.rayon_livraison_km = Number(data.rayon_livraison_km);

    if (req.file) {
      data.image_url = `/uploads/${req.file.filename}`;
    }

    if (req.user.type === 'PHARMACIEN') {
      data.id_responsable = req.user.id;
    }

    const pharmacie = await prisma.pharmacie.create({ data });
    res.status(201).json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const pharmacieExistante = await prisma.pharmacie.findUnique({
      where: { id_pharmacie: id }
    });

    if (!pharmacieExistante) throw new NotFoundError('Pharmacie');

    // Vérification : Un pharmacien ne peut modifier que sa propre pharmacie
    if (req.user.type === 'PHARMACIEN' && pharmacieExistante.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez modifier que votre propre pharmacie');
    }

    const data = { ...req.body };
    // Conversion des types si envoyés via FormData
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.livraison_disponible === 'true') data.livraison_disponible = true;
    if (data.livraison_disponible === 'false') data.livraison_disponible = false;
    if (data.rayon_livraison_km) data.rayon_livraison_km = Number(data.rayon_livraison_km);

    if (req.file) {
      data.image_url = `/uploads/${req.file.filename}`;
    }

    const pharmacie = await prisma.pharmacie.update({
      where: { id_pharmacie: id },
      data,
    });
    res.json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.evaluateOrdonnance = async (req, res, next) => {
  try {
    const { id: id_pharmacie, id_ordonnance } = req.params;

    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id_ordonnance },
      include: { lignes: { include: { medicament: true } } }
    });

    if (!ordonnance) throw new NotFoundError('Ordonnance introuvable');

    const evaluation = {
      lignes: [],
      prix_total_produits: 0,
      disponibilite_complete: true,
      medicaments_manquants: []
    };

    for (const ligne of ordonnance.lignes) {
      const stock = await prisma.stockPharmacie.findFirst({
        where: {
          id_pharmacie,
          id_medicament: ligne.id_medicament,
          quantite_disponible: { gte: ligne.quantite }
        }
      });

      if (stock) {
        const sousTotal = Number(stock.prix_vente_fcfa) * ligne.quantite;
        evaluation.lignes.push({
          id_medicament: ligne.id_medicament,
          nom: ligne.medicament.nom_commercial,
          quantite: ligne.quantite,
          disponible: true,
          prix_unitaire: stock.prix_vente_fcfa,
          sous_total: sousTotal,
          id_stock: stock.id_stock
        });
        evaluation.prix_total_produits += sousTotal;
      } else {
        evaluation.disponibilite_complete = false;
        evaluation.medicaments_manquants.push(ligne.medicament.nom_commercial);
        evaluation.lignes.push({
          id_medicament: ligne.id_medicament,
          nom: ligne.medicament.nom_commercial,
          quantite: ligne.quantite,
          disponible: false
        });
      }
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('Aucun fichier uploadé');
    const document_verification_url = `/uploads/${req.file.filename}`;
    
    const pharmacie = await prisma.pharmacie.findUnique({
      where: { id_pharmacie: req.params.id }
    });

    if (!pharmacie) throw new NotFoundError('Pharmacie');
    if (req.user.type !== 'ADMIN' && pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez modifier que votre propre pharmacie');
    }

    const updated = await prisma.pharmacie.update({
      where: { id_pharmacie: req.params.id },
      data: { 
        document_verification_url, 
        statut_verification: 'en_attente' 
      }
    });

    res.json({ success: true, message: 'Agrément uploadé', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const { statut_verification, notes_verification } = req.body;
    
    if (!['verifie', 'rejete'].includes(statut_verification)) {
      const { ValidationError } = require('../errors/AppError');
      throw new ValidationError('Statut invalide');
    }

    const updated = await prisma.pharmacie.update({
      where: { id_pharmacie: req.params.id },
      data: { statut_verification, notes_verification }
    });

    res.json({ success: true, message: `Pharmacie ${statut_verification}`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.addEmploye = async (req, res, next) => {
  try {
    const { id_pharmacie } = req.params;
    const { email, role_employe } = req.body;

    const pharmacie = await prisma.pharmacie.findUnique({ where: { id_pharmacie } });
    if (!pharmacie) throw new NotFoundError('Pharmacie');
    
    if (req.user.type !== 'ADMIN' && pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Seul le responsable peut ajouter un employé');
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur) throw new NotFoundError('Utilisateur avec cet email introuvable');
    if (!['PHARMACIEN', 'INFIRMIER', 'ADMIN'].includes(utilisateur.type_utilisateur)) {
      const { ValidationError } = require('../errors/AppError');
      throw new ValidationError('L\'utilisateur doit avoir un compte de type médical ou de gestion pour être staff.');
    }

    const employe = await prisma.employePharmacie.create({
      data: {
        id_pharmacie,
        id_utilisateur: utilisateur.id_utilisateur,
        role_employe: role_employe || 'pharmacien_assistant'
      },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true } } }
    });

    res.status(201).json({ success: true, message: 'Employé ajouté', data: employe });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Cet utilisateur est déjà employé ici' });
    next(error);
  }
};

exports.getEmployes = async (req, res, next) => {
  try {
    const { id_pharmacie } = req.params;
    const employes = await prisma.employePharmacie.findMany({
      where: { id_pharmacie },
      include: { utilisateur: { select: { id_utilisateur: true, nom: true, prenom: true, email: true, telephone: true } } }
    });
    res.json({ success: true, data: employes });
  } catch (error) {
    next(error);
  }
};

exports.removeEmploye = async (req, res, next) => {
  try {
    const { id_pharmacie, id_employe } = req.params;

    const pharmacie = await prisma.pharmacie.findUnique({ where: { id_pharmacie } });
    if (!pharmacie) throw new NotFoundError('Pharmacie');
    
    if (req.user.type !== 'ADMIN' && pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Seul le responsable peut révoquer un employé');
    }

    await prisma.employePharmacie.delete({
      where: { id_employe }
    });

    res.json({ success: true, message: 'Employé révoqué' });
  } catch (error) {
    next(error);
  }
};

exports.deletePharmacie = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.findUnique({ where: { id_pharmacie: req.params.id } });
    if (!pharmacie) throw new NotFoundError('Pharmacie');
    
    const updated = await prisma.pharmacie.update({
      where: { id_pharmacie: req.params.id },
      data: { statut: 'inactif_archive' }
    });
    
    res.json({ success: true, message: 'Pharmacie archivée (Soft-Delete) avec succès', data: updated });
  } catch (error) {
    next(error);
  }
};

