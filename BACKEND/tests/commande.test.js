const request = require('supertest');
const app = require('../src/server');
const { registerAndLogin } = require('./auth-helper');

describe('Commandes', () => {
  let patient, pharmacien, stockId, pharmacieId, commandeId;

  beforeAll(async () => {
    patient = await registerAndLogin(app, { nom: 'Pat', prenom: 'Cmd', type_utilisateur: 'PATIENT', sexe: 'F' });
    pharmacien = await registerAndLogin(app, { nom: 'Pha', prenom: 'Cmd', type_utilisateur: 'PHARMACIEN', sexe: 'M' });

    const ph = await request(app).post('/api/pharmacies').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_pharmacie: 'Pharmacie Cmd', numero_autorisation: 'AUTH-CMD-' + Date.now(),
      adresse: 'Yaoundé', latitude: 3.87, longitude: 11.52, telephone: '+237690000333',
    });
    pharmacieId = ph.body.data.id_pharmacie;

    const med = await request(app).post('/api/medicaments').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_commercial: 'CmdMed ' + Date.now(), dci: 'X', forme_galenique: 'comprime', dosage: '500 mg',
      categorie: 'antalgique', necessite_ordonnance: false,
    });
    const medicamentId = med.body.data.id_medicament;

    const stock = await request(app).post('/api/stocks').set('Authorization', `Bearer ${pharmacien.token}`).send({
      id_medicament: medicamentId, quantite_disponible: 100, prix_vente_fcfa: 500, seuil_alerte: 10,
    });
    stockId = stock.body.data.id_stock;
  });

  it('crée une commande depuis le panier (PATIENT)', async () => {
    const res = await request(app)
      .post('/api/commandes')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        id_pharmacie: pharmacieId,
        type_livraison: 'retrait_en_pharmacie',
        lignes: [{ id_stock: stockId, quantite_commandee: 2 }],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.id_commande).toBeDefined();
    expect(Number(res.body.data.montant_total_fcfa)).toBe(1000); // 2 x 500
    commandeId = res.body.data.id_commande;
  });

  it('refuse une commande à un non-patient (403)', async () => {
    const res = await request(app)
      .post('/api/commandes')
      .set('Authorization', `Bearer ${pharmacien.token}`)
      .send({ id_pharmacie: pharmacieId, type_livraison: 'retrait_en_pharmacie', lignes: [{ id_stock: stockId, quantite_commandee: 1 }] });
    expect(res.statusCode).toBe(403);
  });

  it('refuse une commande sans ligne (400 validation)', async () => {
    const res = await request(app)
      .post('/api/commandes')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ id_pharmacie: pharmacieId, type_livraison: 'retrait_en_pharmacie', lignes: [] });
    expect(res.statusCode).toBe(400);
  });

  it('liste les commandes (authentifié)', async () => {
    const res = await request(app).get('/api/commandes').set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('récupère une commande par ID', async () => {
    const res = await request(app).get('/api/commandes/' + commandeId).set('Authorization', `Bearer ${patient.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id_commande).toBe(commandeId);
  });
});
