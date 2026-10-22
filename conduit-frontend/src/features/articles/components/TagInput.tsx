import { FieldError } from '@/shared/ui/FieldError'

interface TagInputProps {
  id: string
  label: string
  tags: string[]
  draft: string
  error?: string
  onDraftChange: (value: string) => void

  onCommit: () => void
  onRemove: (tag: string) => void
}

export function TagInput({
  id,
  label,
  tags,
  draft,
  error,
  onDraftChange,
  onCommit,
  onRemove,
}: TagInputProps) {
  const errorId = `${id}-error`
  return (
    <>
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="text"
          value={draft}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onCommit()
            }
          }}
        />
        <FieldError id={errorId} message={error} />
      </div>
      {tags.length > 0 && (
        <ul className="tag-list editable-tags" aria-label="Selected tags">
          {tags.map((tag) => (
            <li className="tag-pill" key={tag}>
              <span>{tag}</span>
              <button
                type="button"
                className="tag-remove"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onRemove(tag)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
