import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { favoriteArticle } from '@/features/articles/api/articles.api'
import { fetchCurrentUser, login } from '@/features/auth/api/auth.api'
import { setToken } from '@/features/auth/token'
import { errorResponse, url } from '@/test/handlers'
import { makeArticle } from '@/test/factories'
import { server } from '@/test/server'
import { setUnauthorizedHandler } from './client'

afterEach(() => setUnauthorizedHandler(() => {}))

describe('api client', () => {
  it('sends the token with the "Token" scheme, not "Bearer"', async () => {
    setToken('abc.def.ghi')
    let header: string | null = null
    server.use(
      http.get(url('/user'), ({ request }) => {
        header = request.headers.get('authorization')
        return HttpResponse.json({ user: { email: 'a@b.co', token: 't', username: 'a', bio: null, image: null } })
      }),
    )
    await fetchCurrentUser()
    expect(header).toBe('Token abc.def.ghi')
  })

  it('does not send a Content-Type on requests without a body', async () => {
    setToken('t')
    let contentType: string | null = 'unset'
    server.use(
      http.post(url('/articles/hello-world/favorite'), ({ request }) => {
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ article: makeArticle({ favorited: true }) })
      }),
    )
    await favoriteArticle('hello-world')
    expect(contentType).toBeNull()
  })

  it('reports an expired session on 401 from a normal endpoint', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    server.use(http.get(url('/user'), () => errorResponse(401, { token: ['has expired'] })))
    await expect(fetchCurrentUser()).rejects.toMatchObject({ kind: 'unauthenticated' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not treat a failed login as an expired session', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    server.use(
      http.post(url('/users/login'), () => errorResponse(401, { credentials: ['are invalid'] })),
    )
    await expect(login({ email: 'a@b.co', password: 'x' })).rejects.toMatchObject({
      kind: 'unauthenticated',
    })
    expect(handler).not.toHaveBeenCalled()
  })
})
