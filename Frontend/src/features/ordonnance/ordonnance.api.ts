import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Paginated, Ordonnance } from '@/types';

export async function getOrdonnances(
  id_patient: string,
): Promise<Paginated<Ordonnance>> {
  const res = await client.get<ApiResponse<Paginated<Ordonnance>>>(
    endpoints.ordonnances.list,
    { params: { id_patient } },
  );
  return res.data.data;
}

export async function getOrdonnance(id: string): Promise<Ordonnance> {
  const res = await client.get<ApiResponse<Ordonnance>>(
    endpoints.ordonnances.byId(id),
  );
  return res.data.data;
}
