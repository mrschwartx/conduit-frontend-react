import { describe, expect, it } from 'vitest'
import { buildArticlePatch, buildNewArticle } from './article-payload'

const initial = { title: 'T', description: 'D', body: 'B', tagList: ['a'] }

describe('article payloads', () => {
  it('omits tagList on create when there are no tags', () => {
    expect(buildNewArticle({ ...initial, tagList: [] })).toEqual({
      title: 'T',
      description: 'D',
      body: 'B',
    })
  })

  it('sends only changed fields on update', () => {
    expect(buildArticlePatch(initial, { ...initial, title: 'New' })).toEqual({ title: 'New' })
    expect(buildArticlePatch(initial, { ...initial, tagList: ['a', 'b'] })).toEqual({
      tagList: ['a', 'b'],
    })
  })

  it('sends nothing when nothing changed', () => {
    expect(buildArticlePatch(initial, { ...initial })).toEqual({})
  })
})
