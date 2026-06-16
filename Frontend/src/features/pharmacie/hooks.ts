import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as api from './pharmacie.api';
import { StockSort } from './pharmacie.api';

/** Recherche de stock (activée à partir de 2 caractères). */
export function useStockSearch(term: string, sort: StockSort = 'price') {
  const query = term.trim();
  return useQuery({
    queryKey: ['stock-search', query, sort],
    queryFn: () => api.searchStock(query, sort),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useMedicament(id: string) {
  return useQuery({
    queryKey: ['medicament', id],
    queryFn: () => api.getMedicament(id),
    enabled: !!id,
  });
}

export function usePharmacies(params: api.PharmacieListParams = {}) {
  return useQuery({
    queryKey: ['pharmacies', params],
    queryFn: () => api.getPharmacies(params),
  });
}

export function usePharmacie(id: string) {
  return useQuery({
    queryKey: ['pharmacie', id],
    queryFn: () => api.getPharmacie(id),
    enabled: !!id,
  });
}
