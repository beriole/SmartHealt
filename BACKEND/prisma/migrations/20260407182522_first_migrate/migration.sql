/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeUtilisateur" AS ENUM ('PATIENT', 'MEDECIN', 'PHARMACIEN', 'INFIRMIER', 'TUTEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F', 'AUTRE');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('fr', 'en');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('actif', 'suspendu', 'desactive');

-- CreateEnum
CREATE TYPE "GroupeSanguin" AS ENUM ('A_PLUS', 'A_MOINS', 'B_PLUS', 'B_MOINS', 'AB_PLUS', 'AB_MOINS', 'O_PLUS', 'O_MOINS');

-- CreateEnum
CREATE TYPE "StatutVerification" AS ENUM ('en_attente', 'verifie', 'rejete');

-- CreateEnum
CREATE TYPE "FormeGalenique" AS ENUM ('comprime', 'sirop', 'injection', 'creme', 'suppositoire', 'pommade');

-- CreateEnum
CREATE TYPE "CategorieMedicament" AS ENUM ('antibiotique', 'antalgique', 'antiparasitaire', 'vaccin', 'autre');

-- CreateEnum
CREATE TYPE "StatutMedicament" AS ENUM ('actif', 'retire', 'en_rupture_nationale');

-- CreateEnum
CREATE TYPE "StatutPharmacie" AS ENUM ('active', 'suspendue', 'fermee');

-- CreateEnum
CREATE TYPE "TypeConsultation" AS ENUM ('presentiel', 'teleconsultation', 'domicile');

-- CreateEnum
CREATE TYPE "StatutConsultation" AS ENUM ('planifiee', 'effectuee', 'annulee', 'no_show');

-- CreateEnum
CREATE TYPE "StatutOrdonnance" AS ENUM ('active', 'partiellement_servie', 'servie', 'expiree');

-- CreateEnum
CREATE TYPE "TypeLivraison" AS ENUM ('retrait_en_pharmacie', 'livraison_domicile');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('en_attente', 'paye', 'rembourse', 'echoue');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('mobile_money', 'especes', 'carte_bancaire');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('en_attente', 'confirmee', 'preparee', 'en_livraison', 'livree', 'annulee');

-- CreateEnum
CREATE TYPE "StatutRappel" AS ENUM ('actif', 'pause', 'termine', 'abandonne');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('sms', 'whatsapp', 'push', 'email');

-- CreateEnum
CREATE TYPE "NiveauUrgence" AS ENUM ('faible', 'modere', 'urgent', 'tres_urgent');

-- CreateEnum
CREATE TYPE "ModeSaisie" AS ENUM ('texte', 'vocal');

-- CreateEnum
CREATE TYPE "TypeAcces" AS ENUM ('lecture', 'modification', 'qr_code', 'urgence');

-- CreateEnum
CREATE TYPE "StatutPrise" AS ENUM ('en_attente', 'prise', 'manquee', 'reportee');

-- CreateEnum
CREATE TYPE "TypeActe" AS ENUM ('injection', 'pansement', 'prise_sang', 'perfusion', 'autre');

-- CreateEnum
CREATE TYPE "StatutIntervention" AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "utilisateur" (
    "id_utilisateur" TEXT NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "mot_de_passe_hash" VARCHAR(255) NOT NULL,
    "type_utilisateur" "TypeUtilisateur" NOT NULL,
    "date_naissance" DATE,
    "sexe" "Sexe" NOT NULL,
    "photo_profil" VARCHAR(500),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "langue_preferee" "Langue" NOT NULL DEFAULT 'fr',
    "statut_compte" "StatutCompte" NOT NULL DEFAULT 'actif',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_connexion" TIMESTAMP(3),

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id_utilisateur")
);

-- CreateTable
CREATE TABLE "patient" (
    "id_patient" TEXT NOT NULL,
    "id_utilisateur" TEXT NOT NULL,
    "numero_carnet" VARCHAR(20) NOT NULL,
    "groupe_sanguin" "GroupeSanguin",
    "poids_kg" DECIMAL(5,2),
    "taille_cm" INTEGER,
    "allergies_connues" TEXT,
    "antecedents_medicaux" TEXT,
    "maladies_chroniques" JSONB,
    "id_tuteur" TEXT,
    "consentement_donnees" BOOLEAN NOT NULL DEFAULT false,
    "date_enregistrement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id_patient")
);

