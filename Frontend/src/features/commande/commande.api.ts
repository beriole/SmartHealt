import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Commande, Paginated , TypeLivraison } from '@/types';

export interface CreateCommandePayload {
  id_pharmacie: string;
  type_livraison: TypeLivraison;
  lignes: { id_stock: string; quantite_commandee: number }[];
  adresse_livraison?: string;
  latitude_livraison?: number;
  longitude_livraison?: number;
  /** Ordonnance numérique rattachée (médicaments sur ordonnance). */
  id_ordonnance?: string;
  /** Photo d'ordonnance (ordonnance papier). */
  photo_ordonnance_url?: string;
}

export async function createCommande(
  payload: CreateCommandePayload,
): Promise<Commande> {
  const res = await client.post<ApiResponse<Commande>>(
    endpoints.commandes.create,
    payload,
  );
  return res.data.data;
}

export interface CommandeListParams {
  page?: number;
  limit?: number;
  statut_commande?: string;
}

export async function getCommandes(
  params: CommandeListParams = {},
): Promise<Paginated<Commande>> {
  const res = await client.get<ApiResponse<Paginated<Commande>>>(
    endpoints.commandes.list,
    { params },
  );
  return res.data.data;
}

export async function getCommande(id: string): Promise<Commande> {
  const res = await client.get<ApiResponse<Commande>>(
    endpoints.commandes.byId(id),
  );
  return res.data.data;
}

export type PaymentMedium = 'mobile money' | 'orange money';

export interface PayerResult {
  transId: string;
  statut_paiement: string;
}

export async function payer(
  id: string,
  body: { phone: string; medium?: PaymentMedium },
): Promise<PayerResult> {
  const res = await client.post<ApiResponse<PayerResult>>(
    endpoints.commandes.payer(id),
    body,
  );
  return res.data.data;
}

export interface PaymentStatusResult {
  statut_paiement: string;
  status: string | null;
}

export async function getPaymentStatus(
  id: string,
): Promise<PaymentStatusResult> {
  const res = await client.get<ApiResponse<PaymentStatusResult>>(
    endpoints.commandes.paymentStatus(id),
  );
  return res.data.data;
}

export async function validerLivraison(id: string, code_validation: string) {
  const res = await client.post(endpoints.commandes.validerLivraison(id), {
    code_validation,
  });
  return res.data;
}

export interface EvaluationPayload {
  note_livraison?: number;
  commentaire_livraison?: string;
  note_pharmacie?: number;
  commentaire_pharmacie?: string;
}

export async function evaluer(id: string, payload: EvaluationPayload) {
  const res = await client.post(endpoints.commandes.evaluer(id), payload);
  return res.data;
}
