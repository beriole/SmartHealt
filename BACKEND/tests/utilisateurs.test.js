const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin } = require('./auth-helper');

describe('Utilisateurs', () => {
  let admin, patient;

  beforeAll(async () => {
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'U', type_utilisateur: 'ADMIN', sexe: 'M' });
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'U', type_utilisateur: 'PATIENT', sexe: 'F' });
  });

  it('liste les utilisateurs (ADMIN)', async () => {
    const res = await request(app).get('/api/utilisateurs').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('refuse la liste à un non-admin (403)', async () => {
    const res = await request(app).get('/api/utilisateurs').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(403);
  });

  it('exige un token (401)', async () => {
    const res = await request(app).get('/api/utilisateurs/' + patient.id_utilisateur);
    expect(res.statusCode).toBe(401);
  });

  it('récupère mon profil via /me sans le hash', async () => {
    const res = await request(app).get('/api/utilisateurs/me').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_utilisateur).toBe(patient.id_utilisateur);
    expect(res.body.data.mot_de_passe_hash).toBeUndefined();
  });

  it('met à jour son propre profil (champ autorisé)', async () => {
    const res = await request(app)
      .put('/api/utilisateurs/' + patient.id_utilisateur)
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ nom: 'Modifie' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.nom).toBe('Modifie');
  });

  it('ignore les champs sensibles (anti mass-assignment)', async () => {
    const res = await request(app)
      .put('/api/utilisateurs/' + patient.id_utilisateur)
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ prenom: 'Ok', type_utilisateur: 'ADMIN' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.type_utilisateur).toBe('PATIENT'); // inchangé
  });

  it("empêche de modifier le profil d'un autre (403)", async () => {
    const res = await request(app)
      .put('/api/utilisateurs/' + admin.id_utilisateur)
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ nom: 'Pirate' });
    expect(res.statusCode).toBe(403);
  });

  it('archive un utilisateur (ADMIN, soft-delete)', async () => {
    const cible = await registerAndLogin(app, { nom: 'Cible', prenom: 'U', type_utilisateur: 'PATIENT', sexe: 'M' });
    const res = await request(app)
      .delete('/api/utilisateurs/' + cible.id_utilisateur)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut_compte).toBe('inactif_archive');
  });
});
