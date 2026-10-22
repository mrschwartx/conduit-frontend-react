import type { ArticleFilters } from '@/api/query-keys'
import { Pagination } from '@/shared/ui/Pagination'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { PAGE_SIZE } from '../api/articles.api'
import { useArticles } from '../hooks/useArticles'
import { ArticlePreview } from './ArticlePreview'

interface ArticleListProps {
  filters: ArticleFilters
  onPageChange: (page: number) => void
  emptyMessage?: string
}

export function ArticleList({
  filters,
  onPageChange,
  emptyMessage = 'No articles are here... yet.',
}: ArticleListProps) {
  const query = useArticles(filters)
  return (
    <QueryBoundary query={query} loadingLabel="Loading articles..." skeletonRows={4}>
      {({ articles, articlesCount }) =>
        articles.length === 0 ? (
          <p className="status">{emptyMessage}</p>
        ) : (
          <>
            {articles.map((article) => (
              <ArticlePreview key={article.slug} article={article} />
            ))}
            <Pagination
              page={filters.page}
              total={articlesCount}
              pageSize={PAGE_SIZE}
              onChange={onPageChange}
            />
          </>
        )
      }
    </QueryBoundary>
  )
}
