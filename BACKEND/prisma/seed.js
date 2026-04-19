const { prisma, connectDatabase, disconnectDatabase } = require('../services/database');

const medicamentsData = [
  { nom_commercial: 'Paracétamol 500mg', dci: 'Paracétamol', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antalgique', prix_indicatif_fcfa: 500 },
  { nom_commercial: 'Paracétamol 1g', dci: 'Paracétamol', forme_galenique: 'comprime', dosage: '1 g', categorie: 'antalgique', prix_indicatif_fcfa: 1000 },
  { nom_commercial: 'Amoxicilline 500mg', dci: 'Amoxicilline', forme_galenique: 'comprime', dosage: '500 mg', categorie: 'antibiotique', prix_indicatif_fcfa: 1500, necessite_ordonnance: true },
  { nom_commercial: 'Clamoxyl 1g', dci: 'Amoxicilline', forme_galenique: 'comprime', dosage: '1 g', categorie: 'antibiotique', prix_indicatif_fcfa: 3000, necessite_ordonnance: true },
  { nom_commercial: 'Ibuprofène 400mg', dci: 'Ibuprofène', forme_galenique: 'comprime', dosage: '400 mg', categorie: 'antalgique', prix_indicatif_fcfa: 1200 },
  { nom_commercial: 'Maxilase Sirop', dci: 'Alpha-amylase', forme_galenique: 'sirop', dosage: '200 U.CEIP/ml', categorie: 'autre', prix_indicatif_fcfa: 2500 },
  { nom_commercial: 'Coartem', dci: 'Artéméther/Luméfantrine', forme_galenique: 'comprime', dosage: '20 mg/120 mg', categorie: 'antiparasitaire', prix_indicatif_fcfa: 4500, necessite_ordonnance: true },
  { nom_commercial: 'Efferalgan Pédiatrique', dci: 'Paracétamol', forme_galenique: 'sirop', dosage: '30 mg/ml', categorie: 'antalgique', prix_indicatif_fcfa: 1800 },
  { nom_commercial: 'Betadine Dermique', dci: 'Povidone iodée', forme_galenique: 'creme', dosage: '10%', categorie: 'autre', prix_indicatif_fcfa: 2000 },
  { nom_commercial: 'Vaccin BCG', dci: 'Bacille de Calmette et Guérin', forme_galenique: 'injection', dosage: '0.05 ml', categorie: 'vaccin', prix_indicatif_fcfa: null, necessite_ordonnance: true },
];

async function main() {
  await connectDatabase();
  console.log('Début du peuplement (seeding) des médicaments...');
  
  for (const med of medicamentsData) {
    const exists = await prisma.medicament.findFirst({
      where: { nom_commercial: med.nom_commercial }
    });

    if (!exists) {
      await prisma.medicament.create({
        data: med
      });
      console.log(`Ajout du médicament: ${med.nom_commercial}`);
    } else {
      console.log(`Déjà existant: ${med.nom_commercial}`);
    }
  }

  console.log('Peuplement terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
