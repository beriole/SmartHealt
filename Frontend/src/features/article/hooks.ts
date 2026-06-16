import { useQuery } from '@tanstack/react-query';
import * as api from './article.api';
import { ArticleListParams } from './article.api';

export function useArticles(params: ArticleListParams = {}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.getArticles(params),
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => api.getArticle(id),
    enabled: !!id,
  });
}
