import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { useServerErrors } from '@/shared/hooks/useServerErrors'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { FormErrors } from '@/shared/ui/FieldError'
import { TextField } from '@/shared/ui/TextField'
import { registerSchema, type RegisterValues } from '@/shared/validation/schemas'
import { useRegister } from '../hooks/useAuthMutations'

const FIELDS = ['username', 'email', 'password'] as const

export function RegisterPage() {
  useDocumentTitle('Sign up')
  const navigate = useNavigate()
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })
  const { formErrors, handle, clear } = useServerErrors(setError, FIELDS)

  const onSubmit = handleSubmit((values) => {
    clear()
    registerUser.mutate(values, {
      onSuccess: () => void navigate('/', { replace: true }),
      onError: handle,
    })
  })

  return (
    <div className="container page auth-page">
      <h1 className="page-title">Sign up</h1>
      <p className="page-subtitle">
        <Link to="/login">Have an account?</Link>
      </p>
      <form onSubmit={onSubmit} noValidate>
        <FormErrors messages={formErrors} />
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={registerUser.isPending}
        >
          Sign up
        </button>
      </form>
    </div>
  )
}
