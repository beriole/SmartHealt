const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin } = require('./auth-helper');

describe('Stocks', () => {
  let pharmacien, medicamentId, stockId;
  const nomMed = 'StockMed ' + Date.now();

  beforeAll(async () => {
    pharmacien = await registerAndLogin(app, { nom: 'Stk', prenom: 'Ph', type_utilisateur: 'PHARMACIEN', sexe: 'F' });

    // Une pharmacie pour ce pharmacien
    await request(app).post('/api/pharmacies').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_pharmacie: 'Pharmacie Stock', numero_autorisation: 'AUTH-STK-' + Date.now(),
      adresse: 'Douala', latitude: 4.05, longitude: 9.7, telephone: '+237690000222',
    });

    // Un médicament
    const med = await request(app).post('/api/medicaments').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_commercial: nomMed, dci: 'TestDCI', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antalgique',
    });
    medicamentId = med.body.data.id_medicament;
  });

  it('ajoute un médicament au stock (mouvement "entree" tracé)', async () => {
    const res = await request(app)
      .post('/api/stocks')
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ id_medicament: medicamentId, quantite_disponible: 100, prix_vente_fcfa: 500, seuil_alerte: 20 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_stock).toBeDefined();
    expect(res.body.data.quantite_disponible).toBe(100);
    stockId = res.body.data.id_stock;
  });

  it('liste mon inventaire (PHARMACIEN)', async () => {
    const res = await request(app).get('/api/stocks/my-stocks').set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('recherche dans le stock global (authentifié)', async () => {
    const res = await request(app).get('/api/stocks/search').query({ medicament: 'StockMed' }).set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('ajuste la quantité (mouvement "ajustement" tracé)', async () => {
    const res = await request(app)
      .put('/api/stocks/' + stockId)
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ quantite_disponible: 50, motif: 'Inventaire' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.quantite_disponible).toBe(50);
  });

  it('retourne l’historique des mouvements (entrée + ajustement)', async () => {
    const res = await request(app).get(`/api/stocks/${stockId}/mouvements`).set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('retourne les alertes de stock', async () => {
    const res = await request(app).get('/api/stocks/alertes').set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('ruptures');
    expect(res.body.data).toHaveProperty('peremptions');
  });

  it('supprime un stock (PHARMACIEN)', async () => {
    const res = await request(app).delete('/api/stocks/' + stockId).set('Authorization', `Bearer ${pharmacien.token}`);
    expect(res.statusCode).toBe(200);
  });

  it('exige un token (401)', async () => {
    const res = await request(app).get('/api/stocks/my-stocks');
    expect(res.statusCode).toBe(401);
  });
});
