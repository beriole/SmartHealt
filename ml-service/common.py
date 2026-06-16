"""Utilitaires partagés entre l'entraînement et le service d'inférence."""
import unicodedata


def normaliser_symptome(s: str) -> str:
    """Normalise un symptôme : minuscules, sans accents, espaces/tirets -> underscore.

    Garantit que "Fièvre", "fievre" et "fièvre " produisent le même token,
    afin que les symptômes envoyés par le frontend correspondent au vocabulaire du modèle.
    """
    if not isinstance(s, str):
        return ""
    s = s.strip().lower()
    # Suppression des accents
    s = "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )
    # Uniformisation des séparateurs
    for sep in (" ", "-", "'", "/"):
        s = s.replace(sep, "_")
    while "__" in s:
        s = s.replace("__", "_")
    return s.strip("_")


def normaliser_liste(symptomes):
    """Normalise une liste de symptômes en supprimant les doublons et les vides."""
    vus = []
    for s in symptomes or []:
        n = normaliser_symptome(s)
        if n and n not in vus:
            vus.append(n)
    return vus
