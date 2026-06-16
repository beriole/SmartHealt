const { prisma, connectDatabase, disconnectDatabase } = require('../services/database');
const { hashPassword, generateNumeroCarnet, generateUUID } = require('../utils/helpers');

// ============================================================
// Données de démonstration SmartHealth
// Idempotent : peut être relancé sans créer de doublons.
// Mot de passe commun à tous les comptes de démo : Password123!
// ============================================================

const MOT_DE_PASSE_DEMO = 'Password123!';

const medicamentsData = [
  { nom_commercial: 'Doliprane 500mg', dci: 'Paracétamol', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antalgique', prix_indicatif_fcfa: 500 },
  { nom_commercial: 'Doliprane 1g', dci: 'Paracétamol', forme_galenique: 'comprime', dosage: '1 g', categorie: 'antalgique', prix_indicatif_fcfa: 1000 },
  { nom_commercial: 'Efferalgan Pédiatrique', dci: 'Paracétamol', forme_galenique: 'sirop', dosage: '30 mg/ml', categorie: 'antalgique', prix_indicatif_fcfa: 1800 },
  { nom_commercial: 'Ibuprofène 400mg', dci: 'Ibuprofène', forme_galenique: 'comprime', dosage: '400 mg', categorie: 'antalgique', prix_indicatif_fcfa: 1200 },
  { nom_commercial: 'Amoxicilline 500mg', dci: 'Amoxicilline', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antibiotique', prix_indicatif_fcfa: 1500, necessite_ordonnance: true },
  { nom_commercial: 'Clamoxyl 1g', dci: 'Amoxicilline', forme_galenique: 'comprime', dosage: '1 g', categorie: 'antibiotique', prix_indicatif_fcfa: 3000, necessite_ordonnance: true },
  { nom_commercial: 'Coartem', dci: 'Artéméther/Luméfantrine', forme_galenique: 'comprime', dosage: '20 mg/120 mg', categorie: 'antiparasitaire', prix_indicatif_fcfa: 4500, necessite_ordonnance: true },
  { nom_commercial: 'Arsucam', dci: 'Artésunate/Amodiaquine', forme_galenique: 'comprime', dosage: '100 mg/270 mg', categorie: 'antiparasitaire', prix_indicatif_fcfa: 2800, necessite_ordonnance: true },
  { nom_commercial: 'Quinine 300mg', dci: 'Quinine', forme_galenique: 'comprime', dosage: '300 mg', categorie: 'antiparasitaire', prix_indicatif_fcfa: 2000, necessite_ordonnance: true },
  { nom_commercial: 'Flagyl 500mg', dci: 'Métronidazole', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antibiotique', prix_indicatif_fcfa: 1800, necessite_ordonnance: true },
  { nom_commercial: 'Smecta', dci: 'Diosmectite', forme_galenique: 'sirop', dosage: '3 g/sachet', categorie: 'autre', prix_indicatif_fcfa: 2500 },
  { nom_commercial: 'Maxilase Sirop', dci: 'Alpha-amylase', forme_galenique: 'sirop', dosage: '200 U.CEIP/ml', categorie: 'autre', prix_indicatif_fcfa: 2500 },
  { nom_commercial: 'Betadine Dermique', dci: 'Povidone iodée', forme_galenique: 'creme', dosage: '10%', categorie: 'autre', prix_indicatif_fcfa: 2000 },
  { nom_commercial: 'Sérum Oral (SRO)', dci: 'Sels de réhydratation orale', forme_galenique: 'sirop', dosage: 'sachet', categorie: 'autre', prix_indicatif_fcfa: 300 },
  { nom_commercial: 'Vaccin BCG', dci: 'Bacille de Calmette et Guérin', forme_galenique: 'injection', dosage: '0.05 ml', categorie: 'vaccin', prix_indicatif_fcfa: null, necessite_ordonnance: true },
];

// Utilisateurs de démo (tous vérifiés). Le profil métier est créé selon le type.
const utilisateursData = [
  { email: 'admin@smarthealth.cm', type_utilisateur: 'ADMIN', nom: 'Admin', prenom: 'Système', sexe: 'M', telephone: '+237690000001' },
  { email: 'dr.kamga@smarthealth.cm', type_utilisateur: 'MEDECIN', nom: 'Kamga', prenom: 'Jean', sexe: 'M', telephone: '+237690000002', numero_ordre: 'MED-2024-001', specialite: 'Médecine générale', structure_exercice: 'Hôpital Central de Yaoundé' },
  { email: 'dr.nguemo@smarthealth.cm', type_utilisateur: 'MEDECIN', nom: 'Nguemo', prenom: 'Sandrine', sexe: 'F', telephone: '+237690000003', numero_ordre: 'MED-2024-002', specialite: 'Pédiatrie', structure_exercice: 'Clinique de la Cité Verte' },
  { email: 'inf.mballa@smarthealth.cm', type_utilisateur: 'INFIRMIER', nom: 'Mballa', prenom: 'Paul', sexe: 'M', telephone: '+237690000004', numero_ordre: 'INF-2024-010', specialite: 'Soins à domicile', structure_exercice: 'SmartHealth Domicile' },
  { email: 'livreur.tene@smarthealth.cm', type_utilisateur: 'LIVREUR', nom: 'Tene', prenom: 'Eric', sexe: 'M', telephone: '+237690000005', vehicule_type: 'Moto', plaque_immatriculation: 'CE-2024-AB' },
  { email: 'pharm.essomba@smarthealth.cm', type_utilisateur: 'PHARMACIEN', nom: 'Essomba', prenom: 'Marie', sexe: 'F', telephone: '+237690000006' },
  { email: 'pharm.fouda@smarthealth.cm', type_utilisateur: 'PHARMACIEN', nom: 'Fouda', prenom: 'Joseph', sexe: 'M', telephone: '+237690000007' },
  { email: 'patient.aya@smarthealth.cm', type_utilisateur: 'PATIENT', nom: 'Aya', prenom: 'Christelle', sexe: 'F', telephone: '+237690000008', date_naissance: '1995-03-12', allergies_connues: 'Pénicilline', antecedents_medicaux: 'Aucun', groupe_sanguin: 'O_PLUS' },
  { email: 'patient.bilo@smarthealth.cm', type_utilisateur: 'PATIENT', nom: 'Bilo', prenom: 'Armand', sexe: 'M', telephone: '+237690000009', date_naissance: '1980-07-22', allergies_connues: 'Aucune', antecedents_medicaux: 'Hypertension', groupe_sanguin: 'A_PLUS' },
  { email: 'patient.ndi@smarthealth.cm', type_utilisateur: 'PATIENT', nom: 'Ndi', prenom: 'Sarah', sexe: 'F', telephone: '+237690000010', date_naissance: '2018-11-05', allergies_connues: 'Aucune', antecedents_medicaux: 'Drépanocytose', groupe_sanguin: 'AB_PLUS' },
];

const pharmaciesData = [
  { responsableEmail: 'pharm.essomba@smarthealth.cm', nom_pharmacie: 'Pharmacie de la Cité Verte', numero_autorisation: 'PHARM-YDE-001', adresse: 'Cité Verte, Yaoundé', latitude: 3.8721, longitude: 11.5021, telephone: '+237222000001', livraison_disponible: true, rayon_livraison_km: 10 },
  { responsableEmail: 'pharm.fouda@smarthealth.cm', nom_pharmacie: 'Pharmacie du Centre', numero_autorisation: 'PHARM-YDE-002', adresse: 'Avenue Kennedy, Yaoundé', latitude: 3.8667, longitude: 11.5167, telephone: '+237222000002', livraison_disponible: true, rayon_livraison_km: 15 },
];

const articlesData = [
  { titre: 'Paludisme : reconnaître les signes et agir vite', categorie: 'sensibilisation', contenu: 'Le paludisme reste la première cause de consultation au Cameroun. Fièvre, frissons, maux de tête et courbatures doivent amener à consulter rapidement. Dormez sous moustiquaire imprégnée et consultez dès les premiers symptômes.' },
  { titre: 'Bien conserver ses médicaments à la maison', categorie: 'conseil_medical', contenu: "Conservez vos médicaments dans un endroit sec, à l'abri de la chaleur et hors de portée des enfants. Vérifiez régulièrement les dates de péremption et ne consommez jamais un médicament périmé." },
  { titre: "L'hypertension, un tueur silencieux", categorie: 'article_sante', contenu: "L'hypertension artérielle ne provoque souvent aucun symptôme mais augmente fortement le risque d'AVC et de maladies cardiaques. Faites contrôler votre tension régulièrement et limitez le sel." },
];

async function upsertUtilisateur(data) {
  const existant = await prisma.utilisateur.findUnique({ where: { email: data.email } });
  if (existant) return existant;

  const { numero_ordre, specialite, structure_exercice, groupe_sanguin, vehicule_type, plaque_immatriculation,
          allergies_connues, antecedents_medicaux, date_naissance, ...userData } = data;

  const hash = await hashPassword(MOT_DE_PASSE_DEMO);

  return prisma.$transaction(async (tx) => {
    const utilisateur = await tx.utilisateur.create({
      data: {
        ...userData,
        mot_de_passe_hash: hash,
        email_verifie: new Date(),
        date_naissance: date_naissance ? new Date(date_naissance) : null,
      },
    });

    if (utilisateur.type_utilisateur === 'PATIENT') {
      const patient = await tx.patient.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          numero_carnet: generateNumeroCarnet(),
          groupe_sanguin: groupe_sanguin || null,
          allergies_connues: allergies_connues || null,
          antecedents_medicaux: antecedents_medicaux || null,
        },
      });
      await tx.carnetSante.create({
        data: { id_patient: patient.id_patient, qr_code_token: generateUUID(), acces_actif: true },
      });
    } else if (['MEDECIN', 'INFIRMIER'].includes(utilisateur.type_utilisateur)) {
      await tx.professionnelSante.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          numero_ordre,
          specialite: specialite || (utilisateur.type_utilisateur === 'INFIRMIER' ? 'Soins infirmiers' : 'Médecine générale'),
          structure_exercice: structure_exercice || 'Non précisé',
          statut_verification: 'verifie',
        },
      });
    } else if (utilisateur.type_utilisateur === 'LIVREUR') {
      await tx.livreur.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          vehicule_type: vehicule_type || null,
          plaque_immatriculation: plaque_immatriculation || null,
          statut_verification: 'verifie',
        },
      });
    }

    return utilisateur;
  });
}

