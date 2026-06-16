"""
Microservice d'inférence ML — SmartHealth.

Expose les prédictions des modèles entraînés (scikit-learn) au backend Node.
Le backend appelle ces endpoints puis fait rédiger un rapport explicatif par le
LLM (Groq) à partir des probabilités retournées ici.

Lancement :
    uvicorn app:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

from common import normaliser_symptome

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
CHEMINS = {
    "diagnostic": MODELS_DIR / "diagnostic.pkl",
    "risque": MODELS_DIR / "risque.pkl",
    "observance": MODELS_DIR / "observance.pkl",
}

# Modèles chargés en mémoire
MODELES = {}


def charger_modeles():
    for nom, chemin in CHEMINS.items():
        if chemin.exists():
            MODELES[nom] = joblib.load(chemin)
            print(f"[OK] Modele {nom} charge (v{MODELES[nom].get('version')})")
        else:
            script = {
                "diagnostic": "train_diagnostic.py",
                "risque": "train_risque.py",
                "observance": "train_observance.py",
            }[nom]
            print(f"[!] Modele {nom} absent. Lancez : python training/{script}")


def niveau_risque(pourcent):
    """Classe un pourcentage de risque en niveau qualitatif."""
    if pourcent < 25:
        return "faible"
    if pourcent < 50:
        return "modere"
    if pourcent < 75:
        return "eleve"
    return "tres_eleve"


@asynccontextmanager
async def lifespan(app: FastAPI):
    charger_modeles()
    yield
    MODELES.clear()


app = FastAPI(
    title="SmartHealth ML Service",
    description="Microservice d'inférence des modèles IA propres à SmartHealth",
    version="1.0.0",
    lifespan=lifespan,
)


# ----------------------------- Schémas ------------------------------

class DiagnosticInput(BaseModel):
    symptomes: List[str] = Field(..., description="Liste de symptômes (clés normalisées)")
    top_k: int = Field(5, ge=1, le=14, description="Nombre de maladies probables à retourner")


class MaladieProbable(BaseModel):
    maladie: str
    probabilite_pourcent: float
    specialite: Optional[str] = None
    niveau_urgence: Optional[str] = None


class DiagnosticOutput(BaseModel):
    disponible: bool
    version: Optional[str] = None
    maladies_probables: List[MaladieProbable] = []
    symptomes_reconnus: List[str] = []
    symptomes_inconnus: List[str] = []


# ----------------------------- Endpoints ----------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "modeles_charges": list(MODELES.keys()),
    }


@app.get("/symptomes")
def liste_symptomes():
    """Vocabulaire de symptômes reconnu par le modèle (utile pour le frontend)."""
    bundle = MODELES.get("diagnostic")
    if not bundle:
        return {"disponible": False, "symptomes": []}
    return {"disponible": True, "symptomes": bundle["symptomes"]}


@app.post("/predict/diagnostic", response_model=DiagnosticOutput)
def predict_diagnostic(entree: DiagnosticInput):
    bundle = MODELES.get("diagnostic")
    if not bundle:
        return DiagnosticOutput(disponible=False)

    vocab = bundle["symptomes"]
    index = {s: i for i, s in enumerate(vocab)}
    meta = bundle.get("meta", {})

    reconnus, inconnus = [], []
    vecteur = np.zeros(len(vocab), dtype=int)
    for symptome in entree.symptomes:
        cle = normaliser_symptome(symptome)
        if cle in index:
            vecteur[index[cle]] = 1
            reconnus.append(cle)
        else:
            inconnus.append(symptome)

    modele = bundle["modele"]
    probabilites = modele.predict_proba([vecteur])[0]
    classes = modele.classes_

    ordre = np.argsort(probabilites)[::-1][: entree.top_k]
    maladies_probables = [
        MaladieProbable(
            maladie=classes[i],
            probabilite_pourcent=round(float(probabilites[i]) * 100, 1),
            specialite=meta.get(classes[i], {}).get("specialite"),
            niveau_urgence=meta.get(classes[i], {}).get("niveau_urgence"),
        )
        for i in ordre
        if probabilites[i] > 0.01
    ]

    return DiagnosticOutput(
        disponible=True,
        version=bundle.get("version"),
        maladies_probables=maladies_probables,
        symptomes_reconnus=reconnus,
        symptomes_inconnus=inconnus,
    )


# ------------------------- Risque (diabète / cardio) -------------------------

class RisqueInput(BaseModel):
    age: Optional[float] = None
    sexe: Optional[str] = Field(None, description="M ou F")
    imc: Optional[float] = None
    poids_kg: Optional[float] = None
    taille_cm: Optional[float] = None
    glucose: Optional[float] = Field(None, description="Glycémie à jeun mg/dL")
    tension_systolique: Optional[float] = None
    cholesterol: Optional[float] = None
    fumeur: Optional[bool] = None
    antecedent_familial_diabete: Optional[bool] = None
    antecedent_familial_cardiaque: Optional[bool] = None
    diabete_existant: Optional[bool] = None
    hypertension: Optional[bool] = None


def _valeur(entree: dict, defauts: dict, cle: str):
    """Valeur fournie sinon imputation par la moyenne d'entraînement."""
    v = entree.get(cle)
    if v is None:
        return defauts.get(cle, 0.0)
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    return float(v)


