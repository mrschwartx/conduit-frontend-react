import { useSyncExternalStore } from 'react'
import { getToasts, subscribeToasts } from './toast-store'

/** Always mounted so screen readers announce messages as they appear. */
export function ToastRegion() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts)
  return (
    <div role="status" aria-live="polite">
      {toasts.map((item) => (
        <div key={item.id} className={item.kind === 'error' ? 'flash flash-error' : 'flash'}>
          <div className="container">{item.message}</div>
        </div>
      ))}
    </div>
  )
}