/**
 * Crée un traitement complet de démonstration pour patient.aya :
 * consultation → ordonnance → rappel → prises (passées avec ~70% d'observance,
 * et 3 jours de prises futures pour la prédiction d'observance).
 */
async function seedTraitementDemo(medsParNom) {
  const patientUser = await prisma.utilisateur.findUnique({ where: { email: 'patient.aya@smarthealth.cm' } });
  const patient = await prisma.patient.findUnique({ where: { id_utilisateur: patientUser.id_utilisateur }, include: { carnet: true } });
  const medecinUser = await prisma.utilisateur.findUnique({ where: { email: 'dr.kamga@smarthealth.cm' } });
  const medecin = await prisma.professionnelSante.findUnique({ where: { id_utilisateur: medecinUser.id_utilisateur } });
  const medicament = medsParNom['Doliprane 500mg'];

  // Idempotence : si un rappel de démo existe déjà pour ce patient, on s'arrête.
  const existant = await prisma.rappelTraitement.findFirst({ where: { id_patient: patient.id_patient } });
  if (existant) {
    console.log('   (déjà présent)');
    return;
  }

  const now = new Date();
  const debut = new Date(now); debut.setDate(debut.getDate() - 5); // commencé il y a 5 jours
  const fin = new Date(now); fin.setDate(fin.getDate() + 3);       // se termine dans 3 jours

  await prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.create({
      data: {
        id_patient: patient.id_patient,
        id_professionnel: medecin.id_professionnel,
        id_carnet: patient.carnet.id_carnet,
        date_consultation: debut,
        motif: 'Fièvre et céphalées',
        diagnostic: 'Syndrome grippal',
        type_consultation: 'presentiel',
        statut: 'effectuee',
      },
    });

    const ordonnance = await tx.ordonnance.create({
      data: {
        id_consultation: consultation.id_consultation,
        id_professionnel: medecin.id_professionnel,
        id_patient: patient.id_patient,
        date_emission: debut,
        date_expiration: fin,
        signature_numerique: 'DEMO-SIGNATURE-' + Date.now(),
      },
    });

    const rappel = await tx.rappelTraitement.create({
      data: {
        id_patient: patient.id_patient,
        id_ordonnance: ordonnance.id_ordonnance,
        id_medicament: medicament.id_medicament,
        frequence: { type: 'quotidien', fois_par_jour: 2 },
        heure_prise: ['08:00', '20:00'],
        date_debut: debut,
        date_fin: fin,
        canal_notification: 'email',
      },
    });

    // Génération des prises : passées (statut réaliste ~70% prises) + futures (en_attente)
    const prises = [];
    for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
      for (const heure of ['08:00', '20:00']) {
        const [h, m] = heure.split(':');
        const dh = new Date(d); dh.setHours(+h, +m, 0, 0);
        let statut = 'en_attente';
        if (dh < now) {
          // prises passées : le soir est plus souvent manqué (réaliste pour le modèle)
          const manque = heure === '20:00' ? Math.random() < 0.5 : Math.random() < 0.15;
          statut = manque ? 'manquee' : 'prise';
        }
        prises.push({
          id_rappel: rappel.id_rappel,
          date_heure_prevue: dh,
          statut_prise: statut,
          date_heure_reelle: statut === 'prise' ? dh : null,
        });
      }
    }
    await tx.priseMedicament.createMany({ data: prises });
  });

  console.log('   + Traitement Doliprane (2x/j) avec prises passées et futures pour patient.aya');
}

