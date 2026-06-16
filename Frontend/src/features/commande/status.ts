import { StatutCommande, StatutPaiement } from '@/types';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function commandeTone(statut: StatutCommande): Tone {
  switch (statut) {
    case 'livree':
      return 'success';
    case 'annulee':
      return 'danger';
    case 'en_livraison':
    case 'preparee':
    case 'confirmee':
      return 'info';
    default:
      return 'warning'; // en_attente
  }
}

export function paiementTone(statut: StatutPaiement): Tone {
  switch (statut) {
    case 'paye':
      return 'success';
    case 'echoue':
      return 'danger';
    case 'rembourse':
      return 'neutral';
    default:
      return 'warning'; // en_attente
  }
}
