const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

/**
 * Parcours patient complet de bout en bout :
 * inscription → consultation → ordonnance → pharmacie/stock → commande.
 */
describe('E2E — Parcours patient complet', () => {
  let patient, medecin, pharmacien, admin;
  let patientId, carnetId, consultationId, ordonnanceId, medicamentId, stockId, pharmacieId, commandeId;

  beforeAll(async () => {
    patient = await registerAndLogin(app, { nom: 'E2E', prenom: 'Patient', type_utilisateur: 'PATIENT', sexe: 'M' });
    medecin = await registerAndLogin(app, { nom: 'E2E', prenom: 'Medecin', type_utilisateur: 'MEDECIN', sexe: 'M', specialite: 'Généraliste' });
    pharmacien = await registerAndLogin(app, { nom: 'E2E', prenom: 'Pharma', type_utilisateur: 'PHARMACIEN', sexe: 'F' });
    admin = await registerAndLogin(app, { nom: 'E2E', prenom: 'Admin', type_utilisateur: 'ADMIN', sexe: 'M' });
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
    const carnet = await prisma.carnetSante.findUnique({ where: { id_patient: patientId } });
    carnetId = carnet.id_carnet;
  });

  it('1. le patient possède un carnet de santé', () => {
    expect(carnetId).toBeDefined();
  });

  it('2. le médecin crée une consultation', async () => {
    const res = await request(app).post('/api/consultations').set('Authorization', `Bearer ${medecin.token}`).send({
      id_patient: patientId, id_carnet: carnetId, date_consultation: new Date().toISOString(),
      motif: 'Fièvre et fatigue', diagnostic: 'Paludisme', type_consultation: 'presentiel',
    });
    expect(res.statusCode).toBe(201);
    consultationId = res.body.data.id_consultation;
  });

  it('3. la pharmacie est créée avec un médicament en stock', async () => {
    const ph = await request(app).post('/api/pharmacies').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_pharmacie: 'Pharmacie E2E', numero_autorisation: 'AUTH-E2E-' + Date.now(),
      adresse: 'Yaoundé', latitude: 3.87, longitude: 11.52, telephone: '+237690000444',
    });
    pharmacieId = ph.body.data.id_pharmacie;

    const med = await request(app).post('/api/medicaments').set('Authorization', `Bearer ${pharmacien.token}`).send({
      nom_commercial: 'E2EMed ' + Date.now(), dci: 'Artéméther', forme_galenique: 'comprime',
      dosage: '20 mg', categorie: 'antiparasitaire', necessite_ordonnance: false,
    });
    medicamentId = med.body.data.id_medicament;

    const stock = await request(app).post('/api/stocks').set('Authorization', `Bearer ${pharmacien.token}`).send({
      id_medicament: medicamentId, quantite_disponible: 50, prix_vente_fcfa: 4500, seuil_alerte: 10,
    });
    stockId = stock.body.data.id_stock;
    expect(stockId).toBeDefined();
  });

  it('4. le médecin émet une ordonnance', async () => {
    const res = await request(app).post('/api/ordonnances').set('Authorization', `Bearer ${medecin.token}`).send({
      id_consultation: consultationId, id_patient: patientId,
      date_expiration: new Date(Date.now() + 30 * 86400000).toISOString(),
      lignes: [{ id_medicament: medicamentId, quantite: 1, duree_traitement_jours: 3, posologie: '1 cp x2/j' }],
    });
    expect(res.statusCode).toBe(201);
    ordonnanceId = res.body.data.id_ordonnance;
  });

  it('5. le patient commande le médicament', async () => {
    const res = await request(app).post('/api/commandes').set('Authorization', `Bearer ${patient.token}`).send({
      id_pharmacie: pharmacieId, type_livraison: 'retrait_en_pharmacie',
      lignes: [{ id_stock: stockId, quantite_commandee: 1 }],
    });
    expect(res.statusCode).toBe(201);
    expect(Number(res.body.data.montant_total_fcfa)).toBe(4500);
    commandeId = res.body.data.id_commande;
  });

  it('6. le stock a été décrémenté après la commande', async () => {
    const stock = await prisma.stockPharmacie.findUnique({ where: { id_stock: stockId } });
    expect(stock.quantite_disponible).toBe(49);
  });

  it('7. l’admin retrouve la commande dans la liste', async () => {
    const res = await request(app).get('/api/commandes').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    const ids = res.body.data.data.map(c => c.id_commande);
    expect(ids).toContain(commandeId);
  });
});
