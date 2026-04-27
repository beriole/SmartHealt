const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, id_patient, id_infirmier } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    
    // Filtres automatiques selon le profil
    if (req.user.type === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id }});
      if (patient) where.id_patient = patient.id_patient;
    } else if (['MEDECIN', 'INFIRMIER'].includes(req.user.type)) {
      const pro = await prisma.professionnelSante.findUnique({ where: { id_utilisateur: req.user.id }});
      if (pro) where.id_infirmier = pro.id_professionnel;
    } else {
      if (id_patient) where.id_patient = id_patient;
      if (id_infirmier) where.id_infirmier = id_infirmier;
    }

    const [data, total] = await Promise.all([
      prisma.interventionDomicile.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
          infirmier: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } }
        },
        orderBy: { date_planifiee: 'desc' }
      }),
      prisma.interventionDomicile.count({ where })
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const intervention = await prisma.interventionDomicile.findUnique({
      where: { id_intervention: req.params.id },
      include: {
        patient: { include: { utilisateur: true } },
        infirmier: { include: { utilisateur: true } }
      }
    });

    if (!intervention) throw new NotFoundError('Intervention');
    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    
    // Le demandeur doit être un patient
    if (req.user.type !== 'PATIENT') {
      throw new ForbiddenError('Seuls les patients peuvent planifier une intervention à domicile');
    }

    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!patient) throw new NotFoundError('Patient');
    data.id_patient = patient.id_patient;

    // Assure date au bon format
    if (data.date_planifiee) {
      data.date_planifiee = new Date(data.date_planifiee);
    }
    
    // Conversion numérique
    if (data.latitude_intervention) data.latitude_intervention = Number(data.latitude_intervention);
    if (data.longitude_intervention) data.longitude_intervention = Number(data.longitude_intervention);
    if (data.cout_fcfa) data.cout_fcfa = Number(data.cout_fcfa);

    const intervention = await prisma.interventionDomicile.create({ data });
    res.status(201).json({ success: true, message: 'Intervention planifiée', data: intervention });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, compte_rendu } = req.body;
    
    const intervention = await prisma.interventionDomicile.findUnique({ where: { id_intervention: id } });
    if (!intervention) throw new NotFoundError('Intervention');

    if (['MEDECIN', 'INFIRMIER'].includes(req.user.type)) {
      const pro = await prisma.professionnelSante.findUnique({ where: { id_utilisateur: req.user.id } });
      if (intervention.id_infirmier !== pro.id_professionnel) {
        throw new ForbiddenError('Cette intervention ne vous est pas assignée');
      }
    }

    const dataToUpdate = { statut };
    if (statut === 'terminee') {
      dataToUpdate.date_effective = new Date();
    }
    if (compte_rendu) {
      dataToUpdate.compte_rendu = compte_rendu;
    }

    const updated = await prisma.interventionDomicile.update({
      where: { id_intervention: id },
      data: dataToUpdate
    });

    res.json({ success: true, message: `Intervention marquée comme ${statut}`, data: updated });
  } catch (error) {
    next(error);
  }
};
