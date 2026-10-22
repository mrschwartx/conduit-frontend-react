import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Article } from '@/api/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { FollowButton } from '@/features/profiles/components/FollowButton'
import { useDeleteArticle } from '../hooks/useArticleMutations'
import { FavoriteButton } from './FavoriteButton'

function OwnerActions({ article }: { article: Article }) {
  const navigate = useNavigate()
  const remove = useDeleteArticle()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Link to={`/editor/${encodeURIComponent(article.slug)}`} className="btn btn-secondary btn-wide">
        Edit Article
      </Link>
      {confirming ? (
        <>
          <button
            type="button"
            className="btn btn-danger btn-wide"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(article.slug, { onSuccess: () => void navigate('/', { replace: true }) })
            }
          >
            Confirm Delete
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-wide"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-danger btn-wide" onClick={() => setConfirming(true)}>
          Delete Article
        </button>
      )}
    </>
  )
}

export function ArticleActions({ article }: { article: Article }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (user && user.username === article.author.username) return <OwnerActions article={article} />
  return (
    <>
      <FollowButton profile={article.author} />
      <FavoriteButton article={article} variant="full" />
    </>
  )
}
