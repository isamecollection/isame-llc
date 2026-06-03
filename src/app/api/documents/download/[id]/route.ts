import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  try {
    const doc = await payload.findByID({
      collection: 'account-documents',
      id,
      depth: 1,
    })

    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const media = (doc as any).document
    if (!media?.url) {
      return NextResponse.json({ error: 'No file' }, { status: 404 })
    }

    // Use Cloudinary metadata directly - single source of truth
    const fileUrl = cloudinary.url(media.cloudinaryPublicId, {
      secure: true,
      resource_type: media.cloudinaryResourceType || 'raw',
      type: 'upload',
      sign_url: false,
    })

    console.log('FETCHING', fileUrl)

    const fileResponse = await fetch(fileUrl)

    if (!fileResponse.ok) {
      const body = await fileResponse.text()
      console.error('Cloudinary error:', { status: fileResponse.status, body, fileUrl })
      return NextResponse.json({ status: fileResponse.status, body }, { status: 500 })
    }

    const blob = await fileResponse.arrayBuffer()

    return new NextResponse(blob, {
      headers: {
        'Content-Type': media.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${media.filename || 'download'}"`,
        'Content-Length': blob.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
