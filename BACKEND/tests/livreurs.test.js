const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Livreurs', () => {
  let livreur, admin, livreurId;

  beforeAll(async () => {
    livreur = await registerAndLogin(app, { nom: 'Liv', prenom: 'L', type_utilisateur: 'LIVREUR', sexe: 'M' });
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'L', type_utilisateur: 'ADMIN', sexe: 'M' });
    livreurId = await getProfileId('LIVREUR', livreur.id_utilisateur);
  });

  it('crée le profil livreur automatiquement à l’inscription', () => {
    expect(livreurId).toBeDefined();
  });

  it('refuse un second profil livreur (déjà existant, 400)', async () => {
    const res = await request(app).post('/api/livreurs/register').set('Authorization', `Bearer ${livreur.token}`).send({ vehicule_type: 'Moto' });
    expect(res.statusCode).toBe(400);
  });

  it('met à jour la position GPS (LIVREUR)', async () => {
    const res = await request(app)
      .put('/api/livreurs/position')
      .set('Authorization', `Bearer ${livreur.token}`)
      .send({ latitude: 3.87, longitude: 11.52 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.latitude).toBe(3.87);
  });

  it('change la disponibilité (LIVREUR)', async () => {
    const res = await request(app)
      .put('/api/livreurs/disponibilite')
      .set('Authorization', `Bearer ${livreur.token}`)
      .send({ disponible: false });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.disponible).toBe(false);
  });

  it('vérifie un livreur (ADMIN)', async () => {
    const res = await request(app)
      .post('/api/livreurs/' + livreurId + '/verify')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ statut_verification: 'verifie' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut_verification).toBe('verifie');
  });

  it('liste les livreurs (ADMIN)', async () => {
    const res = await request(app).get('/api/livreurs').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('expose le tableau de bord du livreur', async () => {
    const res = await request(app).get('/api/livreurs/dashboard').set('Authorization', `Bearer ${livreur.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_livreur).toBe(livreurId);
  });

  it('exige un token (401)', async () => {
    const res = await request(app).get('/api/livreurs/dashboard');
    expect(res.statusCode).toBe(401);
  });
});
