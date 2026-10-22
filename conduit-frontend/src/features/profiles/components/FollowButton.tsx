import type { Profile } from '@/api/types'
import { useAuthGate } from '@/features/auth/hooks/useAuth'
import { useToggleFollow } from '../hooks/useProfiles'

export function FollowButton({ profile }: { profile: Profile }) {
  const gate = useAuthGate()
  const toggle = useToggleFollow()
  return (
    <button
      type="button"
      className={profile.following ? 'btn btn-secondary active' : 'btn btn-secondary'}
      aria-pressed={profile.following}
      disabled={toggle.isPending}
      onClick={() =>
        gate(() => toggle.mutate({ username: profile.username, follow: !profile.following }))
      }
    >
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  )
}
