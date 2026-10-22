import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from './app/query-client'
import { routes } from './app/routes'
import { installUnauthorizedHandler } from './app/session-guard'
import './styles/globals.css'

const queryClient = createQueryClient()
const router = createBrowserRouter(routes)
installUnauthorizedHandler(queryClient, router)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
