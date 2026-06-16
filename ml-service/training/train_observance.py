"""
Entraînement du modèle d'observance thérapeutique (risque d'oubli de prise).

ORIGINALITÉ : ce modèle apprend des PROPRES données de la plateforme
(table `prise_medicament`). Le système s'améliore avec son utilisation.

Stratégie de démarrage à froid :
  1. Le script tente de charger les prises réelles depuis PostgreSQL (DATABASE_URL).
  2. S'il n'y a pas assez de données (< MIN_REELLES), il génère un jeu synthétique
     cliniquement plausible pour amorcer le modèle.
  3. Au fil du temps, relancer le script réentraîne sur les données réelles accumulées.

Cible : prise « manquée » (1) vs « prise » (0).

Usage :
    python training/train_observance.py [--samples 5000] [--seed 42]
"""

import argparse
import json
import os
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
MODEL_PATH = MODELS_DIR / "observance.pkl"
METRICS_PATH = MODELS_DIR / "observance_metrics.json"
MODEL_VERSION = "randomforest-observance-v1"

# Nombre minimal de prises réelles pour entraîner sur la BD plutôt que sur le synthétique
MIN_REELLES = 300

FEATURES = [
    "age", "nb_traitements_actifs", "taux_observance_historique",
    "heure_prise", "est_soir", "est_weekend", "jours_depuis_debut",
]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def z(v):
    v = np.asarray(v, dtype=float)
    return (v - np.mean(v)) / (np.std(v) + 1e-9)


# ----------------------------------------------------------------------
# Chargement des données RÉELLES (PostgreSQL) — best effort
# ----------------------------------------------------------------------
def charger_donnees_reelles():
    """Retourne (X, y, source) depuis la BD, ou None si indisponible/insuffisant."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        return None
    try:
        import psycopg2  # noqa
    except ImportError:
        print("ℹ️  psycopg2 non installé : impossible de lire la BD (repli synthétique).")
        return None

    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        # Prises terminées (prise/manquée) avec contexte patient et traitement
        cur.execute(
            """
            SELECT
              EXTRACT(YEAR FROM AGE(u.date_naissance))::float           AS age,
              pm.date_heure_prevue,
              r.date_debut,
              CASE WHEN pm.statut_prise = 'manquee' THEN 1 ELSE 0 END    AS manquee,
              p.id_patient
            FROM prise_medicament pm
            JOIN rappel_traitement r ON r.id_rappel = pm.id_rappel
            JOIN patient p ON p.id_patient = r.id_patient
            JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
            WHERE pm.statut_prise IN ('prise', 'manquee')
            """
        )
        lignes = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:  # noqa
        print(f"ℹ️  Lecture BD impossible ({e}) : repli synthétique.")
        return None

    if len(lignes) < MIN_REELLES:
        print(f"ℹ️  Seulement {len(lignes)} prise(s) réelle(s) (< {MIN_REELLES}) : repli synthétique.")
        return None

    # Agrégats par patient : nb de rappels et taux d'observance historique
    from collections import defaultdict
    total = defaultdict(int)
    manques = defaultdict(int)
    for age, prevue, debut, manquee, pid in lignes:
        total[pid] += 1
        manques[pid] += manquee

    X, y = [], []
    for age, prevue, debut, manquee, pid in lignes:
        taux_hist = 1.0 - (manques[pid] / total[pid]) if total[pid] else 1.0
        heure = prevue.hour if prevue else 12
        jour = prevue.weekday() if prevue else 0
        jours_depuis = (prevue.date() - debut.date()).days if (prevue and debut) else 0
        X.append([
            age if age else 40,
            total[pid],  # proxy du nombre de prises/traitements
            taux_hist,
            heure,
            1 if (heure >= 18 or heure < 6) else 0,
            1 if jour >= 5 else 0,
            max(0, jours_depuis),
        ])
        y.append(int(manquee))

    print(f"✓ {len(X)} prises réelles chargées depuis la base.")
    return np.array(X, dtype=float), np.array(y), "donnees_reelles"


# ----------------------------------------------------------------------
# Génération SYNTHÉTIQUE (amorçage)
# ----------------------------------------------------------------------
def generer_synthetique(n, rng):
    age = np.clip(rng.normal(40, 18, n), 5, 90)
    nb_traitements = np.clip(rng.poisson(1.5, n) + 1, 1, 8)
    taux_hist = np.clip(rng.beta(6, 2, n), 0, 1)        # plutôt observants
    heures_typiques = np.array([7, 8, 12, 13, 18, 20, 22])
    heure = rng.choice(heures_typiques, n)
    jour = rng.integers(0, 7, n)
    jours_depuis = rng.integers(0, 90, n)
    est_soir = ((heure >= 18) | (heure < 6)).astype(float)
    est_weekend = (jour >= 5).astype(float)

    logit = (
        -1.8
        + 2.5 * (1.0 - taux_hist)        # facteur dominant : observance passée
        + 0.35 * z(nb_traitements)        # charge médicamenteuse
        + 0.50 * est_soir                 # prises du soir/nuit plus oubliées
        + 0.40 * z(jours_depuis)          # lassitude en fin de traitement
        + 0.30 * est_weekend
        + 0.20 * z(np.abs(age - 45))      # âges extrêmes
    )
    y = rng.binomial(1, sigmoid(logit))

    X = np.column_stack([age, nb_traitements, taux_hist, heure, est_soir, est_weekend, jours_depuis])
    return X, y, "synthetique"


def entrainer(samples=5000, seed=42):
    rng = np.random.default_rng(seed)

    reel = charger_donnees_reelles()
    if reel is not None:
        X, y, source = reel
    else:
        X, y, source = generer_synthetique(samples, rng)
        print(f"→ Jeu synthétique généré : {samples} prises")

    print(f"→ Source des données : {source} | {len(X)} échantillons | taux d'oubli : {np.mean(y):.1%}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )
    modele = RandomForestClassifier(
        n_estimators=200, max_depth=10, min_samples_leaf=5,
        class_weight="balanced", random_state=seed, n_jobs=-1,
    )
    modele.fit(X_train, y_train)
    y_pred = modele.predict(X_test)
    y_proba = modele.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_proba) if len(set(y_test)) > 1 else 0.0
    print(f"\n=== Modèle observance ===")
    print(f"Accuracy : {acc:.3f} | F1 : {f1:.3f} | ROC-AUC : {auc:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0, target_names=["prise", "manquee"]))

    importances = sorted(zip(FEATURES, modele.feature_importances_), key=lambda t: -t[1])

    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump({
        "version": MODEL_VERSION,
        "modele": modele,
        "features": FEATURES,
        "source_entrainement": source,
    }, MODEL_PATH)
    print(f"\n[OK] Modele observance sauvegarde : {MODEL_PATH}")

    with open(METRICS_PATH, "w", encoding="utf-8") as fp:
        json.dump({
            "version": MODEL_VERSION,
            "source_entrainement": source,
            "n_echantillons": int(len(X)),
            "taux_oubli": round(float(np.mean(y)), 4),
            "accuracy": round(acc, 4),
            "f1": round(f1, 4),
            "roc_auc": round(auc, 4),
            "importances": [{"feature": k, "poids": round(float(v), 4)} for k, v in importances],
        }, fp, ensure_ascii=False, indent=2)
    print(f"[OK] Metriques sauvegardees : {METRICS_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entraînement du modèle d'observance SmartHealth")
    parser.add_argument("--samples", type=int, default=5000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    entrainer(samples=args.samples, seed=args.seed)
