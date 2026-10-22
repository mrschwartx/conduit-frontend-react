const KEY = 'conduit_token'

type Listener = () => void
const listeners = new Set<Listener>()
let memory: string | null = null
let loaded = false

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return memory
  }
}

export function getToken(): string | null {
  if (!loaded) {
    memory = read()
    loaded = true
  }
  return memory
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function setToken(token: string): void {
  memory = token
  loaded = true
  try {
    localStorage.setItem(KEY, token)
  } catch {
  }
  emit()
}

export function clearToken(): void {
  memory = null
  loaded = true
  try {
    localStorage.removeItem(KEY)
  } catch {
  }
  emit()
}

export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function resetTokenCache(): void {
  loaded = false
  memory = null
}
