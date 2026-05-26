export async function sendEmailViaMXRoute({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const payload = {
    server: process.env.MXROUTE_SERVER!,
    username: process.env.MXROUTE_USERNAME!,
    password: process.env.MXROUTE_PASSWORD!,
    from: process.env.MXROUTE_FROM!,
    to,
    subject,
    body,
  }

  console.log('Sending email with payload:', { ...payload, password: '***' })

  const res = await fetch('https://smtpapi.mxroute.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({ message: res.statusText }))
  console.log('MXRoute response:', data)

  if (!res.ok || data.success !== true) {
    throw new Error(data.message || data.error || 'Failed to send email')
  }

  return data
}
