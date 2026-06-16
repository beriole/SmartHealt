import { useMutation, useQuery } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './ia.api';
import {
  DiagnosticPayload,
  MedecineTraditionnellePayload,
  HistoriqueParams,
} from './ia.api';

/** Diagnostic / triage IA à partir des symptômes. */
export function useDiagnostic() {
  return useMutation<
    Awaited<ReturnType<typeof api.diagnostic>>,
    NormalizedError,
    DiagnosticPayload
  >({
    mutationFn: api.diagnostic,
  });
}

/** Compatibilité d'un médicament avec le dossier du patient. */
export function useCompatibilite() {
  return useMutation<
    Awaited<ReturnType<typeof api.compatibiliteMedicament>>,
    NormalizedError,
    string
  >({
    mutationFn: api.compatibiliteMedicament,
  });
}

/** Remèdes de médecine traditionnelle. */
export function useMedecineTraditionnelle() {
  return useMutation<
    Awaited<ReturnType<typeof api.medecineTraditionnelle>>,
    NormalizedError,
    MedecineTraditionnellePayload
  >({
    mutationFn: api.medecineTraditionnelle,
  });
}

export function useHistoriqueIa(params: HistoriqueParams = {}) {
  return useQuery({
    queryKey: ['ia-historique', params],
    queryFn: () => api.getHistorique(params),
  });
}

export function useAnalyseIa(id: string) {
  return useQuery({
    queryKey: ['ia-analyse', id],
    queryFn: () => api.getAnalyse(id),
    enabled: !!id,
  });
}
