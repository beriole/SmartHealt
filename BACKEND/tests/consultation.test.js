const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Consultations', () => {
  let medecin, patient, patientId, carnetId, consultationId;

  beforeAll(async () => {
    medecin = await registerAndLogin(app, { nom: 'Doc', prenom: 'C', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Généraliste' });
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'C', type_utilisateur: 'PATIENT', sexe: 'F' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
    const carnet = await prisma.carnetSante.findUnique({ where: { id_patient: patientId } });
    carnetId = carnet.id_carnet;
  });

  it('crée une consultation (MEDECIN)', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${medecin.token}`)
      .send({
        id_patient: patientId,
        id_carnet: carnetId,
        date_consultation: new Date().toISOString(),
        motif: 'Fièvre persistante',
        type_consultation: 'presentiel',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_consultation).toBeDefined();
    consultationId = res.body.data.id_consultation;
  });

  it('refuse la création à un patient (403)', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ id_patient: patientId, id_carnet: carnetId, date_consultation: new Date().toISOString(), motif: 'X', type_consultation: 'presentiel' });
    expect(res.statusCode).toBe(403);
  });

  it('liste les consultations (authentifié)', async () => {
    const res = await request(app).get('/api/consultations').set('Authorization', `Bearer ${medecin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une consultation par ID', async () => {
    const res = await request(app).get('/api/consultations/' + consultationId).set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_consultation).toBe(consultationId);
  });

  it('met à jour une consultation (MEDECIN)', async () => {
    const res = await request(app)
      .put('/api/consultations/' + consultationId)
      .set('Authorization', `Bearer ${medecin.token}`)
      .send({ diagnostic: 'Paludisme', statut: 'effectuee' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.diagnostic).toBe('Paludisme');
  });
});
