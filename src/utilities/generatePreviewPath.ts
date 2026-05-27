import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/posts',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  if (slug === undefined || slug === null) {
    return null
  }

  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret) {
    throw new Error('PREVIEW_SECRET environment variable is missing')
  }

  const encodedSlug = encodeURIComponent(slug)

  // Fix homepage path: avoid /home and use /
  const path =
    collection === 'pages' && slug === 'home'
      ? '/'
      : `${collectionPrefixMap[collection]}/${encodedSlug}`

  const encodedParams = new URLSearchParams({
    slug: encodedSlug,
    collection,
    path,
    previewSecret,
  })

  return `/next/preview?${encodedParams.toString()}`
}
