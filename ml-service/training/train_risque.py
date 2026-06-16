"""
Entraînement des modèles de risque (diabète et risque cardiovasculaire).

Approche : on génère un jeu de données synthétique mais cliniquement cohérent.
Pour chaque "patient", on tire des caractéristiques réalistes (âge, IMC, glycémie,
tension, cholestérol, tabac, antécédents…), puis on calcule une probabilité de
risque via une fonction logistique pondérée par des facteurs de risque
épidémiologiques connus. Le label est tiré selon cette probabilité, et un
classifieur apprend à recouvrer la relation.

Pour la production : remplacer `generer_dataset()` par le chargement d'un dataset
réel (UCI Pima Indians Diabetes pour le diabète, Framingham pour le cardiovasculaire),
en conservant les mêmes colonnes de features.

Usage :
    python training/train_risque.py [--samples 4000] [--seed 42]
"""

import argparse
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "risque.pkl"
METRICS_PATH = MODELS_DIR / "risque_metrics.json"
MODEL_VERSION = "randomforest-risque-v1"

# Features utilisées par chaque modèle (l'ordre est conservé pour l'inférence)
FEATURES_DIABETE = [
    "age", "sexe_homme", "imc", "glucose", "tension_systolique",
    "antecedent_familial_diabete", "hypertension", "fumeur",
]
FEATURES_CARDIO = [
    "age", "sexe_homme", "imc", "glucose", "tension_systolique", "cholesterol",
    "fumeur", "antecedent_familial_cardiaque", "diabete_existant", "hypertension",
]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def echantillonner_features(n, rng):
    """Tire des caractéristiques cliniques réalistes pour n patients."""
    age = np.clip(rng.normal(42, 15, n), 18, 85)
    sexe_homme = rng.binomial(1, 0.5, n)
    imc = np.clip(rng.normal(25.5, 5, n), 15, 45)
    glucose = np.clip(rng.normal(95, 25, n), 60, 250)            # glycémie à jeun mg/dL
    tension_systolique = np.clip(rng.normal(125, 18, n), 90, 200)
    cholesterol = np.clip(rng.normal(190, 40, n), 120, 320)      # mg/dL
    fumeur = rng.binomial(1, 0.22, n)
    antecedent_familial_diabete = rng.binomial(1, 0.25, n)
    antecedent_familial_cardiaque = rng.binomial(1, 0.20, n)
    hypertension = (tension_systolique > 140).astype(int)
    diabete_existant = (glucose > 126).astype(int)

    return {
        "age": age,
        "sexe_homme": sexe_homme.astype(float),
        "imc": imc,
        "glucose": glucose,
        "tension_systolique": tension_systolique,
        "cholesterol": cholesterol,
        "fumeur": fumeur.astype(float),
        "antecedent_familial_diabete": antecedent_familial_diabete.astype(float),
        "antecedent_familial_cardiaque": antecedent_familial_cardiaque.astype(float),
        "hypertension": hypertension.astype(float),
        "diabete_existant": diabete_existant.astype(float),
    }


def z(v):
    """Standardisation (centre-réduit)."""
    return (v - np.mean(v)) / (np.std(v) + 1e-9)


def generer_dataset(n, rng):
    f = echantillonner_features(n, rng)

    # Risque de DIABÈTE : glycémie et IMC dominants, puis âge/antécédents
    logit_diab = (
        -1.3
        + 1.1 * z(f["glucose"])
        + 0.7 * z(f["imc"])
        + 0.5 * z(f["age"])
        + 0.45 * f["antecedent_familial_diabete"]
        + 0.30 * f["hypertension"]
        + 0.20 * z(f["tension_systolique"])
        + 0.15 * f["fumeur"]
        + 0.10 * f["sexe_homme"]
    )
    y_diab = rng.binomial(1, sigmoid(logit_diab))

    # Risque CARDIOVASCULAIRE : âge, tabac, tension, cholestérol, diabète
    logit_cardio = (
        -1.6
        + 0.9 * z(f["age"])
        + 0.7 * f["fumeur"]
        + 0.6 * z(f["tension_systolique"])
        + 0.5 * z(f["cholesterol"])
        + 0.5 * f["diabete_existant"]
        + 0.4 * z(f["imc"])
        + 0.3 * f["antecedent_familial_cardiaque"]
        + 0.25 * f["sexe_homme"]
        + 0.20 * f["hypertension"]
    )
    y_cardio = rng.binomial(1, sigmoid(logit_cardio))

    X_diab = np.column_stack([f[c] for c in FEATURES_DIABETE])
    X_cardio = np.column_stack([f[c] for c in FEATURES_CARDIO])
    # Valeurs moyennes (pour imputer les features manquantes à l'inférence)
    defauts = {c: float(np.mean(f[c])) for c in set(FEATURES_DIABETE) | set(FEATURES_CARDIO)}
    return X_diab, y_diab, X_cardio, y_cardio, defauts


def entrainer_un(nom, X, y, features, seed):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )
    modele = RandomForestClassifier(
        n_estimators=250, max_depth=12, min_samples_leaf=3,
        class_weight="balanced", random_state=seed, n_jobs=-1,
    )
    modele.fit(X_train, y_train)
    y_pred = modele.predict(X_test)
    y_proba = modele.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"\n=== Modèle {nom} ===")
    print(f"Accuracy : {acc:.3f} | F1 : {f1:.3f} | ROC-AUC : {auc:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0,
                                target_names=[f"pas_{nom}", nom]))

    importances = sorted(
        zip(features, modele.feature_importances_), key=lambda t: -t[1]
    )
    return modele, {
        "accuracy": round(acc, 4), "f1": round(f1, 4), "roc_auc": round(auc, 4),
        "importances": [{"feature": k, "poids": round(float(v), 4)} for k, v in importances],
        "taux_positif": round(float(np.mean(y)), 4),
    }


def entrainer(samples=4000, seed=42):
    rng = np.random.default_rng(seed)
    X_diab, y_diab, X_cardio, y_cardio, defauts = generer_dataset(samples, rng)
    print(f"→ Dataset généré : {samples} patients synthétiques")

    modele_diab, m_diab = entrainer_un("diabete", X_diab, y_diab, FEATURES_DIABETE, seed)
    modele_cardio, m_cardio = entrainer_un("cardiovasculaire", X_cardio, y_cardio, FEATURES_CARDIO, seed)

    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump({
        "version": MODEL_VERSION,
        "modele_diabete": modele_diab,
        "modele_cardio": modele_cardio,
        "features_diabete": FEATURES_DIABETE,
        "features_cardio": FEATURES_CARDIO,
        "defauts": defauts,
    }, MODEL_PATH)
    print(f"\n[OK] Modeles de risque sauvegardes : {MODEL_PATH}")

    with open(METRICS_PATH, "w", encoding="utf-8") as fp:
        json.dump({
            "version": MODEL_VERSION,
            "n_echantillons": samples,
            "diabete": m_diab,
            "cardiovasculaire": m_cardio,
        }, fp, ensure_ascii=False, indent=2)
    print(f"[OK] Metriques sauvegardees : {METRICS_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entraînement des modèles de risque SmartHealth")
    parser.add_argument("--samples", type=int, default=4000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    entrainer(samples=args.samples, seed=args.seed)
