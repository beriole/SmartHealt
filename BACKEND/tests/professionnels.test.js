const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Professionnels de santé', () => {
  let admin, medecin, medecinProId;

  beforeAll(async () => {
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'Pro', type_utilisateur: 'ADMIN', sexe: 'M' });
    medecin = await registerAndLogin(app, { nom: 'Doc', prenom: 'Pro', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Cardiologie' });
    medecinProId = await getProfileId('MEDECIN', medecin.id_utilisateur);
  });

  it('crée un profil professionnel à l’inscription d’un médecin', () => {
    expect(medecinProId).toBeDefined();
  });

  it('liste les professionnels (public)', async () => {
    const res = await request(app).get('/api/professionnels');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère un professionnel par ID (public)', async () => {
    const res = await request(app).get('/api/professionnels/' + medecinProId);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_professionnel).toBe(medecinProId);
  });

  it('vérifie un professionnel (ADMIN)', async () => {
    const res = await request(app)
      .post('/api/professionnels/' + medecinProId + '/verify')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ statut_verification: 'verifie', notes_verification: 'Dossier conforme' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut_verification).toBe('verifie');
  });

  it('rejette la vérification par un non-admin (403)', async () => {
    const res = await request(app)
      .post('/api/professionnels/' + medecinProId + '/verify')
      .set('Authorization', `Bearer ${medecin.token}`)
      .send({ statut_verification: 'verifie' });
    expect(res.statusCode).toBe(403);
  });
});
