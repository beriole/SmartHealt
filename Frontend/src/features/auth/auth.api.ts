import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, LoginResult, Utilisateur } from '@/types';

export interface LoginPayload {
  email: string;
  mot_de_passe: string;
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  mot_de_passe: string;
  type_utilisateur: string;
  sexe: string;
  [key: string]: unknown;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await client.post<ApiResponse<LoginResult>>(
    endpoints.auth.login,
    payload,
  );
  return res.data.data;
}

export async function register(payload: RegisterPayload) {
  const res = await client.post<ApiResponse<unknown>>(
    endpoints.auth.register,
    payload,
  );
  return res.data;
}

export async function logout(refreshToken: string | null): Promise<void> {
  await client.post(endpoints.auth.logout, { refreshToken });
}

export async function getMe(): Promise<Utilisateur> {
  const res = await client.get<ApiResponse<Utilisateur>>(endpoints.utilisateurs.me);
  return res.data.data;
}

export async function forgotPassword(email: string) {
  const res = await client.post(endpoints.auth.forgotPassword, { email });
  return res.data;
}

export async function resendVerification(email: string) {
  const res = await client.post(endpoints.auth.resendVerification, { email });
  return res.data;
}

export async function resetPassword(token: string, mot_de_passe: string) {
  const res = await client.post(endpoints.auth.resetPassword(token), {
    mot_de_passe,
  });
  return res.data;
}