-- CreateTable
CREATE TABLE "professionnel_sante" (
    "id_professionnel" TEXT NOT NULL,
    "id_utilisateur" TEXT NOT NULL,
    "numero_ordre" VARCHAR(50) NOT NULL,
    "specialite" VARCHAR(100) NOT NULL,
    "sous_specialite" VARCHAR(100),
    "structure_exercice" VARCHAR(200) NOT NULL,
    "latitude_cabinet" DOUBLE PRECISION,
    "longitude_cabinet" DOUBLE PRECISION,
    "adresse_cabinet" TEXT,
    "tarif_consultation" DECIMAL(10,2),
    "disponible_domicile" BOOLEAN NOT NULL DEFAULT false,
    "note_moyenne" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "statut_verification" "StatutVerification" NOT NULL DEFAULT 'en_attente',
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professionnel_sante_pkey" PRIMARY KEY ("id_professionnel")
);

-- CreateTable
CREATE TABLE "carnet_sante" (
    "id_carnet" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "qr_code_token" VARCHAR(500) NOT NULL,
    "vaccinations" JSONB,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_mise_a_jour" TIMESTAMP(3) NOT NULL,
    "acces_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "carnet_sante_pkey" PRIMARY KEY ("id_carnet")
);

-- CreateTable
CREATE TABLE "consultation" (
    "id_consultation" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "id_professionnel" TEXT NOT NULL,
    "id_carnet" TEXT NOT NULL,
    "date_consultation" TIMESTAMP(3) NOT NULL,
    "motif" TEXT NOT NULL,
    "diagnostic" TEXT,
    "codes_cim10" TEXT[],
    "observations" TEXT,
    "type_consultation" "TypeConsultation" NOT NULL,
    "cout_fcfa" DECIMAL(10,2),
    "statut" "StatutConsultation" NOT NULL DEFAULT 'planifiee',
    "pj_documents" JSONB,

    CONSTRAINT "consultation_pkey" PRIMARY KEY ("id_consultation")
);

-- CreateTable
CREATE TABLE "ordonnance" (
    "id_ordonnance" TEXT NOT NULL,
    "id_consultation" TEXT NOT NULL,
    "id_professionnel" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "date_emission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_expiration" DATE NOT NULL,
    "signature_numerique" TEXT NOT NULL,
    "statut" "StatutOrdonnance" NOT NULL DEFAULT 'active',
    "notes_pharmacien" TEXT,

    CONSTRAINT "ordonnance_pkey" PRIMARY KEY ("id_ordonnance")
);

-- CreateTable
CREATE TABLE "medicament" (
    "id_medicament" TEXT NOT NULL,
    "nom_commercial" VARCHAR(200) NOT NULL,
    "dci" VARCHAR(200) NOT NULL,
    "forme_galenique" "FormeGalenique" NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "categorie" "CategorieMedicament" NOT NULL,
    "est_generique" BOOLEAN NOT NULL DEFAULT false,
    "id_reference" TEXT,
    "necessite_ordonnance" BOOLEAN NOT NULL DEFAULT true,
    "prix_indicatif_fcfa" DECIMAL(10,2),
    "image_url" VARCHAR(500),
    "statut" "StatutMedicament" NOT NULL DEFAULT 'actif',

    CONSTRAINT "medicament_pkey" PRIMARY KEY ("id_medicament")
);

-- CreateTable
CREATE TABLE "pharmacie" (
    "id_pharmacie" TEXT NOT NULL,
    "id_responsable" TEXT NOT NULL,
    "nom_pharmacie" VARCHAR(200) NOT NULL,
    "numero_autorisation" VARCHAR(100) NOT NULL,
    "adresse" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "horaires_ouverture" JSONB,
    "livraison_disponible" BOOLEAN NOT NULL DEFAULT false,
    "rayon_livraison_km" DECIMAL(5,2),
    "note_moyenne" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "statut" "StatutPharmacie" NOT NULL DEFAULT 'active',

    CONSTRAINT "pharmacie_pkey" PRIMARY KEY ("id_pharmacie")
);

-- CreateTable
CREATE TABLE "commande" (
    "id_commande" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "id_pharmacie" TEXT NOT NULL,
    "id_ordonnance" TEXT,
    "type_livraison" "TypeLivraison" NOT NULL,
    "adresse_livraison" TEXT,
    "latitude_livraison" DOUBLE PRECISION,
    "longitude_livraison" DOUBLE PRECISION,
    "montant_total_fcfa" DECIMAL(10,2) NOT NULL,
    "statut_paiement" "StatutPaiement" NOT NULL DEFAULT 'en_attente',
    "mode_paiement" "ModePaiement",
    "statut_commande" "StatutCommande" NOT NULL DEFAULT 'en_attente',
    "date_commande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_livraison_prevue" TIMESTAMP(3),
    "date_livraison_effective" TIMESTAMP(3),

    CONSTRAINT "commande_pkey" PRIMARY KEY ("id_commande")
);

