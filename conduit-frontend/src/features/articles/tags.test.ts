import { describe, expect, it } from 'vitest'
import { addTags } from './tags'

describe('addTags', () => {
  it('trims, ignores blanks and keeps first-seen order', () => {
    expect(addTags(['a'], ' b , , c ').tags).toEqual(['a', 'b', 'c'])
  })

  it('de-duplicates and returns the same array when nothing changed', () => {
    const existing = ['a', 'b']
    expect(addTags(existing, 'a').tags).toBe(existing)
  })

  it('rejects whitespace inside a tag', () => {
    expect(addTags([], 'two words')).toEqual({ tags: [], error: 'Tags cannot contain spaces' })
  })

  it('rejects an eleventh tag', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `t${i}`)
    expect(addTags(ten, 'extra').error).toBe('Tags are limited to 10 per article')
  })
})
