import nodemailer from 'nodemailer'

export async function sendFormEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.MXROUTE_SERVER!,
    port: 465,
    secure: true,
    auth: {
      user: process.env.FORM_EMAIL_USERNAME!,
      pass: process.env.FORM_EMAIL_PASSWORD!,
    },
  })

  return transporter.sendMail({
    from: process.env.FORM_EMAIL_USERNAME!, // info@isame.co
    to,
    subject,
    html,
  })
}
