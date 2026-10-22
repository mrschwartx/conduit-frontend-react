import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { useTags } from '../hooks/useArticles'

export function PopularTags({ onSelect }: { onSelect: (tag: string) => void }) {
  const tags = useTags()
  return (
    <aside className="sidebar" aria-label="Popular tags">
      <h2 className="sidebar-title">Popular Tags</h2>
      <QueryBoundary query={tags} loadingLabel="Loading tags..." skeletonRows={1}>
        {(list) =>
          list.length === 0 ? (
            <p className="status">No tags are available.</p>
          ) : (
            <ul className="tag-list tag-cloud">
              {list.map((tag) => (
                <li key={tag}>
                  <button type="button" className="tag-pill tag-button" onClick={() => onSelect(tag)}>
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </aside>
  )
}
