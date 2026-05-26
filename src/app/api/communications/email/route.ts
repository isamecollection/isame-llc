import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import { sendEmailViaMXRoute } from '@/lib/email'

export async function POST(request: Request) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountId, to, subject, body } = await request.json()
  if (!accountId || !to || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch account to get its number for tagging
  let account
  try {
    account = await payload.findByID({ collection: 'accounts', id: accountId })
  } catch {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const tag = `[Account: ${account.accountNumber}]`
  const taggedSubject = subject.includes(tag) ? subject : `${tag} ${subject}`

  try {
    const result = await sendEmailViaMXRoute({ to, subject: taggedSubject, body })

    // Log success
    await payload.create({
      collection: 'emails',
      data: {
        account: accountId,
        direction: 'sent',
        recipient: to,
        subject: taggedSubject,
        body,
        status: 'sent',
      },
    })

    await payload.create({
      collection: 'notes',
      data: {
        account: accountId,
        content: `📧 Email sent to ${to} — Subject: "${taggedSubject}"`,
      },
    })

    return NextResponse.json(result)
  } catch (error: any) {
    await payload.create({
      collection: 'emails',
      data: {
        account: accountId,
        direction: 'sent',
        recipient: to,
        subject: taggedSubject,
        body,
        status: 'failed',
        errorMessage: error.message,
      },
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
