import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()
  const body = await request.json()
  const updated = await payload.update({
    collection: 'accounts',
    id,
    data: body,
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !user.roles?.some((r) => ['admin', 'crm-manager'].includes(r))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await payload.delete({ collection: 'accounts', id })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
