const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Interventions à domicile', () => {
  let patient, infirmier, admin, infirmierProId, interventionId;

  beforeAll(async () => {
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'I', type_utilisateur: 'PATIENT', sexe: 'F' });
    infirmier = await registerAndLogin(app, { nom: 'Inf', prenom: 'I', type_utilisateur: 'INFIRMIER', sexe: 'M' });
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'I', type_utilisateur: 'ADMIN', sexe: 'M' });
    infirmierProId = await getProfileId('INFIRMIER', infirmier.id_utilisateur);
  });

  it('planifie une intervention (PATIENT)', async () => {
    const res = await request(app)
      .post('/api/interventions')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        id_infirmier: infirmierProId,
        type_acte: 'injection',
        date_planifiee: new Date(Date.now() + 86400000).toISOString(),
        adresse_intervention: 'Bastos, Yaoundé',
        cout_fcfa: 5000,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_intervention).toBeDefined();
    interventionId = res.body.data.id_intervention;
  });

  it('refuse la planification par un non-patient (403)', async () => {
    const res = await request(app)
      .post('/api/interventions')
      .set('Authorization', `Bearer ${infirmier.token}`)
      .send({ id_infirmier: infirmierProId, type_acte: 'injection', date_planifiee: new Date().toISOString(), adresse_intervention: 'X', cout_fcfa: 1000 });
    expect(res.statusCode).toBe(403);
  });

  it('liste les interventions (PATIENT voit les siennes)', async () => {
    const res = await request(app).get('/api/interventions').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une intervention par ID', async () => {
    const res = await request(app).get('/api/interventions/' + interventionId).set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_intervention).toBe(interventionId);
  });

  it('met à jour le statut (INFIRMIER assigné)', async () => {
    const res = await request(app)
      .put('/api/interventions/' + interventionId + '/status')
      .set('Authorization', `Bearer ${infirmier.token}`)
      .send({ statut: 'terminee', compte_rendu: 'Injection réalisée sans incident' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut).toBe('terminee');
    expect(res.body.data.date_effective).toBeDefined();
  });

  it('exige un token (401)', async () => {
    const res = await request(app).post('/api/interventions').send({});
    expect(res.statusCode).toBe(401);
  });
});
