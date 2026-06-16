import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse } from '@/types';

export interface PinConsentement {
  code_pin: string;
  date_expiration: string;
}

export async function genererPin(): Promise<PinConsentement> {
  const res = await client.post<ApiResponse<PinConsentement>>(
    endpoints.b2b.genererPin,
  );
  return res.data.data;
}
