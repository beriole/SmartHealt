const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');

describe('Patient Controller Integration Tests', () => {
  let token;
  let patientId;
  let userId;

  const testUser = {
    nom: 'Doe',
    prenom: 'John',
    email: 'johndoe.patient@test.com',
    mot_de_passe: 'Password123!',
    telephone: '000000020',
    type_utilisateur: 'PATIENT',
    sexe: 'M'
  };

  beforeAll(async () => {
    // S'inscrire d'abord pour avoir un compte
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    userId = res.body.data.id_utilisateur;
    token = res.body.data.token; // si l'inscription renvoie un token, sinon on se connectera.
    
    if (!token) {
       const login = await request(app).post('/api/auth/login').send({ email: testUser.email, mot_de_passe: testUser.mot_de_passe });
       token = login.body.data.token;
    }

    // Récupérer le patient lié à cet utilisateur
    const patientRow = await prisma.patient.findUnique({ where: { id_utilisateur: userId }});
    patientId = patientRow.id_patient;
  });

  it('devrait récupérer la liste des patients', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(Array.isArray(res.body.data.data)).toBe(true);
    // Au moins le patient qu'on vient de créer doit y être
    expect(res.body.data.total).toBeGreaterThanOrEqual(1); 
  });

  it('devrait récupérer les détails du profil patient par ID', async () => {
    const res = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.id_patient).toEqual(patientId);
  });

  it('devrait mettre à jour son propre profil', async () => {
    const res = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        poids_kg: 75.5,
        taille_cm: 180,
        groupe_sanguin: 'O_PLUS'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.poids_kg).toEqual(75.5);
    expect(res.body.data.taille_cm).toEqual(180);
    expect(res.body.data.groupe_sanguin).toEqual('O_PLUS');
  });
});
