// Only the API base URL is configurable. It defaults to a same-origin path so
// that switching backend never needs a frontend change.
const raw = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL: string =
  typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : '/api/v1'
