import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Paginated,
  Intervention,
  Professionnel,
} from '@/types';

export async function getInterventions(): Promise<Paginated<Intervention>> {
  const res = await client.get<ApiResponse<Paginated<Intervention>>>(
    endpoints.interventions.list,
  );
  return res.data.data;
}

export async function getIntervention(id: string): Promise<Intervention> {
  const res = await client.get<ApiResponse<Intervention>>(
    endpoints.interventions.byId(id),
  );
  return res.data.data;
}

/** Infirmiers vérifiés et disponibles à domicile. */
export async function getInfirmiers(): Promise<Professionnel[]> {
  const res = await client.get<ApiResponse<Paginated<Professionnel>>>(
    endpoints.professionnels.list,
    { params: { disponible_domicile: 'true', statut_verification: 'verifie', limit: 50 } },
  );
  return res.data.data.data.filter(
    p => p.utilisateur?.type_utilisateur === 'INFIRMIER',
  );
}

export interface CreateInterventionPayload {
  id_infirmier: string;
  type_acte: string;
  date_planifiee: string;
  adresse_intervention: string;
  cout_fcfa: number;
}

export async function createIntervention(
  payload: CreateInterventionPayload,
): Promise<Intervention> {
  const res = await client.post<ApiResponse<Intervention>>(
    endpoints.interventions.create,
    payload,
  );
  return res.data.data;
}

export async function updateStatutIntervention(
  id: string,
  statut: string,
  compte_rendu?: string,
): Promise<Intervention> {
  const res = await client.put<ApiResponse<Intervention>>(
    endpoints.interventions.updateStatus(id),
    { statut, compte_rendu },
  );
  return res.data.data;
}
