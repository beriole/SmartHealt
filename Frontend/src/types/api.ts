/** Forme standard des réponses du backend : { success, message, data }. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/** Erreur normalisée par l'intercepteur axios pour l'UI. */
export interface NormalizedError {
  message: string;
  status?: number;
  fields?: Record<string, string>;
}

/** Métadonnées de pagination renvoyées par les endpoints listés. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
