const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Rappels de traitement', () => {
  let patient, medecin, patientId, medicamentId, ordonnanceId;

  beforeAll(async () => {
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'R', type_utilisateur: 'PATIENT', sexe: 'F' });
    medecin = await registerAndLogin(app, { nom: 'Doc', prenom: 'R', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Généraliste' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
    const proId = await getProfileId('MEDECIN', medecin.id_utilisateur);
    const carnet = await prisma.carnetSante.findUnique({ where: { id_patient: patientId } });

    const med = await prisma.medicament.create({
      data: { nom_commercial: 'RapMed ' + Date.now(), dci: 'X', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antalgique' },
    });
    medicamentId = med.id_medicament;

    const cons = await prisma.consultation.create({
      data: { id_patient: patientId, id_professionnel: proId, id_carnet: carnet.id_carnet, date_consultation: new Date(), motif: 'X', type_consultation: 'presentiel' },
    });
    const ord = await prisma.ordonnance.create({
      data: { id_consultation: cons.id_consultation, id_professionnel: proId, id_patient: patientId, date_expiration: new Date(Date.now() + 30 * 86400000), signature_numerique: 'SIG-' + Date.now() },
    });
    ordonnanceId = ord.id_ordonnance;
  });

  it('configure un rappel et génère les prises (PATIENT)', async () => {
    const debut = new Date();
    const fin = new Date(Date.now() + 5 * 86400000);
    const res = await request(app)
      .post('/api/rappels')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        id_ordonnance: ordonnanceId,
        id_medicament: medicamentId,
        frequence: { type: 'quotidien', fois_par_jour: 2 },
        heure_prise: ['08:00', '20:00'],
        date_debut: debut.toISOString(),
        date_fin: fin.toISOString(),
        canal_notification: 'email',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_rappel).toBeDefined();
  });

  it('liste mes rappels', async () => {
    const res = await request(app).get('/api/rappels').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('retourne les prises du jour et permet de marquer une prise', async () => {
    const jour = await request(app).get('/api/rappels/prises-du-jour').set('Authorization', `Bearer ${patient.token}`);
    expect(jour.statusCode).toBe(200);
    expect(jour.body.data.length).toBeGreaterThanOrEqual(1);

    const priseId = jour.body.data[0].id_prise;
    const res = await request(app).put('/api/rappels/prises/' + priseId).set('Authorization', `Bearer ${patient.token}`).send({ statut_prise: 'prise' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut_prise).toBe('prise');
  });

  it('calcule les statistiques globales d’observance', async () => {
    const res = await request(app).get('/api/rappels/stats/globales').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('taux_observance_pourcentage');
  });

  it('répond à la prédiction de risque d’oubli (ML ou repli gracieux)', async () => {
    const res = await request(app).get('/api/rappels/risque-observance').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
