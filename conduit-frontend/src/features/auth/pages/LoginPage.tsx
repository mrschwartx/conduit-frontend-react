import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { useServerErrors } from '@/shared/hooks/useServerErrors'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { FormErrors } from '@/shared/ui/FieldError'
import { TextField } from '@/shared/ui/TextField'
import { loginSchema, type LoginValues } from '@/shared/validation/schemas'
import { useLogin } from '../hooks/useAuthMutations'

const FIELDS = ['email', 'password'] as const

function safeReturnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const { formErrors, handle, clear } = useServerErrors(setError, FIELDS)

  const onSubmit = handleSubmit((values) => {
    clear()
    login.mutate(values, {
      onSuccess: () => void navigate(safeReturnPath(location.state), { replace: true }),
      onError: handle,
    })
  })

  return (
    <div className="container page auth-page">
      <h1 className="page-title">Sign in</h1>
      <p className="page-subtitle">
        <Link to="/register">Need an account?</Link>
      </p>
      <form onSubmit={onSubmit} noValidate>
        <FormErrors messages={formErrors} />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button type="submit" className="btn btn-primary btn-large" disabled={login.isPending}>
          Sign in
        </button>
      </form>
    </div>
  )
}
