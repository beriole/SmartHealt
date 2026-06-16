import { formatFCFA, formatDate } from '@/lib/format';

describe('formatFCFA', () => {
  it('formate un nombre en FCFA', () => {
    expect(formatFCFA(1500)).toBe('1 500 FCFA');
  });

  it('accepte une chaîne numérique', () => {
    expect(formatFCFA('2000')).toBe('2 000 FCFA');
  });

  it('retourne — pour une valeur invalide', () => {
    expect(formatFCFA(null)).toBe('—');
    expect(formatFCFA(undefined)).toBe('—');
  });
});

describe('formatDate', () => {
  it('retourne — pour une valeur vide', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formate une date ISO', () => {
    expect(formatDate('2026-06-13T00:00:00.000Z')).toContain('2026');
  });
});
