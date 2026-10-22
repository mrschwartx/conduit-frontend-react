import { api } from '@/api/client'
import type {
  Comment,
  CommentResponse,
  CommentsResponse,
  NewCommentPayload,
} from '@/api/types'

const path = (slug: string) => `/articles/${encodeURIComponent(slug)}/comments`

export async function listComments(slug: string): Promise<Comment[]> {
  const { data } = await api.get<CommentsResponse>(path(slug))
  return data.comments
}

export async function addComment(slug: string, comment: NewCommentPayload): Promise<Comment> {
  const { data } = await api.post<CommentResponse>(path(slug), { comment })
  return data.comment
}

export async function deleteComment(slug: string, id: number): Promise<void> {
  await api.delete(`${path(slug)}/${id}`)
}
