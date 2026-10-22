import { api } from '@/api/client'
import type { ArticleFilters } from '@/api/query-keys'
import type {
  Article,
  ArticleResponse,
  ArticlesPage,
  NewArticlePayload,
  TagsResponse,
  UpdateArticlePayload,
} from '@/api/types'

export const PAGE_SIZE = 10

const path = (slug: string) => `/articles/${encodeURIComponent(slug)}`

export async function listArticles(filters: ArticleFilters): Promise<ArticlesPage> {
  const paging = { limit: PAGE_SIZE, offset: filters.page * PAGE_SIZE }
  if (filters.scope === 'feed') {
    const { data } = await api.get<ArticlesPage>('/articles/feed', { params: paging })
    return data
  }
  const { data } = await api.get<ArticlesPage>('/articles', {
    params: { tag: filters.tag, author: filters.author, favorited: filters.favorited, ...paging },
  })
  return data
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await api.get<ArticleResponse>(path(slug))
  return data.article
}

export async function createArticle(article: NewArticlePayload): Promise<Article> {
  const { data } = await api.post<ArticleResponse>('/articles', { article })
  return data.article
}

export async function updateArticle(slug: string, article: UpdateArticlePayload): Promise<Article> {
  const { data } = await api.put<ArticleResponse>(path(slug), { article })
  return data.article
}

export async function deleteArticle(slug: string): Promise<void> {
  await api.delete(path(slug))
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const { data } = await api.post<ArticleResponse>(`${path(slug)}/favorite`)
  return data.article
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const { data } = await api.delete<ArticleResponse>(`${path(slug)}/favorite`)
  return data.article
}

export async function fetchTags(): Promise<string[]> {
  const { data } = await api.get<TagsResponse>('/tags')
  return data.tags
}
