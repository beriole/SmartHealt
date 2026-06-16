# SmartHealth — Microservice IA (modèles entraînés maison)

Microservice Python (FastAPI + scikit-learn) qui héberge **vos propres modèles de Machine Learning**. Le backend Node les appelle pour obtenir des prédictions chiffrées, puis fait rédiger un rapport explicatif en français par le LLM (Groq).

> **Architecture hybride** : le modèle ML produit les **probabilités**, le LLM produit le **texte**. Argument fort pour la soutenance : « les chiffres viennent de *mon* modèle, le LLM ne fait que les expliquer ».

```
Backend Node ──HTTP──► ce microservice (modèle .pkl) ──► probabilités
      │                                                       │
      └──────────► Groq (LLM) rédige le rapport à partir des probabilités
```

## Modèles disponibles

| Modèle | Fichier | Endpoint | Performance | Statut |
|---|---|---|---|---|
| Diagnostic (symptômes → maladie) | `diagnostic.pkl` | `POST /predict/diagnostic` | accuracy 0,94 | ✅ |
| Risque diabète | `risque.pkl` | `POST /predict/risque` | ROC-AUC 0,79 | ✅ |
| Risque cardiovasculaire | `risque.pkl` | `POST /predict/risque` | ROC-AUC 0,76 | ✅ |
| Observance (risque d'oubli) | `observance.pkl` | `POST /predict/observance` | ROC-AUC 0,67 | ✅ |

- **Diagnostic** : 14 maladies prévalentes en Afrique centrale (paludisme, typhoïde, pneumonie, drépanocytose, méningite…), 61 symptômes. Alimente `/api/ia/diagnostic`.
- **Risque diabète + cardiovasculaire** : à partir du profil clinique (âge, IMC, glycémie, tension, cholestérol, tabac, antécédents). Alimente `/api/ia/analyse-predictive`. Métriques réalistes (labels bruités, pas de sur-apprentissage).
- **Observance** : prédit le risque d'oubli d'une prise. **S'entraîne sur les propres données `prise_medicament` de la plateforme** (repli synthétique tant que la base n'a pas assez de données) — le système s'améliore avec son usage. Alimente `/api/rappels/risque-observance`.

Métriques détaillées : `models/*_metrics.json`.

> **Diagnostic complet côté backend** : l'endpoint `/api/ia/diagnostic` du backend ne se contente pas du diagnostic. Il renvoie aussi la **conduite à tenir** (mesures non médicamenteuses), les **traitements recommandés** parmi les médicaments réellement en stock, et **les pharmacies où les acheter** (nom, prix, `id_stock` pour commander directement). Le modèle ML fournit les probabilités, le LLM rédige le tout.

## Installation

```bash
cd ml-service
python -m venv venv
# Windows : venv\Scripts\activate   |   Linux/Mac : source venv/bin/activate
pip install -r requirements.txt
```

## Entraîner le modèle

```bash
python training/train_diagnostic.py     # diagnostic (symptômes → maladie)
python training/train_risque.py          # risque diabète + cardiovasculaire
python training/train_observance.py      # observance (lit la BD si DATABASE_URL est défini)

# Options communes : --samples N, --seed 42
```

Chaque script produit son `.pkl` dans `models/` et un `*_metrics.json` (accuracy, F1, ROC-AUC, importances des variables). `train_diagnostic.py` génère aussi une matrice de confusion (`diagnostic_metrics.json`, + image si `matplotlib` installé).

Pour réentraîner l'observance sur les **vraies données** accumulées : définir `DATABASE_URL` et installer `psycopg2-binary`, puis relancer `train_observance.py` (bascule automatique sur la BD dès ~300 prises réelles).

## Lancer le service

```bash
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

Endpoints :
- `GET /health` — état du service et modèles chargés
- `GET /symptomes` — vocabulaire de symptômes reconnu (utile pour le frontend)
- `POST /predict/diagnostic` — `{ "symptomes": ["fievre", "frissons", ...], "top_k": 5 }`
- `POST /predict/risque` — `{ "age": 55, "sexe": "M", "imc": 32, "glucose": 145, "fumeur": true, ... }` → risques diabète + cardiovasculaire
- `POST /predict/observance` — `{ "age": 70, "nb_traitements_actifs": 4, "taux_observance_historique": 0.5, "heure_prise": 22, ... }` → probabilité d'oubli
- Documentation interactive auto-générée : http://localhost:8001/docs

## Intégration backend

Le backend Node lit `ML_SERVICE_URL` (défaut `http://127.0.0.1:8001`) dans son `.env`.
**Dégradation gracieuse** : si ce service est éteint, le backend bascule automatiquement
sur le LLM seul — aucune route ne casse.

## Passer à des données réelles (production)

Le modèle actuel apprend sur un dataset **synthétique** généré depuis une base de
connaissances clinique (`data/base_connaissances.json`). Pour la production :

1. Télécharger un dataset labellisé réel (Kaggle « Disease Symptom Prediction », SymbiPredict…).
2. Adapter `generer_dataset()` dans `training/train_diagnostic.py` pour charger ce CSV,
   en conservant le format `X` (présence binaire des symptômes) / `y` (maladie).
3. Réentraîner — le service et l'intégration Node restent inchangés.

## Pistes d'extension

- **Modèle d'observance** entraîné sur **vos propres données** `prise_medicament` :
  prédire le risque qu'un patient manque ses prises. Très original (le système apprend
  de sa propre utilisation).
- **Modèles de risque** (diabète/cardio) sur datasets UCI (Pima, Framingham).
- **NLP** : fine-tuning de DistilCamemBERT pour comprendre des symptômes en texte libre.
