import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import { sendEmailViaMXRoute } from '@/lib/email'

export async function POST(request: Request) {
  const { name, email, phone, message } = await request.json()
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
  }

  const payload = await getPayload()

  // 1. Save to database
  try {
    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, phone: phone || undefined, message },
    })
  } catch (err) {
    console.error('Failed to save contact submission', err)
    // Continue – still try to send the email
  }

  // 2. Send email notification to you
  try {
    await sendEmailViaMXRoute({
      to: 'info@isame.co', // where you want to receive leads
      subject: `New Website Lead: ${name}`,
      body: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Submitted from isame.co contact form</small></p>
      `,
    })
  } catch (err) {
    console.error('Failed to send email notification', err)
    return NextResponse.json(
      { success: false, message: 'Your message was saved, but we could not send a notification.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, message: 'Thank you! Your message has been sent.' })
}
