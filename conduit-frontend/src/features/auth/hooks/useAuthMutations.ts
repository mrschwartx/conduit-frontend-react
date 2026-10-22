import { useMutation, useQueryClient } from '@tanstack/react-query'
import { articleKeys, authKeys, profileKeys } from '@/api/query-keys'
import { toast } from '@/shared/toast/toast-store'
import { login, register, updateCurrentUser } from '../api/auth.api'
import { establishSession } from '../session'
import { setToken } from '../token'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => establishSession(queryClient, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      establishSession(queryClient, user)
      toast.success(`Welcome to Conduit, ${user.username}!`)
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user(), user)
      setToken(user.token)
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
      void queryClient.invalidateQueries({ queryKey: articleKeys.all })
      toast.success('Settings updated successfully.')
    },
  })
}
