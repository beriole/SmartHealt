const request = require('supertest');
const app = require('../src/server');

describe('Auth — Inscription et connexion', () => {
  const unique = `${Date.now()}`;
  const user = {
    nom: 'Test', prenom: 'Auth',
    email: `auth.${unique}@smarthealth.test`,
    mot_de_passe: 'Password123!',
    telephone: `auth${unique}`,
    type_utilisateur: 'PATIENT',
    sexe: 'M',
  };

  it('inscrit un nouvel utilisateur (PATIENT)', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.id_utilisateur).toBeDefined();
  });

  it('refuse une inscription incomplète (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'incomplet@test.cm' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('refuse un email déjà utilisé (400)', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(400);
  });

  it('connecte avec les bons identifiants', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: user.email, mot_de_passe: user.mot_de_passe,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.utilisateur.email).toBe(user.email);
  });

  it('ne renvoie jamais le hash du mot de passe', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: user.email, mot_de_passe: user.mot_de_passe,
    });
    expect(res.body.data.utilisateur.mot_de_passe_hash).toBeUndefined();
  });

  it('rejette un mauvais mot de passe (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: user.email, mot_de_passe: 'MauvaisMotDePasse1!',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('renvoie un refresh token à la connexion', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: user.email, mot_de_passe: user.mot_de_passe,
    });
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.accessToken).toBe(res.body.data.token);
  });
});

describe('Auth — Refresh token', () => {
  const unique = `${Date.now()}`;
  const user = {
    nom: 'Test', prenom: 'Refresh',
    email: `refresh.${unique}@smarthealth.test`,
    mot_de_passe: 'Password123!',
    telephone: `refresh${unique}`,
    type_utilisateur: 'PATIENT',
    sexe: 'M',
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send(user);
  });

  const login = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: user.email, mot_de_passe: user.mot_de_passe,
    });
    return res.body.data;
  };

  it('rafraîchit l\'access token et fait tourner le refresh token', async () => {
    const { refreshToken } = await login();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejette un refresh token déjà utilisé (rotation)', async () => {
    const { refreshToken } = await login();
    await request(app).post('/api/auth/refresh').send({ refreshToken }); // 1er usage : OK
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken }); // rejeu
    expect(res.statusCode).toBe(401);
  });

  it('révoque le refresh token à la déconnexion', async () => {
    const { refreshToken } = await login();
    const out = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(out.statusCode).toBe(200);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.statusCode).toBe(401);
  });

  it('rejette un refresh token inconnu (401)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'token-bidon' });
    expect(res.statusCode).toBe(401);
  });

  it('exige un refresh token (400)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.statusCode).toBe(400);
  });
});
