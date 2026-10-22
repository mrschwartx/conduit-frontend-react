// Client-side mirror of the business rules (fast feedback only: the server
// stays the authority and its 422 messages are always displayed).
import { z } from 'zod'

/** Unicode characters, not UTF-16 units or bytes. */
export const chars = (value: string): number => Array.from(value).length

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[A-Za-z0-9_-]+$/

interface TextRules {
  min?: number
  max: number
}

function text(label: string, { min = 1, max }: TextRules) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const length = chars(value)
      if (length === 0) ctx.addIssue({ code: 'custom', message: `${label} can't be blank` })
      else if (length < min)
        ctx.addIssue({
          code: 'custom',
          message: `${label} is too short (minimum is ${min} characters)`,
        })
      else if (length > max)
        ctx.addIssue({
          code: 'custom',
          message: `${label} is too long (maximum is ${max} characters)`,
        })
    })
}

export const usernameField = text('Username', { min: 3, max: 30 }).refine(
  (v) => v === '' || chars(v) < 3 || chars(v) > 30 || USERNAME.test(v),
  { message: 'Username is invalid (letters, numbers, "_" and "-" only)' },
)

export const emailField = text('Email', { max: 254 }).refine((v) => v === '' || EMAIL.test(v), {
  message: 'Email is invalid',
})

export const passwordField = z.string().superRefine((value, ctx) => {
  const length = chars(value)
  if (length === 0) ctx.addIssue({ code: 'custom', message: "Password can't be blank" })
  else if (length < 8)
    ctx.addIssue({ code: 'custom', message: 'Password is too short (minimum is 8 characters)' })
  else if (length > 72)
    ctx.addIssue({ code: 'custom', message: 'Password is too long (maximum is 72 characters)' })
})

/** Empty means "leave unchanged" in the settings form. */
export const optionalPasswordField = z.string().superRefine((value, ctx) => {
  const length = chars(value)
  if (length === 0) return
  if (length < 8)
    ctx.addIssue({ code: 'custom', message: 'Password is too short (minimum is 8 characters)' })
  else if (length > 72)
    ctx.addIssue({ code: 'custom', message: 'Password is too long (maximum is 72 characters)' })
})

export const bioField = z
  .string()
  .trim()
  .refine((v) => chars(v) <= 300, { message: 'Bio is too long (maximum is 300 characters)' })

export const imageField = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (v === '') return true
      try {
        return new URL(v).protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'Image must be a valid https URL' },
  )

export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 30

/** Returns an error message for a single candidate tag, or null if it is fine. */
export function tagProblem(tag: string): string | null {
  if (tag === '') return null
  if (/\s/.test(tag)) return 'Tags cannot contain spaces'
  if (tag.includes(',')) return 'Tags cannot contain commas'
  if (chars(tag) > MAX_TAG_LENGTH) return `Tags are limited to ${MAX_TAG_LENGTH} characters`
  return null
}

export const tagListField = z.array(z.string()).superRefine((tags, ctx) => {
  if (tags.length > MAX_TAGS)
    ctx.addIssue({ code: 'custom', message: `Tags are limited to ${MAX_TAGS} per article` })
  for (const tag of tags) {
    const problem = tagProblem(tag)
    if (problem) ctx.addIssue({ code: 'custom', message: problem })
  }
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password can't be blank"),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  username: usernameField,
  email: emailField,
  password: passwordField,
})
export type RegisterValues = z.infer<typeof registerSchema>

export const settingsSchema = z.object({
  image: imageField,
  username: usernameField,
  bio: bioField,
  email: emailField,
  password: optionalPasswordField,
})
export type SettingsValues = z.infer<typeof settingsSchema>

export const articleSchema = z.object({
  title: text('Title', { max: 100 }),
  description: text('Description', { max: 200 }),
  body: text('Body', { max: 20000 }),
  tagList: tagListField,
})
export type ArticleValues = z.infer<typeof articleSchema>

export const commentSchema = z.object({ body: text('Comment', { max: 1000 }) })
export type CommentValues = z.infer<typeof commentSchema>
