import { useCallback, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { authKeys } from '@/api/query-keys'
import { isTransportError, toAppError } from '@/api/errors'
import { fetchCurrentUser } from '../api/auth.api'
import { getToken, subscribeToken } from '../token'

/**
 * `user` comes from GET /user (only requested when a token exists) and lives in
 * the query cache. `ready` is false only while that first request is in flight,
 * so callers can show a neutral state instead of a flash of logged-out UI.
 */
export function useAuth() {
  const token = useSyncExternalStore(subscribeToken, getToken, getToken)
  const query = useQuery({
    queryKey: authKeys.user(),
    queryFn: fetchCurrentUser,
    enabled: token !== null,
    staleTime: Infinity,
    retry: (count, error) => count < 1 && isTransportError(toAppError(error)),
  })
  const user = token === null ? undefined : query.data
  const ready = token === null || !query.isPending
  return { user, ready }
}

/** Run `action` for signed-in users; send everyone else to /login. */
export function useAuthGate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return useCallback(
    (action: () => void) => {
      if (user) action()
      else void navigate('/login')
    },
    [user, navigate],
  )
}
