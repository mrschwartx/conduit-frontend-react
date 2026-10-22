import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from '@/app/query-client'
import { routes } from '@/app/routes'
import { installUnauthorizedHandler } from '@/app/session-guard'
import { setToken } from '@/features/auth/token'

interface RenderAppOptions {
  /** Pretend the user is already signed in with this JWT. */
  token?: string
}

/** Renders the real routes with a fresh query cache and an in-memory router. */
export function renderApp(route = '/', { token }: RenderAppOptions = {}) {
  if (token) setToken(token)
  const queryClient = createQueryClient({ retry: false })
  const router = createMemoryRouter(routes, { initialEntries: [route] })
  installUnauthorizedHandler(queryClient, router)
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, queryClient, user }
}

export const pathname = (router: ReturnType<typeof createMemoryRouter>) =>
  router.state.location.pathname
