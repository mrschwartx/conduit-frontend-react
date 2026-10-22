// Every type is derived from the generated schema (npm run gen:api).
// Nothing here is a hand-written API shape.
import type { components, operations } from './schema'

type JsonBody<T> = T extends { content: { 'application/json': infer B } } ? B : never
type Res<Op extends keyof operations, S extends number> = operations[Op]['responses'] extends infer R
  ? S extends keyof R
    ? JsonBody<R[S]>
    : never
  : never
type Req<Op extends keyof operations> = operations[Op]['requestBody'] extends infer B
  ? JsonBody<B>
  : never

export type User = components['schemas']['User']
export type Profile = components['schemas']['Profile']
export type Article = components['schemas']['Article']
export type Comment = components['schemas']['Comment']

export type ArticlesPage = Res<'GetArticles', 200>
/** List endpoints omit `body`; a full Article is structurally a superset. */
export type ArticleListItem = ArticlesPage['articles'][number]

export type LoginPayload = Req<'Login'>['user']
export type NewUserPayload = Req<'CreateUser'>['user']
export type UpdateUserPayload = Req<'UpdateCurrentUser'>['user']
export type NewArticlePayload = Req<'CreateArticle'>['article']
export type UpdateArticlePayload = Req<'UpdateArticle'>['article']
export type NewCommentPayload = Req<'CreateArticleComment'>['comment']

export type UserResponse = Res<'GetCurrentUser', 200>
export type ProfileResponse = Res<'GetProfileByUsername', 200>
export type ArticleResponse = Res<'GetArticle', 200>
export type CommentResponse = Res<'CreateArticleComment', 201>
export type CommentsResponse = Res<'GetArticleComments', 200>
export type TagsResponse = Res<'GetTags', 200>
