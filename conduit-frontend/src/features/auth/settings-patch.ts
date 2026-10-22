import type { UpdateUserPayload, User } from '@/api/types'
import type { SettingsValues } from '@/shared/validation/schemas'

export function buildSettingsPatch(user: User, values: SettingsValues): UpdateUserPayload {
  const patch: UpdateUserPayload = {}
  if (values.username !== user.username) patch.username = values.username
  if (values.email !== user.email) patch.email = values.email
  const image = values.image === '' ? null : values.image
  if (image !== user.image) patch.image = image
  const bio = values.bio === '' ? null : values.bio
  if (bio !== user.bio) patch.bio = bio
  if (values.password !== '') patch.password = values.password
  return patch
}
