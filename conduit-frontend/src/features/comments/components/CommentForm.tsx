import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { User } from '@/api/types'
import { useServerErrors } from '@/shared/hooks/useServerErrors'
import { Avatar } from '@/shared/ui/Avatar'
import { FormErrors } from '@/shared/ui/FieldError'
import { TextField } from '@/shared/ui/TextField'
import { commentSchema, type CommentValues } from '@/shared/validation/schemas'
import { useAddComment } from '../hooks/useComments'

const FIELDS = ['body'] as const

export function CommentForm({ slug, user }: { slug: string; user: User }) {
  const add = useAddComment(slug)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CommentValues>({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } })
  const { formErrors, handle, clear } = useServerErrors(setError, FIELDS)

  const onSubmit = handleSubmit(({ body }) => {
    clear()
    add.mutate(body, { onSuccess: () => reset({ body: '' }), onError: handle })
  })

  return (
    <form className="comment-form" onSubmit={onSubmit} noValidate>
      <FormErrors messages={formErrors} />
      <TextField
        id="comment"
        label="Write a comment"
        placeholder="Write a comment..."
        multiline
        rows={3}
        error={errors.body?.message}
        {...register('body')}
      />
      <div className="comment-form-footer">
        <Avatar image={user.image} size="small" />
        <button type="submit" className="btn btn-primary btn-small" disabled={add.isPending}>
          Post Comment
        </button>
      </div>
    </form>
  )
}
