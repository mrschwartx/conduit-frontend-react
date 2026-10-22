import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { clearToken, resetTokenCache } from '@/features/auth/token'
import { toast } from '@/shared/toast/toast-store'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearToken()
  localStorage.clear()
  resetTokenCache()
  toast.clear()
})

afterAll(() => server.close())
