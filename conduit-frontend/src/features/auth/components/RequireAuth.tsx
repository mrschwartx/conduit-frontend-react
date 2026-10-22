import { Navigate, Outlet, useLocation } from 'react-router'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return (
      <div className="container page">
        <Skeleton rows={2} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
