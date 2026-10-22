import axios, { type AxiosError } from 'axios'
import { API_BASE_URL } from '@/shared/config/env'
import { getToken } from '@/features/auth/token'
import { toAppError } from './errors'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

// 401s from these endpoints are normal outcomes (wrong password, duplicate
// user), not an expired session.
const AUTH_ENDPOINTS = new Set(['/users/login', '/users'])

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = getToken()
  // The scheme word is "Token", not "Bearer".
  if (token) config.headers.set('Authorization', `Token ${token}`)
  // Requests without a body (DELETE, follow, favorite) must not send a
  // Content-Type; `false` stops axios adding its own default.
  if (config.data === undefined) config.headers.set('Content-Type', false)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.has(error.config?.url ?? '')) {
      onUnauthorized()
    }
    return Promise.reject(toAppError(error))
  },
)
