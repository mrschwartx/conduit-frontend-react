import type { QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/api/query-keys'
import type { User } from '@/api/types'
import { clearToken, setToken } from './token'

export function establishSession(queryClient: QueryClient, user: User): void {
  queryClient.setQueryData(authKeys.user(), user)
  setToken(user.token)
}

export function endSession(queryClient: QueryClient): void {
  clearToken()
  queryClient.clear()
}
