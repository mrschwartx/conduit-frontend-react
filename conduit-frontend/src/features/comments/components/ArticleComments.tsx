import { Link } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { useComments, useDeleteComment } from '../hooks/useComments'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'

export function ArticleComments({ slug }: { slug: string }) {
  const { user, ready } = useAuth()
  const comments = useComments(slug)
  const remove = useDeleteComment(slug)

  return (
    <section className="comments" aria-label="Comments">
      {ready && user && <CommentForm slug={slug} user={user} />}
      {ready && !user && (
        <p className="comment-prompt">
          <Link to="/login">Sign in</Link> or <Link to="/register">Sign up</Link> to add comments on
          this article.
        </p>
      )}
      <QueryBoundary query={comments} notFound="Comments are not available." skeletonRows={2}>
        {(list) =>
          list.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              canDelete={user?.username === comment.author.username}
              deleting={remove.isPending && remove.variables === comment.id}
              onDelete={(id) => remove.mutate(id)}
            />
          ))
        }
      </QueryBoundary>
    </section>
  )
}
