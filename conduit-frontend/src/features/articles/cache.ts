import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { articleKeys } from '@/api/query-keys'
import type { Article, ArticleListItem, ArticlesPage } from '@/api/types'

export type Snapshot = [QueryKey, unknown][]
type Patcher = <T extends ArticleListItem>(article: T) => T

export function snapshotCaches(queryClient: QueryClient, prefixes: QueryKey[]): Snapshot {
  return prefixes.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }))
}

export function restoreCaches(queryClient: QueryClient, snapshot: Snapshot): void {
  snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
}

export function patchArticles(
  queryClient: QueryClient,
  matches: (article: ArticleListItem) => boolean,
  patch: Patcher,
): void {
  queryClient.setQueriesData<ArticlesPage>({ queryKey: articleKeys.lists() }, (page) =>
    page
      ? { ...page, articles: page.articles.map((a) => (matches(a) ? patch(a) : a)) }
      : page,
  )
  queryClient.setQueriesData<Article>({ queryKey: articleKeys.details() }, (article) =>
    article && matches(article) ? patch(article) : article,
  )
}
