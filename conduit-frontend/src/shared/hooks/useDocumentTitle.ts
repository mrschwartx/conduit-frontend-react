import { useEffect } from 'react'

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} - Conduit` : 'Conduit'
  }, [title])
}
