import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Carnet } from '@/types';

export async function getMonCarnet(): Promise<Carnet> {
  const res = await client.get<ApiResponse<Carnet>>(endpoints.carnets.mine);
  return res.data.data;
}

export async function regenerateQr(): Promise<{ qr_code_token: string }> {
  const res = await client.post<ApiResponse<{ qr_code_token: string }>>(
    endpoints.carnets.regenerateQr,
  );
  return res.data.data;
}
