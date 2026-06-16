const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin } = require('./auth-helper');

describe('Médicaments', () => {
  let pharmacien, medicamentId;

  beforeAll(async () => {
    pharmacien = await registerAndLogin(app, { nom: 'Pharma', prenom: 'M', type_utilisateur: 'PHARMACIEN', sexe: 'F' });
  });

  it('crée un médicament (PHARMACIEN)', async () => {
    const res = await request(app)
      .post('/api/medicaments')
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({
        nom_commercial: 'Paracetamol Test ' + Date.now(),
        dci: 'Paracétamol',
        forme_galenique: 'comprime',
        dosage: '500 mg',
        categorie: 'antalgique',
        prix_indicatif_fcfa: 500,
        necessite_ordonnance: false,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_medicament).toBeDefined();
    medicamentId = res.body.data.id_medicament;
  });

  it('liste les médicaments (public)', async () => {
    const res = await request(app).get('/api/medicaments').query({ page: 1, limit: 10 });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère un médicament par ID (public)', async () => {
    const res = await request(app).get('/api/medicaments/' + medicamentId);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_medicament).toBe(medicamentId);
  });

  it('met à jour le prix d’un médicament (PHARMACIEN)', async () => {
    const res = await request(app)
      .put('/api/medicaments/' + medicamentId)
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ prix_indicatif_fcfa: 600 });
    expect(res.statusCode).toBe(200);
    expect(Number(res.body.data.prix_indicatif_fcfa)).toBe(600);
  });

  it('rejette la création sans authentification (401)', async () => {
    const res = await request(app).post('/api/medicaments').send({
      nom_commercial: 'X', dci: 'X', forme_galenique: 'comprime', dosage: '1', categorie: 'autre',
    });
    expect(res.statusCode).toBe(401);
  });
});
