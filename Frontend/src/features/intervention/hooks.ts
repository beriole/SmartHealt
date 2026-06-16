import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './intervention.api';
import { CreateInterventionPayload } from './intervention.api';

export function useInterventions() {
  return useQuery({
    queryKey: ['interventions'],
    queryFn: api.getInterventions,
  });
}

export function useIntervention(id: string) {
  return useQuery({
    queryKey: ['intervention', id],
    queryFn: () => api.getIntervention(id),
    enabled: !!id,
  });
}

export function useInfirmiers() {
  return useQuery({ queryKey: ['infirmiers'], queryFn: api.getInfirmiers });
}

export function useCreateIntervention() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.createIntervention>>,
    NormalizedError,
    CreateInterventionPayload
  >({
    mutationFn: api.createIntervention,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}

export function useUpdateStatutIntervention() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.updateStatutIntervention>>,
    NormalizedError,
    { id: string; statut: string; compte_rendu?: string }
  >({
    mutationFn: ({ id, statut, compte_rendu }) =>
      api.updateStatutIntervention(id, statut, compte_rendu),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
      qc.invalidateQueries({ queryKey: ['intervention', vars.id] });
    },
  });
}
