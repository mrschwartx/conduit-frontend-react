import { useCallback, useState } from 'react'
import type { FieldValues, UseFormSetError } from 'react-hook-form'
import { applyServerErrors, describeError } from '@/api/errors'
import { toast } from '@/shared/toast/toast-store'

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
