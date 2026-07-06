# SmartHealth Mobile — Documentation technique du Frontend

Application mobile **React Native + Expo (SDK 54)**, écrite en **TypeScript**,
consommant l'API REST du backend SmartHealth (`/api/*`). Interface **française**,
design **« Trust & Vitality »**. Fonctionne dans **Expo Go (SDK 54)** — aucune
dépendance native lourde.

---

## 1. Vue d'ensemble

SmartHealth est une **super-app de santé** (e-santé + e-pharmacie + logistique).
L'application mobile couvre **tous les rôles** métier via une navigation
conditionnelle après connexion :

| Rôle | Espace mobile |
|------|---------------|
| **PATIENT / TUTEUR** | Accueil, Pharmacie, Santé (IA/carnet/ordonnances/rappels), Commandes, Profil |
| **MEDECIN / INFIRMIER** | Agenda, scan carnet (QR), consultations, ordonnances, interventions |
| **PHARMACIEN** | Tableau de bord, commandes entrantes, inventaire/stocks, profil pharmacie |
| **LIVREUR** | Tableau de bord, courses disponibles, livraisons, validation par code |
| **ADMIN** | Hors application mobile (web) |

Le rôle est déterminé par `type_utilisateur` du profil ; `RootNavigator` route
vers l'espace correspondant (`PatientTabs`, `ProTabs`, `PharmacienTabs`,
`LivreurTabs`).

---

## 2. Stack technique

| Domaine | Choix |
|---------|-------|
| Framework | **Expo SDK 54** (managed), RN 0.81.5, React 19.1 |
| Langage | **TypeScript** (strict) |
| Navigation | **React Navigation v7** (native-stack + bottom-tabs) |
| Données / cache | **TanStack Query v5** |
| État global | **Zustand** (session, panier) |
| Formulaires | **React Hook Form + Zod** |
| HTTP | **Axios** (intercepteur : refresh auto sur 401) |
| Stockage sécurisé | **expo-secure-store** (jetons chiffrés) |
| i18n | **i18next** (FR par défaut) |
| Icônes | **lucide-react-native** (+ react-native-svg) |
| QR | **react-native-qrcode-svg** |
| Police | **Inter** (@expo-google-fonts/inter) |
| Retour haptique | **expo-haptics** |

Alias d'import : `@/*` → `src/*` (résolu par Metro d'Expo via tsconfig).
Point d'entrée : `App.tsx` (providers + polices) → `index.js` (registerRootComponent).

---

## 3. Design system « Trust & Vitality »

Bleu médical (confiance/autorité) + vert vitalité (santé), sur fond gris-bleu clair.
Tokens centralisés dans `src/theme/` (`colors.ts`, `tokens.ts`, `index.tsx` +
hook `useTheme()`). Aucune couleur en dur dans le code (hors fond blanc du QR).

**Couleurs (clair)**
- Primary `#0052CC` · Primary sombre `#003D9B` · Vitalité `#2ECC71`
- Fond `#FAF8FF` · Surface `#FFFFFF` · Texte `#131B2E`
- Ombres ambiantes teintées bleu (élévation tonale niveaux 1 & 2)

**Typographie** : Inter (chargée par graisse : 400/500/600/700). Échelle
`caption 12 · body 16 · h3 24 · h2 28 · h1 32`. `AppText` applique la bonne
famille selon le poids.

**Formes & espacement** : rayons 8/12/16/24, grille 4/8 pt, cibles tactiles ≥ 44.

**Dark mode** : activé (`userInterfaceStyle: automatic`), thème sombre complet,
`NavigationContainer` calé sur les tokens, StatusBar auto, splash sombre.

**Logo** : `BrandLogo` (vectoriel) = squircle dégradé bleu + croix de soin +
battement ECG vert. Icônes d'app générées depuis `assets/logo/*.svg` via
`scripts/generate-icons.js`.

---

## 4. Architecture du projet