async function main() {
  await connectDatabase();
  console.log('🌱 Seed SmartHealth — démarrage\n');

  // 1. Médicaments
  console.log('→ Médicaments');
  const medsParNom = {};
  for (const med of medicamentsData) {
    let m = await prisma.medicament.findFirst({ where: { nom_commercial: med.nom_commercial, dosage: med.dosage } });
    if (!m) {
      m = await prisma.medicament.create({ data: med });
      console.log(`   + ${med.nom_commercial}`);
    }
    medsParNom[med.nom_commercial] = m;
  }

  // 2. Utilisateurs
  console.log('→ Utilisateurs');
  for (const u of utilisateursData) {
    const created = await upsertUtilisateur(u);
    console.log(`   • ${u.type_utilisateur.padEnd(11)} ${u.email}`);
    u._id = created.id_utilisateur;
  }

  // 3. Pharmacies + stock
  console.log('→ Pharmacies et stocks');
  for (const ph of pharmaciesData) {
    const responsable = await prisma.utilisateur.findUnique({ where: { email: ph.responsableEmail } });
    let pharmacie = await prisma.pharmacie.findUnique({ where: { numero_autorisation: ph.numero_autorisation } });
    if (!pharmacie) {
      const { responsableEmail, ...pData } = ph;
      pharmacie = await prisma.pharmacie.create({
        data: { ...pData, id_responsable: responsable.id_utilisateur, statut: 'active', statut_verification: 'verifie' },
      });
      console.log(`   + ${ph.nom_pharmacie}`);
    }

    // Stock : chaque pharmacie reçoit tout le catalogue (prix légèrement variable)
    for (const med of Object.values(medsParNom)) {
      const exist = await prisma.stockPharmacie.findFirst({ where: { id_pharmacie: pharmacie.id_pharmacie, id_medicament: med.id_medicament } });
      if (!exist && med.prix_indicatif_fcfa) {
        const variation = 1 + (Math.random() * 0.2 - 0.1); // ±10%
        await prisma.stockPharmacie.create({
          data: {
            id_pharmacie: pharmacie.id_pharmacie,
            id_medicament: med.id_medicament,
            quantite_disponible: Math.floor(50 + Math.random() * 150),
            prix_vente_fcfa: Math.round(Number(med.prix_indicatif_fcfa) * variation),
            seuil_alerte: 20,
          },
        });
      }
    }
  }

  // 4. Articles de contenu santé
  console.log('→ Articles de santé');
  const admin = await prisma.utilisateur.findUnique({ where: { email: 'admin@smarthealth.cm' } });
  for (const art of articlesData) {
    const exist = await prisma.articleSante.findFirst({ where: { titre: art.titre } });
    if (!exist) {
      await prisma.articleSante.create({
        data: { ...art, id_auteur: admin.id_utilisateur, statut: 'publie', date_publication: new Date() },
      });
      console.log(`   + ${art.titre}`);
    }
  }

  // 5. Traitement de démonstration (active les stats d'observance + la prédiction ML)
  console.log('→ Traitement de démonstration (rappels + prises)');
  await seedTraitementDemo(medsParNom);

  console.log('\n✅ Seed terminé.');
  console.log('   Comptes de démo (mot de passe : ' + MOT_DE_PASSE_DEMO + ') :');
  console.log('   - admin@smarthealth.cm (ADMIN)');
  console.log('   - dr.kamga@smarthealth.cm (MEDECIN)');
  console.log('   - pharm.essomba@smarthealth.cm (PHARMACIEN)');
  console.log('   - patient.aya@smarthealth.cm (PATIENT)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
