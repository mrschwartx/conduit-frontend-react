import { useSearchParams } from 'react-router'
import type { ArticleFilters } from '@/api/query-keys'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Skeleton } from '@/shared/ui/Skeleton'
import { ArticleList } from '../components/ArticleList'
import { PopularTags } from '../components/PopularTags'

type Tab = 'feed' | 'global' | 'tag'

const tabClass = (active: boolean) => (active ? 'feed-tab active' : 'feed-tab')

export function HomePage() {
  useDocumentTitle()
  const { user, ready } = useAuth()
  const [params, setParams] = useSearchParams()

  // The tab and page live in the URL so Back/Forward and reloads behave.
  const tag = params.get('tag') || undefined
  const pageNumber = Number(params.get('page'))
  const page = Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber - 1 : 0
  const tab: Tab = tag ? 'tag' : params.get('feed') === 'global' || !user ? 'global' : 'feed'

  const filters: ArticleFilters =
    tab === 'feed'
      ? { scope: 'feed', page }
      : { scope: 'global', ...(tab === 'tag' ? { tag } : {}), page }

  const show = (next: Record<string, string>) => setParams(next)
  const changePage = (index: number) => {
    const next = new URLSearchParams(params)
    if (index === 0) next.delete('page')
    else next.set('page', String(index + 1))
    setParams(next)
  }

  return (
    <div className="home-page">
      <div className="banner banner-brand">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>
      <div className="container page layout-with-sidebar">
        <div className="main-column">
          <ul className="feed-tabs">
            {user && (
              <li>
                <button
                  type="button"
                  className={tabClass(tab === 'feed')}
                  aria-pressed={tab === 'feed'}
                  onClick={() => show({})}
                >
                  Your Feed
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                className={tabClass(tab === 'global')}
                aria-pressed={tab === 'global'}
                onClick={() => show({ feed: 'global' })}
              >
                Global Feed
              </button>
            </li>
            {tag && (
              <li>
                <button type="button" className={tabClass(true)} aria-pressed>
                  {`#${tag}`}
                </button>
              </li>
            )}
          </ul>
          {ready ? (
            <ArticleList
              filters={filters}
              onPageChange={changePage}
              emptyMessage={
                tab === 'feed'
                  ? 'No articles are here... yet. Follow some authors to fill your feed.'
                  : undefined
              }
            />
          ) : (
            <Skeleton rows={4} label="Loading articles..." />
          )}
        </div>
        <PopularTags onSelect={(selected) => show({ tag: selected })} />
      </div>
    </div>
  )
}
