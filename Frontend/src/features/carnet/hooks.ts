import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './carnet.api';

export function useMonCarnet() {
  return useQuery({
    queryKey: ['mon-carnet'],
    queryFn: api.getMonCarnet,
  });
}

export function useRegenerateQr() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.regenerateQr>>,
    NormalizedError,
    void
  >({
    mutationFn: api.regenerateQr,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mon-carnet'] });
    },
  });
}
