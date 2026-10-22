export function Skeleton({ rows = 3, label = 'Loading...' }: { rows?: number; label?: string }) {
  return (
    <div aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="skeleton-line tall" aria-hidden="true" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={i === rows - 1 ? 'skeleton-line short' : 'skeleton-line'} aria-hidden="true" />
      ))}
    </div>
  )
}
