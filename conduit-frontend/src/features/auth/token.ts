// The ONLY module that touches browser storage. The JWT lives under one key.
const KEY = 'conduit_token'

type Listener = () => void
const listeners = new Set<Listener>()
let memory: string | null = null
let loaded = false

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return memory // storage unavailable (private mode): keep it in memory
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
    /* kept in memory only */
  }
  emit()
}

export function clearToken(): void {
  memory = null
  loaded = true
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to remove */
  }
  emit()
}

export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Test helper: forget the cached value so the next read hits storage again. */
export function resetTokenCache(): void {
  loaded = false
  memory = null
}
