export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p className="field-error" id={id}>
      {message}
    </p>
  )
}

export function FormErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <ul className="form-errors" role="alert">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  )
}
