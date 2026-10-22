export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul className="tag-list" aria-label="Tags">
      {tags.map((tag) => (
        <li className="tag-pill" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  )
}
