// API shapes used by the frontend. They are maintained here, inside this
// project, so the frontend has no build-time dependency on the OpenAPI file
// (which lives only in conduit-openapi). Runtime compatibility with every
// backend is covered by the MSW tests and the Playwright e2e tests.

export interface Profile {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

export interface User {
  email: string
  token: string
  username: string
  bio: string | null
  image: string | null
}

export interface Article {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  createdAt: string
  updatedAt: string
  favorited: boolean
  favoritesCount: number
  author: Profile
}

/** List endpoints omit `body`; a full Article is structurally a superset. */
export type ArticleListItem = Omit<Article, 'body'>

export interface Comment {
  id: number
  createdAt: string
  updatedAt: string
  body: string
  author: Profile
}

export interface ArticlesPage {
  articles: ArticleListItem[]
  articlesCount: number
}

export interface LoginPayload {
  email: string
  password: string
}
export interface NewUserPayload {
  username: string
  email: string
  password: string
}
export interface UpdateUserPayload {
  email?: string
  password?: string
  username?: string
  bio?: string | null
  image?: string | null
}
export interface NewArticlePayload {
  title: string
  description: string
  body: string
  tagList?: string[]
}
export type UpdateArticlePayload = Partial<NewArticlePayload>
export interface NewCommentPayload {
  body: string
}

export interface UserResponse {
  user: User
}
export interface ProfileResponse {
  profile: Profile
}
export interface ArticleResponse {
  article: Article
}
export interface CommentResponse {
  comment: Comment
}
export interface CommentsResponse {
  comments: Comment[]
}
export interface TagsResponse {
  tags: string[]
}
