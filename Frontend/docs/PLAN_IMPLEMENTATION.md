# SmartHealth — Plan d'implémentation du Frontend Mobile

> Application mobile **React Native CLI** (workflow *bare*, sans Expo), écrite en **TypeScript**, consommant l'API REST `BACKEND` (`/api/*`).
> Document de référence pour l'équipe frontend. Langue produit : **Français** (FR par défaut, EN secondaire).
> **Auth** : access token JWT court (1h) + **refresh token** rotatif (30j) — endpoints `POST /auth/refresh` et `POST /auth/logout` déjà implémentés côté backend.

---

## 1. Vision & périmètre

SmartHealth est une **super-app de santé** (e-santé + e-pharmacie + logistique) destinée au marché camerounais/africain. Le backend gère **7 rôles**. Une **seule application mobile** sert plusieurs rôles via une navigation conditionnelle après connexion ; l'administration reste sur le web.

### Rôles cibles de l'app mobile

| Rôle | Priorité mobile | Justification |
|------|-----------------|---------------|
| **PATIENT** | 🟢 P0 — cœur de l'app | Parcours le plus riche : triage IA, commande, ordonnances, rappels, carnet |
| **TUTEUR** | 🟢 P0 (variante patient) | Gère les patients dont il est responsable (mêmes écrans, contexte « pour mon proche ») |
| **LIVREUR** | 🟡 P1 — app opérationnelle | Courses, carte, statut, validation par code PIN |
| **MEDECIN / INFIRMIER** | 🟠 P2 | Scan QR carnet, consultations, ordonnances, interventions domicile |
| **PHARMACIEN** | 🔵 P3 (plutôt web/tablette) | Stocks, commandes entrantes, traitement d'ordonnances — denses, mieux sur grand écran |
| **ADMIN** | ⚫ Hors mobile | Dashboard, finances, audit → web |

> **Stratégie recommandée** : livrer en P0 l'**app Patient/Tuteur** complète, puis le **module Livreur** (P1), puis **Professionnel** (P2). Le code est structuré dès le départ pour accueillir tous les rôles (dossiers `roles/`).

---

## 2. Stack technique

| Domaine | Choix | Raison |
|---------|-------|--------|
| Framework | **React Native CLI** (bare, dernière stable) | Contrôle total du natif, pas de dépendance Expo |
| Langage | **TypeScript** (strict) | Sûreté de types sur les contrats API |
| Navigation | **React Navigation v7** (native-stack + bottom-tabs) | Standard RN CLI, deep-linking via `linking` config |
| Data fetching / cache | **TanStack Query v5** | Cache, retry, invalidation, états loading/error normalisés |
| State global léger | **Zustand** | Auth/session, panier — simple, sans boilerplate |
| Formulaires | **React Hook Form + Zod** | Validation alignée sur les validators backend |
| Client HTTP | **Axios** (instance + intercepteurs) | Injection access token, **refresh auto** sur 401, mapping erreurs `{success,message}` |
| Stockage sécurisé | **react-native-keychain** | access + refresh tokens chiffrés (Keystore/Keychain) |
| Stockage simple | **@react-native-async-storage/async-storage** | Préférences non sensibles (langue, persistance cache Query) |
| Styles | **StyleSheet + thème tokenisé** (ou **NativeWind** optionnel) | Tokens du design system, dark mode |
| i18n | **i18next + react-native-localize** | FR/EN (cf. `Langue` backend) |
| Icônes | **lucide-react-native** (+ react-native-svg) | SVG cohérents, pas d'emoji (`no-emoji-icons`) |
| Cartes | **react-native-maps** | Pharmacies proches, suivi livreur, géoloc |
| Géoloc | **react-native-geolocation-service** + **react-native-permissions** | Position patient/livreur |
| QR | **react-native-vision-camera** + **react-native-qrcode-svg** | Scan carnet (pro) / affichage carnet (patient) |
| Notifications | **@notifee/react-native** + **@react-native-firebase/messaging** (FCM) | Rappels de prise (locales) + push (suivi commande) |
| Fichiers/photos | **react-native-image-picker** + **react-native-image-resizer** | Upload ordonnance papier, avatar, documents |
| WebView | **react-native-webview** | Paiement NotchPay (mobile money) |
| Config / env | **react-native-config** | `API_URL` par environnement (dev/prod) |
| Paiement | WebView NotchPay | `/api/commandes/:id/payer` → URL de paiement, puis polling du statut |
| Tests | **Jest + @testing-library/react-native**, **Maestro** (E2E) | Unitaire + parcours critiques |

