import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload()
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const accountId = formData.get('accountId') as string

    console.log('Service proof upload:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      accountId,
    })

    if (!file || !accountId) {
      return NextResponse.json({ error: 'Missing file or accountId' }, { status: 400 })
    }

    // Limit file size to 5MB for serverless compatibility
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`,
        },
        { status: 400 },
      )
    }

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Service proof for account ${accountId}`,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        serviceProof: media.id,
        serviceDate: new Date().toISOString(),
        serviceStatus: 'served',
      },
    })

    const cases = await payload.find({
      collection: 'legal-cases',
      where: { account: { equals: accountId } },
    })

    if (cases.totalDocs > 0) {
      await payload.update({
        collection: 'legal-cases',
        id: cases.docs[0].id,
        data: { status: 'served' },
      })
    }

    return NextResponse.json({ success: true, mediaId: media.id })
  } catch (error: any) {
    console.error('Service proof upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
