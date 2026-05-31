import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { accountId, courtAgentId } = await request.json()

  if (!accountId || !courtAgentId) {
    return NextResponse.json({ error: 'Missing accountId or courtAgentId' }, { status: 400 })
  }

  const payload = await getPayload()

  try {
    const account = await payload.findByID({
      collection: 'accounts',
      id: accountId,
    })

    // Update the account with court agent assignment
    await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        assignedCourtAgent: courtAgentId,
        legalStatus: 'assigned',
      },
    })

    // Create or update legal case
    const existingCases = await payload.find({
      collection: 'legal-cases',
      where: { account: { equals: accountId } },
    })

    if (existingCases.totalDocs > 0) {
      await payload.update({
        collection: 'legal-cases',
        id: existingCases.docs[0].id,
        data: {
          assignedTo: courtAgentId, // Use assignedTo instead of assignedAgent
          status: 'filed', // Valid status from legal-cases options
        },
      })
    } else {
      await payload.create({
        collection: 'legal-cases',
        data: {
          account: accountId,
          status: 'filed', // Valid status
          assignedTo: courtAgentId,
          caseNumber: account.suitNo || account.courtReceiptNo || undefined,
          court: account.lodge || undefined,
          reason: `Assigned by Claims Officer. Suit No: ${account.suitNo || 'N/A'}, Court Receipt: ${account.courtReceiptNo || 'N/A'}`,
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Account assigned successfully' })
  } catch (error: any) {
    console.error('Assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
