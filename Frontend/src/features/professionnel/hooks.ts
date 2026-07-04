import { useQuery } from '@tanstack/react-query';
import * as api from './professionnel.api';

export function useProfessionnelMe() {
  return useQuery({ queryKey: ['professionnel-me'], queryFn: api.getMe });
}

export function useMesConsultations(id_professionnel?: string) {
  return useQuery({
    queryKey: ['mes-consultations', id_professionnel],
    queryFn: () => api.getMesConsultations(id_professionnel as string),
    enabled: !!id_professionnel,
  });
}

export function useMesOrdonnances(id_professionnel?: string) {
  return useQuery({
    queryKey: ['mes-ordonnances-pro', id_professionnel],
    queryFn: () => api.getMesOrdonnances(id_professionnel as string),
    enabled: !!id_professionnel,
  });
}
