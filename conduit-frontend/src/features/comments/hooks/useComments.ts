import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentKeys } from '@/api/query-keys'
import { describeError } from '@/api/errors'
import type { Comment } from '@/api/types'
import { toast } from '@/shared/toast/toast-store'
import { addComment, deleteComment, listComments } from '../api/comments.api'

export function useComments(slug: string) {
  return useQuery({ queryKey: commentKeys.list(slug), queryFn: () => listComments(slug) })
}

export function useAddComment(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addComment(slug, { body }),
    // Comments are listed newest first.
    onSuccess: (comment) =>
      queryClient.setQueryData<Comment[]>(commentKeys.list(slug), (old) => [comment, ...(old ?? [])]),
  })
}

export function useDeleteComment(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteComment(slug, id),
    onSuccess: (_void, id) =>
      queryClient.setQueryData<Comment[]>(commentKeys.list(slug), (old) =>
        old?.filter((c) => c.id !== id),
      ),
    onError: (error) => toast.error(describeError(error)),
  })
}
