const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Patients', () => {
  let admin, patient, patientId;

  beforeAll(async () => {
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'P', type_utilisateur: 'ADMIN', sexe: 'M' });
    patient = await registerAndLogin(app, { nom: 'Patient', prenom: 'P', type_utilisateur: 'PATIENT', sexe: 'F' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
  });

  it('crée un profil patient + carnet à l’inscription', () => {
    expect(patientId).toBeDefined();
  });

  it('liste les patients (ADMIN)', async () => {
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère un patient par ID (authentifié)', async () => {
    const res = await request(app).get('/api/patients/' + patientId).set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_patient).toBe(patientId);
  });

  it('met à jour les données médicales du patient', async () => {
    const res = await request(app)
      .put('/api/patients/' + patientId)
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ poids_kg: 75.5, taille_cm: 180, groupe_sanguin: 'O_PLUS', allergies_connues: 'Pénicilline' });
    expect(res.statusCode).toBe(200);
    expect(Number(res.body.data.poids_kg)).toBe(75.5);
    expect(res.body.data.taille_cm).toBe(180);
    expect(res.body.data.groupe_sanguin).toBe('O_PLUS');
  });

  it('exige un token (401)', async () => {
    const res = await request(app).get('/api/patients/' + patientId);
    expect(res.statusCode).toBe(401);
  });
});
