import { Link } from 'react-router'
import type { ArticleListItem } from '@/api/types'
import { TagList } from '@/shared/ui/TagList'
import { ArticleMeta } from './ArticleMeta'
import { FavoriteButton } from './FavoriteButton'

export function ArticlePreview({ article }: { article: ArticleListItem }) {
  const href = `/article/${encodeURIComponent(article.slug)}`
  return (
    <article className="article-preview">
      <ArticleMeta author={article.author} createdAt={article.createdAt}>
        <FavoriteButton article={article} />
      </ArticleMeta>
      <h3 className="preview-title">
        <Link to={href}>{article.title}</Link>
      </h3>
      <p className="preview-description">{article.description}</p>
      <div className="preview-footer">
        <Link to={href} className="read-more" aria-label={`Read more: ${article.title}`}>
          Read more...
        </Link>
        <TagList tags={article.tagList} />
      </div>
    </article>
  )
}
