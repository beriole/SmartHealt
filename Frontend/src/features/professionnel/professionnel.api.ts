import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import {
  ApiResponse,
  Paginated,
  Consultation,
  Ordonnance,
  ProfessionnelMe,
} from '@/types';

/** Profil + statistiques + agenda du professionnel connecté. */
export async function getMe(): Promise<ProfessionnelMe> {
  const res = await client.get<ApiResponse<ProfessionnelMe>>(
    endpoints.professionnels.me,
  );
  return res.data.data;
}

/** Consultations émises par le professionnel. */
export async function getMesConsultations(
  id_professionnel: string,
): Promise<Paginated<Consultation>> {
  const res = await client.get<ApiResponse<Paginated<Consultation>>>(
    endpoints.consultations.list,
    { params: { id_professionnel, limit: 50 } },
  );
  return res.data.data;
}

/** Ordonnances émises par le professionnel. */
export async function getMesOrdonnances(
  id_professionnel: string,
): Promise<Paginated<Ordonnance>> {
  const res = await client.get<ApiResponse<Paginated<Ordonnance>>>(
    endpoints.ordonnances.list,
    { params: { id_professionnel, limit: 50 } },
  );
  return res.data.data;
}
