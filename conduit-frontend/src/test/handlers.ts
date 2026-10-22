import { http, HttpResponse } from 'msw'
import { makePage, makeUser } from './factories'

export const url = (path: string) => `*/api/v1${path}`

export const errorResponse = (status: number, errors: Record<string, string[]>) =>
  HttpResponse.json({ errors }, { status })

export const noContent = () => new HttpResponse(null, { status: 204 })

export const handlers = [
  http.get(url('/tags'), () => HttpResponse.json({ tags: ['react', 'vitest'] })),
  http.get(url('/user'), () => HttpResponse.json({ user: makeUser() })),
  http.get(url('/articles'), () => HttpResponse.json(makePage([]))),
  http.get(url('/articles/feed'), () => HttpResponse.json(makePage([]))),
]
