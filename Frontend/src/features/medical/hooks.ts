import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './medical.api';
import { CreateConsultationPayload, CreateOrdonnancePayload } from './medical.api';

export function useScanCarnet(token: string) {
  return useQuery({
    queryKey: ['scan-carnet', token],
    queryFn: () => api.scanCarnet(token),
    enabled: !!token,
    retry: false,
  });
}

export function useCreateConsultation() {
  return useMutation<
    Awaited<ReturnType<typeof api.createConsultation>>,
    NormalizedError,
    CreateConsultationPayload
  >({
    mutationFn: api.createConsultation,
  });
}

export function useCreateOrdonnance() {
  return useMutation<unknown, NormalizedError, CreateOrdonnancePayload>({
    mutationFn: api.createOrdonnance,
  });
}

export function useSearchMedicaments(term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: ['search-medicaments', query],
    queryFn: () => api.searchMedicaments(query),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
}
