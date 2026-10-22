import { describe, expect, it } from 'vitest'
import { makeUser } from '@/test/factories'
import { buildSettingsPatch } from './settings-patch'

const same = { image: '', username: 'jane', bio: '', email: 'jane@example.com', password: '' }

describe('buildSettingsPatch', () => {
  it('is empty when nothing changed', () => {
    expect(buildSettingsPatch(makeUser(), same)).toEqual({})
  })

  it('sends only what changed and omits an empty password', () => {
    expect(buildSettingsPatch(makeUser(), { ...same, username: 'janet' })).toEqual({
      username: 'janet',
    })
  })

  it('sends null to clear bio and image', () => {
    const user = makeUser({ bio: 'hello', image: 'https://example.com/a.png' })
    expect(buildSettingsPatch(user, { ...same, bio: '', image: '' })).toEqual({
      bio: null,
      image: null,
    })
  })

  it('includes a new password', () => {
    expect(buildSettingsPatch(makeUser(), { ...same, password: 'new-password' })).toEqual({
      password: 'new-password',
    })
  })
})
