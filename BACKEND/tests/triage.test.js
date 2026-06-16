const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Triage IA', () => {
  let patient, medecin, patientId, triageId;

  beforeAll(async () => {
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'T', type_utilisateur: 'PATIENT', sexe: 'F' });
    medecin = await registerAndLogin(app, { nom: 'Doc', prenom: 'T', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Généraliste' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
  });

  it('crée une session de triage (authentifié)', async () => {
    const res = await request(app)
      .post('/api/triage')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        id_patient: patientId,
        symptomes_declares: { symptomes: ['fievre', 'maux_de_tete'], duree: '2 jours' },
        resultats_analyse: { maladies: [{ maladie: 'Paludisme', probabilite: 70 }] },
        recommandation: 'Consulter un médecin rapidement',
        niveau_urgence: 'urgent',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_triage).toBeDefined();
    triageId = res.body.data.id_triage;
  });

  it('liste les sessions de triage (MEDECIN)', async () => {
    const res = await request(app).get('/api/triage').set('Authorization', `Bearer ${medecin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une session par ID', async () => {
    const res = await request(app).get('/api/triage/' + triageId).set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_triage).toBe(triageId);
  });

  it('met à jour le suivi', async () => {
    const res = await request(app).put('/api/triage/' + triageId + '/suivi').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.suivi_pris).toBe(true);
  });

  it('exige un token (401)', async () => {
    const res = await request(app).post('/api/triage').send({});
    expect(res.statusCode).toBe(401);
  });
});
