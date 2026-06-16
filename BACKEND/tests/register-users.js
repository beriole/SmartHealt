require('dotenv').config({ path: __dirname + '/../.env' });
const request = require('supertest');
const app = require('../src/server');
const { prisma } = require('../services/database');

const testUsers = [
  {
    label: 'ADMIN',
    email: 'berioletsague@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000030',
    type_utilisateur: 'ADMIN',
    nom: 'Admin',
    prenom: 'Test',
    sexe: 'M'
  },
  {
    label: 'PHARMACIEN',
    email: 'angelleg888@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000031',
    type_utilisateur: 'PHARMACIEN',
    nom: 'Pharma',
    prenom: 'Cien',
    sexe: 'F'
  },
  {
    label: 'INFIRMIER',
    email: 'djeumenimadimi@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000051',
    type_utilisateur: 'INFIRMIER',
    nom: 'Infirmier',
    prenom: 'Test',
    sexe: 'M',
    specialite: 'Soins',
    numero_ordre: 'INF-001',
    structure_exercice: 'Clinique Test'
  },
  {
    label: 'MEDECIN',
    email: 'bernardmama95@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000041',
    type_utilisateur: 'MEDECIN',
    nom: 'Docteur',
    prenom: 'Med',
    sexe: 'M',
    specialite: 'Generaliste',
    numero_ordre: 'MED-001',
    structure_exercice: 'Hopital Test'
  },
  {
    label: 'PATIENT',
    email: 'vickymora871@gmail.com',
    mot_de_passe: 'Password123!',
    telephone: '000000060',
    type_utilisateur: 'PATIENT',
    nom: 'Patient',
    prenom: 'Test',
    sexe: 'F'
  }
];

async function registerAll() {
  console.log('=== SmartHealth Test User Registration ===\n');

  for (const user of testUsers) {
    console.log(`\n--- Processing ${user.label}: ${user.email} ---`);

    try {
      // Check if user already exists
      const existing = await prisma.utilisateur.findUnique({
        where: { email: user.email }
      });

      if (existing) {
        if (existing.email_verifie) {
          console.log(`VERIFIED - ${user.email} is already verified. Ready for tests.`);
        } else {
          console.log(`UNVERIFIED - ${user.email} exists but not verified.`);
          console.log(`   Deleting old unverified account to get fresh verification email...`);
          
          // Delete related records first
          await prisma.patient.deleteMany({ where: { id_utilisateur: existing.id_utilisateur } }).catch(() => {});
          await prisma.professionnelSante.deleteMany({ where: { id_utilisateur: existing.id_utilisateur } }).catch(() => {});
          await prisma.livreur.deleteMany({ where: { id_utilisateur: existing.id_utilisateur } }).catch(() => {});
          await prisma.utilisateur.delete({ where: { id_utilisateur: existing.id_utilisateur } }).catch(() => {});
          
          // Register fresh
          const res = await request(app).post('/api/auth/register').send(user);
          if (res.statusCode === 201) {
            console.log(`   FRESH REGISTRATION SUCCESS`);
            console.log(`   Check your inbox at ${user.email} for verification email`);
          } else {
            console.log(`   Registration failed: ${res.body.message}`);
          }
        }
      } else {
        // Register new user
        const res = await request(app).post('/api/auth/register').send(user);

        if (res.statusCode === 201) {
          console.log(`SUCCESS - Check your inbox at ${user.email}`);
          console.log(`   ${res.body.message}`);
        } else {
          console.log(`FAILED - ${res.body.message || res.statusCode}`);
        }
      }
    } catch (error) {
      console.log(`ERROR - ${error.message.substring(0, 200)}`);
    }

    console.log('');
  }

  await prisma.$disconnect();
  console.log('\n=== Registration Complete ===');
  console.log('Please check each email inbox and click the verification link.');
  console.log('After verifying all emails, run: npm test');
  process.exit(0);
}

registerAll();
