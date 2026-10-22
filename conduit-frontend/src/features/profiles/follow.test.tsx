import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { makeProfile } from '@/test/factories'
import { errorResponse, url } from '@/test/handlers'
import { renderApp } from '@/test/render'
import { server } from '@/test/server'

const serveProfile = () =>
  server.use(
    http.get(url('/profiles/author'), () => HttpResponse.json({ profile: makeProfile() })),
  )

describe('follow button', () => {
  it('shows the new state before the server answers', async () => {
    serveProfile()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(url('/profiles/author/follow'), async () => {
        await gate
        return HttpResponse.json({ profile: makeProfile({ following: true }) })
      }),
    )
    const { user } = renderApp('/profile/author', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Follow author' }))
    expect(await screen.findByRole('button', { name: 'Unfollow author' })).toBeInTheDocument()

    release()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Unfollow author' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
  })

  it('rolls back when the request fails', async () => {
    serveProfile()
    server.use(
      http.post(url('/profiles/author/follow'), () =>
        errorResponse(500, { server: ['internal server error'] }),
      ),
    )
    const { user } = renderApp('/profile/author', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Follow author' }))

    expect(await screen.findByText(/Something went wrong/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Follow author' })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown profile', async () => {
    server.use(
      http.get(url('/profiles/ghost'), () => errorResponse(404, { profile: ['not found'] })),
    )
    renderApp('/profile/ghost')
    expect(await screen.findByText('Profile not found.')).toBeInTheDocument()
  })
})
