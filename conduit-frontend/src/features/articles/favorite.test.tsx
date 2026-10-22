import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeArticle, makeListItem, makePage } from '@/test/factories'
import { errorResponse, url } from '@/test/handlers'
import { pathname, renderApp } from '@/test/render'
import { server } from '@/test/server'

const serveOneArticle = () =>
  server.use(
    http.get(url('/articles'), () => HttpResponse.json(makePage([makeListItem()]))),
    http.get(url('/articles/feed'), () => HttpResponse.json(makePage([makeListItem()]))),
  )

describe('favorite button', () => {
  it('updates immediately and keeps the server answer as the final truth', async () => {
    serveOneArticle()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(url('/articles/hello-world/favorite'), async () => {
        await gate
        return HttpResponse.json({ article: makeArticle({ favorited: true, favoritesCount: 7 }) })
      }),
    )
    const { user } = renderApp('/', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Favorite article' }))

    // Optimistic: flipped and +1 while the request is still pending.
    const optimistic = await screen.findByRole('button', { name: 'Unfavorite article' })
    expect(optimistic).toHaveTextContent('4')

    release()
    // The server says 7 (others favorited meanwhile): the server wins.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Unfavorite article' })).toHaveTextContent('7'),
    )
  })

  it('rolls back and shows a toast when the request fails', async () => {
    serveOneArticle()
    server.use(
      http.post(url('/articles/hello-world/favorite'), () =>
        errorResponse(500, { server: ['internal server error'] }),
      ),
    )
    const { user } = renderApp('/', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Favorite article' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Favorite article' })).toHaveTextContent('3'),
    )
    expect(
      await screen.findByText('Something went wrong on our side. Please try again.'),
    ).toBeInTheDocument()
  })

  it('sends guests to /login instead of calling the API', async () => {
    serveOneArticle()
    const { user, router } = renderApp('/')

    await user.click(await screen.findByRole('button', { name: 'Favorite article' }))

    await waitFor(() => expect(pathname(router)).toBe('/login'))
  })
})
