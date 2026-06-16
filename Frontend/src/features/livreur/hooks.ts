import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError } from '@/types';
import * as api from './livreur.api';

export function useDashboard() {
  return useQuery({ queryKey: ['livreur-dashboard'], queryFn: api.getDashboard });
}

export function useDisponibles() {
  return useQuery({
    queryKey: ['courses-disponibles'],
    queryFn: api.getDisponibles,
  });
}

export function useMesLivraisons() {
  return useQuery({
    queryKey: ['mes-livraisons'],
    queryFn: api.getMesLivraisons,
  });
}

export function useAccepterCourse() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.accepterCourse>>,
    NormalizedError,
    string
  >({
    mutationFn: api.accepterCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses-disponibles'] });
      qc.invalidateQueries({ queryKey: ['mes-livraisons'] });
    },
  });
}

export function useValiderLivraison() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.validerLivraison>>,
    NormalizedError,
    { id: string; code: string }
  >({
    mutationFn: ({ id, code }) => api.validerLivraison(id, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-livraisons'] });
      qc.invalidateQueries({ queryKey: ['livreur-dashboard'] });
    },
  });
}

export function useSetDisponibilite() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.setDisponibilite>>,
    NormalizedError,
    boolean
  >({
    mutationFn: api.setDisponibilite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['livreur-dashboard'] });
    },
  });
}
