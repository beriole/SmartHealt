const { prisma } = require('./database');

class CarnetService {
  async findByPatientId(idPatient) {
    return prisma.carnetSante.findUnique({ where: { id_patient: idPatient } });
  }

  async update(id, data) {
    return prisma.carnetSante.update({ where: { id_carnet: id }, data });
  }

  async logAccess(idCarnet, idAccedant, typeAcces, adresseIp, autorise) {
    return prisma.accesCarnet.create({
      data: {
        id_carnet: idCarnet,
        id_accedant: idAccedant,
        type_acces: typeAcces,
        adresse_ip: adresseIp,
        autorise_par_patient: autorise,
      },
    });
  }
}

module.exports = new CarnetService();
