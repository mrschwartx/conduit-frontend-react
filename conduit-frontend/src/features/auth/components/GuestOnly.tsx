import { Navigate, Outlet } from 'react-router'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'

export function GuestOnly() {
  const { user, ready } = useAuth()
  if (!ready) {
    return (
      <div className="container page">
        <Skeleton rows={2} />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
