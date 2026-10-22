import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { errorResponse, url } from '@/test/handlers'
import { makeUser } from '@/test/factories'
import { pathname, renderApp } from '@/test/render'
import { server } from '@/test/server'

const storedToken = () => localStorage.getItem('conduit_token')

describe('registration', () => {
  it('registers, stores the token, welcomes the user and goes home', async () => {
    let body: unknown
    server.use(
      http.post(url('/users'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ user: makeUser({ token: 'new-jwt' }) }, { status: 201 })
      }),
    )
    const { user, router } = renderApp('/register')

    await user.type(screen.getByLabelText('Username'), 'jane')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText('Welcome to Conduit, jane!')).toBeInTheDocument()
    expect(body).toEqual({
      user: { username: 'jane', email: 'jane@example.com', password: 'password123' },
    })
    expect(storedToken()).toBe('new-jwt')
    await waitFor(() => expect(pathname(router)).toBe('/'))
    expect(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', {
        name: 'New Article',
      }),
    ).toBeInTheDocument()
  })

  it('validates on the client without calling the server', async () => {
    const { user } = renderApp('/register') // any request would fail the test (unhandled)
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText("Username can't be blank")).toBeInTheDocument()
    expect(screen.getByText("Email can't be blank")).toBeInTheDocument()
    expect(screen.getByText("Password can't be blank")).toBeInTheDocument()
  })

  it('shows a 409 conflict on the email field', async () => {
    server.use(
      http.post(url('/users'), () => errorResponse(409, { email: ['has already been taken'] })),
    )
    const { user } = renderApp('/register')

    await user.type(screen.getByLabelText('Username'), 'jane')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText('Email has already been taken')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(storedToken()).toBeNull()
  })

  it('shows every 422 message next to its field', async () => {
    server.use(
      http.post(url('/users'), () =>
        errorResponse(422, { username: ['is invalid'], password: ["can't be blank"] }),
      ),
    )
    const { user } = renderApp('/register')

    await user.type(screen.getByLabelText('Username'), 'jane')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText('Username is invalid')).toBeInTheDocument()
    expect(screen.getByText("Password can't be blank")).toBeInTheDocument()
  })
})

describe('login', () => {
  it('signs in and returns home', async () => {
    server.use(
      http.post(url('/users/login'), () => HttpResponse.json({ user: makeUser({ token: 'tok' }) })),
    )
    const { user, router } = renderApp('/login')

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(pathname(router)).toBe('/'))
    expect(storedToken()).toBe('tok')
  })

  it('shows wrong credentials as a form message and stays on the page', async () => {
    server.use(
      http.post(url('/users/login'), () => errorResponse(401, { credentials: ['are invalid'] })),
    )
    const { user, router } = renderApp('/login')

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password are invalid')
    expect(pathname(router)).toBe('/login')
    expect(storedToken()).toBeNull()
  })
})

describe('route guards', () => {
  it('sends guests who open a protected page to /login', async () => {
    const { router } = renderApp('/editor')
    await waitFor(() => expect(pathname(router)).toBe('/login'))
  })

  it('sends signed-in users away from /login and /register', async () => {
    const { router } = renderApp('/login', { token: 'jwt' })
    await waitFor(() => expect(pathname(router)).toBe('/'))
  })

  it('shows a neutral state, not logged-out UI, while the current user loads', async () => {
    server.use(
      http.get(url('/user'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ user: makeUser() })
      }),
    )
    renderApp('/', { token: 'jwt' })

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(await within(nav).findByRole('link', { name: 'jane' })).toBeInTheDocument()
  })
})

describe('session expiry', () => {
  it('clears the token and redirects to /login when the API answers 401', async () => {
    server.use(http.get(url('/user'), () => errorResponse(401, { token: ['has expired'] })))
    const { router } = renderApp('/', { token: 'stale' })

    await waitFor(() => expect(pathname(router)).toBe('/login'))
    expect(storedToken()).toBeNull()
    expect(await screen.findByText('Your session has expired. Please sign in again.')).toBeInTheDocument()
  })
})

describe('logout', () => {
  it('clears the session, returns home and confirms', async () => {
    const { user, router } = renderApp('/settings', { token: 'jwt' })

    await user.click(await screen.findByRole('button', { name: 'Or click here to logout.' }))

    expect(await screen.findByText("You've been logged out successfully!")).toBeInTheDocument()
    await waitFor(() => expect(pathname(router)).toBe('/'))
    expect(storedToken()).toBeNull()
    expect(
      await within(screen.getByRole('navigation', { name: 'Main' })).findByRole('link', {
        name: 'Sign in',
      }),
    ).toBeInTheDocument()
  })
})

describe('settings', () => {
  it('sends only the changed fields and keeps the fresh token', async () => {
    let body: unknown
    server.use(
      http.put(url('/user'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ user: makeUser({ bio: 'Hi there', token: 'fresh-jwt' }) })
      }),
      http.get(url('/profiles/jane'), () =>
        HttpResponse.json({
          profile: { username: 'jane', bio: 'Hi there', image: null, following: false },
        }),
      ),
    )
    const { user, router } = renderApp('/settings', { token: 'jwt' })

    await user.type(await screen.findByLabelText('Short bio about you'), 'Hi there')
    await user.click(screen.getByRole('button', { name: 'Update Settings' }))

    expect(await screen.findByText('Settings updated successfully.')).toBeInTheDocument()
    expect(body).toEqual({ user: { bio: 'Hi there' } })
    expect(storedToken()).toBe('fresh-jwt')
    await waitFor(() => expect(pathname(router)).toBe('/profile/jane'))
  })
})
