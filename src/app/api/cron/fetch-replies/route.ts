import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import * as imapSimple from 'imap-simple'
import { simpleParser } from 'mailparser'

export async function GET(request: Request) {
  // Authorization check – use the exact secret from .env.local
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (token !== secret) {
      console.log('Auth failed – expected:', secret, 'received:', token)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = await getPayload()
  let lastFetch = new Date(0)
  try {
    const state = await payload.find({
      collection: 'cron-state',
      where: { key: { equals: 'lastImapFetch' } },
    })
    if (state.docs.length > 0 && state.docs[0].value) {
      lastFetch = new Date(state.docs[0].value)
    }
  } catch (err) {
    console.error('Failed to get last fetch time', err)
  }

  let connection
  try {
    connection = await imapSimple.connect({
      imap: {
        user: process.env.IMAP_USER!,
        password: process.env.IMAP_PASSWORD!,
        host: process.env.IMAP_HOST!,
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: true,
        authTimeout: 10000,
      },
    })
    await connection.openBox('INBOX')
  } catch (err: any) {
    console.error('IMAP connection failed', err)
    return NextResponse.json(
      { error: 'IMAP connection failed', details: err.message },
      { status: 500 },
    )
  }

  const searchCriteria = ['UNSEEN', ['SINCE', lastFetch.toISOString().split('T')[0]]]
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true }
  let messages
  try {
    messages = await connection.search(searchCriteria, fetchOptions)
  } catch (err) {
    console.error('IMAP search failed', err)
    connection.end()
    return NextResponse.json({ error: 'IMAP search failed' }, { status: 500 })
  }

  let processed = 0
  for (const msg of messages) {
    try {
      const headerPart = msg.parts.find((p: any) => p.which === 'HEADER')
      const bodyPart = msg.parts.find((p: any) => p.which === 'TEXT')
      if (!headerPart || !bodyPart) continue

      const header = headerPart.body as Record<string, any>
      const from = header.from?.[0] || 'unknown'
      const subject = header.subject?.[0] || 'No Subject'
      const rawBody = bodyPart.body as string
      const parsed = await simpleParser(rawBody)
      const emailBody = parsed.text || '(no body)'

      const match = subject.match(/\[Account:\s*([^\]]+)\]/)
      const accountNumber = match ? match[1].trim() : null

      if (!accountNumber) {
        console.log('No account tag found in subject:', subject)
        continue
      }

      const accounts = await payload.find({
        collection: 'accounts',
        where: { accountNumber: { equals: accountNumber } },
      })
      if (accounts.docs.length === 0) continue

      await payload.create({
        collection: 'emails',
        data: {
          account: accounts.docs[0].id,
          direction: 'received',
          recipient: from,
          subject,
          body: emailBody,
          status: 'sent',
        },
      })

      await payload.create({
        collection: 'notes',
        data: {
          account: accounts.docs[0].id,
          content: `📬 Email received from ${from} — Subject: "${subject}"`,
        },
      })

      processed++
    } catch (err) {
      console.error('Error processing message', err)
    }
  }

  connection.end()

  const now = new Date().toISOString()
  try {
    const stateDoc = await payload.find({
      collection: 'cron-state',
      where: { key: { equals: 'lastImapFetch' } },
    })
    if (stateDoc.docs.length > 0) {
      await payload.update({
        collection: 'cron-state',
        id: stateDoc.docs[0].id,
        data: { value: now },
      })
    } else {
      await payload.create({
        collection: 'cron-state',
        data: { key: 'lastImapFetch', value: now },
      })
    }
  } catch (err) {
    console.error('Failed to update last fetch time', err)
  }

  return NextResponse.json({ success: true, processed })
}