-- CreateTable
CREATE TABLE "rappel_traitement" (
    "id_rappel" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "id_ordonnance" TEXT NOT NULL,
    "id_medicament" TEXT NOT NULL,
    "frequence" JSONB NOT NULL,
    "heure_prise" TEXT[],
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "canal_notification" "CanalNotification" NOT NULL DEFAULT 'sms',
    "alerte_tuteur_active" BOOLEAN NOT NULL DEFAULT false,
    "statut" "StatutRappel" NOT NULL DEFAULT 'actif',

    CONSTRAINT "rappel_traitement_pkey" PRIMARY KEY ("id_rappel")
);

-- CreateTable
CREATE TABLE "triage_ia" (
    "id_triage" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "date_session" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symptomes_declares" JSONB NOT NULL,
    "resultats_analyse" JSONB NOT NULL,
    "recommandation" TEXT NOT NULL,
    "niveau_urgence" "NiveauUrgence" NOT NULL,
    "specialite_recommandee" VARCHAR(100),
    "langue_session" "Langue" NOT NULL DEFAULT 'fr',
    "mode_saisie" "ModeSaisie" NOT NULL DEFAULT 'texte',
    "suivi_pris" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "triage_ia_pkey" PRIMARY KEY ("id_triage")
);

-- CreateTable
CREATE TABLE "intervention_domicile" (
    "id_intervention" TEXT NOT NULL,
    "id_patient" TEXT NOT NULL,
    "id_infirmier" TEXT NOT NULL,
    "type_acte" "TypeActe" NOT NULL,
    "date_planifiee" TIMESTAMP(3) NOT NULL,
    "date_effective" TIMESTAMP(3),
    "adresse_intervention" TEXT NOT NULL,
    "latitude_intervention" DOUBLE PRECISION,
    "longitude_intervention" DOUBLE PRECISION,
    "cout_fcfa" DECIMAL(10,2) NOT NULL,
    "compte_rendu" TEXT,
    "statut" "StatutIntervention" NOT NULL DEFAULT 'planifiee',
    "note_patient" INTEGER,

    CONSTRAINT "intervention_domicile_pkey" PRIMARY KEY ("id_intervention")
);

-- CreateTable
CREATE TABLE "ligne_ordonnance" (
    "id_ligne" TEXT NOT NULL,
    "id_ordonnance" TEXT NOT NULL,
    "id_medicament" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "duree_traitement_jours" INTEGER NOT NULL,
    "posologie" VARCHAR(300) NOT NULL,
    "servi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ligne_ordonnance_pkey" PRIMARY KEY ("id_ligne")
);

-- CreateTable
CREATE TABLE "stock_pharmacie" (
    "id_stock" TEXT NOT NULL,
    "id_pharmacie" TEXT NOT NULL,
    "id_medicament" TEXT NOT NULL,
    "quantite_disponible" INTEGER NOT NULL DEFAULT 0,
    "prix_vente_fcfa" DECIMAL(10,2) NOT NULL,
    "date_peremption" DATE,
    "seuil_alerte" INTEGER NOT NULL DEFAULT 10,
    "derniere_maj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pharmacie_pkey" PRIMARY KEY ("id_stock")
);

-- CreateTable
CREATE TABLE "ligne_commande" (
    "id_ligne_cmd" TEXT NOT NULL,
    "id_commande" TEXT NOT NULL,
    "id_stock" TEXT NOT NULL,
    "quantite_commandee" INTEGER NOT NULL,
    "prix_unitaire_fcfa" DECIMAL(10,2) NOT NULL,
    "sous_total_fcfa" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ligne_commande_pkey" PRIMARY KEY ("id_ligne_cmd")
);

-- CreateTable
CREATE TABLE "prise_medicament" (
    "id_prise" TEXT NOT NULL,
    "id_rappel" TEXT NOT NULL,
    "date_heure_prevue" TIMESTAMP(3) NOT NULL,
    "date_heure_reelle" TIMESTAMP(3),
    "statut_prise" "StatutPrise" NOT NULL DEFAULT 'en_attente',
    "commentaire" TEXT,

    CONSTRAINT "prise_medicament_pkey" PRIMARY KEY ("id_prise")
);

