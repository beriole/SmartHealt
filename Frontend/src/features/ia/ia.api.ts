import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Paginated,
  DiagnosticResult,
  CompatibiliteResult,
  MedecineTraditionnelleResult,
  AnalyseIa,
  TypeAnalyseIa,
} from '@/types';

export interface DiagnosticPayload {
  symptomes: string[];
  duree?: string;
  intensite?: string;
  langue?: string;
}

export async function diagnostic(
  payload: DiagnosticPayload,
): Promise<DiagnosticResult> {
  const res = await client.post<ApiResponse<DiagnosticResult>>(
    endpoints.ia.diagnostic,
    payload,
  );
  return res.data.data;
}

export async function compatibiliteMedicament(
  id_medicament: string,
): Promise<CompatibiliteResult> {
  const res = await client.post<ApiResponse<CompatibiliteResult>>(
    endpoints.ia.compatibiliteMedicament,
    { id_medicament },
  );
  return res.data.data;
}

export interface MedecineTraditionnellePayload {
  symptomes?: string[];
  maladie?: string;
}

export async function medecineTraditionnelle(
  payload: MedecineTraditionnellePayload,
): Promise<MedecineTraditionnelleResult> {
  const res = await client.post<ApiResponse<MedecineTraditionnelleResult>>(
    endpoints.ia.medecineTraditionnelle,
    payload,
  );
  return res.data.data;
}

export interface HistoriqueParams {
  type_analyse?: TypeAnalyseIa;
  page?: number;
  limit?: number;
}

export async function getHistorique(
  params: HistoriqueParams = {},
): Promise<Paginated<AnalyseIa>> {
  const res = await client.get<ApiResponse<Paginated<AnalyseIa>>>(
    endpoints.ia.historique,
    { params },
  );
  return res.data.data;
}

export async function getAnalyse(id: string): Promise<AnalyseIa> {
  const res = await client.get<ApiResponse<AnalyseIa>>(
    endpoints.ia.analyseById(id),
  );
  return res.data.data;
}
