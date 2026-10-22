import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Profile } from '@/api/types'
import { Avatar } from '@/shared/ui/Avatar'
import { formatDate } from '@/shared/utils/format'

interface ArticleMetaProps {
  author: Profile
  createdAt: string
  children?: ReactNode
}

export function ArticleMeta({ author, createdAt, children }: ArticleMetaProps) {
  const profileHref = `/profile/${encodeURIComponent(author.username)}`
  return (
    <div className="article-meta">
      <Link to={profileHref} className="avatar-link" aria-hidden="true" tabIndex={-1}>
        <Avatar image={author.image} />
      </Link>
      <div className="article-info">
        <Link to={profileHref} className="author">
          {author.username}
        </Link>
        <time className="date" dateTime={createdAt}>
          {formatDate(createdAt)}
        </time>
      </div>
      {children}
    </div>
  )
}