### Versions & contraintes
- **React Native CLI** (bare) : build via **Android Studio** (Gradle) et **Xcode** (CocoaPods). Pas d'Expo Go.
- Outils natifs requis : **JDK 17**, Android SDK, (macOS pour iOS). `npx pod-install` après chaque ajout de lib native iOS.
- **Notifications push (FCM)** : créer un projet **Firebase**, ajouter `google-services.json` (Android) / `GoogleService-Info.plist` (iOS).
- **Cartes** : clé **Google Maps** par plateforme (AndroidManifest / AppDelegate).
- Permissions à déclarer : caméra (QR/photo), localisation, notifications, stockage.
- Node ≥ 20 pour l'outillage JS.

---

## 3. Design System (source de vérité)

Issu du moteur UI/UX (profil **« Accessible & Ethical »**, WCAG AAA, e-santé).

### 3.1 Couleurs (tokens sémantiques)

```ts
// theme/colors.ts
export const palette = {
  // Marque
  primary:        '#15803D', // vert pharmacie
  primaryOn:      '#FFFFFF',
  secondary:      '#22C55E', // vert clair (succès/actions positives)
  accent:         '#0369A1', // bleu confiance (liens, CTA secondaires)
  // Surfaces
  background:     '#F0FDF4',
  surface:        '#FFFFFF',
  muted:          '#E8F0F1',
  border:         '#BBF7D0',
  // Texte
  foreground:     '#14532D',
  textSecondary:  '#3F6B52',
  // États
  success:        '#16A34A',
  warning:        '#D97706',
  destructive:    '#DC2626',
  ring:           '#15803D',
};
```
- **Mode sombre** conçu en parallèle (`color-dark-mode`) : surfaces désaturées, contrastes re-vérifiés (texte primaire ≥ 4.5:1, secondaire ≥ 3:1).
- Couleur **jamais seule porteuse de sens** (`color-not-only`) : urgence triage = couleur **+ icône + label**.
- **Niveaux d'urgence** (enum `NiveauUrgence`) → mapping : `faible`=vert, `modere`=ambre, `urgent`=orange, `tres_urgent`=rouge, chacun avec icône distincte.

### 3.2 Typographie

