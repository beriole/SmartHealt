const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');

describe('Utilisateur Controller Integration Tests', () => {
  let adminToken;
  let adminId;

  beforeAll(async () => {
    // S'inscrire d'abord pour avoir un compte
    const adminUser = {
        nom: 'Admin', prenom: 'Global', email: 'admin.global@test.com',
        mot_de_passe: 'Pswd123!', telephone: 'admin001', type_utilisateur: 'ADMIN', sexe: 'M'
    };

    const res = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = res.body?.data?.token;

    if (!adminToken) {
        const lp = await request(app).post('/api/auth/login').send({ email: adminUser.email, mot_de_passe: adminUser.mot_de_passe });
        adminToken = lp.body.data.token;
    }
    
    adminId = res.body.data.id_utilisateur;
  });

  it('devrait récupérer le profil de l\'utilisateur authentifié (Moi)', async () => {
    const res = await request(app)
      .get('/api/utilisateurs/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.id_utilisateur).toEqual(adminId);
  });

  it('devrait récupérer tous les utilisateurs (Admin uniquement)', async () => {
    const res = await request(app)
      .get('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });
});
