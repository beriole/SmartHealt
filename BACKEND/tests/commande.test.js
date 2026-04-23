const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const notchpayClient = require('../utils/notchpay');

// Mock partial du client NotchPay
jest.mock('../utils/notchpay', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

describe('Commande Controller Integration Tests', () => {
  let patientToken;
  let pharmacieId, stockId, patientId;

  beforeAll(async () => {
    // 1. Inscription Pharmacien
    const pLogin = await request(app).post('/api/auth/register').send({
      nom: 'Pharma', prenom: 'Doc', email: 'pharma.cmd@test.com',
      mot_de_passe: 'Pswd123!', telephone: 'pharma01', type_utilisateur: 'PHARMACIEN', sexe: 'M',
      nom_pharmacie: 'Pharma Test', numero_autorisation: 'AUTH001', adresse: 'Rue Test',
      latitude: '4.0', longitude: '9.7'
    });

    const pharmaRow = await prisma.pharmacie.findFirst({
        where: { responsable: { email: 'pharma.cmd@test.com' } }
    });
    pharmacieId = pharmaRow.id_pharmacie;

    // 2. Inscription Patient
    const patLogin = await request(app).post('/api/auth/register').send({
      nom: 'Pat', prenom: 'Cmd', email: 'pat.cmd@test.com',
      mot_de_passe: 'Pswd123!', telephone: 'pat01', type_utilisateur: 'PATIENT', sexe: 'F'
    });
    let login = await request(app).post('/api/auth/login').send({ email: 'pat.cmd@test.com', mot_de_passe: 'Pswd123!' });
    patientToken = login.body.data.token;
    patientId = patLogin.body.data.id_utilisateur; // it's actually id_utilisateur
    
    // 3. Injecter un médicament & un stock
    const med = await prisma.medicament.create({
      data: {
        nom_commercial: 'Paracetamol', dci: 'Paracetamol', dosage: '500mg',
        forme_galenique: 'comprime', categorie: 'antalgique', necessite_ordonnance: false
      }
    });

    const stock = await prisma.stockPharmacie.create({
      data: { 
          id_pharmacie: pharmacieId, id_medicament: med.id_medicament, 
          quantite_disponible: 100, prix_vente_fcfa: 500 
        }
    });
    stockId = stock.id_stock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  let commandeId;

  it('devrait créer une commande depuis le panier du patient', async () => {
    const res = await request(app)
      .post('/api/commandes')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        id_pharmacie: pharmacieId,
        type_livraison: 'retrait_en_pharmacie',
        lignes: [
          { id_stock: stockId, quantite_commandee: 2 }
        ]
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.montant_total_fcfa).toEqual('1000'); // 500 * 2
    commandeId = res.body.data.id_commande;
  });

  it('devrait simuler l\'initialisation du paiement (NotchPay)', async () => {
    notchpayClient.post.mockResolvedValue({
      data: {
        transaction: { reference: commandeId },
        authorization_url: 'https://pay.notchpay.co/fake'
      }
    });

    const res = await request(app)
      .post(`/api/commandes/${commandeId}/payer`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.authorization_url).toEqual('https://pay.notchpay.co/fake');
    expect(notchpayClient.post).toHaveBeenCalled();
  });
});
