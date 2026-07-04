import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NormalizedError, StatutCommande } from '@/types';
import * as api from './pharmacien.api';

export function useMyPharmacie() {
  return useQuery({ queryKey: ['ma-pharmacie'], queryFn: api.getMyPharmacie });
}

export function useCommandesPharmacie(statut?: StatutCommande) {
  return useQuery({
    queryKey: ['commandes-pharmacie', statut ?? 'all'],
    queryFn: () => api.getCommandes(statut),
  });
}

export function useCommandePharmacie(id: string) {
  return useQuery({
    queryKey: ['commande-pharmacie', id],
    queryFn: () => api.getCommande(id),
  });
}

function useInvalidateCommandes() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['commandes-pharmacie'] });
    qc.invalidateQueries({ queryKey: ['commande-pharmacie'] });
    qc.invalidateQueries({ queryKey: ['ma-pharmacie'] });
  };
}

export function useUpdateCommandeStatus() {
  const invalidate = useInvalidateCommandes();
  return useMutation<
    Awaited<ReturnType<typeof api.updateCommandeStatus>>,
    NormalizedError,
    { id: string; statut: StatutCommande }
  >({
    mutationFn: ({ id, statut }) => api.updateCommandeStatus(id, statut),
    onSuccess: invalidate,
  });
}

export function useAttribuerLivreur() {
  const invalidate = useInvalidateCommandes();
  return useMutation<
    Awaited<ReturnType<typeof api.attribuerLivreurAuto>>,
    NormalizedError,
    string
  >({
    mutationFn: api.attribuerLivreurAuto,
    onSuccess: invalidate,
  });
}

export function useAnnulerCommande() {
  const invalidate = useInvalidateCommandes();
  return useMutation<
    Awaited<ReturnType<typeof api.annulerCommande>>,
    NormalizedError,
    { id: string; motif?: string }
  >({
    mutationFn: ({ id, motif }) => api.annulerCommande(id, motif),
    onSuccess: invalidate,
  });
}

// ---- Inventaire ----
export function useMyStocks() {
  return useQuery({ queryKey: ['mes-stocks'], queryFn: api.getMyStocks });
}

export function useAlertes() {
  return useQuery({ queryKey: ['stock-alertes'], queryFn: api.getAlertes });
}

function useInvalidateStocks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['mes-stocks'] });
    qc.invalidateQueries({ queryKey: ['stock-alertes'] });
    qc.invalidateQueries({ queryKey: ['ma-pharmacie'] });
  };
}

export function useUpdateStock() {
  const invalidate = useInvalidateStocks();
  return useMutation<
    Awaited<ReturnType<typeof api.updateStock>>,
    NormalizedError,
    { id: string; payload: api.StockPayload }
  >({
    mutationFn: ({ id, payload }) => api.updateStock(id, payload),
    onSuccess: invalidate,
  });
}

export function useCreateStock() {
  const invalidate = useInvalidateStocks();
  return useMutation<
    Awaited<ReturnType<typeof api.createStock>>,
    NormalizedError,
    api.CreateStockPayload
  >({
    mutationFn: api.createStock,
    onSuccess: invalidate,
  });
}

export function useDeleteStock() {
  const invalidate = useInvalidateStocks();
  return useMutation<void, NormalizedError, string>({
    mutationFn: api.deleteStock,
    onSuccess: invalidate,
  });
}

export function useSearchMedicaments(recherche: string) {
  return useQuery({
    queryKey: ['medicaments-search', recherche],
    queryFn: () => api.searchMedicaments(recherche),
    enabled: recherche.trim().length >= 2,
  });
}

// ---- Ordonnances ----
export function useOrdonnance(id?: string) {
  return useQuery({
    queryKey: ['ordonnance', id],
    queryFn: () => api.getOrdonnance(id as string),
    enabled: !!id,
  });
}

export function useTraiterOrdonnance() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.traiterOrdonnance>>,
    NormalizedError,
    { id: string; payload: api.TraiterOrdonnancePayload }
  >({
    mutationFn: ({ id, payload }) => api.traiterOrdonnance(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordonnance'] });
      qc.invalidateQueries({ queryKey: ['commande-pharmacie'] });
    },
  });
}
