export type ToastKind = 'success' | 'error'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const DURATION: Record<ToastKind, number> = { success: 4000, error: 7000 }

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit(next: ToastItem[]) {
  items = next
  listeners.forEach((listener) => listener())
}

function push(kind: ToastKind, message: string): number {
  const id = nextId++
  emit([...items, { id, kind, message }])
  setTimeout(() => dismiss(id), DURATION[kind])
  return id
}

function dismiss(id: number) {
  if (items.some((item) => item.id === id)) emit(items.filter((item) => item.id !== id))
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  dismiss,
  clear: () => emit([]),
}

export const getToasts = (): ToastItem[] => items

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
