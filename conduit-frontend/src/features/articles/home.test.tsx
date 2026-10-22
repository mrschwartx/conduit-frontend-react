import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeListItem, makePage } from '@/test/factories'
import { url } from '@/test/handlers'
import { renderApp } from '@/test/render'
import { server } from '@/test/server'

function serveArticles(path: '/articles' | '/articles/feed', total = 1) {
  const calls: URLSearchParams[] = []
  server.use(
    http.get(url(path), ({ request }) => {
      const params = new URL(request.url).searchParams
      calls.push(params)
      const offset = Number(params.get('offset') ?? 0)
      return HttpResponse.json(
        makePage([makeListItem({ slug: `a-${offset}`, title: `Article at ${offset}` })], total),
      )
    }),
  )
  return calls
}

describe('home page', () => {
  it('shows only the global feed to guests, 10 per page', async () => {
    const calls = serveArticles('/articles')
    renderApp('/')

    expect(await screen.findByText('Article at 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Global Feed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Your Feed' })).not.toBeInTheDocument()
    expect(calls[0].get('limit')).toBe('10')
    expect(calls[0].get('offset')).toBe('0')
  })

  it('opens "Your Feed" for signed-in users and can switch to the global feed', async () => {
    const feedCalls = serveArticles('/articles/feed')
    const globalCalls = serveArticles('/articles')
    const { user } = renderApp('/', { token: 'jwt' })

    expect(await screen.findByText('Article at 0')).toBeInTheDocument()
    expect(feedCalls).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Your Feed' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Global Feed' }))
    await waitFor(() => expect(globalCalls).toHaveLength(1))
    expect(screen.getByRole('button', { name: 'Global Feed' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters by a popular tag and shows a #tag tab', async () => {
    const calls = serveArticles('/articles')
    const { user } = renderApp('/')

    await user.click(await screen.findByRole('button', { name: 'vitest' }))

    expect(await screen.findByRole('button', { name: '#vitest' })).toBeInTheDocument()
    await waitFor(() => expect(calls.some((c) => c.get('tag') === 'vitest')).toBe(true))
  })

  it('paginates with offset = page * 10', async () => {
    const calls = serveArticles('/articles', 25)
    const { user } = renderApp('/')

    await screen.findByText('Article at 0')
    expect(screen.getAllByRole('button', { name: /^Page \d+$/ })).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(await screen.findByText('Article at 10')).toBeInTheDocument()
    expect(calls.at(-1)?.get('offset')).toBe('10')
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the empty state', async () => {
    renderApp('/')
    expect(await screen.findByText('No articles are here... yet.')).toBeInTheDocument()
  })
})
