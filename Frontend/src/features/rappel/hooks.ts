import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError, StatutPrise } from '@/types';
import * as api from './rappel.api';
import { CreateRappelPayload } from './rappel.api';

export function useRappels() {
  return useQuery({ queryKey: ['rappels'], queryFn: api.getRappels });
}

export function usePrisesDuJour(date?: string) {
  return useQuery({
    queryKey: ['prises-du-jour', date ?? 'today'],
    queryFn: () => api.getPrisesDuJour(date),
  });
}

export function useStatsObservance() {
  return useQuery({
    queryKey: ['stats-observance'],
    queryFn: api.getStatsObservance,
  });
}

export function useMarquerPrise() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.marquerPrise>>,
    NormalizedError,
    { id: string; statut: StatutPrise; commentaire?: string }
  >({
    mutationFn: ({ id, statut, commentaire }) =>
      api.marquerPrise(id, statut, commentaire),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prises-du-jour'] });
      qc.invalidateQueries({ queryKey: ['stats-observance'] });
    },
  });
}

export function useCreateRappel() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.createRappel>>,
    NormalizedError,
    CreateRappelPayload
  >({
    mutationFn: api.createRappel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      qc.invalidateQueries({ queryKey: ['prises-du-jour'] });
    },
  });
}
