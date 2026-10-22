import type { NewArticlePayload, UpdateArticlePayload } from '@/api/types'
import type { ArticleValues } from '@/shared/validation/schemas'

/** Create: send what the author filled in; tagList only when there are tags. */
export function buildNewArticle(values: ArticleValues): NewArticlePayload {
  const payload: NewArticlePayload = {
    title: values.title,
    description: values.description,
    body: values.body,
  }
  if (values.tagList.length > 0) payload.tagList = values.tagList
  return payload
}

/** Update is partial: send only the fields that changed. */
export function buildArticlePatch(initial: ArticleValues, values: ArticleValues): UpdateArticlePayload {
  const patch: UpdateArticlePayload = {}
  if (values.title !== initial.title) patch.title = values.title
  if (values.description !== initial.description) patch.description = values.description
  if (values.body !== initial.body) patch.body = values.body
  const sameTags =
    values.tagList.length === initial.tagList.length &&
    values.tagList.every((tag, i) => tag === initial.tagList[i])
  if (!sameTags) patch.tagList = values.tagList
  return patch
}
