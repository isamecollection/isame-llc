import { NextResponse } from 'next/server'

export async function GET() {
  const secret = process.env.PAYLOAD_PUBLIC_LIVE_PREVIEW_SECRET
  return NextResponse.json({
    exists: !!secret,
    firstChars: secret ? secret.substring(0, 4) + '...' : 'NOT SET',
  })
}
