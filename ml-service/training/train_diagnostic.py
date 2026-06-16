"""
Entraînement du classifieur de diagnostic SmartHealth.

Approche : à partir d'une base de connaissances clinique (symptôme -> probabilité
par maladie), on génère un jeu de données synthétique réaliste (chaque patient
présente un sous-ensemble de symptômes tiré selon ces probabilités, plus un bruit
de fond), puis on entraîne un RandomForest.

Pour la production : remplacer `generer_dataset()` par le chargement d'un dataset
labellisé réel (ex. Kaggle "Disease Symptom Prediction" / SymbiPredict) en
conservant le même format X (présence binaire des symptômes) / y (maladie).

Usage :
    python training/train_diagnostic.py
    python training/train_diagnostic.py --samples 800 --seed 42
"""

import argparse
import json
import sys
from pathlib import Path

# Sortie UTF-8 portable (évite les UnicodeEncodeError sur les consoles Windows cp1252)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "base_connaissances.json"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "diagnostic.pkl"
METRICS_PATH = MODELS_DIR / "diagnostic_metrics.json"

MODEL_VERSION = "randomforest-diagnostic-v1"

# Probabilité qu'un symptôme NON lié à la maladie apparaisse quand même (bruit de fond)
BRUIT_FOND = 0.03


def charger_base():
    with open(DATA_PATH, encoding="utf-8") as f:
        base = json.load(f)
    maladies = base["maladies"]
    # Vocabulaire = union triée de tous les symptômes
    vocab = sorted({s for m in maladies for s in m["symptomes"].keys()})
    return maladies, vocab


def generer_dataset(maladies, vocab, samples_par_maladie, rng):
    """Génère un DataFrame binaire (présence de symptômes) + labels maladie."""
    lignes = []
    labels = []
    index_symptome = {s: i for i, s in enumerate(vocab)}

    for maladie in maladies:
        profil = maladie["symptomes"]
        for _ in range(samples_par_maladie):
            vecteur = np.zeros(len(vocab), dtype=int)
            for symptome in vocab:
                proba = profil.get(symptome, BRUIT_FOND)
                if rng.random() < proba:
                    vecteur[index_symptome[symptome]] = 1
            # On évite les patients totalement asymptomatiques : on force au moins
            # le symptôme le plus caractéristique de la maladie.
            if vecteur.sum() == 0:
                symptome_cle = max(profil, key=profil.get)
                vecteur[index_symptome[symptome_cle]] = 1
            lignes.append(vecteur)
            labels.append(maladie["nom"])

    X = pd.DataFrame(lignes, columns=vocab)
    y = pd.Series(labels, name="maladie")
    return X, y


def entrainer(samples_par_maladie=600, seed=42):
    rng = np.random.default_rng(seed)
    maladies, vocab = charger_base()

    print(f"→ {len(maladies)} maladies, {len(vocab)} symptômes dans le vocabulaire")
    X, y = generer_dataset(maladies, vocab, samples_par_maladie, rng)
    print(f"→ Dataset généré : {len(X)} échantillons")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    modele = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=seed,
        n_jobs=-1,
    )
    modele.fit(X_train, y_train)

    y_pred = modele.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    rapport = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    matrice = confusion_matrix(y_test, y_pred, labels=modele.classes_)

    print(f"\n=== Performances (jeu de test) ===")
    print(f"Accuracy : {accuracy:.3f}")
    print(f"F1 (pondéré) : {f1:.3f}\n")
    print(classification_report(y_test, y_pred, zero_division=0))

    MODELS_DIR.mkdir(exist_ok=True)

    # Bundle complet pour le service d'inférence
    bundle = {
        "modele": modele,
        "symptomes": vocab,
        "maladies": list(modele.classes_),
        "version": MODEL_VERSION,
        # méta-données cliniques (urgence / spécialité) pour enrichir la réponse
        "meta": {
            m["nom"]: {
                "specialite": m["specialite"],
                "niveau_urgence": m["niveau_urgence"],
            }
            for m in maladies
        },
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"\n[OK] Modele sauvegarde : {MODEL_PATH}")

    metrics = {
        "version": MODEL_VERSION,
        "accuracy": round(accuracy, 4),
        "f1_pondere": round(f1, 4),
        "nb_echantillons": len(X),
        "nb_maladies": len(maladies),
        "nb_symptomes": len(vocab),
        "rapport_par_classe": {
            k: v for k, v in rapport.items()
            if k not in ("accuracy", "macro avg", "weighted avg")
        },
        "matrice_confusion": {
            "labels": list(modele.classes_),
            "matrice": matrice.tolist(),
        },
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
    print(f"[OK] Metriques sauvegardees : {METRICS_PATH}")

    # Matrice de confusion en image (optionnel, si matplotlib installé)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from sklearn.metrics import ConfusionMatrixDisplay

        fig, ax = plt.subplots(figsize=(12, 10))
        ConfusionMatrixDisplay(matrice, display_labels=modele.classes_).plot(
            ax=ax, xticks_rotation=90, cmap="Blues", colorbar=False
        )
        plt.tight_layout()
        fig.savefig(MODELS_DIR / "diagnostic_confusion.png", dpi=120)
        print(f"[OK] Matrice de confusion : {MODELS_DIR / 'diagnostic_confusion.png'}")
    except ImportError:
        print("[i] matplotlib non installe : image de matrice de confusion ignoree.")

    return accuracy, f1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entraînement du classifieur de diagnostic SmartHealth")
    parser.add_argument("--samples", type=int, default=600, help="Échantillons générés par maladie")
    parser.add_argument("--seed", type=int, default=42, help="Graine aléatoire (reproductibilité)")
    args = parser.parse_args()

    entrainer(samples_par_maladie=args.samples, seed=args.seed)
