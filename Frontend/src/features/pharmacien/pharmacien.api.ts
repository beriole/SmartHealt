import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Paginated,
  Commande,
  StockItem,
  PharmacieMine,
  AlertesStock,
  StatutCommande,
  Medicament,
  Ordonnance,
} from '@/types';

// ---- Pharmacie + tableau de bord ----
export async function getMyPharmacie(): Promise<PharmacieMine> {
  const res = await client.get<ApiResponse<PharmacieMine>>(endpoints.pharmacies.mine);
  return res.data.data;
}

// ---- Commandes de la pharmacie ----
export async function getCommandes(
  statut_commande?: StatutCommande,
): Promise<Paginated<Commande>> {
  const res = await client.get<ApiResponse<Paginated<Commande>>>(
    endpoints.commandes.list,
    { params: { limit: 50, ...(statut_commande ? { statut_commande } : {}) } },
  );
  return res.data.data;
}

export async function getCommande(id: string): Promise<Commande> {
  const res = await client.get<ApiResponse<Commande>>(endpoints.commandes.byId(id));
  return res.data.data;
}

export async function updateCommandeStatus(
  id: string,
  statut_commande: StatutCommande,
): Promise<Commande> {
  const res = await client.put<ApiResponse<Commande>>(
    endpoints.commandes.updateStatus(id),
    { statut_commande },
  );
  return res.data.data;
}

export async function attribuerLivreurAuto(id: string): Promise<Commande> {
  const res = await client.post<ApiResponse<Commande>>(
    endpoints.commandes.attribuerAuto(id),
  );
  return res.data.data;
}

export async function annulerCommande(id: string, motif?: string): Promise<Commande> {
  const res = await client.put<ApiResponse<Commande>>(
    endpoints.commandes.annuler(id),
    { motif },
  );
  return res.data.data;
}

// ---- Inventaire ----
export async function getMyStocks(): Promise<StockItem[]> {
  const res = await client.get<ApiResponse<StockItem[]>>(endpoints.stocks.myStocks);
  return res.data.data;
}

export async function getAlertes(): Promise<AlertesStock> {
  const res = await client.get<ApiResponse<AlertesStock>>(endpoints.stocks.alertes);
  return res.data.data;
}

export interface StockPayload {
  quantite_disponible?: number;
  prix_vente_fcfa?: number;
  seuil_alerte?: number;
  date_peremption?: string | null;
}

export async function updateStock(id: string, payload: StockPayload): Promise<StockItem> {
  const res = await client.put<ApiResponse<StockItem>>(
    endpoints.stocks.byId(id),
    payload,
  );
  return res.data.data;
}

export interface CreateStockPayload extends StockPayload {
  id_medicament: string;
}

export async function createStock(payload: CreateStockPayload): Promise<StockItem> {
  const res = await client.post<ApiResponse<StockItem>>(
    endpoints.stocks.create,
    payload,
  );
  return res.data.data;
}

export async function deleteStock(id: string): Promise<void> {
  await client.delete(endpoints.stocks.byId(id));
}

// ---- Catalogue médicaments (pour l'ajout au stock) ----
export async function searchMedicaments(recherche: string): Promise<Medicament[]> {
  const res = await client.get<ApiResponse<Paginated<Medicament>>>(
    endpoints.medicaments.list,
    { params: { recherche, limit: 30 } },
  );
  return res.data.data.data;
}

// ---- Ordonnances (service par le pharmacien) ----
export async function getOrdonnance(id: string): Promise<Ordonnance> {
  const res = await client.get<ApiResponse<Ordonnance>>(endpoints.ordonnances.byId(id));
  return res.data.data;
}

export interface TraiterOrdonnancePayload {
  action: 'servir' | 'refuser';
  lignes_servies?: string[];
  notes_pharmacien?: string;
}

export async function traiterOrdonnance(
  id: string,
  payload: TraiterOrdonnancePayload,
): Promise<Ordonnance> {
  const res = await client.put<ApiResponse<Ordonnance>>(
    endpoints.ordonnances.traiter(id),
    payload,
  );
  return res.data.data;
}
