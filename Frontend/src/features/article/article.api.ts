import { client } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { ApiResponse, Paginated, Article } from '@/types';

export interface ArticleListParams {
  categorie?: string;
  recherche?: string;
  page?: number;
  limit?: number;
}

export async function getArticles(
  params: ArticleListParams = {},
): Promise<Paginated<Article>> {
  const res = await client.get<ApiResponse<Paginated<Article>>>(
    endpoints.articles.list,
    { params },
  );
  return res.data.data;
}

export async function getArticle(id: string): Promise<Article> {
  const res = await client.get<ApiResponse<Article>>(endpoints.articles.byId(id));
  return res.data.data;
}
