const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('Carnet de Santé Controller Integration Tests', () => {
  let patientToken, medecinToken, adminToken;
  let patientId, medecinId, carnetId;

  beforeAll(async () => {
    const patient = await registerAndLogin(app, {
      nom: 'Patient', prenom: 'Carnet', email: 'berioletsague@gmail.com',
      mot_de_passe: 'Password123!', telephone: '000000070',
      type_utilisateur: 'PATIENT', sexe: 'M'
    });
    patientToken = patient?.token;
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);

    const medecin = await registerAndLogin(app, {
      nom: 'Docteur', prenom: 'Carnet', email: 'bernardmama95@gmail.com',
      mot_de_passe: 'Password123!', telephone: '000000071',
      type_utilisateur: 'MEDECIN', sexe: 'M',
      specialite: 'Generaliste', numero_ordre: 'ORD-001', structure_exercice: 'Hopital Carnet'
    });
    medecinToken = medecin?.token;
    medecinId = await getProfileId('MEDECIN', medecin.id_utilisateur);

    const admin = await registerAndLogin(app, {
      nom: 'Admin', prenom: 'Test', email: 'berioletsague@gmail.com',
      mot_de_passe: 'Password123!', telephone: '000000030',
      type_utilisateur: 'ADMIN', sexe: 'M'
    });
    adminToken = admin?.token;

    if (patientId) {
      let carnet = await prisma.carnetSante.findFirst({ where: { id_patient: patientId } });
      if (!carnet) {
        carnet = await prisma.carnetSante.create({
          data: { id_patient: patientId, qr_code_token: 'test-carnet-qr-token-' + Date.now() }
        });
      }
      carnetId = carnet.id_carnet;
    }
  });

  it('devrait récupérer son propre carnet de santé (Patient)', async () => {
    const res = await request(app)
      .get('/api/carnets/my-carnet')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });

  it('devrait régénérer le QR code du carnet (Patient)', async () => {
    const res = await request(app)
      .post('/api/carnets/my-carnet/regenerate-qr')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });

  it('devrait scanner un carnet via QR token (Médecin)', async () => {
    const carnet = await prisma.carnetSante.findUnique({ where: { id_carnet: carnetId } });
    expect(carnet?.qr_code_token).toBeTruthy();

    const res = await request(app)
      .get(`/api/carnets/scan/${carnet.qr_code_token}`)
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.id_carnet).toBe(carnetId);
  });

  it('devrait lister tous les carnets (Admin)', async () => {
    const res = await request(app)
      .get('/api/carnets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });

  it('devrait récupérer un carnet par ID (Admin)', async () => {
    if (carnetId) {
      const res = await request(app)
        .get(`/api/carnets/${carnetId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
    }
  });

  it('devrait mettre à jour un carnet (Admin)', async () => {
    if (carnetId) {
      const res = await request(app)
        .put(`/api/carnets/${carnetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Carnet mis à jour par test' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
    }
  });

  it('devrait rejeter l\'accès au carnet sans token', async () => {
    const res = await request(app).get('/api/carnets/my-carnet');
    expect(res.statusCode).toEqual(401);
  });
});
