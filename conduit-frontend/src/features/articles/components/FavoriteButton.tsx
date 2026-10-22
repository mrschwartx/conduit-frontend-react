import type { ArticleListItem } from '@/api/types'
import { useAuthGate } from '@/features/auth/hooks/useAuth'
import { useToggleFavorite } from '../hooks/useArticleMutations'

interface FavoriteButtonProps {
  article: Pick<ArticleListItem, 'slug' | 'favorited' | 'favoritesCount'>
  variant?: 'compact' | 'full'
}

export function FavoriteButton({ article, variant = 'compact' }: FavoriteButtonProps) {
  const gate = useAuthGate()
  const toggle = useToggleFavorite()
  const onClick = () =>
    gate(() => toggle.mutate({ slug: article.slug, favorite: !article.favorited }))
  const className = [
    'btn',
    'btn-favorite',
    variant === 'full' ? 'btn-wide' : 'btn-small',
    article.favorited ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (variant === 'compact') {
    return (
      <button
        type="button"
        className={className}
        aria-label={article.favorited ? 'Unfavorite article' : 'Favorite article'}
        aria-pressed={article.favorited}
        disabled={toggle.isPending}
        onClick={onClick}
      >
        ♥ {article.favoritesCount}
      </button>
    )
  }
  return (
    <button
      type="button"
      className={className}
      aria-pressed={article.favorited}
      disabled={toggle.isPending}
      onClick={onClick}
    >
      {`${article.favorited ? 'Unfavorite Article' : 'Favorite Article'} (${article.favoritesCount})`}
    </button>
  )
}
