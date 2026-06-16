import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Medicament,
  Paginated,
  Pharmacie,
  StockItem,
} from '@/types';

export type StockSort = 'price' | 'rating';

/** Recherche globale de stock par nom commercial / DCI / id. */
export async function searchStock(
  medicament: string,
  sort: StockSort = 'price',
): Promise<StockItem[]> {
  const res = await client.get<ApiResponse<StockItem[]>>(
    endpoints.stocks.search,
    { params: { medicament, sort } },
  );
  return res.data.data;
}

export interface MedicamentListParams {
  page?: number;
  limit?: number;
  recherche?: string;
  categorie?: string;
}

export async function getMedicaments(
  params: MedicamentListParams = {},
): Promise<Paginated<Medicament>> {
  const res = await client.get<ApiResponse<Paginated<Medicament>>>(
    endpoints.medicaments.list,
    { params },
  );
  return res.data.data;
}

export async function getMedicament(id: string): Promise<Medicament> {
  const res = await client.get<ApiResponse<Medicament>>(
    endpoints.medicaments.byId(id),
  );
  return res.data.data;
}

export interface PharmacieListParams {
  page?: number;
  limit?: number;
  recherche?: string;
  livraison_disponible?: boolean;
}

export async function getPharmacies(
  params: PharmacieListParams = {},
): Promise<Paginated<Pharmacie>> {
  const res = await client.get<ApiResponse<Paginated<Pharmacie>>>(
    endpoints.pharmacies.list,
    { params },
  );
  return res.data.data;
}

export async function getPharmacie(id: string): Promise<Pharmacie> {
  const res = await client.get<ApiResponse<Pharmacie>>(
    endpoints.pharmacies.byId(id),
  );
  return res.data.data;
}
