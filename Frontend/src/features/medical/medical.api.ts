import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Paginated,
  Carnet,
  Consultation,
  Medicament,
} from '@/types';

export async function scanCarnet(token: string): Promise<Carnet> {
  const res = await client.get<ApiResponse<Carnet>>(endpoints.carnets.scan(token));
  return res.data.data;
}

export interface CreateConsultationPayload {
  id_patient: string;
  id_carnet: string;
  date_consultation: string;
  motif: string;
  type_consultation: string;
  diagnostic?: string;
  observations?: string;
}

export async function createConsultation(
  payload: CreateConsultationPayload,
): Promise<Consultation> {
  const res = await client.post<ApiResponse<Consultation>>(
    endpoints.consultations.create,
    payload,
  );
  return res.data.data;
}

export interface LigneOrdonnancePayload {
  id_medicament: string;
  quantite: number;
  duree_traitement_jours: number;
  posologie: string;
}

export interface CreateOrdonnancePayload {
  id_consultation: string;
  id_patient: string;
  date_expiration: string;
  lignes: LigneOrdonnancePayload[];
}

export async function createOrdonnance(payload: CreateOrdonnancePayload) {
  const res = await client.post<ApiResponse<unknown>>(
    endpoints.ordonnances.create,
    payload,
  );
  return res.data.data;
}

export async function searchMedicaments(recherche: string): Promise<Medicament[]> {
  const res = await client.get<ApiResponse<Paginated<Medicament>>>(
    endpoints.medicaments.list,
    { params: { recherche, limit: 20 } },
  );
  return res.data.data.data;
}
