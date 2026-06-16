import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Rappel,
  Prise,
  StatsObservance,
  StatutPrise,
} from '@/types';

export async function getRappels(): Promise<Rappel[]> {
  const res = await client.get<ApiResponse<Rappel[]>>(endpoints.rappels.list);
  return res.data.data;
}

export async function getPrisesDuJour(date?: string): Promise<Prise[]> {
  const res = await client.get<ApiResponse<Prise[]>>(
    endpoints.rappels.prisesDuJour,
    { params: date ? { date } : undefined },
  );
  return res.data.data;
}

export async function marquerPrise(
  id: string,
  statut_prise: StatutPrise,
  commentaire?: string,
): Promise<Prise> {
  const res = await client.put<ApiResponse<Prise>>(
    endpoints.rappels.marquerPrise(id),
    { statut_prise, commentaire },
  );
  return res.data.data;
}

export async function getStatsObservance(): Promise<StatsObservance> {
  const res = await client.get<ApiResponse<StatsObservance>>(
    endpoints.rappels.statsGlobales,
  );
  return res.data.data;
}

export interface CreateRappelPayload {
  id_ordonnance: string;
  id_medicament: string;
  frequence: Record<string, unknown>;
  heure_prise: string[];
  date_debut: string;
  date_fin: string;
  canal_notification?: string;
  alerte_tuteur_active?: boolean;
}

export async function createRappel(
  payload: CreateRappelPayload,
): Promise<Rappel> {
  const res = await client.post<ApiResponse<Rappel>>(
    endpoints.rappels.create,
    payload,
  );
  return res.data.data;
}
