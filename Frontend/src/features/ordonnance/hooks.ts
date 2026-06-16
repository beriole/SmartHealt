import { useQuery } from '@tanstack/react-query';
import * as api from './ordonnance.api';

export function useOrdonnances(id_patient?: string) {
  return useQuery({
    queryKey: ['ordonnances', id_patient],
    queryFn: () => api.getOrdonnances(id_patient as string),
    enabled: !!id_patient,
  });
}

export function useOrdonnance(id: string) {
  return useQuery({
    queryKey: ['ordonnance', id],
    queryFn: () => api.getOrdonnance(id),
    enabled: !!id,
  });
}
