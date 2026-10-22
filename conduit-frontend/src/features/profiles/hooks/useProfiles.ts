import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { articleKeys, profileKeys } from '@/api/query-keys'
import { describeError } from '@/api/errors'
import type { Profile } from '@/api/types'
import { patchArticles, restoreCaches, snapshotCaches } from '@/features/articles/cache'
import { toast } from '@/shared/toast/toast-store'
import { followUser, getProfile, unfollowUser } from '../api/profiles.api'

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: () => getProfile(username),
    enabled: username !== '',
  })
}

export function useToggleFollow() {
  const queryClient = useQueryClient()

  const apply = (username: string, following: boolean) => {
    queryClient.setQueryData<Profile>(profileKeys.detail(username), (p) =>
      p ? { ...p, following } : p,
    )
    patchArticles(
      queryClient,
      (a) => a.author.username === username,
      (a) => ({ ...a, author: { ...a.author, following } }),
    )
  }

  return useMutation({
    mutationFn: ({ username, follow }: { username: string; follow: boolean }) =>
      follow ? followUser(username) : unfollowUser(username),
    onMutate: async ({ username, follow }) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.all })
      await queryClient.cancelQueries({ queryKey: articleKeys.all })
      const snapshot = snapshotCaches(queryClient, [profileKeys.all, articleKeys.all])
      apply(username, follow)
      return { snapshot }
    },
    onError: (error, _vars, context) => {
      if (context) restoreCaches(queryClient, context.snapshot)
      toast.error(describeError(error))
    },
    onSuccess: (profile) => {
      apply(profile.username, profile.following)

      void queryClient.invalidateQueries({ queryKey: articleKeys.feeds() })
    },
  })
}
