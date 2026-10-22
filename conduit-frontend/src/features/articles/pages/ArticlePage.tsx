import { useParams } from 'react-router'
import { ArticleComments } from '@/features/comments/components/ArticleComments'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { TagList } from '@/shared/ui/TagList'
import { ArticleActions } from '../components/ArticleActions'
import { ArticleMeta } from '../components/ArticleMeta'
import { useArticle } from '../hooks/useArticles'

export function ArticlePage() {
  const { slug = '' } = useParams()
  const query = useArticle(slug)
  useDocumentTitle(query.data?.title)

  return (
    <QueryBoundary query={query} notFound="Article not found.">
      {(article) => (
        <div className="article-page">
          <div className="banner banner-dark">
            <div className="container">
              <h1 className="article-title">{article.title}</h1>
              <ArticleMeta author={article.author} createdAt={article.createdAt}>
                <ArticleActions article={article} />
              </ArticleMeta>
            </div>
          </div>
          <div className="container page">
            <p className="article-body">{article.body}</p>
            <TagList tags={article.tagList} />
            <hr />
            <ArticleComments slug={article.slug} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
