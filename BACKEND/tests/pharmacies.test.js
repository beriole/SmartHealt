const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin } = require('./auth-helper');

describe('Pharmacies', () => {
  let admin, pharmacien, employe, pharmacieId;

  beforeAll(async () => {
    admin = await registerAndLogin(app, { nom: 'Admin', prenom: 'Ph', type_utilisateur: 'ADMIN', sexe: 'M' });
    pharmacien = await registerAndLogin(app, { nom: 'Resp', prenom: 'Ph', type_utilisateur: 'PHARMACIEN', sexe: 'F' });
    employe = await registerAndLogin(app, { nom: 'Emp', prenom: 'Ph', type_utilisateur: 'INFIRMIER', sexe: 'M' });
  });

  it('crée une pharmacie (PHARMACIEN, responsable = lui-même)', async () => {
    const res = await request(app)
      .post('/api/pharmacies')
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({
        nom_pharmacie: 'Pharmacie Test',
        numero_autorisation: 'AUTH-' + Date.now(),
        adresse: 'Yaoundé',
        latitude: 3.87, longitude: 11.52,
        telephone: '+237690000111',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_pharmacie).toBeDefined();
    expect(res.body.data.id_responsable).toBe(pharmacien.id_utilisateur);
    pharmacieId = res.body.data.id_pharmacie;
  });

  it('liste les pharmacies (public)', async () => {
    const res = await request(app).get('/api/pharmacies');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une pharmacie par ID (public)', async () => {
    const res = await request(app).get('/api/pharmacies/' + pharmacieId);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_pharmacie).toBe(pharmacieId);
  });

  it('met à jour sa pharmacie (PHARMACIEN)', async () => {
    const res = await request(app)
      .put('/api/pharmacies/' + pharmacieId)
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ livraison_disponible: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.livraison_disponible).toBe(true);
  });

  it('ajoute un employé (PHARMACIEN)', async () => {
    const res = await request(app)
      .post(`/api/pharmacies/${pharmacieId}/employes`)
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ email: employe.email, role_employe: 'caissier' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.role_employe).toBe('caissier');
  });

  it('liste les employés', async () => {
    const res = await request(app)
      .get(`/api/pharmacies/${pharmacieId}/employes`)
      .set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('archive une pharmacie (ADMIN, soft-delete)', async () => {
    const res = await request(app)
      .delete('/api/pharmacies/' + pharmacieId)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut).toBe('inactif_archive');
  });
});