-- CreateTable
CREATE TABLE "acces_carnet" (
    "id_acces" TEXT NOT NULL,
    "id_carnet" TEXT NOT NULL,
    "id_accedant" TEXT NOT NULL,
    "type_acces" "TypeAcces" NOT NULL,
    "date_acces" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adresse_ip" TEXT,
    "autorise_par_patient" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "acces_carnet_pkey" PRIMARY KEY ("id_acces")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_telephone_key" ON "utilisateur"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "patient_id_utilisateur_key" ON "patient"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "patient_numero_carnet_key" ON "patient"("numero_carnet");

-- CreateIndex
CREATE UNIQUE INDEX "professionnel_sante_id_utilisateur_key" ON "professionnel_sante"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "professionnel_sante_numero_ordre_key" ON "professionnel_sante"("numero_ordre");

-- CreateIndex
CREATE UNIQUE INDEX "carnet_sante_id_patient_key" ON "carnet_sante"("id_patient");

-- CreateIndex
CREATE UNIQUE INDEX "carnet_sante_qr_code_token_key" ON "carnet_sante"("qr_code_token");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacie_numero_autorisation_key" ON "pharmacie"("numero_autorisation");

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_id_tuteur_fkey" FOREIGN KEY ("id_tuteur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionnel_sante" ADD CONSTRAINT "professionnel_sante_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carnet_sante" ADD CONSTRAINT "carnet_sante_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_id_professionnel_fkey" FOREIGN KEY ("id_professionnel") REFERENCES "professionnel_sante"("id_professionnel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_id_carnet_fkey" FOREIGN KEY ("id_carnet") REFERENCES "carnet_sante"("id_carnet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_id_consultation_fkey" FOREIGN KEY ("id_consultation") REFERENCES "consultation"("id_consultation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_id_professionnel_fkey" FOREIGN KEY ("id_professionnel") REFERENCES "professionnel_sante"("id_professionnel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicament" ADD CONSTRAINT "medicament_id_reference_fkey" FOREIGN KEY ("id_reference") REFERENCES "medicament"("id_medicament") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacie" ADD CONSTRAINT "pharmacie_id_responsable_fkey" FOREIGN KEY ("id_responsable") REFERENCES "utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commande" ADD CONSTRAINT "commande_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commande" ADD CONSTRAINT "commande_id_pharmacie_fkey" FOREIGN KEY ("id_pharmacie") REFERENCES "pharmacie"("id_pharmacie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commande" ADD CONSTRAINT "commande_id_ordonnance_fkey" FOREIGN KEY ("id_ordonnance") REFERENCES "ordonnance"("id_ordonnance") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappel_traitement" ADD CONSTRAINT "rappel_traitement_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappel_traitement" ADD CONSTRAINT "rappel_traitement_id_ordonnance_fkey" FOREIGN KEY ("id_ordonnance") REFERENCES "ordonnance"("id_ordonnance") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappel_traitement" ADD CONSTRAINT "rappel_traitement_id_medicament_fkey" FOREIGN KEY ("id_medicament") REFERENCES "medicament"("id_medicament") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_ia" ADD CONSTRAINT "triage_ia_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_domicile" ADD CONSTRAINT "intervention_domicile_id_patient_fkey" FOREIGN KEY ("id_patient") REFERENCES "patient"("id_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_domicile" ADD CONSTRAINT "intervention_domicile_id_infirmier_fkey" FOREIGN KEY ("id_infirmier") REFERENCES "professionnel_sante"("id_professionnel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_ordonnance" ADD CONSTRAINT "ligne_ordonnance_id_ordonnance_fkey" FOREIGN KEY ("id_ordonnance") REFERENCES "ordonnance"("id_ordonnance") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_ordonnance" ADD CONSTRAINT "ligne_ordonnance_id_medicament_fkey" FOREIGN KEY ("id_medicament") REFERENCES "medicament"("id_medicament") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pharmacie" ADD CONSTRAINT "stock_pharmacie_id_pharmacie_fkey" FOREIGN KEY ("id_pharmacie") REFERENCES "pharmacie"("id_pharmacie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pharmacie" ADD CONSTRAINT "stock_pharmacie_id_medicament_fkey" FOREIGN KEY ("id_medicament") REFERENCES "medicament"("id_medicament") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_commande" ADD CONSTRAINT "ligne_commande_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "commande"("id_commande") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_commande" ADD CONSTRAINT "ligne_commande_id_stock_fkey" FOREIGN KEY ("id_stock") REFERENCES "stock_pharmacie"("id_stock") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prise_medicament" ADD CONSTRAINT "prise_medicament_id_rappel_fkey" FOREIGN KEY ("id_rappel") REFERENCES "rappel_traitement"("id_rappel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_carnet" ADD CONSTRAINT "acces_carnet_id_carnet_fkey" FOREIGN KEY ("id_carnet") REFERENCES "carnet_sante"("id_carnet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_carnet" ADD CONSTRAINT "acces_carnet_id_accedant_fkey" FOREIGN KEY ("id_accedant") REFERENCES "utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;
