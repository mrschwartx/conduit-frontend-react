import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_API_PORT ?? 8080)
const HOST = process.env.MOCK_API_HOST ?? '127.0.0.1'
const MAX_LIMIT = 50

const users = new Map()
const articles = []
const comments = new Map()
const favorites = new Set()
const follows = new Set()
let commentId = 0

const now = () => new Date().toISOString()
const fail = (status, errors) => ({ status, body: { errors } })
const ok = (body, status = 200) => ({ status, body })

const slugify = (title) =>
  title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'article'

const uniqueSlug = (title, ignore) => {
  const base = slugify(title)
  const taken = new Set(articles.filter((a) => a.slug !== ignore).map((a) => a.slug))
  taken.add('feed')
  let slug = base
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`
  return slug
}

const tokenFor = (user) => `mock.${user.username}.${Date.now()}`
const publicUser = (user) => ({
  email: user.email,
  token: tokenFor(user),
  username: user.username,
  bio: user.bio,
  image: user.image,
})
const profileOf = (user, viewer) => ({
  username: user.username,
  bio: user.bio,
  image: user.image,
  following: Boolean(viewer) && follows.has(`${viewer.username}>${user.username}`),
})

const articleView = (article, viewer, withBody = true) => {
  const author = users.get(article.author)
  const view = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: Boolean(viewer) && favorites.has(`${viewer.username}:${article.slug}`),
    favoritesCount: [...favorites].filter((key) => key.endsWith(`:${article.slug}`)).length,
    author: profileOf(author, viewer),
  }
  return withBody ? { ...view, body: article.body } : view
}

const viewerOf = (headers) => {
  const header = headers.authorization
  if (!header) return { viewer: null }
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Token' || !token) return { error: fail(401, { token: ['is invalid'] }) }
  const user = users.get(token.split('.')[1])
  if (!user) return { error: fail(401, { token: ['is invalid'] }) }
  return { viewer: user }
}

const required = (value, max) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return "can't be blank"
  if (text.length > max) return `is too long (maximum is ${max} characters)`
  return null
}

const collect = (checks) => {
  const errors = {}
  for (const [field, message] of checks) if (message) errors[field] = [message]
  return Object.keys(errors).length ? fail(422, errors) : null
}

const normaliseTags = (tags) => [
  ...new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag).trim()).filter(Boolean)),
]

const page = (items, query, viewer) => {
  const offset = Math.max(0, Number.parseInt(query.get('offset') ?? '0', 10) || 0)
  const requested = Number.parseInt(query.get('limit') ?? '20', 10) || 20
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested))
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return ok({
    articles: sorted.slice(offset, offset + limit).map((a) => articleView(a, viewer, false)),
    articlesCount: sorted.length,
  })
}

const route = (method, path, query, body, viewer) => {
  const need = () => (viewer ? null : fail(401, { token: ['is missing'] }))
  let match

  if (method === 'POST' && path === '/users') {
    const input = body?.user ?? {}
    const invalid = collect([
      ['username', required(input.username, 30)],
      ['email', required(input.email, 255)],
      [
        'password',
        typeof input.password === 'string' && input.password.length >= 8
          ? null
          : 'is too short (minimum is 8 characters)',
      ],
    ])
    if (invalid) return invalid
    const username = input.username.trim()
    const email = input.email.trim().toLowerCase()
    if ([...users.values()].some((u) => u.username.toLowerCase() === username.toLowerCase()))
      return fail(409, { username: ['has already been taken'] })
    if ([...users.values()].some((u) => u.email === email))
      return fail(409, { email: ['has already been taken'] })
    const user = { username, email, password: input.password, bio: null, image: null }
    users.set(username, user)
    return ok({ user: publicUser(user) }, 201)
  }

  if (method === 'POST' && path === '/users/login') {
    const input = body?.user ?? {}
    const user = [...users.values()].find((u) => u.email === String(input.email).toLowerCase())
    if (!user || user.password !== input.password)
      return fail(401, { credentials: ['are invalid'] })
    return ok({ user: publicUser(user) })
  }

  if (method === 'GET' && path === '/user') return need() ?? ok({ user: publicUser(viewer) })

  if (method === 'PUT' && path === '/user') {
    const denied = need()
    if (denied) return denied
    const input = body?.user ?? {}
    if (Object.keys(input).length === 0) return fail(422, { user: ["can't be empty"] })
    for (const field of ['email', 'username', 'bio', 'image', 'password']) {
      if (field in input) viewer[field] = input[field] === '' ? null : input[field]
    }
    return ok({ user: publicUser(viewer) })
  }

  if ((match = path.match(/^\/profiles\/([^/]+)(\/follow)?$/))) {
    const user = users.get(decodeURIComponent(match[1]))
    if (!user) return fail(404, { profile: ['not found'] })
    if (!match[2]) return method === 'GET' ? ok({ profile: profileOf(user, viewer) }) : null
    const denied = need()
    if (denied) return denied
    const key = `${viewer.username}>${user.username}`
    if (method === 'POST') follows.add(key)
    if (method === 'DELETE') follows.delete(key)
    return ok({ profile: profileOf(user, viewer) })
  }

  if (method === 'GET' && path === '/tags')
    return ok({ tags: [...new Set(articles.flatMap((a) => a.tagList))] })

  if (method === 'GET' && path === '/articles/feed') {
    const denied = need()
    if (denied) return denied
    const followed = articles.filter((a) => follows.has(`${viewer.username}>${a.author}`))
    return page(followed, query, viewer)
  }

  if (method === 'GET' && path === '/articles') {
    const tag = query.get('tag')
    const author = query.get('author')
    const favorited = query.get('favorited')
    const found = articles.filter(
      (a) =>
        (!tag || a.tagList.includes(tag)) &&
        (!author || a.author === author) &&
        (!favorited || favorites.has(`${favorited}:${a.slug}`)),
    )
    return page(found, query, viewer)
  }

  if (method === 'POST' && path === '/articles') {
    const denied = need()
    if (denied) return denied
    const input = body?.article ?? {}
    const invalid = collect([
      ['title', required(input.title, 100)],
      ['description', required(input.description, 200)],
      ['body', required(input.body, 20000)],
    ])
    if (invalid) return invalid
    const stamp = now()
    const article = {
      slug: uniqueSlug(input.title),
      title: input.title.trim(),
      description: input.description.trim(),
      body: input.body.trim(),
      tagList: normaliseTags(input.tagList),
      createdAt: stamp,
      updatedAt: stamp,
      author: viewer.username,
    }
    articles.push(article)
    return ok({ article: articleView(article, viewer) }, 201)
  }

  if ((match = path.match(/^\/articles\/([^/]+)(\/favorite|\/comments(?:\/(\d+))?)?$/))) {
    const slug = decodeURIComponent(match[1])
    const article = articles.find((a) => a.slug === slug)
    const sub = match[2]

    if (!sub) {
      if (method === 'GET')
        return article
          ? ok({ article: articleView(article, viewer) })
          : fail(404, { article: ['not found'] })
      const denied = need()
      if (denied) return denied
      if (!article) return fail(404, { article: ['not found'] })
      if (article.author !== viewer.username) return fail(403, { article: ['forbidden'] })
      if (method === 'DELETE') {
        articles.splice(articles.indexOf(article), 1)
        comments.delete(slug)
        return { status: 204, body: null }
      }
      if (method === 'PUT') {
        const input = body?.article ?? {}
        for (const field of ['description', 'body'])
          if (field in input) article[field] = input[field]
        if ('tagList' in input) article.tagList = normaliseTags(input.tagList)
        if ('title' in input) {
          article.title = input.title
          article.slug = uniqueSlug(input.title, article.slug)
        }
        article.updatedAt = now()
        return ok({ article: articleView(article, viewer) })
      }
      return null
    }

    if (sub === '/favorite') {
      const denied = need()
      if (denied) return denied
      if (!article) return fail(404, { article: ['not found'] })
      const key = `${viewer.username}:${slug}`
      if (method === 'POST') favorites.add(key)
      if (method === 'DELETE') favorites.delete(key)
      return ok({ article: articleView(article, viewer) })
    }

    if (!article) return fail(404, { article: ['not found'] })
    const list = comments.get(slug) ?? []
    if (!match[3]) {
      if (method === 'GET') return ok({ comments: list.map((c) => commentView(c, viewer)) })
      if (method === 'POST') {
        const denied = need()
        if (denied) return denied
        const invalid = collect([['body', required(body?.comment?.body, 1000)]])
        if (invalid) return invalid
        const stamp = now()
        const comment = {
          id: ++commentId,
          createdAt: stamp,
          updatedAt: stamp,
          body: body.comment.body.trim(),
          author: viewer.username,
        }
        comments.set(slug, [...list, comment])
        return ok({ comment: commentView(comment, viewer) }, 201)
      }
      return null
    }
    if (method === 'DELETE') {
      const denied = need()
      if (denied) return denied
      const comment = list.find((c) => c.id === Number(match[3]))
      if (!comment) return fail(404, { comment: ['not found'] })
      if (comment.author !== viewer.username) return fail(403, { comment: ['forbidden'] })
      comments.set(
        slug,
        list.filter((c) => c !== comment),
      )
      return { status: 204, body: null }
    }
  }

  return null
}

const commentView = (comment, viewer) => ({
  id: comment.id,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  body: comment.body,
  author: profileOf(users.get(comment.author), viewer),
})

const readBody = (request) =>
  new Promise((resolve) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })

const send = (response, status, body, type = 'application/json') => {
  response.writeHead(status, body === null ? {} : { 'Content-Type': type })
  response.end(
    body === null ? undefined : type === 'application/json' ? JSON.stringify(body) : body,
  )
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (url.pathname === '/health') return send(response, 200, 'OK', 'text/plain')
  if (!url.pathname.startsWith('/api/v1'))
    return send(response, 404, { errors: { path: ['not found'] } })

  const path = url.pathname.slice('/api/v1'.length) || '/'
  const raw = await readBody(request)
  let body
  if (raw) {
    if (!String(request.headers['content-type'] ?? '').startsWith('application/json'))
      return send(response, 415, { errors: { 'content-type': ['must be application/json'] } })
    try {
      body = JSON.parse(raw)
    } catch {
      return send(response, 400, { errors: { body: ['is not valid JSON'] } })
    }
  }

  const { viewer, error } = viewerOf(request.headers)
  if (error) return send(response, error.status, error.body)

  try {
    const result = route(request.method ?? 'GET', path, url.searchParams, body, viewer)
    if (!result) return send(response, 404, { errors: { path: ['not found'] } })
    return send(response, result.status, result.body)
  } catch {
    return send(response, 500, { errors: { server: ['internal server error'] } })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Mock Conduit API listening on http://${HOST}:${PORT}`)
})