def _facteurs_risque(e: dict):
    """Explication interprétable : facteurs présents dans le profil."""
    facteurs = []
    if e.get("glucose") and e["glucose"] >= 110:
        facteurs.append("glycémie élevée")
    if e.get("imc") and e["imc"] >= 30:
        facteurs.append("obésité (IMC ≥ 30)")
    elif e.get("imc") and e["imc"] >= 25:
        facteurs.append("surpoids")
    if e.get("age") and e["age"] >= 50:
        facteurs.append("âge ≥ 50 ans")
    if e.get("tension_systolique") and e["tension_systolique"] >= 140:
        facteurs.append("tension élevée")
    if e.get("cholesterol") and e["cholesterol"] >= 240:
        facteurs.append("cholestérol élevé")
    if e.get("fumeur"):
        facteurs.append("tabagisme")
    if e.get("antecedent_familial_diabete"):
        facteurs.append("antécédents familiaux de diabète")
    if e.get("antecedent_familial_cardiaque"):
        facteurs.append("antécédents familiaux cardiaques")
    if e.get("diabete_existant"):
        facteurs.append("diabète existant")
    return facteurs


@app.post("/predict/risque")
def predict_risque(entree: RisqueInput):
    bundle = MODELES.get("risque")
    if not bundle:
        return {"disponible": False}

    e = entree.model_dump()
    # IMC calculé si absent mais poids/taille fournis
    if e.get("imc") is None and e.get("poids_kg") and e.get("taille_cm"):
        t = e["taille_cm"] / 100.0
        if t > 0:
            e["imc"] = round(e["poids_kg"] / (t * t), 1)
    e["sexe_homme"] = 1.0 if (e.get("sexe") or "").upper().startswith("H") or (e.get("sexe") or "").upper() == "M" else 0.0

    defauts = bundle["defauts"]
    facteurs = _facteurs_risque(e)

    sorties = []
    for type_risque, cle_modele, cle_features in [
        ("diabete", "modele_diabete", "features_diabete"),
        ("cardiovasculaire", "modele_cardio", "features_cardio"),
    ]:
        modele = bundle[cle_modele]
        vecteur = [_valeur(e, defauts, c) for c in bundle[cle_features]]
        proba = float(modele.predict_proba([vecteur])[0][1]) * 100
        sorties.append({
            "type": type_risque,
            "probabilite_pourcent": round(proba, 1),
            "niveau": niveau_risque(proba),
            "facteurs_contributifs": facteurs,
        })

    return {
        "disponible": True,
        "version": bundle.get("version"),
        "imc_utilise": e.get("imc"),
        "risques": sorties,
    }


# ------------------------------ Observance ----------------------------------

class ObservanceInput(BaseModel):
    age: Optional[float] = 40
    nb_traitements_actifs: Optional[int] = 1
    taux_observance_historique: Optional[float] = Field(0.9, ge=0, le=1)
    heure_prise: Optional[int] = Field(12, ge=0, le=23)
    jour_semaine: Optional[int] = Field(0, ge=0, le=6, description="0=lundi … 6=dimanche")
    jours_depuis_debut: Optional[int] = 0


@app.post("/predict/observance")
def predict_observance(entree: ObservanceInput):
    bundle = MODELES.get("observance")
    if not bundle:
        return {"disponible": False}

    e = entree.model_dump()
    heure = e["heure_prise"]
    est_soir = 1 if (heure >= 18 or heure < 6) else 0
    est_weekend = 1 if e["jour_semaine"] >= 5 else 0
    vecteur = [
        e["age"], e["nb_traitements_actifs"], e["taux_observance_historique"],
        heure, est_soir, est_weekend, e["jours_depuis_debut"],
    ]

    proba = float(bundle["modele"].predict_proba([vecteur])[0][1]) * 100

    facteurs = []
    if e["taux_observance_historique"] < 0.7:
        facteurs.append("faible observance passée")
    if e["nb_traitements_actifs"] >= 3:
        facteurs.append("nombreux traitements simultanés")
    if est_soir:
        facteurs.append("prise du soir/nuit")
    if e["jours_depuis_debut"] >= 30:
        facteurs.append("traitement de longue durée")
    if est_weekend:
        facteurs.append("week-end")

    return {
        "disponible": True,
        "version": bundle.get("version"),
        "probabilite_oubli_pourcent": round(proba, 1),
        "niveau_risque": niveau_risque(proba),
        "facteurs": facteurs,
    }
