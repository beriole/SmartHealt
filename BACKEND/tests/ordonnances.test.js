const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Ordonnances', () => {
  let medecin, patient, patientId, consultationId, medicamentId, ordonnanceId;

  beforeAll(async () => {
    medecin = await registerAndLogin(app, { nom: 'Doc', prenom: 'O', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Généraliste' });
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'O', type_utilisateur: 'PATIENT', sexe: 'F' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
    const carnet = await prisma.carnetSante.findUnique({ where: { id_patient: patientId } });

    const med = await prisma.medicament.create({
      data: { nom_commercial: 'OrdMed ' + Date.now(), dci: 'X', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antalgique' },
    });
    medicamentId = med.id_medicament;

    const cons = await request(app).post('/api/consultations').set('Authorization', `Bearer ${medecin.token}`).send({
      id_patient: patientId, id_carnet: carnet.id_carnet, date_consultation: new Date().toISOString(),
      motif: 'Douleur', type_consultation: 'presentiel',
    });
    consultationId = cons.body.data.id_consultation;
  });

  it('crée une ordonnance avec lignes (MEDECIN)', async () => {
    const expiration = new Date(); expiration.setMonth(expiration.getMonth() + 1);
    const res = await request(app)
      .post('/api/ordonnances')
      .set('Authorization', `Bearer ${medecin.token}`)
      .send({
        id_consultation: consultationId,
        id_patient: patientId,
        date_expiration: expiration.toISOString(),
        lignes: [{ id_medicament: medicamentId, quantite: 2, duree_traitement_jours: 7, posologie: '1 comprimé matin et soir' }],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_ordonnance).toBeDefined();
    expect(res.body.data.signature_numerique).toBeDefined();
    ordonnanceId = res.body.data.id_ordonnance;
  });

  it('refuse la création sans token (401)', async () => {
    const res = await request(app).post('/api/ordonnances').send({ id_patient: patientId });
    expect(res.statusCode).toBe(401);
  });

  it('liste les ordonnances (authentifié)', async () => {
    const res = await request(app).get('/api/ordonnances').set('Authorization', `Bearer ${medecin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une ordonnance par ID (avec ses lignes)', async () => {
    const res = await request(app).get('/api/ordonnances/' + ordonnanceId).set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_ordonnance).toBe(ordonnanceId);
    expect(res.body.data.lignes.length).toBe(1);
  });
});
