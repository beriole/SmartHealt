import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './commande.api';
import {
  CreateCommandePayload,
  CommandeListParams,
  EvaluationPayload,
  PaymentMedium,
} from './commande.api';

export function useCommandes(params: CommandeListParams = {}) {
  return useQuery({
    queryKey: ['commandes', params],
    queryFn: () => api.getCommandes(params),
  });
}

export function useCommande(id: string) {
  return useQuery({
    queryKey: ['commande', id],
    queryFn: () => api.getCommande(id),
    enabled: !!id,
  });
}

export function useCreateCommande() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.createCommande>>,
    NormalizedError,
    CreateCommandePayload
  >({
    mutationFn: api.createCommande,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commandes'] }),
  });
}

export function usePayer(id: string) {
  return useMutation<
    Awaited<ReturnType<typeof api.payer>>,
    NormalizedError,
    { phone: string; medium?: PaymentMedium }
  >({
    mutationFn: body => api.payer(id, body),
  });
}

/**
 * Interroge le statut de paiement ; tant qu'il est en attente, repoll toutes
 * les 4 s (respecte la limite Fapshi de 6 req/min/transId).
 */
export function usePaymentStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-status', id],
    queryFn: () => api.getPaymentStatus(id),
    enabled: enabled && !!id,
    refetchInterval: query => {
      const statut = query.state.data?.statut_paiement;
      return statut === 'en_attente' ? 4000 : false;
    },
  });
}

export function useValiderLivraison(id: string) {
  const qc = useQueryClient();
  return useMutation<unknown, NormalizedError, string>({
    mutationFn: code => api.validerLivraison(id, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commande', id] });
      qc.invalidateQueries({ queryKey: ['commandes'] });
    },
  });
}

export function useEvaluer(id: string) {
  const qc = useQueryClient();
  return useMutation<unknown, NormalizedError, EvaluationPayload>({
    mutationFn: payload => api.evaluer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commande', id] });
      qc.invalidateQueries({ queryKey: ['commandes'] });
    },
  });
}
