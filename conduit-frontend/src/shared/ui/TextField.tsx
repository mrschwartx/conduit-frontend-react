import type { ComponentPropsWithRef } from 'react'
import { FieldError } from './FieldError'

type InputProps = Omit<ComponentPropsWithRef<'input'>, 'id'>

interface TextFieldProps extends InputProps {
  id: string
  label: string
  error?: string
  multiline?: boolean
  rows?: number
}

export function TextField({ id, label, error, multiline, rows = 6, ...rest }: TextFieldProps) {
  const errorId = `${id}-error`
  const a11y = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea {...(rest as ComponentPropsWithRef<'textarea'>)} {...a11y} rows={rows} />
      ) : (
        <input {...rest} {...a11y} />
      )}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
