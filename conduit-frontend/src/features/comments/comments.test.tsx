import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeArticle, makeComment, makeProfile } from '@/test/factories'
import { noContent, url } from '@/test/handlers'
import { renderApp } from '@/test/render'
import { server } from '@/test/server'

const mine = makeComment({ id: 1, body: 'My own comment', author: makeProfile({ username: 'jane' }) })
const theirs = makeComment({ id: 2, body: 'Their comment', author: makeProfile({ username: 'bob' }) })

const serveArticle = (comments = [mine, theirs]) =>
  server.use(
    http.get(url('/articles/hello-world'), () => HttpResponse.json({ article: makeArticle() })),
    http.get(url('/articles/hello-world/comments'), () => HttpResponse.json({ comments })),
  )

describe('comments', () => {
  it('lets you delete only your own comments', async () => {
    serveArticle()
    renderApp('/article/hello-world', { token: 'jwt' })

    expect(await screen.findByText('Their comment')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Delete comment' })).toHaveLength(1)
  })

  it('adds a comment at the top of the list', async () => {
    serveArticle()
    let body: unknown
    server.use(
      http.post(url('/articles/hello-world/comments'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          { comment: makeComment({ id: 3, body: 'Fresh thought', author: makeProfile({ username: 'jane' }) }) },
          { status: 201 },
        )
      }),
    )
    const { user } = renderApp('/article/hello-world', { token: 'jwt' })

    await user.type(await screen.findByLabelText('Write a comment'), 'Fresh thought')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    expect(await screen.findByText('Fresh thought')).toBeInTheDocument()
    expect(body).toEqual({ comment: { body: 'Fresh thought' } })
    expect(screen.getByLabelText('Write a comment')).toHaveValue('')
    const articles = within(screen.getByRole('region', { name: 'Comments' })).getAllByRole('article')
    expect(articles[0]).toHaveTextContent('Fresh thought')
  })

  it('deletes a comment', async () => {
    serveArticle()
    let deleted = false
    server.use(
      http.delete(url('/articles/hello-world/comments/1'), () => {
        deleted = true
        return noContent()
      }),
    )
    const { user } = renderApp('/article/hello-world', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Delete comment' }))

    await waitFor(() => expect(screen.queryByText('My own comment')).not.toBeInTheDocument())
    expect(deleted).toBe(true)
    expect(screen.getByText('Their comment')).toBeInTheDocument()
  })

  it('invites guests to sign in instead of showing the form', async () => {
    serveArticle()
    renderApp('/article/hello-world')

    const section = await screen.findByRole('region', { name: 'Comments' })
    expect(await within(section).findByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Write a comment')).not.toBeInTheDocument()
  })
})
