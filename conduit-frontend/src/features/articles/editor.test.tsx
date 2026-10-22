import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeArticle, makeProfile, makeUser } from '@/test/factories'
import { errorResponse, url } from '@/test/handlers'
import { pathname, renderApp } from '@/test/render'
import { server } from '@/test/server'

const serveComments = (slug: string) =>
  server.use(http.get(url(`/articles/${slug}/comments`), () => HttpResponse.json({ comments: [] })))

describe('editor: create', () => {
  it('publishes an article with confirmed and pending tags', async () => {
    let body: unknown
    server.use(
      http.post(url('/articles'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          { article: makeArticle({ slug: 'my-title', title: 'My title' }) },
          { status: 201 },
        )
      }),
    )
    serveComments('my-title')
    const { user, router } = renderApp('/editor', { token: 'jwt' })

    await user.type(await screen.findByLabelText('Article title'), 'My title')
    await user.type(screen.getByLabelText("What's this article about?"), 'About things')
    await user.type(screen.getByLabelText('Write your article'), 'Some body')
    await user.type(screen.getByLabelText('Enter tags'), 'react{Enter}')
    await user.type(screen.getByLabelText('Enter tags'), 'vitest') // not confirmed with Enter
    await user.click(screen.getByRole('button', { name: 'Publish Article' }))

    expect(await screen.findByText('Article published successfully!')).toBeInTheDocument()
    expect(body).toEqual({
      article: {
        title: 'My title',
        description: 'About things',
        body: 'Some body',
        tagList: ['react', 'vitest'],
      },
    })
    await waitFor(() => expect(pathname(router)).toBe('/article/my-title'))
  })

  it('rejects a tag containing whitespace', async () => {
    const { user } = renderApp('/editor', { token: 'jwt' })

    await user.type(await screen.findByLabelText('Enter tags'), 'two words{Enter}')

    expect(await screen.findByText('Tags cannot contain spaces')).toBeInTheDocument()
  })

  it('shows 422 messages from the server under the fields', async () => {
    server.use(
      http.post(url('/articles'), () =>
        errorResponse(422, { title: ['is too long (maximum is 100 characters)'] }),
      ),
    )
    const { user } = renderApp('/editor', { token: 'jwt' })

    await user.type(await screen.findByLabelText('Article title'), 'T')
    await user.type(screen.getByLabelText("What's this article about?"), 'D')
    await user.type(screen.getByLabelText('Write your article'), 'B')
    await user.click(screen.getByRole('button', { name: 'Publish Article' }))

    expect(
      await screen.findByText('Title is too long (maximum is 100 characters)'),
    ).toBeInTheDocument()
  })
})

describe('editor: edit', () => {
  const mine = makeArticle({ author: makeProfile({ username: 'jane' }) })

  it('sends only the changed field and follows the regenerated slug', async () => {
    let body: unknown
    server.use(
      http.get(url('/articles/hello-world'), () => HttpResponse.json({ article: mine })),
      http.put(url('/articles/hello-world'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          article: { ...mine, slug: 'brand-new-title', title: 'Brand new title' },
        })
      }),
    )
    serveComments('brand-new-title')
    const { user, router } = renderApp('/editor/hello-world', { token: 'jwt' })

    const title = await screen.findByLabelText('Article title')
    expect(title).toHaveValue('Hello World')
    await user.clear(title)
    await user.type(title, 'Brand new title')
    await user.click(screen.getByRole('button', { name: 'Publish Article' }))

    expect(await screen.findByText('Article updated successfully!')).toBeInTheDocument()
    expect(body).toEqual({ article: { title: 'Brand new title' } })
    await waitFor(() => expect(pathname(router)).toBe('/article/brand-new-title'))
  })

  it("does not let you edit someone else's article", async () => {
    server.use(
      http.get(url('/user'), () => HttpResponse.json({ user: makeUser({ username: 'intruder' }) })),
      http.get(url('/articles/hello-world'), () => HttpResponse.json({ article: mine })),
    )
    renderApp('/editor/hello-world', { token: 'jwt' })

    expect(await screen.findByText('You can only edit your own articles.')).toBeInTheDocument()
  })
})

describe('article page', () => {
  it('renders title, body and comments as plain text', async () => {
    const markup = '<img src=x onerror=alert(1)> **bold**'
    server.use(
      http.get(url('/articles/hello-world'), () =>
        HttpResponse.json({ article: makeArticle({ body: markup }) }),
      ),
    )
    serveComments('hello-world')
    renderApp('/article/hello-world')

    expect(await screen.findByText(markup)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('shows a not-found message', async () => {
    server.use(
      http.get(url('/articles/nope'), () => errorResponse(404, { article: ['not found'] })),
    )
    serveComments('nope')
    renderApp('/article/nope')
    expect(await screen.findByText('Article not found.')).toBeInTheDocument()
  })
})
