import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { isAppError } from '@/api/errors'
import { Skeleton } from './Skeleton'

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>
  notFound?: string
  skeletonRows?: number
  loadingLabel?: string
  children: (data: T) => ReactNode
}

/** Loading skeleton, not-found / error message with retry, or the data. */
export function QueryBoundary<T>({
  query,
  notFound = 'Not found.',
  skeletonRows,
  loadingLabel,
  children,
}: QueryBoundaryProps<T>) {
  if (query.isPending) return <Skeleton rows={skeletonRows} label={loadingLabel} />
  if (query.isError) {
    if (isAppError(query.error) && query.error.kind === 'not_found') {
      return <p className="status">{notFound}</p>
    }
    return (
      <div className="status status-error" role="alert">
        <span>{query.error.message}</span>
        <button type="button" className="btn btn-small" onClick={() => void query.refetch()}>
          Try again
        </button>
      </div>
    )
  }
  return <>{children(query.data)}</>
}
