# SmartHealth Platform - Documentation Technique

---

## Table des Matières
1. [Vue d'ensemble du Projet](#1-vue-densemble-du-projet)
2. [Architecture Technique](#2-architecture-technique)
3. [Modèle de Données](#3-modèle-de-données)
4. [API et Endpoints](#4-api-et-endpoints)
5. [Comptes et Rôles Utilisateurs](#5-comptes-et-rôles-utilisateurs)
6. [Flux Métier Principaux](#6-flux-métier-principaux)
7. [Installation et Configuration](#7-installation-et-configuration)
8. [Sécurité](#8-sécurité)
9. [Déploiement](#9-déploiement)

---

## 1. Vue d'ensemble du Projet

### 1.1 Présentation
SmartHealth est une plateforme de santé numérique complète conçue pour connecter les patients, les professionnels de santé et les pharmacies. Elle permet la gestion intégrée des consultations, ordonnances, commandes de médicaments, interventions à domicile et suivi de traitement.

### 1.2 Fonctionnalités Principales

| Catégorie | Fonctionnalité | Description |
|-----------|----------------|-------------|
| **Utilisateurs** | Gestion multi-rôles | PATIENT, MEDECIN, PHARMACIEN, INFIRMIER, LIVREUR, TUTEUR, ADMIN |
| **Carnets de santé** | Numérique avec QR code | Accès sécurisé, vaccinations, données médicales |
| **Consultations** | 3 types | Présentielles, téléconsultations, à domicile |
| **Ordonnances** | Électroniques | Création, suivi, notification automatisée |
| **Pharmacies** | Gestion stocks | Commandes, livraison, alertes seuil |
| **Interventions** | Soins à domicile | Infirmiers, actes, compte rendu |
| **Triage IA** | Analyse symptômes | Recommandations spécialité, niveau urgence |
| **Rappels** | Traitement | Notifications email automatisées (cron) |
| **B2B** | Partenaires externes | OAuth 2.0, intégration API |
| **IA (Groq/Llama 3.3)** | 5 modules | Compatibilité médicaments, analyse prédictive, diagnostic, recommandation de traitements, médecine traditionnelle |
| **Administration** | Pilotage global | Dashboard, finances, contenu santé, journal d'audit, détection d'activités suspectes |
| **Stocks** | Traçabilité | Historique des mouvements, alertes rupture/péremption |

---

## 2. Architecture Technique

### 2.1 Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | >= 18 |
| Framework | Express.js | 5.2.1 |
| Base de données | PostgreSQL | >= 14 |
| ORM | Prisma | 7.6.0 |
| Authentification | JWT (jsonwebtoken) | 9.0.2 |
| Validation | express-validator | 7.2.1 |
| Sécurité | helmet, cors, express-rate-limit | - |
| Logging | Winston | 3.17.0 |
| Tâches planifiées | node-cron | 4.2.1 |
| Upload fichiers | multer | 1.4.5-lts.1 |

### 2.2 Structure des Dossiers

```
BACKEND/
├── src/
│   └── server.js              # Entrée principale de l'application
├── routes/                      # Définition des routes API
│   ├── authRoutes.js
│   ├── patientRoutes.js
│   ├── professionnelRoutes.js
│   ├── pharmacieRoutes.js
│   ├── consultationRoutes.js
│   ├── ordonnanceRoutes.js
│   ├── commandeRoutes.js
│   ├── carnetRoutes.js
│   ├── triageRoutes.js
│   ├── stockRoutes.js
│   ├── rappelRoutes.js
│   ├── interventionRoutes.js
│   ├── livreurRoutes.js
│   ├── b2bRoutes.js
│   └── utilisateurRoutes.js
├── controllers/                 # Logique métier des endpoints
├── services/                    # Services métiers et utilitaires
│   ├── database.js
│   ├── utilisateurService.js
│   ├── professionnelService.js
│   ├── patientService.js
│   ├── carnetService.js
│   └── rappelCron.js
├── validators/                  # Schémas de validation
│   ├── validators.js
│   └── validate.js
├── utils/                       # Utilitaires transversaux
│   ├── logger.js
│   ├── email.js
│   ├── helpers.js
│   └── notchpay.js
├── tests/                       # Tests unitaires et E2E
│   ├── setup.js
│   ├── e2e-workflow.test.js
│   └── *.test.js (par module)
├── prisma/
│   └── schema.prisma           # Schéma ORM et modèles DB
└── uploads/                     # Stockage fichiers uploadés
```

---

## 3. Modèle de Données

### 3.1 Diagramme Entité-Relation (Résumé)

```
Utilisateur (1) ←→ (1) Patient
     │
     ├→ (1) ProfessionnelSante
     ├→ (1) Livreur
     └→ (0..n) Pharmacie (comme responsable)

Patient (1) ←→ (1) CarnetSante
     │
     ├→ (0..n) Consultation
     ├→ (0..n) Ordonnance
     ├→ (0..n) Commande
     ├→ (0..n) RappelTraitement
     └→ (0..n) TriageIa

Consultation (1) ←→ (0..n) Ordonnance
     │
     └→ (0..n) LigneOrdonnance → Medicament

Pharmacie (1) ←→ (0..n) EmployePharmacie
     │
     ├→ (0..n) StockPharmacie → Medicament
     └→ (0..n) Commande

Ordonnance (1) ←→ (0..n) Commande
```

### 3.2 Entités Principales

#### Utilisateur
| Champ | Type | Description |
|-------|------|-------------|
| id_utilisateur | UUID (PK) | Identifiant unique |
| nom, prenom | String | Identité |
| email | String (unique) | Login/email vérifié |
| telephone | String (unique) | Contact |
| mot_de_passe_hash | String | BCrypt |
| type_utilisateur | Enum | PATIENT, MEDECIN, etc. |
| sexe | Enum (M, F, AUTRE) | Genre |
| date_naissance | DateTime? | DOB |
| statut_compte | Enum | actif, suspendu, etc. |
| latitude, longitude | Float? | Position géo |

#### Patient
| Champ | Type | Description |
|-------|------|-------------|
| id_patient | UUID (PK) | Identifiant patient |
| numero_carnet | String (unique) | Numéro carnet |
| groupe_sanguin | Enum | Groupe sanguin |
| poids_kg | Decimal? | Poids actuel |
| taille_cm | Int? | Taille |
| allergies_connues | Text? | Allergies |
| antecedents_medicaux | Text? | Antécédents |

#### ProfessionnelSante
| Champ | Type | Description |
|-------|------|-------------|
| id_professionnel | UUID (PK) | Identifiant |
| numero_ordre | String (unique) | Numéro licence |
| specialite | String | Spécialité |
| structure_exercice | String | Structure |
| tarif_consultation | Decimal? | Prix |
| statut_verification | Enum | en_attente, verifie, rejete |

#### Pharmacie
| Champ | Type | Description |
|-------|------|-------------|
| id_pharmacie | UUID (PK) | Identifiant |
| id_responsable | FK (utilisateur) | Pharmacien |
| nom_pharmacie | String | Nom commerce |
| numero_autorisation | String (unique) | Licence |
| adresse | Text | Adresse complète |
| livraison_disponible | Boolean | Service livraison |
| rayon_livraison_km | Decimal? | Zone couverture |

#### Consultation
| Champ | Type | Description |
|-------|------|-------------|
| id_consultation | UUID (PK) | Identifiant |
| id_patient, id_professionnel, id_carnet | FK | Relations |
| date_consultation | DateTime | Date/heure |
| motif | Text | Motif consultation |
| diagnostic | Text? | Diagnostic CIM10 |
| type_consultation | Enum | presentiel, teleconsultation, domicile |
| statut | Enum | planifiee, effectuee, annulee |

#### Ordonnance
| Champ | Type | Description |
|-------|------|-------------|
| id_ordonnance | UUID (PK) | Identifiant |
| date_emission, date_expiration | DateTime | Validité |
| statut | Enum | active, partiellement_servie, servie |
| lignes | LigneOrdonnance[] | Médicaments prescrits |

#### Commande
| Champ | Type | Description |
|-------|------|-------------|
| id_commande | UUID (PK) | Identifiant |
| type_livraison | Enum | retrait, livraison_domicile |
| montant_total_fcfa | Decimal | Montant TTC |
| statut_commande | Enum | en_attente → livree |
| statut_paiement | Enum | en_attente, paye, echoue |
| mode_paiement | Enum | mobile_money, especes, carte |

---

## 4. API et Endpoints

### 4.1 Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription utilisateur (crée aussi le profil PATIENT/MEDECIN/INFIRMIER/LIVREUR) | ❌ |
| POST | `/login` | Connexion, retourne JWT (rate-limité 5/15min) | ❌ |
| GET | `/verify-email/:token` | Vérification email | ❌ |
| POST | `/resend-verification` | Renvoi du lien de vérification | ❌ |
| POST | `/forgot-password` | Mot de passe oublié (lien valide 1h) | ❌ |
| POST | `/reset-password/:token` | Réinitialisation | ❌ |

### 4.2 Utilisateurs (`/api/utilisateurs`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/` | Liste utilisateurs (paginated) | ADMIN |
| GET | `/:id` | Détails utilisateur | Tous |
| PUT | `/:id` | Mise à jour profil | Propriétaire/ADMIN |
| PUT | `/:id/avatar` | Upload avatar | Propriétaire |
| DELETE | `/:id` | Suppression compte | ADMIN |

### 4.3 Patients (`/api/patients`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste patients | Auth |
| GET | `/:id` | Détails patient | Auth |
| PUT | `/:id` | Mise à jour données | Propriétaire |

### 4.4 Professionnels (`/api/professionnels`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste professionnels |
| GET | `/:id` | Détails professionnel |
| PUT | `/:id/upload-document` | Upload document vérif |
| POST | `/:id/verify` | Vérification par admin |

### 4.5 Pharmacies (`/api/pharmacies`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste pharmacies (filtrable) |
| POST | `/` | Création pharmacie |
| GET | `/:id` | Détails pharmacie |
| PUT | `/:id` | Mise à jour |
| POST | `/:id_pharmacie/employes` | Ajouter employé |
| GET | `/:id_pharmacie/employes` | Liste employés |
| DELETE | `/:id_pharmacie/employes/:id` | Retirer employé |

### 4.6 Consultations (`/api/consultations`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste consultations |
| POST | `/` | Créer consultation |
| GET | `/:id` | Détails consultation |
| PUT | `/:id` | Mise à jour |

### 4.7 Ordonnances (`/api/ordonnances`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste ordonnances |
| POST | `/` | Créer ordonnance |
| GET | `/:id` | Détails ordonnance |
| PUT | `/:id` | Mise à jour |

### 4.8 Commandes (`/api/commandes`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste commandes |
| POST | `/` | Créer commande |
| GET | `/:id` | Détails commande |
| PUT | `/:id/status` | Changer statut |
| POST | `/:id/payer` | Paiement |

### 4.9 Carnets (`/api/carnets`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/my-carnet` | Mon carnet santé |
| POST | `/my-carnet/regenerate-qr` | Régénérer QR |
| GET | `/scan/:qrToken` | Scanner QR code |

### 4.10 Rappels (`/api/rappels`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Créer rappel traitement |
| GET | `/` | Mes rappels |
| GET | `/prises-du-jour` | Prises aujourd'hui |
| GET | `/stats/globales` | Statistiques globales (taux d'observance) |
| GET | `/risque-observance` | **Prédiction ML** du risque d'oubli des prochaines prises (modèle d'observance entraîné sur les données de la plateforme) |
| PUT | `/prises/:id` | Marquer prise |

### 4.11 Triage IA (`/api/triage`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Créer session triage |
| GET | `/` | Historique sessions |
| GET | `/:id` | Détails session |
| PUT | `/:id/suivi` | Mettre à jour suivi |

### 4.12 Stocks (`/api/stocks`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/search` | Recherche globale de médicaments en stock | Auth |
| GET | `/my-stocks` | Inventaire de ma pharmacie | PHARMACIEN |
| GET | `/alertes` | Alertes rupture (≤ seuil) et péremption (< 90j) | PHARMACIEN |
| GET | `/:id/mouvements` | Historique des mouvements (entrées, ventes, retours, ajustements) | PHARMACIEN |
| POST | `/` | Ajout au stock (mouvement "entree" tracé) | PHARMACIEN |
| PUT | `/:id` | Modification (mouvement "ajustement" tracé) | PHARMACIEN |
| DELETE | `/:id` | Retrait du catalogue | PHARMACIEN |

### 4.13 Livreurs (`/api/livreurs`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/` | Liste des livreurs (filtres statut/disponibilité) | ADMIN |
| POST | `/register` | Création du profil logistique | LIVREUR |
| PUT | `/upload-document` | Upload pièces (permis, CNI) | LIVREUR |
| POST | `/:id/verify` | Validation des documents | ADMIN |
| PUT | `/position` | Mise à jour position GPS (suivi temps réel) | LIVREUR |
| PUT | `/disponibilite` | Activation/désactivation | LIVREUR |
| GET | `/dashboard` | Statistiques personnelles | LIVREUR |

La logistique des commandes ajoute : `POST /api/commandes/:id/attribuer-auto` (attribution automatique du livreur vérifié le plus proche de la pharmacie, distance de Haversine) et la validation par code PIN envoyé au patient.

### 4.14 Intelligence Artificielle (`/api/ia`) — Groq / Llama 3.3 70B

Toutes les routes exigent une authentification (PATIENT, MEDECIN ou ADMIN) et sont rate-limitées (10 req/min). Chaque analyse est persistée dans `analyse_ia` et accompagnée d'un avertissement médical.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/compatibilite-medicament` | Analyse la compatibilité d'un médicament avec le dossier complet du patient (allergies, traitements en cours, maladies chroniques). Résultat : compatible / compatible_avec_precautions / non_recommande / dangereux + rapport détaillé |
| POST | `/analyse-predictive` | Analyse préventive du carnet. Les **modèles ML internes** (RandomForest) estiment d'abord les probabilités de diabète et de risque cardiovasculaire (champ `scores_ml`), puis le LLM rédige l'analyse : tendances inquiétantes, recommandations. Accepte des valeurs cliniques optionnelles (`glucose`, `tension_systolique`, `cholesterol`, `fumeur`, antécédents) |
| POST | `/diagnostic` | **Diagnostic complet** : maladies probables (modèle ML interne + LLM), niveau d'urgence, spécialité, conduite à tenir (mesures non médicamenteuses), **traitements recommandés parmi les médicaments en stock** (posologie, durée, ordonnance requise ou non) **avec les pharmacies où les acheter** (nom, prix, stock, `id_stock`), signes d'alarme. Alimente aussi le module triage |
| POST | `/recommandation-traitement` | Recommande des traitements UNIQUEMENT parmi les médicaments en stock (posologie, contre-indications) avec localisation en pharmacie. Utile quand la maladie est déjà connue |
| POST | `/medecine-traditionnelle` | Remèdes naturels (gingembre, moringa, neem…) : ingrédients, quantités, préparation, fréquence, précautions |
| GET | `/historique` | Historique des analyses IA du patient |
| GET | `/analyses/:id` | Détail d'une analyse |

### 4.15 Administration (`/api/admin`) — ADMIN uniquement

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/dashboard` | Statistiques globales (utilisateurs, commandes, consultations, CA…) |
| GET | `/finances` | Revenus, transactions, commissions livreurs, rapports par période |
| GET | `/audit` | Journal des actions sensibles (filtres action/utilisateur/période) |
| GET | `/securite/activites-suspectes` | Détection brute-force (échecs de connexion), comptes suspendus |
| PUT | `/utilisateurs/:id/statut` | Suspension / réactivation d'un compte |
| GET/POST/PUT/DELETE | `/articles` | Gestion du contenu santé (actualités, conseils, sensibilisation) |

Lecture publique du contenu : `GET /api/articles` et `GET /api/articles/:id`.

### 4.16 Ordonnances — traitement pharmacien

`PUT /api/ordonnances/:id/traiter` (PHARMACIEN) : `{ "action": "servir", "lignes_servies": [...] }` ou `{ "action": "refuser", "notes_pharmacien": "motif" }`. Le statut passe automatiquement à `partiellement_servie` / `servie`. Les ordonnances expirées sont archivées chaque nuit par cron.

### 4.17 B2B (`/api/b2b`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/onboarding` | Enregistrement partenaire |
| GET | `/admin/demandes` | Demandes en attente |
| POST | `/admin/:id/valider` | Valider partenaire |
| POST | `/oauth/token` | Token OAuth 2.0 |
| POST | `/patient/generer-pin` | Générer PIN consentement |

---

## 5. Comptes et Rôles

### 5.1 Matrice des Permissions

| Action | PATIENT | MEDECIN | PHARMACIEN | INFIRMIER | LIVREUR | TUTEUR | ADMIN |
|--------|---------|---------|------------|-----------|---------|--------|-------|
| Voir son carnet | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (lié) | ✅ |
| Créer consultation | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Prescrire ordonnance | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gérer stocks | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Préparer commande | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Livrer commande | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Intervention domicile | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Vérifier comptes | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer partenaires B2B | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 6. Flux Métier Principaux

### 6.1 Parcours Patient Complet

```mermaid
graph TD
    A[Inscription] --> B[Vérification email]
    B --> C[Création carnet santé]
    C --> D[Génération QR code]
    D --> E[Consultation médical]
    E --> F[Ordonnance électronique]
    F --> G[Commande médicaments]
    G --> H[Paiement]
    H --> I[Livraison/retir]
    I --> J[Suivi traitement]
    J --> K[Rappels automatiques]
```

### 6.2 Flux Pharmacie

1. **Création** : Le pharmacien crée sa pharmacie
2. **Vérification** : Admin valide les documents
3. **Employés** : Ajout des employés avec rôles (pharmacien_assistant, caissier, magasinier)
4. **Stocks** : Saisie des médicaments disponibles
5. **Commandes** : Préparation et suivi des commandes
6. **Livraison** : Attribution des livreurs

### 6.3 Flux B2B (Partenaires externes)

1. **Onboarding** : Soumission demande partenaire
2. **Validation** : Admin examine et valide
3. **OAuth** : Génération client_id/secret pour l'API
4. **Accès** : Le partenaire accède via OAuth 2.0

---

## 7. Installation et Configuration

### 7.1 Prérequis Système

- **Node.js** >= 18.x
- **npm** >= 9.x ou **yarn** >= 1.22
- **PostgreSQL** >= 14
- **Git** >= 2.30

### 7.2 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd smarthealth/BACKEND

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Initialiser la base de données
npx prisma generate
npx prisma migrate dev --name init

# Démarrer le serveur
npm run dev
```

### 7.3 Variables d'Environnement

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/smarthealth

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# Email (Gmail : mot de passe d'application)
EMAIL=votre-email@gmail.com
PASS_EMAIL=mot-de-passe-application
EMAIL_SENDER_NAME=SmartHealth

# Paiement NotchPay
NOTCHPAY_BASE_URL=https://api.notchpay.co
NOTCHPAY_PUBLIC_KEY=pk_test_xxxx
NOTCHPAY_HASH_KEY=hsk_xxxx

# IA - Groq (clé gratuite : https://console.groq.com)
GROQ_API_KEY=gsk_xxxx
```

Voir `.env.example` pour le modèle complet.

### 7.4 Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrage avec nodemon (hot reload) |
| `npm start` | Démarrage production |
| `npm test` | Exécuter les tests Jest |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint` | Linting ESLint |
| `npx prisma studio` | Interface graphique DB |
| `npx prisma migrate dev` | Migrations dev |

---

## 8. Sécurité

### 8.1 Mesures Implémentées

| Couche | Mesure | Objectif |
|--------|--------|----------|
| **Authentification** | JWT signé | Identité utilisateur |
| **Mot de passe** | BCrypt (12 rounds) | Protection des mots de passe |
| **API** | Rate limiting global (100 req/15min) + login (5/15min) + IA (10/min) | Prévention DDoS et brute-force |
| **Headers** | Helmet.js | Protection headers HTTP |
| **CORS** | Configuré | Contrôle accès cross-origin |
| **Validation** | express-validator + whitelist de champs | Sanitisation entrées, anti mass-assignment |
| **Audit** | JournalAudit (BD) + Winston | Traçabilité des actions sensibles |
| **Upload** | Multer (limites, types) | Sécurité fichiers |
| **Paiement** | Vérification HMAC du webhook NotchPay | Anti-fraude |

### 8.2 Bonnes Pratiques

- Les mots de passe sont toujours hachés côté serveur (jamais renvoyés dans les réponses API)
- Les tokens de vérification/réinitialisation ont une durée de vie courte (24h / 1h)
- Toutes les entrées sont validées côté serveur ; les champs sensibles (rôle, statut, hash) ne sont pas modifiables par le client
- Les connexions (succès et échecs) sont journalisées ; un endpoint admin détecte les rafales d'échecs (brute-force)
- Les routes médicales (triage, analyses IA, carnets) exigent une authentification et un contrôle de propriété

---

## 9. Déploiement

### 9.1 Préparation Production

```bash
# Build (si applicable)
NODE_ENV=production npm run build

# Migrer la base
NODE_ENV=production npx prisma migrate deploy
```

### 9.2 Configuration Serveur

Recommandé avec **PM2** :

```bash
npm install -g pm2
pm2 start src/server.js --name smarthealth
pm2 save
pm2 startup
```

### 9.3 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.smarthealth.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9.4 Monitoring

- Logs : `pm2 logs smarthealth`
- Processus : `pm2 monit`
- Health check : `GET /health`

---

*Documentation SmartHealth v1.0.0 - Projet Soutenance 2026 - Tous droits réservés*