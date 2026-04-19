const { prisma } = require('./database');

class ProfessionnelService {
  async create(data) {
    return prisma.professionnelSante.create({ data });
  }

  async findById(id) {
    return prisma.professionnelSante.findUnique({
      where: { id_professionnel: id },
      include: { utilisateur: true },
    });
  }

  async findByUtilisateurId(idUtilisateur) {
    return prisma.professionnelSante.findUnique({ where: { id_utilisateur: idUtilisateur } });
  }

  async findByNumeroOrdre(numero) {
    return prisma.professionnelSante.findUnique({ where: { numero_ordre: numero } });
  }

  async update(id, data) {
    return prisma.professionnelSante.update({ where: { id_professionnel: id }, data });
  }
}

module.exports = new ProfessionnelService();
