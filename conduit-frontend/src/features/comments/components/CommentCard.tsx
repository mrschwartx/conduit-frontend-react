import { Link } from 'react-router'
import type { Comment } from '@/api/types'
import { Avatar } from '@/shared/ui/Avatar'
import { formatDate } from '@/shared/utils/format'

interface CommentCardProps {
  comment: Comment
  canDelete: boolean
  deleting: boolean
  onDelete: (id: number) => void
}

export function CommentCard({ comment, canDelete, deleting, onDelete }: CommentCardProps) {
  const profileHref = `/profile/${encodeURIComponent(comment.author.username)}`
  return (
    <article className="comment-card">
      <p className="comment-body">{comment.body}</p>
      <div className="comment-footer">
        <Link to={profileHref} className="avatar-link" aria-hidden="true" tabIndex={-1}>
          <Avatar image={comment.author.image} size="small" />
        </Link>
        <Link to={profileHref} className="author">
          {comment.author.username}
        </Link>
        <time className="date" dateTime={comment.createdAt}>
          {formatDate(comment.createdAt)}
        </time>
        {canDelete && (
          <button
            type="button"
            className="link-button comment-delete"
            aria-label="Delete comment"
            disabled={deleting}
            onClick={() => onDelete(comment.id)}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
