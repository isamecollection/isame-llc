import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const payload = await getPayload()
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const accountId = formData.get('accountId') as string

    if (!file || !accountId) {
      return NextResponse.json({ error: 'Missing file or accountId' }, { status: 400 })
    }

    // Upload to media collection
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Service proof for account ${accountId} - ${new Date().toLocaleDateString()}`,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    // Update account
    await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        serviceProof: media.id,
        serviceDate: new Date().toISOString(),
        serviceStatus: 'served',
      },
    })

    // Update legal case if exists
    const cases = await payload.find({
      collection: 'legal-cases',
      where: { account: { equals: accountId } },
    })

    if (cases.totalDocs > 0) {
      await payload.update({
        collection: 'legal-cases',
        id: cases.docs[0].id,
        data: {
          status: 'served',
        },
      })
    }

    return NextResponse.json({ success: true, mediaId: media.id })
  } catch (error: any) {
    console.error('Service proof upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
