import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { articleKeys, tagKeys, type ArticleFilters } from '@/api/query-keys'
import { getArticle, listArticles, fetchTags } from '../api/articles.api'

export function useArticles(filters: ArticleFilters, enabled = true) {
  return useQuery({
    queryKey: articleKeys.list(filters),
    queryFn: () => listArticles(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: () => getArticle(slug),
    enabled: slug !== '',
  })
}

export function useTags() {
  return useQuery({ queryKey: tagKeys.all, queryFn: fetchTags, staleTime: 60_000 })
}
