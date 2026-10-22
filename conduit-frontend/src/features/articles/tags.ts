import { MAX_TAGS, tagProblem } from '@/shared/validation/schemas'

export interface AddTagsResult {
  tags: string[]
  error: string | null
}

/**
 * Adds one or more tags (comma separated) to `existing`: trims, ignores blanks
 * and duplicates, keeps first-seen order, rejects whitespace/commas/long tags
 * and more than MAX_TAGS. Returns the same array when nothing changed.
 */
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
