import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { applyServerErrors, toAppError } from './errors'

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
  } as AxiosResponse)

describe('toAppError', () => {
  it.each([
    [400, 'bad_request'],
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [415, 'unsupported'],
    [422, 'validation'],
  ])('maps status %i to %s', (status, kind) => {
    const error = toAppError(httpError(status, { errors: { x: ['nope'] } }))
    expect(error.kind).toBe(kind)
    expect(error.status).toBe(status)
    expect(error.errors).toEqual({ x: ['nope'] })
  })

  it('writes a readable message from the contract body', () => {
    const error = toAppError(httpError(409, { errors: { email: ['has already been taken'] } }))
    expect(error.message).toBe('Email has already been taken')
  })

  it('never exposes server detail for 5xx', () => {
    const error = toAppError(httpError(500, { errors: { server: ['internal server error'] } }))
    expect(error.kind).toBe('server')
    expect(error.message).toBe('Something went wrong on our side. Please try again.')
  })

  it('treats a missing response as a network failure', () => {
    expect(toAppError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe('network')
  })

  it('survives a body that is not the contract error format', () => {
    const error = toAppError(httpError(418, '<html>teapot</html>'))
    expect(error.kind).toBe('unknown')
    expect(error.errors).toEqual({})
    expect(error.message).toBe('Request failed (418).')
  })
})

describe('applyServerErrors', () => {
  it('turns form fields into field errors and the rest into form-level messages', () => {
    const setError = vi.fn()
    const result = applyServerErrors(
      httpError(422, { errors: { email: ['is invalid'], credentials: ['are invalid'] } }),
      setError,
      ['email', 'password'],
    )
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Email is invalid',
    })
    expect(result).toEqual({ formErrors: ['Email or password are invalid'], transport: false })
  })

  it('flags network and 5xx failures for a toast instead of the form', () => {
    const setError = vi.fn()
    const result = applyServerErrors(httpError(503, {}), setError, ['email'])
    expect(result).toEqual({ formErrors: [], transport: true })
    expect(setError).not.toHaveBeenCalled()
  })

  it('names the tag list field "Tags"', () => {
    const setError = vi.fn()
    applyServerErrors(httpError(422, { errors: { tagList: ['is too long'] } }), setError, ['tagList'])
    expect(setError).toHaveBeenCalledWith('tagList', { type: 'server', message: 'Tags is too long' })
  })
})
