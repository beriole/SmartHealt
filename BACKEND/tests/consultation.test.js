const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');

describe('Consultation Controller Integration Tests', () => {
  let patientToken, profToken;
  let patientId, profId, carnetId;
  let consultationId;

  beforeAll(async () => {
    // 1. Créer Patient
    const pLogin = await request(app).post('/api/auth/register').send({
      nom: 'P', prenom: 'A', email: 'pat.consult@test.com',
      mot_de_passe: 'Pswd123!', telephone: '0001', type_utilisateur: 'PATIENT', sexe: 'M'
    });
    patientToken = pLogin.body?.data?.token;
    
    if(!patientToken) {
        const lp = await request(app).post('/api/auth/login').send({ email: 'pat.consult@test.com', mot_de_passe: 'Pswd123!' });
        patientToken = lp.body.data.token;
    }
    const patRow = await prisma.patient.findUnique({ where: { id_utilisateur: pLogin.body.data.id_utilisateur }});
    patientId = patRow.id_patient;

    // 2. Créer Professionnel
    const pfLogin = await request(app).post('/api/auth/register').send({
      nom: 'Doc', prenom: 'T', email: 'doc.consult@test.com',
      mot_de_passe: 'Pswd123!', telephone: '0002', type_utilisateur: 'MEDECIN', sexe: 'F',
      specialite: 'Généraliste', structure_exercice: 'Clinique Test'
    });
    profToken = pfLogin.body?.data?.token;
    if(!profToken) {
       const lpf = await request(app).post('/api/auth/login').send({ email: 'doc.consult@test.com', mot_de_passe: 'Pswd123!' });
       profToken = lpf.body.data.token;
    }
    const pfRow = await prisma.professionnelSante.findUnique({ where: { id_utilisateur: pfLogin.body.data.id_utilisateur }});
    profId = pfRow.id_professionnel;

    // Carnet
    const carnet = await prisma.carnetSante.findFirst({ where: { id_patient: patientId }});
    carnetId = carnet.id_carnet;
  });

  it('devrait permettre de créer une nouvelle consultation (par un médecin)', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${profToken}`)
      .send({
        id_patient: patientId,
        id_carnet: carnetId,
        motif: 'Fièvre',
        type_consultation: 'presentiel',
        date_consultation: new Date().toISOString()
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data.motif).toEqual('Fièvre');
    consultationId = res.body.data.id_consultation;
  });

  it('devrait récupérer les consultations du médecin', async () => {
    const res = await request(app)
      .get('/api/consultations/prof')
      .set('Authorization', `Bearer ${profToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    // Assuming backend returns an array directly or inside data.data
    const data = res.body.data.data || res.body.data;
    expect(data.some(c => c.id_consultation === consultationId)).toBe(true);
  });
});
