import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Paginated, Commande, Livreur } from '@/types';

export async function getDashboard(): Promise<Livreur> {
  const res = await client.get<ApiResponse<Livreur>>(endpoints.livreurs.dashboard);
  return res.data.data;
}

export async function getDisponibles(): Promise<Commande[]> {
  const res = await client.get<ApiResponse<Commande[]>>(
    endpoints.commandes.disponiblesLivraison,
  );
  return res.data.data;
}

export async function getMesLivraisons(): Promise<Paginated<Commande>> {
  const res = await client.get<ApiResponse<Paginated<Commande>>>(
    endpoints.commandes.list,
  );
  return res.data.data;
}

export async function accepterCourse(id: string): Promise<Commande> {
  const res = await client.post<ApiResponse<Commande>>(
    endpoints.commandes.assignerLivreur(id),
  );
  return res.data.data;
}

export async function validerLivraison(
  id: string,
  code_validation: string,
): Promise<Commande> {
  const res = await client.post<ApiResponse<Commande>>(
    endpoints.commandes.validerLivraison(id),
    { code_validation },
  );
  return res.data.data;
}

export async function setDisponibilite(disponible: boolean): Promise<Livreur> {
  const res = await client.put<ApiResponse<Livreur>>(
    endpoints.livreurs.disponibilite,
    { disponible },
  );
  return res.data.data;
}
