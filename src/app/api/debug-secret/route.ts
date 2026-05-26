import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    cronSecret: process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV,
  })
}
