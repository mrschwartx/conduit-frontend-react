import { useMutation, useQueryClient } from '@tanstack/react-query'
import { articleKeys, commentKeys, tagKeys } from '@/api/query-keys'
import { describeError } from '@/api/errors'
import type { UpdateArticlePayload } from '@/api/types'
import { toast } from '@/shared/toast/toast-store'
import {
  createArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
  updateArticle,
} from '../api/articles.api'
import { patchArticles, restoreCaches, snapshotCaches } from '../cache'

export function useCreateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createArticle,
    onSuccess: (article) => {
      queryClient.setQueryData(articleKeys.detail(article.slug), article)
      void queryClient.invalidateQueries({ queryKey: articleKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
      toast.success('Article published successfully!')
    },
  })
}

export function useUpdateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, patch }: { slug: string; patch: UpdateArticlePayload }) =>
      updateArticle(slug, patch),
    onSuccess: (article, { slug }) => {
      if (article.slug !== slug) queryClient.removeQueries({ queryKey: articleKeys.detail(slug) })
      queryClient.setQueryData(articleKeys.detail(article.slug), article)
      void queryClient.invalidateQueries({ queryKey: articleKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
      toast.success('Article updated successfully!')
    },
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: (_void, slug) => {
      queryClient.removeQueries({ queryKey: articleKeys.detail(slug) })
      queryClient.removeQueries({ queryKey: commentKeys.list(slug) })
      void queryClient.invalidateQueries({ queryKey: articleKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
      toast.success('Article deleted successfully.')
    },
    onError: (error) => toast.error(describeError(error)),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, favorite }: { slug: string; favorite: boolean }) =>
      favorite ? favoriteArticle(slug) : unfavoriteArticle(slug),
    onMutate: async ({ slug, favorite }) => {
      await queryClient.cancelQueries({ queryKey: articleKeys.all })
      const snapshot = snapshotCaches(queryClient, [articleKeys.all])
      patchArticles(
        queryClient,
        (a) => a.slug === slug,
        (a) => ({
          ...a,
          favorited: favorite,
          favoritesCount: Math.max(0, a.favoritesCount + (favorite ? 1 : -1)),
        }),
      )
      return { snapshot }
    },
    onError: (error, _vars, context) => {
      if (context) restoreCaches(queryClient, context.snapshot)
      toast.error(describeError(error))
    },
    onSuccess: (article) => {
      patchArticles(
        queryClient,
        (a) => a.slug === article.slug,
        (a) => ({ ...a, favorited: article.favorited, favoritesCount: article.favoritesCount }),
      )

      void queryClient.invalidateQueries({ queryKey: articleKeys.lists(), refetchType: 'none' })
    },
  })
}
