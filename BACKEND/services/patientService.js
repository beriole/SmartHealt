const { prisma } = require('./database');

class PatientService {
  async create(data) {
    return prisma.patient.create({ data });
  }

  async findById(id) {
    return prisma.patient.findUnique({
      where: { id_patient: id },
      include: {
        utilisateur: true,
        carnet: true,
        tuteur: { include: { utilisateur: true } },
      },
    });
  }

  async findByUtilisateurId(idUtilisateur) {
    return prisma.patient.findUnique({ where: { id_utilisateur: idUtilisateur } });
  }

  async findByNumeroCarnet(numero) {
    return prisma.patient.findUnique({ where: { numero_carnet: numero } });
  }

  async update(id, data) {
    return prisma.patient.update({ where: { id_patient: id }, data });
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        skip,
        take: limit,
        include: { utilisateur: true },
        orderBy: { date_enregistrement: 'desc' },
      }),
      prisma.patient.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new PatientService();
