import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { updateAccountPrefixes, oldPrefix, ...clientData } = body

  const payload = await getPayload()

  try {
    // Update the client
    const client = await payload.update({
      collection: 'clients',
      id,
      data: clientData,
    })

    let accountsUpdated = 0

    // If prefix changed and user wants to update accounts
    if (updateAccountPrefixes && oldPrefix && clientData.prefix) {
      const newPrefix = clientData.prefix.toUpperCase()

      // Find all accounts for this client
      const accounts = await payload.find({
        collection: 'accounts',
        where: { client: { equals: id } },
        limit: 9999,
      })

      // Update each account number
      for (const account of accounts.docs) {
        const oldAccountNumber = account.accountNumber || ''
        const newAccountNumber = oldAccountNumber.replace(new RegExp(`^${oldPrefix}`), newPrefix)

        if (newAccountNumber !== oldAccountNumber) {
          await payload.update({
            collection: 'accounts',
            id: account.id,
            data: {
              accountNumber: newAccountNumber,
            },
          })
          accountsUpdated++
        }
      }
    }

    return NextResponse.json({ ...client, accountsUpdated })
  } catch (error: any) {
    console.error('Client update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
