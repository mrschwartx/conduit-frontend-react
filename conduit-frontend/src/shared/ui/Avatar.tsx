import { useState } from 'react'
import { isHttpsUrl } from '@/shared/utils/url'

export const DEFAULT_AVATAR = '/img/avatar.svg'

interface AvatarProps {
  image: string | null | undefined
  size?: 'small' | 'medium' | 'large'
}

export function Avatar({ image, size = 'medium' }: AvatarProps) {
  // Remember which URL failed so a later, different URL gets a fresh chance.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const source = isHttpsUrl(image) && image !== failedUrl ? image : DEFAULT_AVATAR
  return (
    <img
      className={`avatar avatar-${size}`}
      src={source}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(image ?? null)}
    />
  )
}
