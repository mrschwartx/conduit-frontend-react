import { api } from '@/api/client'
import type { Profile, ProfileResponse } from '@/api/types'

const path = (username: string) => `/profiles/${encodeURIComponent(username)}`

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await api.get<ProfileResponse>(path(username))
  return data.profile
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await api.post<ProfileResponse>(`${path(username)}/follow`)
  return data.profile
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await api.delete<ProfileResponse>(`${path(username)}/follow`)
  return data.profile
}
