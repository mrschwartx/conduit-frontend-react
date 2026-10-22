import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export type AppErrorKind =
  | 'bad_request'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unsupported'
  | 'validation'
  | 'server'
  | 'network'
  | 'unknown'

export type ErrorMap = Record<string, string[]>

export class AppError extends Error {
  kind: AppErrorKind
  status: number | undefined
  errors: ErrorMap

  constructor(kind: AppErrorKind, message: string, status?: number, errors: ErrorMap = {}) {
    super(message)
    this.name = 'AppError'
    this.kind = kind
    this.status = status
    this.errors = errors
  }
}

export const isAppError = (value: unknown): value is AppError => value instanceof AppError

const KIND_BY_STATUS: Record<number, AppErrorKind> = {
  400: 'bad_request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  415: 'unsupported',
  422: 'validation',
}

function parseErrorMap(data: unknown): ErrorMap {
  if (typeof data !== 'object' || data === null || !('errors' in data)) return {}
  const raw = (data as { errors: unknown }).errors
  if (typeof raw !== 'object' || raw === null) return {}
  const map: ErrorMap = {}
  for (const [key, value] of Object.entries(raw)) {
    const messages = Array.isArray(value)
      ? value.filter((m): m is string => typeof m === 'string')
      : []
    if (messages.length > 0) map[key] = messages
  }
  return map
}

const LABELS: Record<string, string> = {
  tagList: 'Tags',
  credentials: 'Email or password',
}

export const fieldLabel = (key: string): string =>
  LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)

export const fieldMessage = (key: string, messages: string[]): string =>
  messages.map((m) => `${fieldLabel(key)} ${m}`).join('. ')

function firstMessage(errors: ErrorMap): string | undefined {
  const [key] = Object.keys(errors)
  return key === undefined ? undefined : fieldMessage(key, errors[key])
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === undefined) {
      return new AppError('network', 'Network error. Check your connection and try again.')
    }
    const errors = parseErrorMap(error.response?.data)
    if (status >= 500) {
      return new AppError(
        'server',
        'Something went wrong on our side. Please try again.',
        status,
        errors,
      )
    }
    const kind = KIND_BY_STATUS[status] ?? 'unknown'
    return new AppError(kind, firstMessage(errors) ?? `Request failed (${status}).`, status, errors)
  }
  return new AppError('unknown', error instanceof Error ? error.message : 'Unexpected error.')
}

export const describeError = (error: unknown): string => toAppError(error).message

export const isTransportError = (error: AppError): boolean =>
  error.kind === 'network' || error.kind === 'server'

export interface AppliedErrors {
  formErrors: string[]

  transport: boolean
}

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
): AppliedErrors {
  const appError = toAppError(error)
  if (isTransportError(appError)) return { formErrors: [], transport: true }

  const formErrors: string[] = []
  const entries = Object.entries(appError.errors)
  if (entries.length === 0) formErrors.push(appError.message)
  for (const [key, messages] of entries) {
    const text = fieldMessage(key, messages)
    if (fields.includes(key)) setError(key as Path<T>, { type: 'server', message: text })
    else formErrors.push(text)
  }
  return { formErrors, transport: false }
}
