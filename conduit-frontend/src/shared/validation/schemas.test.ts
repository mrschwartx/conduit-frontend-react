import { describe, expect, it } from 'vitest'
import {
  articleSchema,
  imageField,
  registerSchema,
  settingsSchema,
} from './schemas'

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? []

describe('registerSchema', () => {
  const valid = { username: 'jane_doe-1', email: 'jane@example.com', password: 'password1' }

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('trims whitespace before validating', () => {
    const parsed = registerSchema.safeParse({ ...valid, username: '  jane  ' })
    expect(parsed.success && parsed.data.username).toBe('jane')
  })

  it.each([
    [{ username: '' }, "Username can't be blank"],
    [{ username: 'ab' }, 'Username is too short (minimum is 3 characters)'],
    [{ username: 'a'.repeat(31) }, 'Username is too long (maximum is 30 characters)'],
    [{ username: 'bad name!' }, 'Username is invalid (letters, numbers, "_" and "-" only)'],
    [{ email: 'nope' }, 'Email is invalid'],
    [{ password: 'short' }, 'Password is too short (minimum is 8 characters)'],
    [{ password: 'x'.repeat(73) }, 'Password is too long (maximum is 72 characters)'],
  ])('rejects %j', (override, message) => {
    expect(messages(registerSchema.safeParse({ ...valid, ...override }))).toContain(message)
  })
})

describe('settingsSchema', () => {
  const base = { image: '', username: 'jane', bio: '', email: 'jane@example.com', password: '' }

  it('allows an empty password (unchanged) and empty image/bio (cleared)', () => {
    expect(settingsSchema.safeParse(base).success).toBe(true)
  })

  it('limits bio to 300 characters', () => {
    expect(settingsSchema.safeParse({ ...base, bio: 'x'.repeat(301) }).success).toBe(false)
  })

  it('requires https images', () => {
    expect(imageField.safeParse('http://example.com/a.png').success).toBe(false)
    expect(imageField.safeParse('javascript:alert(1)').success).toBe(false)
    expect(imageField.safeParse('https://example.com/a.png').success).toBe(true)
  })
})

describe('articleSchema', () => {
  const valid = { title: 'T', description: 'D', body: 'B', tagList: ['one', 'two'] }

  it('accepts a valid article', () => {
    expect(articleSchema.safeParse(valid).success).toBe(true)
  })

  it('counts Unicode characters, not UTF-16 units', () => {
    const emoji = '😀'
    expect(articleSchema.safeParse({ ...valid, title: emoji.repeat(100) }).success).toBe(true)
    expect(articleSchema.safeParse({ ...valid, title: emoji.repeat(101) }).success).toBe(false)
  })

  it('allows at most 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`)
    expect(articleSchema.safeParse({ ...valid, tagList: tags }).success).toBe(false)
  })

  it('rejects tags with whitespace or commas, and tags over 30 characters', () => {
    expect(articleSchema.safeParse({ ...valid, tagList: ['a b'] }).success).toBe(false)
    expect(articleSchema.safeParse({ ...valid, tagList: ['a,b'] }).success).toBe(false)
    expect(articleSchema.safeParse({ ...valid, tagList: ['x'.repeat(31)] }).success).toBe(false)
  })
})
