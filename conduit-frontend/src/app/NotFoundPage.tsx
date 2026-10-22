import { Link } from 'react-router'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Not found')
  return (
    <div className="container page">
      <h1 className="page-title">Not Found</h1>
      <p className="page-subtitle">
        This page does not exist. <Link to="/">Go to the home page</Link>.
      </p>
    </div>
  )
}
