import type { Article, ArticleListItem, ArticlesPage, Comment, Profile, User } from '@/api/types'

export const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  username: 'author',
  bio: null,
  image: null,
  following: false,
  ...overrides,
})

export const makeUser = (overrides: Partial<User> = {}): User => ({
  email: 'jane@example.com',
  token: 'jwt-token',
  username: 'jane',
  bio: null,
  image: null,
  ...overrides,
})

export const makeArticle = (overrides: Partial<Article> = {}): Article => ({
  slug: 'hello-world',
  title: 'Hello World',
  description: 'A greeting',
  body: 'The body text',
  tagList: ['react'],
  createdAt: '2026-10-21T10:15:30.123Z',
  updatedAt: '2026-10-21T10:15:30.123Z',
  favorited: false,
  favoritesCount: 3,
  author: makeProfile(),
  ...overrides,
})

export const makeListItem = (overrides: Partial<ArticleListItem> = {}): ArticleListItem => {
  const full = makeArticle(overrides)
  return {
    slug: full.slug,
    title: full.title,
    description: full.description,
    tagList: full.tagList,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
    favorited: full.favorited,
    favoritesCount: full.favoritesCount,
    author: full.author,
  }
}

export const makePage = (articles: ArticleListItem[], articlesCount = articles.length): ArticlesPage => ({
  articles,
  articlesCount,
})

export const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  createdAt: '2026-10-21T11:00:00.000Z',
  updatedAt: '2026-10-21T11:00:00.000Z',
  body: 'Nice article',
  author: makeProfile({ username: 'bob' }),
  ...overrides,
})
