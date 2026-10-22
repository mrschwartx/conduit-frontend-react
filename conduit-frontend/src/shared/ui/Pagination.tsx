interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagination">
      <ul className="pagination">
        {Array.from({ length: pages }, (_, index) => (
          <li key={index}>
            <button
              type="button"
              className={index === page ? 'page-button active' : 'page-button'}
              aria-label={`Page ${index + 1}`}
              aria-current={index === page ? 'page' : undefined}
              onClick={() => onChange(index)}
            >
              {index + 1}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
