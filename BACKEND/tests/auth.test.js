const request = require('supertest');
const app = require('../src/server');

describe('Auth Controller Integration Tests', () => {
  const testUser = {
    nom: 'Test',
    prenom: 'User',
    email: 'testauth@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000010',
    type_utilisateur: 'PATIENT',
    sexe: 'M' // as the Sexe Enum requires 'M', 'F' or 'AUTRE'
  };

  it('devrait enregistrer un nouvel utilisateur avec succès (Patient)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.email).toEqual(testUser.email);
    expect(res.body.data.id_utilisateur).toBeDefined();
  });

  it('devrait retourner une erreur si un champ obligatoire manque', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@gmail.com' });

    expect(res.statusCode).toEqual(400); // Bad Request
    expect(res.body.success).toBeFalsy();
  });

  it('devrait permettre la connexion', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        mot_de_passe: testUser.mot_de_passe
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.utilisateur.email).toEqual(testUser.email);
  });

  it('devrait rejeter une connexion avec mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        mot_de_passe: 'WrongPassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBeFalsy();
  });
});
