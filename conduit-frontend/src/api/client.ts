import axios, { type AxiosError } from 'axios'
import { API_BASE_URL } from '@/shared/config/env'
import { getToken } from '@/features/auth/token'
import { toAppError } from './errors'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

const AUTH_ENDPOINTS = new Set(['/users/login', '/users'])

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) config.headers.set('Authorization', `Token ${token}`)

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