- **Titres** : Figtree (600/700) · **Corps** : Noto Sans (400/500) — bon support des accents FR.
- Échelle : 12 / 14 / 16(base) / 18 / 24 / 32. Corps mobile **≥ 16px** (`readable-font-size`), interligne 1.5.
- Support **Dynamic Type** (mise à l'échelle système) sans casse de layout.
- Chiffres tabulaires pour prix FCFA et compteurs (`number-tabular`).

### 3.3 Espacement & layout
- Grille **4 / 8 pt**. Rayons : `sm 8 · md 12 · lg 16 · pill 999`.
- Cibles tactiles **≥ 44×44 pt** (`hitSlop` si l'icône est plus petite).
- **Safe areas** respectées (header, tab bar, CTA bas) via `react-native-safe-area-context`.
- Conteneurs : padding horizontal 16 (téléphone), gouttières adaptées en paysage/tablette.

### 3.4 Élévation & effets
- Échelle d'ombre cohérente (cartes, sheets, modales). Pas d'ombres aléatoires.
- Motion **150–300 ms**, `ease-out` à l'entrée, sortie ~60–70 %. Respecter `prefers-reduced-motion`.
- À éviter (consigne e-santé) : néon, animations lourdes, dégradés violet/rose « IA ».

> Tokens centralisés dans `theme/` ; **aucune valeur hex brute** dans les composants (`color-semantic`).

---

## 4. Architecture du projet

```
Frontend/
├─ android/                      # projet natif Android (Gradle)
├─ ios/                          # projet natif iOS (CocoaPods)
├─ index.js                      # point d'entrée RN (AppRegistry)
├─ App.tsx                       # Providers racine (QueryClient, Theme, Auth, i18n, SafeArea)
├─ src/
│  ├─ navigation/
│  │  ├─ RootNavigator.tsx       # choisit la pile selon session + rôle
│  │  ├─ AuthStack.tsx           # login, register, verify-email, forgot/reset password
│  │  ├─ PatientTabs.tsx         # bottom tabs (≤5) + stacks internes
│  │  ├─ LivreurTabs.tsx         # espace LIVREUR (P1)
│  │  ├─ ProTabs.tsx             # espace MEDECIN/INFIRMIER (P2)
│  │  └─ linking.ts              # deep-linking (smarthealth://…)
│  ├─ screens/                   # écrans, regroupés par domaine
│  │  ├─ auth/  accueil/  pharmacie/  commande/
│  │  ├─ sante/  (triage, carnet, ordonnances, rappels, ia)
│  │  ├─ profil/  livreur/  pro/
│  ├─ api/
│  │  ├─ client.ts               # instance axios + intercepteurs (refresh auto)
│  │  ├─ endpoints.ts            # constantes des chemins /api/*
│  │  └─ modules/                # auth.api, pharmacie.api, commande.api, ia.api…
│  ├─ features/                  # logique par domaine (hooks Query, types, schémas Zod)
│  │  ├─ auth/  pharmacie/  commande/  ordonnance/  rappel/
│  │  ├─ triage/  ia/  carnet/  intervention/  article/  livreur/
│  ├─ components/                # UI réutilisable (Button, Card, Input, Badge, EmptyState…)
│  ├─ theme/                     # colors, typography, spacing, shadows, useTheme()
│  ├─ store/                     # Zustand (authStore, cartStore)
│  ├─ lib/                       # utils (format FCFA, dates, géoloc, qr, upload, secureStorage)
│  ├─ i18n/                      # fr.json, en.json, config
│  └─ types/                     # types partagés (enums backend, modèles)
├─ assets/                       # polices (Figtree, Noto Sans), images, icône, splash
├─ react-native.config.js        # liaison des polices/assets natifs
├─ .env / .env.production        # API_URL (react-native-config)
├─ tsconfig.json (paths @/*)
├─ babel.config.js / metro.config.js
└─ package.json
```

**Conventions** : un *feature* = `api` (appels) + `hooks` (Query) + `schema` (Zod) + `types`. Les écrans (`src/screens/`) ne contiennent que de la composition UI ; toute logique de données passe par les hooks de `features/`. La navigation est centralisée dans `src/navigation/`.

---

## 5. Couche API & authentification

### 5.1 Client Axios
- `baseURL = Config.API_URL` (react-native-config ; ex. `http://192.168.x.x:3000/api` en dev — **IP LAN**, pas `localhost`, pour un appareil physique ; `http://10.0.2.2:3000/api` sur l'émulateur Android).
- **Intercepteur requête** : injecte `Authorization: Bearer <accessToken>` depuis Keychain.
- **Intercepteur réponse** :
  - Déballe `response.data.data` ; conserve `message`.
  - **`401` → refresh automatique** : appelle `POST /auth/refresh` avec le refresh token, met à jour les tokens, **rejoue** la requête d'origine. File d'attente des requêtes concurrentes pendant le refresh (un seul refresh à la fois). Si le refresh échoue → purge session + retour `AuthStack`.
  - `429` → message « Trop de requêtes » (rate-limit global 100/15min, auth 5/15min, IA 10/min).
  - Normalise les erreurs en `{ message, status, fields? }` pour l'UI.

### 5.2 Session & rôle
- Au login, le backend renvoie `{ utilisateur, token (access, 1h), refreshToken (30j) }`.
  - **access token + refresh token** → stockés dans **Keychain** (chiffré).
  - `utilisateur` → Zustand (`authStore`), rôle dérivé de `type_utilisateur`.
- **Rotation** : chaque `POST /auth/refresh` renvoie un **nouveau** refresh token (l'ancien est révoqué côté serveur) → toujours persister le dernier. Un token déjà utilisé rejoué = `401` (sécurité anti-vol).
- **Déconnexion** : `POST /auth/logout` avec le refresh token (révocation serveur) + purge Keychain + reset `authStore`.
- **Garde de navigation** dans `RootNavigator` : au démarrage, lire les tokens du Keychain → si présents, charger `GET /utilisateurs/me` puis router vers l'espace du rôle ; sinon `AuthStack`.

### 5.3 Gestion des fichiers (multipart)
- Upload via `FormData` (avatar `PUT /utilisateurs/:id/avatar`, photo d'ordonnance sur `POST /commandes`, documents pro/pharmacie/livreur).
- Compression image avant envoi (`react-native-image-resizer`), formats légers.

---

## 6. Navigation (arbre par rôle)

### Patient/Tuteur — Bottom Tabs (5 max, `bottom-nav-limit`)
1. **Accueil** — résumé santé, prochaine prise, articles, accès rapide triage IA
2. **Pharmacie** — recherche médicaments/pharmacies (carte + liste), détail, panier
3. **Santé** — triage IA, carnet (QR), ordonnances, rappels, médecine traditionnelle
4. **Commandes** — en cours + historique, suivi livraison temps réel
5. **Profil** — infos, langue, sécurité, déconnexion (action destructive séparée)

Tab active mise en évidence (`nav-state-active`), icône **+ label** sur chaque item.
Navigations secondaires (détails, checkout, paramètres) en **stack** au-dessus des tabs.

### Livreur (P1)
Tabs : **Courses dispo** · **Mes livraisons** · **Carte** · **Profil/Stats**.

### Professionnel (P2)
Tabs : **Agenda/Consultations** · **Scan carnet (QR)** · **Interventions** · **Profil**.

---

## 7. Cartographie écrans ↔ endpoints

### 7.1 Authentification `(auth)`
| Écran | Endpoint(s) |
|-------|-------------|
| Connexion | `POST /auth/login` |
| Inscription (sélecteur de rôle) | `POST /auth/register` |
| Vérification email | `GET /auth/verify-email/:token` · `POST /auth/resend-verification` |
| Mot de passe oublié / reset | `POST /auth/forgot-password` · `POST /auth/reset-password/:token` |

### 7.2 Espace Patient
| Domaine | Écrans | Endpoints |
|---------|--------|-----------|
| **Accueil** | Tableau de bord santé | `GET /utilisateurs/me`, `GET /rappels/prises-du-jour`, `GET /articles` |
| **Triage IA** | Saisie symptômes → résultat (urgence, conduite) | `POST /triage`, `PUT /triage/:id/suivi` |
| **Diagnostic IA** | Diagnostic complet + traitements en stock | `POST /ia/diagnostic`, `POST /ia/recommandation-traitement` |
| **Compatibilité / Prévention** | Vérifier un médicament, analyse préventive | `POST /ia/compatibilite-medicament`, `POST /ia/analyse-predictive` |
| **Médecine traditionnelle** | Remèdes/plantes | `POST /ia/medecine-traditionnelle` |
| **Historique IA** | Liste + détail | `GET /ia/historique`, `GET /ia/analyses/:id` |
| **Pharmacie** | Recherche médicament (stock + prix + pharmacie) | `GET /stocks/search`, `GET /medicaments`, `GET /medicaments/:id` |
| | Liste/détail pharmacies (carte) | `GET /pharmacies`, `GET /pharmacies/:id` |
| **Panier & Commande** | Panier → création commande directe | `POST /commandes` |
| | Commande depuis ordonnance numérique | `POST /commandes/from-ordonnance`, `GET /pharmacies/:id/evaluate-ordonnance/:id_ordonnance` |
| | Commande par photo d'ordonnance papier | `POST /commandes` (multipart `photo_ordonnance`) |
| | Paiement | `POST /commandes/:id/payer` (WebView NotchPay) + callback |
| **Commandes** | Liste / détail / suivi statut | `GET /commandes`, `GET /commandes/:id` |
| | Confirmer réception (code) + évaluer | `POST /commandes/:id/valider-livraison`, `POST /commandes/:id/evaluer` |
| **Ordonnances** | Liste / détail (lignes, posologie) | `GET /ordonnances`, `GET /ordonnances/:id` |
| **Carnet de santé** | Affichage + QR + régénérer | `GET /carnets/my-carnet`, `POST /carnets/my-carnet/regenerate-qr` |
| **Rappels** | Créer, lister, prises du jour, marquer prise | `POST /rappels`, `GET /rappels`, `GET /rappels/prises-du-jour`, `PUT /rappels/prises/:id` |
| | Stats observance + risque IA d'oubli | `GET /rappels/stats/globales`, `GET /rappels/risque-observance` |
| **Interventions à domicile** | Planifier (infirmier) | `POST /interventions`, `GET /interventions`, `GET /interventions/:id` |
| **Consultations** | Historique (lecture) | `GET /consultations`, `GET /consultations/:id` |
| **Articles santé** | Liste / détail | `GET /articles`, `GET /articles/:id` |
| **Profil** | Voir/éditer, avatar, langue | `GET /utilisateurs/me`, `PUT /utilisateurs/:id`, `PUT /utilisateurs/:id/avatar`, `PUT /patients/:id` |
| **B2B (consentement)** | Générer PIN de partage dossier | `POST /b2b/patient/generer-pin` |

### 7.3 Espace Livreur (P1)
| Écran | Endpoints |
|-------|-----------|
| Tableau de bord (gains, stats) | `GET /livreurs/dashboard` |
| Courses disponibles | `GET /commandes/disponibles-livraison` |
| Accepter une course | `POST /commandes/:id/assigner-livreur` |
| Valider livraison (PIN patient) | `POST /commandes/:id/valider-livraison` |
| Position temps réel / disponibilité | `PUT /livreurs/position`, `PUT /livreurs/disponibilite` |
| Onboarding & document | `POST /livreurs/register`, `PUT /livreurs/upload-document` |

### 7.4 Espace Professionnel (P2)
| Écran | Endpoints |
|-------|-----------|
| Scan QR carnet patient | `GET /carnets/scan/:qrToken` |
| Créer/éditer consultation | `POST /consultations`, `PUT /consultations/:id` |
| Émettre ordonnance | `POST /ordonnances`, `PUT /ordonnances/:id` |
| Interventions (statut) | `PUT /interventions/:id/status` |
| Vérification de compte | `PUT /professionnels/:id/upload-document` |

---

## 8. Fonctionnalités transverses

- **i18n FR/EN** : toutes les chaînes externalisées ; langue initiale = `langue_preferee` de l'utilisateur, surchargée dans Profil.
- **Notifications** : rappels de prise en **notifications locales programmées** (`@notifee/react-native`, lien profond vers « marquer la prise ») ; changements de statut commande en **push FCM** (`@react-native-firebase/messaging`).
- **Géolocalisation & cartes** : pharmacies proches (rayon livraison), suivi livreur. Permission contextualisée (`react-native-permissions`) + dégradé si refusée.
- **QR Code** : patient affiche le sien (carnet) ; pro scanne (`react-native-vision-camera`).
- **Mode hors-ligne** : cache TanStack Query + messages d'état offline (`offline-support`). Lecture du carnet/ordonnances en cache.
- **Formats locaux** : montants en **FCFA** (séparateur de milliers, sans décimales), dates `fr`.
- **États vides & erreurs** : chaque liste a un `EmptyState` (message + action) et un état d'erreur avec **retry**.
- **Skeletons** pour tout chargement > 300 ms (pas de spinner bloquant long).

---

## 9. Composants UI de base (à livrer en premier)

`Button` (variants primary/secondary/destructive/ghost, état loading) · `Input` (label visible, erreur sous le champ, helper) · `Card` · `Badge`/`UrgencyBadge` · `Avatar` · `Sheet`/`Modal` (scrim 40–60 %, échappatoire) · `Toast` (auto-dismiss 3–5 s, `aria-live`) · `EmptyState` · `ErrorState` · `Skeleton` · `ListItem` · `SearchBar` · `Stepper` (multi-étapes commande) · `PriceTag` (FCFA tabulaire) · `MapView` wrapper · `QRDisplay` / `QRScanner`.

Tous conformes : touch ≥ 44pt, feedback de press (opacity/scale 0.95–1.05), labels d'accessibilité, états light/dark.

---

## 10. Roadmap d'implémentation (par sprints)

| Sprint | Lot | Contenu |
|--------|-----|---------|
| **S0 — Fondations** | Setup | Init React Native CLI + TS, React Navigation, thème/tokens, polices (Figtree/Noto Sans), QueryClient, axios + refresh auto, Keychain, i18n, navigation gardée, composants UI de base |
| **S1 — Auth** | Comptes | Login, register (rôles), vérif email, forgot/reset, store session, redirection par rôle |
| **S2 — Pharmacie & Catalogue** | E-commerce 1 | Recherche stock, liste/détail médicament, liste/détail pharmacie + carte, panier (Zustand) |
| **S3 — Commande & Paiement** | E-commerce 2 | Checkout (retrait/livraison), commande directe + depuis ordonnance + photo papier, paiement NotchPay, suivi commande, validation par code, évaluation |
| **S4 — Santé & IA** | Cœur médical | Triage IA, diagnostic IA, compatibilité, médecine traditionnelle, historique IA |
| **S5 — Carnet, Ordonnances, Rappels** | Suivi | Carnet + QR, ordonnances, rappels + prises du jour + notifications + stats observance |
| **S6 — Profil, Interventions, Articles, B2B** | Compléments | Profil/avatar/langue, interventions domicile, articles santé, PIN consentement |
| **S7 — Module Livreur (P1)** | Logistique | Dashboard, courses, carte, position, validation PIN |
| **S8 — Module Professionnel (P2)** | Pro | Scan carnet, consultations, ordonnances, interventions |
| **S9 — Durcissement** | Qualité | Dark mode complet, accessibilité, perf listes (virtualisation), tests E2E, builds release Android/iOS |

---

## 11. Qualité, accessibilité & tests

**Accessibilité (CRITIQUE)** : contraste ≥ 4.5:1, `accessibilityLabel` sur icônes/boutons, ordre de focus = ordre visuel, Dynamic Type, `prefers-reduced-motion`, couleur jamais seule.

**Checklist pré-livraison par écran** :
- [ ] Touch ≥ 44pt, feedback de press, état disabled clair
- [ ] Safe areas respectées, pas de scroll horizontal
- [ ] États loading (skeleton) / vide / erreur (retry) présents
- [ ] Labels visibles sur les champs, erreurs sous le champ, focus 1er champ invalide
- [ ] FCFA/dates localisés, chaînes i18n
- [ ] Light **et** dark testés
- [ ] Testé sur 375px et en paysage

**Tests** : unitaires (utils, schémas Zod, hooks) + composants (Testing Library) ; **E2E Maestro** sur les parcours critiques : login → recherche → commande → paiement → suivi ; triage IA ; création rappel + notification.

---

## 12. Mise en place (commandes de bootstrap)

```bash
# Depuis la racine du repo — projet React Native CLI en TypeScript
npx @react-native-community/cli@latest init Frontend
cd Frontend

# Navigation
npm i @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm i react-native-screens react-native-safe-area-context

# Données, formulaires, état
npm i @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers
npm i i18next react-i18next react-native-localize
npm i react-native-keychain @react-native-async-storage/async-storage react-native-config

# UI & natifs
npm i lucide-react-native react-native-svg react-native-qrcode-svg
npm i react-native-maps react-native-geolocation-service react-native-permissions
npm i react-native-vision-camera react-native-image-picker react-native-image-resizer
npm i react-native-webview
npm i @notifee/react-native @react-native-firebase/app @react-native-firebase/messaging

# iOS : installer les pods après les libs natives
cd ios && npx pod-install && cd ..

# Qualité (Jest est déjà configuré par le template RN)
npm i -D @testing-library/react-native eslint prettier
```

**Variables d'environnement** (`.env`, lues par `react-native-config`) :
```
API_URL=http://<IP_LAN>:3000/api
```
> Sur **émulateur Android**, le backend `localhost` est joignable via `http://10.0.2.2:3000/api`. Sur **appareil physique**, utiliser l'**IP LAN** de la machine backend (port 3000 ouvert au pare-feu, **CORS** vérifié). En clair HTTP (dev), autoriser le trafic non-TLS : `usesCleartextTraffic` (AndroidManifest) / ATS exception (iOS).

---

## 13. Risques & points d'attention

- **Auth** : access token court (1h) + refresh rotatif (30j) gérés par l'intercepteur Axios. Bien persister le **nouveau** refresh token à chaque rotation (l'ancien est révoqué). Prévoir un verrou pour éviter les refresh concurrents.
- **Notifications push (FCM)** : nécessitent un projet **Firebase** + fichiers de config natifs ; sur iOS, certificat APNs. Les rappels de prise peuvent rester en **notifications locales** (sans serveur).
- **NotchPay** : flux de paiement par WebView + webhook serveur ; l'app doit *poller* le statut commande après retour (`GET /commandes/:id`).
- **Rate-limits** (auth 5/15min, IA 10/min) : gérer les `429` avec messages clairs et back-off.
- **Données médicales sensibles** : pas de log de données patient, tokens en **Keychain** uniquement, écrans carnet/ordonnance non exposés en cache clair persistant.
- **Cartes** : clé API (Google Maps) requise pour le build natif Android/iOS.
- **Build natif** : ajouter une lib native impose `pod-install` (iOS) et parfois un rebuild Gradle ; intégrer EAS-like CI plus tard si besoin.

---

*Prochaine étape proposée : exécuter le Sprint S0 (fondations) — init React Native CLI + thème/tokens + client API (avec refresh auto) + navigation gardée + composants de base.*
```