```
Frontend/
├─ App.tsx                     # Providers + polices Inter + NavigationContainer
├─ index.js                    # registerRootComponent
├─ app.json                    # config Expo (scheme, icônes, splash, dark)
├─ assets/                     # icônes générées + sources SVG du logo
├─ scripts/generate-icons.js   # (re)génère les PNG depuis les SVG (sharp)
└─ src/
   ├─ api/                     # client axios (+refresh), tokenManager, endpoints
   ├─ config/env.ts            # EXPO_PUBLIC_API_URL
   ├─ features/                # 1 dossier/domaine : *.api.ts + hooks.ts (Query)
   │   ├─ auth, pharmacie, commande, ordonnance, rappel, carnet, ia,
   │   ├─ intervention, livreur, pro, pharmacien, professionnel, article,
   │   └─ b2b, medical, profil
   ├─ components/              # UI réutilisable (AppText, Button, Input, Card…)
   ├─ theme/                   # tokens + ThemeProvider/useTheme
   ├─ store/                   # authStore, cartStore (Zustand)
   ├─ lib/                     # secureStorage, format (FCFA/dates), media
   ├─ i18n/                    # fr.json / en.json + config
   ├─ navigation/              # RootNavigator + stacks/tabs par rôle + types
   ├─ screens/                 # 68 écrans par domaine (voir §6)
   └─ types/                   # types partagés (enums backend, modèles)
```

**Convention** : les écrans composent l'UI et consomment les **hooks** de
`features/` ; toute la logique de données passe par ces hooks (TanStack Query).
**100 % des données sont réelles** (aucun mock).

---

## 5. Authentification & sécurité

- Connexion → `{ utilisateur, accessToken, refreshToken }`.
- **Access token** JWT court (1 h) + **refresh token** rotatif (30 j) — côté
  backend : jeton opaque hashé SHA-256, rotation à chaque usage + détection de
  réutilisation (routes `POST /auth/refresh`, `POST /auth/logout`).
- Jetons stockés chiffrés (**expo-secure-store**), cache mémoire pour les
  intercepteurs.
- **Refresh automatique** sur `401` avec file d'attente (une seule requête de
  refresh pour N requêtes concurrentes) — `src/api/client.ts`.
- **Vérification e-mail** par lien (cohérent backend) : après inscription →
  écran « Vérifiez votre e-mail » (renvoi possible).

---

## 6. Cartographie des écrans (68)

- **auth/** : Welcome, RoleSelect, Login, Register (+ Pro / Pharmacie / Livreur),
  ForgotPassword, VerifyEmailNotice, ResetPassword
- **accueil/** : AccueilHome, ArticleDetail
- **sante/** : SanteHome, Triage, Diagnostic/Compatibilité, MedecineTraditionnelle,
  HistoriqueIa, AnalyseDetail, Carnet (QR), Ordonnances (+détail), Rappels (+nouveau)
- **pharmacie/** : PharmacieHome (recherche stock), PharmacieList, PharmacieDetail,
  MedicamentDetail, Cart
- **commande/** : Checkout, Payment (NotchPay mobile money), CommandesList,
  CommandeDetail
- **profil/** : ProfilHome, EditProfil, Interventions (+détail/nouvelle), PartageDossier
- **livreur/** : Dashboard, Courses, LivraisonsList, ValiderLivraison, ProfilLivreur
- **pro/** : DashboardPro, ScanCarnet, DossierPatient, NouvelleConsultation,
  NouvelleOrdonnance, InterventionsProList, TerminerIntervention, Activite, ProfilPro
- **pharmacien/** : DashboardPharmacien, CommandesPharmacien (+détail),
  ServirOrdonnance, Inventaire, EditStock, AjouterStock, PharmacieProfil, ProfilPharmacien
- **common/** : RoleUnavailable

---

## 7. Lancer l'application

```bash
cd Frontend
npm install
npx expo start          # puis scanner le QR avec Expo Go (SDK 54)
```

**Variable d'environnement** (`.env`, non versionné — voir `.env.example`) :
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api    # émulateur Android
# Appareil physique : http://<IP_LAN_DU_BACKEND>:3000/api
```
Le backend doit tourner (port 3000). Pour tester le **mode sombre**, basculer le
thème système du téléphone.

---

## 8. Qualité & accessibilité

- **TypeScript** : 0 erreur · **ESLint** : 0 problème · **bundle Metro** : OK
- États `loading` (skeleton/indicateur) / `empty` / `error` (retry) systématiques
- **Accessibilité** : `Button` et composants interactifs avec `accessibilityRole`/
  `accessibilityLabel` ; champ mot de passe accessible (`Input isPassword` :
  œil avec label dynamique + hitSlop) ; police système mise à l'échelle respectée
- **Retour haptique** : ajout panier, succès/échec paiement
- Montants en **FCFA**, dates localisées `fr`

---

## 9. Points d'attention

- Pas de biométrie / OAuth Google côté backend → non exposés dans l'UI.
- Vérification du compte par **lien e-mail** (pas d'OTP SMS backend à ce jour).
- Paiement **NotchPay** : l'app initie puis *poll* le statut de la commande.
- Rôle non pris en charge sur mobile (ADMIN) → écran d'information dédié.
