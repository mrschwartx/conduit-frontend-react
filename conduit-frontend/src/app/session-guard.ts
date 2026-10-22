import type { QueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '@/api/client'
import { endSession } from '@/features/auth/session'
import { getToken } from '@/features/auth/token'
import { toast } from '@/shared/toast/toast-store'

interface NavigableRouter {
  navigate: (to: string) => unknown
  state: { location: { pathname: string } }
}

export function installUnauthorizedHandler(queryClient: QueryClient, router: NavigableRouter): void {
  setUnauthorizedHandler(() => {
    const hadSession = getToken() !== null
    endSession(queryClient)
    if (hadSession) toast.error('Your session has expired. Please sign in again.')
    if (router.state.location.pathname !== '/login') void router.navigate('/login')
  })
}
