export interface ArticleFilters {
  scope: 'global' | 'feed'
  tag?: string
  author?: string
  favorited?: string

  page: number
}

export const authKeys = {
  user: () => ['auth', 'user'] as const,
}

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (filters: ArticleFilters) => [...articleKeys.lists(), filters] as const,

  feeds: () => [...articleKeys.lists(), { scope: 'feed' }] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (slug: string) => [...articleKeys.details(), slug] as const,
}

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (username: string) => [...profileKeys.all, username] as const,
}

export const commentKeys = {
  all: ['comments'] as const,
  list: (slug: string) => [...commentKeys.all, slug] as const,
}

export const tagKeys = {
  all: ['tags'] as const,
}
