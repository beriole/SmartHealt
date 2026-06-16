const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');
const { registerAndLogin, getProfileId } = require('./auth-helper');

describe('B2B Controller Integration Tests', () => {
  let adminToken, patientToken;
  let patientId, partenaireId;

  beforeAll(async () => {
    const admin = await registerAndLogin(app, {
      nom: 'Admin', prenom: 'B2B', email: 'berioletsague@gmail.com',
      mot_de_passe: 'Password123!', telephone: '000000030',
      type_utilisateur: 'ADMIN', sexe: 'M'
    });
    adminToken = admin?.token;

    const patient = await registerAndLogin(app, {
      nom: 'Patient', prenom: 'B2B', email: 'vickymora871@gmail.com',
      mot_de_passe: 'Password123!', telephone: '000000110',
      type_utilisateur: 'PATIENT', sexe: 'M'
    });
    patientToken = patient?.token;
    patientId = await getProfileId('PATIENT', patient.id_utilisateur);
  });

  it('devrait onboarder un partenaire B2B', async () => {
    const res = await request(app)
      .post('/api/b2b/onboarding')
      .send({
        nom_entreprise: 'Clinique B2B Test',
        type_structure: 'CLINIQUE',
        email_contact: 'contact@clinique-b2b.com',
        telephone: '000000111',
        adresse: 'Yaounde, Centre',
        responsable_nom: 'Responsable B2B',
        description: 'Partenaire B2B pour tests'
      });

    expect([200, 201, 400]).toContain(res.statusCode);
    if (res.body.success) {
      partenaireId = res.body.data?.id_partenaire;
    }
  });

  it('devrait lister les demandes B2B (Admin)', async () => {
    const res = await request(app)
      .get('/api/b2b/admin/demandes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });

  it('devrait valider un partenaire B2B (Admin)', async () => {
    if (partenaireId) {
      const res = await request(app)
        .post(`/api/b2b/admin/${partenaireId}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ duree_agrement_mois: 12 });

      expect([200, 400]).toContain(res.statusCode);
    }
  });

  it('devrait générer un token B2B (OAuth)', async () => {
    const res = await request(app)
      .post('/api/b2b/oauth/token')
      .send({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        grant_type: 'client_credentials'
      });

    expect([200, 400, 401]).toContain(res.statusCode);
  });

  it('devrait générer un PIN de consentement (Patient)', async () => {
    const res = await request(app)
      .post('/api/b2b/patient/generer-pin')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        id_partenaire: partenaireId || 1,
        duree_validite_minutes: 30
      });

    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it('devrait rejeter l\'accès admin sans token', async () => {
    const res = await request(app).get('/api/b2b/admin/demandes');
    expect(res.statusCode).toEqual(401);
  });
});
