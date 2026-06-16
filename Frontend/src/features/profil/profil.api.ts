import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Utilisateur } from '@/types';

export interface UpdateProfilPayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
  langue_preferee?: string;
}

export async function updateProfil(
  id: string,
  data: UpdateProfilPayload,
): Promise<Utilisateur> {
  const res = await client.put<ApiResponse<Utilisateur>>(
    endpoints.utilisateurs.byId(id),
    data,
  );
  return res.data.data;
}
