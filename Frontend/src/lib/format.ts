/** Formatage des montants en FCFA (séparateur de milliers, sans décimales). */
export function formatFCFA(montant: number | string | null | undefined): string {
  const n = typeof montant === 'string' ? Number(montant) : montant;
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
}

/** Heure courte localisée (ex. 07:30). */
export function formatHeure(value: string | Date | null | undefined): string {
  if (!value) {
    return '—';
  }
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Date courte localisée (ex. 13 juin 2026). */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return '—';
  }
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
