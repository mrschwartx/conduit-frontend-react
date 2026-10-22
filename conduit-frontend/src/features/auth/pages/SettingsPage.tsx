import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import type { User } from '@/api/types'
import { useServerErrors } from '@/shared/hooks/useServerErrors'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { FormErrors } from '@/shared/ui/FieldError'
import { TextField } from '@/shared/ui/TextField'
import { settingsSchema, type SettingsValues } from '@/shared/validation/schemas'
import { useAuth } from '../hooks/useAuth'
import { useUpdateSettings } from '../hooks/useAuthMutations'
import { buildSettingsPatch } from '../settings-patch'

const FIELDS = ['image', 'username', 'bio', 'email', 'password'] as const

function SettingsForm({ user }: { user: User }) {
  const navigate = useNavigate()
  const update = useUpdateSettings()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      image: user.image ?? '',
      username: user.username,
      bio: user.bio ?? '',
      email: user.email,
      password: '',
    },
  })
  const { formErrors, setFormErrors, handle, clear } = useServerErrors(setError, FIELDS)

  const onSubmit = handleSubmit((values) => {
    clear()
    const patch = buildSettingsPatch(user, values)
    if (Object.keys(patch).length === 0) {
      setFormErrors(['Change at least one field to update your settings.'])
      return
    }
    update.mutate(patch, {
      onSuccess: (updated) => void navigate(`/profile/${encodeURIComponent(updated.username)}`),
      onError: handle,
    })
  })

  return (
    <div className="container page auth-page">
      <h1 className="page-title">Your Settings</h1>
      <form onSubmit={onSubmit} noValidate>
        <FormErrors messages={formErrors} />
        <TextField
          id="image"
          label="URL of profile picture"
          type="url"
          error={errors.image?.message}
          {...register('image')}
        />
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <TextField
          id="bio"
          label="Short bio about you"
          multiline
          rows={6}
          error={errors.bio?.message}
          {...register('bio')}
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
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button type="submit" className="btn btn-primary btn-large" disabled={update.isPending}>
          Update Settings
        </button>
      </form>
      <hr />
      <button
        type="button"
        className="btn btn-danger-outline"
        onClick={() => void navigate('/logout')}
      >
        Or click here to logout.
      </button>
    </div>
  )
}

export function SettingsPage() {
  useDocumentTitle('Settings')
  const { user } = useAuth()

  return user ? <SettingsForm key={user.username} user={user} /> : null
}
