import { MAX_TAGS, tagProblem } from '@/shared/validation/schemas'

export interface AddTagsResult {
  tags: string[]
  error: string | null
}

export function addTags(existing: string[], raw: string): AddTagsResult {
  let tags = existing
  for (const piece of raw.split(',')) {
    const tag = piece.trim()
    if (tag === '' || tags.includes(tag)) continue
    const problem = tagProblem(tag)
    if (problem) return { tags: existing, error: problem }
    if (tags.length >= MAX_TAGS) {
      return { tags: existing, error: `Tags are limited to ${MAX_TAGS} per article` }
    }
    tags = [...tags, tag]
  }
  return { tags, error: null }
}
