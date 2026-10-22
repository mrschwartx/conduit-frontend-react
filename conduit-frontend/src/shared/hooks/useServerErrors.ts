import { useCallback, useState } from 'react'
import type { FieldValues, UseFormSetError } from 'react-hook-form'
import { applyServerErrors, describeError } from '@/api/errors'
import { toast } from '@/shared/toast/toast-store'

/**
 * Funnel for server failures in a react-hook-form form: field keys become field
 * errors, other keys become form-level messages, network/5xx becomes a toast.
 * `fields` must be a stable (module-level) array.
 */
export function useServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly string[],
) {
  const [formErrors, setFormErrors] = useState<string[]>([])

  const handle = useCallback(
    (error: unknown) => {
      const applied = applyServerErrors(error, setError, fields)
      setFormErrors(applied.formErrors)
      if (applied.transport) toast.error(describeError(error))
    },
    [setError, fields],
  )

  const clear = useCallback(() => setFormErrors([]), [])
  return { formErrors, setFormErrors, handle, clear }
}
