import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useServerErrors } from '@/shared/hooks/useServerErrors'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { FormErrors } from '@/shared/ui/FieldError'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { TextField } from '@/shared/ui/TextField'
import { articleSchema, type ArticleValues } from '@/shared/validation/schemas'
import { buildArticlePatch, buildNewArticle } from '../article-payload'
import { TagInput } from '../components/TagInput'
import { useCreateArticle, useUpdateArticle } from '../hooks/useArticleMutations'
import { useArticle } from '../hooks/useArticles'
import { addTags } from '../tags'

const FIELDS = ['title', 'description', 'body', 'tagList'] as const
const EMPTY: ArticleValues = { title: '', description: '', body: '', tagList: [] }

interface ArticleFormProps {
  initial: ArticleValues

  slug?: string
}

function ArticleForm({ initial, slug }: ArticleFormProps) {
  const navigate = useNavigate()
  const create = useCreateArticle()
  const update = useUpdateArticle()
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<ArticleValues>({ resolver: zodResolver(articleSchema), defaultValues: initial })
  const { formErrors, handle, clear } = useServerErrors(setError, FIELDS)
  const [draft, setDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const tags = useWatch({ control, name: 'tagList' })

  const setTags = (next: string[]) => setValue('tagList', next, { shouldDirty: true })

  const commit = (raw: string): boolean => {
    const result = addTags(getValues('tagList'), raw)
    if (result.error) {
      setTagError(result.error)
      return false
    }
    setTagError(null)
    setTags(result.tags)
    return true
  }

  const onDraftChange = (value: string) => {
    if (!value.includes(',')) {
      setTagError(null)
      setDraft(value)
      return
    }
    const cut = value.lastIndexOf(',')
    setDraft(commit(value.slice(0, cut)) ? value.slice(cut + 1) : value.replace(/,/g, ''))
  }

  const save = handleSubmit((values) => {
    clear()
    const done = (saved: { slug: string }) =>
      void navigate(`/article/${encodeURIComponent(saved.slug)}`)
    if (slug === undefined) {
      create.mutate(buildNewArticle(values), { onSuccess: done, onError: handle })
      return
    }
    const patch = buildArticlePatch(initial, values)
    if (Object.keys(patch).length === 0) {
      done({ slug })
      return
    }
    update.mutate({ slug, patch }, { onSuccess: done, onError: handle })
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (draft.trim() !== '') {
      if (!commit(draft)) {
        event.preventDefault()
        return
      }
      setDraft('')
    }
    return save(event)
  }

  return (
    <div className="container page editor-page">
      <form onSubmit={onSubmit} noValidate>
        <FormErrors messages={formErrors} />
        <TextField
          id="title"
          label="Article title"
          error={errors.title?.message}
          {...register('title')}
        />
        <TextField
          id="description"
          label="What's this article about?"
          error={errors.description?.message}
          {...register('description')}
        />
        <TextField
          id="body"
          label="Write your article"
          multiline
          rows={10}
          error={errors.body?.message}
          {...register('body')}
        />
        <TagInput
          id="tags"
          label="Enter tags"
          tags={tags}
          draft={draft}
          error={tagError ?? (errors.tagList?.message || errors.tagList?.root?.message)}
          onDraftChange={onDraftChange}
          onCommit={() => {
            if (commit(draft)) setDraft('')
          }}
          onRemove={(tag) => setTags(getValues('tagList').filter((item) => item !== tag))}
        />
        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={create.isPending || update.isPending}
        >
          Publish Article
        </button>
      </form>
    </div>
  )
}

function EditArticle({ slug }: { slug: string }) {
  const { user } = useAuth()
  const query = useArticle(slug)
  return (
    <QueryBoundary query={query} notFound="Article not found.">
      {(article) =>
        user?.username === article.author.username ? (
          <ArticleForm
            key={article.slug}
            slug={article.slug}
            initial={{
              title: article.title,
              description: article.description,
              body: article.body,
              tagList: article.tagList,
            }}
          />
        ) : (
          <p className="status">You can only edit your own articles.</p>
        )
      }
    </QueryBoundary>
  )
}

export function EditorPage() {
  const { slug } = useParams()
  useDocumentTitle(slug ? 'Edit article' : 'New article')
  return slug ? <EditArticle slug={slug} /> : <ArticleForm initial={EMPTY} />
}
