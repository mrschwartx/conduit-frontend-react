import type { QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/api/query-keys'
import type { User } from '@/api/types'
import { clearToken, setToken } from './token'

/** Store the JWT and prime the cache so the UI never flashes a logged-out state. */
export function establishSession(queryClient: QueryClient, user: User): void {
  queryClient.setQueryData(authKeys.user(), user)
  setToken(user.token)
}

/** Forget the JWT and everything cached on behalf of the user. */
export function endSession(queryClient: QueryClient): void {
  clearToken()
  queryClient.clear()
}
