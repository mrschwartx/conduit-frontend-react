import { api } from '@/api/client'
import type {
  LoginPayload,
  NewUserPayload,
  UpdateUserPayload,
  User,
  UserResponse,
} from '@/api/types'

export async function login(user: LoginPayload): Promise<User> {
  const { data } = await api.post<UserResponse>('/users/login', { user })
  return data.user
}

export async function register(user: NewUserPayload): Promise<User> {
  const { data } = await api.post<UserResponse>('/users', { user })
  return data.user
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<UserResponse>('/user')
  return data.user
}

export async function updateCurrentUser(user: UpdateUserPayload): Promise<User> {
  const { data } = await api.put<UserResponse>('/user', { user })
  return data.user
}
