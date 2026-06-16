import { useMutation } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './b2b.api';

export function useGenererPin() {
  return useMutation<
    Awaited<ReturnType<typeof api.genererPin>>,
    NormalizedError,
    void
  >({
    mutationFn: api.genererPin,
  });
}
