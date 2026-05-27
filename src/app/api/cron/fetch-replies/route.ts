import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import * as imapSimple from 'imap-simple'
import { simpleParser } from 'mailparser'

export async function GET(request: Request) {
  // ---------- AUTH ----------
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = await getPayload()

  // ---------- LAST FETCH TIME ----------
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

  // ---------- IMAP CONNECTION ----------
  let connection: imapSimple.ImapSimple
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

  // ---------- FETCH UNSEEN FULL MESSAGES ----------
  const searchCriteria = ['UNSEEN', ['SINCE', lastFetch.toISOString().split('T')[0]]]
  const fetchOptions = { bodies: [''], struct: true }

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
      const rawPart = msg.parts?.[0]
      if (!rawPart) continue
      const rawEmail = rawPart.body as string
      if (!rawEmail) continue

      const parsed = await simpleParser(rawEmail)
      console.log('Subject:', parsed.subject, '| Attachments:', parsed.attachments?.length || 0)

      const from = parsed.from?.text || 'unknown'
      const subject = parsed.subject || 'No Subject'
      const emailBody = parsed.text || '(no body)'

      // Extract account number
      const match = subject.match(/\[Account:\s*([^\]]+)\]/)
      const accountNumber = match ? match[1].trim() : null
      if (!accountNumber) {
        // Still mark as seen so we don't loop on untagged emails
        await connection.addFlags(msg.attributes.uid, '\\Seen')
        continue
      }

      const accounts = await payload.find({
        collection: 'accounts',
        where: { accountNumber: { equals: accountNumber } },
      })
      if (accounts.docs.length === 0) {
        await connection.addFlags(msg.attributes.uid, '\\Seen')
        continue
      }
      const accountId = accounts.docs[0].id

      // Save email record
      await payload.create({
        collection: 'emails',
        data: {
          account: accountId,
          direction: 'received',
          recipient: from,
          subject,
          body: emailBody,
          status: 'sent',
        },
        overrideAccess: true,
      })

      // Add note
      await payload.create({
        collection: 'notes',
        data: {
          account: accountId,
          content: `📬 Email received from ${from} — Subject: "${subject}"`,
        },
        overrideAccess: true,
      })

      // ---------- PROCESS ATTACHMENTS ----------
      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const att of parsed.attachments) {
          try {
            const mediaDoc = await payload.create({
              collection: 'media',
              data: { alt: att.filename || 'Attachment' },
              file: {
                data: att.content,
                mimetype: att.contentType,
                name: att.filename || 'attachment',
                size: att.size,
              },
              overrideAccess: true,
            })

            await payload.create({
              collection: 'account-documents',
              data: {
                account: accountId,
                document: mediaDoc.id,
                description: `Attachment from ${from} – ${att.filename}`,
              },
              overrideAccess: true,
            })

            await payload.create({
              collection: 'notes',
              data: {
                account: accountId,
                content: `📎 Attachment received from ${from} – ${att.filename}`,
              },
              overrideAccess: true,
            })

            console.log('Attachment saved:', att.filename)
          } catch (uploadErr) {
            console.error('Failed to process attachment', att.filename, uploadErr)
          }
        }
      }

      // ✅ Mark the email as read so we never fetch it again
      await connection.addFlags(msg.attributes.uid, '\\Seen')
      processed++
    } catch (err) {
      console.error('Error processing message', err)
    }
  }

  connection.end()

  // ---------- UPDATE LAST FETCH TIME ----------
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
