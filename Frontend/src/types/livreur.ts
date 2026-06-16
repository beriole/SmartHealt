import { Commande } from './models';

export interface Livreur {
  id_livreur: string;
  id_utilisateur: string;
  vehicule_type?: string | null;
  plaque_immatriculation?: string | null;
  disponible: boolean;
  statut_verification: string;
  note_moyenne: string;
  total_livraisons: number;
  commission_totale_fcfa: string;
  commandes_livrees?: Commande[];
}
