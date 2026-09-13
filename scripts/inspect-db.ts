// scripts/inspect-db.ts
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  // ─── Parse env directly first, before anything else ───
  const url = process.env.DATABASE_URL || process.env.MONGODB_URI || ''
  console.log('\n>>> RAW DATABASE_URL CHECK <<<')
  console.log('DATABASE_URL exists:', Boolean(process.env.DATABASE_URL))
  console.log('MONGODB_URI exists:  ', Boolean(process.env.MONGODB_URI))

  if (url) {
    const hostMatch = url.match(/@([^/]+)\//)
    const dbMatch = url.match(/\/([^/?]+)\?/) || url.match(/\/([^/?]+)$/)
    console.log('Host:     ', hostMatch?.[1] ?? 'unknown')
    console.log('Database: ', dbMatch?.[1] ?? 'unknown')
  } else {
    console.log('⚠️  No DATABASE_URL or MONGODB_URI found in env')
  }

  console.log('\n>>> CONNECTING TO PAYLOAD <<<')
  let payload
  try {
    payload = await getPayload({ config })
    console.log('✅ Payload connected')
  } catch (err: any) {
    console.error('❌ getPayload failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }

  // ─── Counts ───
  console.log('\n>>> COUNTS <<<')
  for (const col of ['accounts', 'clients', 'payments', 'users'] as const) {
    try {
      const res = await payload.find({
        collection: col as any,
        limit: 1,
        pagination: true,
      })
      console.log(`  ${col.padEnd(12)} ${res.totalDocs}`)
    } catch (err: any) {
      console.log(`  ${col.padEnd(12)} ERROR: ${err.message}`)
    }
  }

  // ─── Sample accounts ───
  console.log('\n>>> SAMPLE ACCOUNTS (first 10) <<<')
  try {
    const accounts = await payload.find({
      collection: 'accounts' as any,
      limit: 10,
      depth: 0,
    })
    if (accounts.docs.length === 0) {
      console.log('  (no accounts found)')
    }
    accounts.docs.forEach((a: any) => {
      console.log(
        `  ${a.accountNumber ?? a.id}  ${a.debtorName ?? ''}  bal: $${a.currentBalance ?? 0}  orig: $${a.originalBalance ?? 0}`,
      )
    })
  } catch (err: any) {
    console.log(`  ERROR: ${err.message}`)
  }

  // ─── Sample clients ───
  console.log('\n>>> SAMPLE CLIENTS (first 10) <<<')
  try {
    const clients = await payload.find({
      collection: 'clients' as any,
      limit: 10,
      depth: 0,
    })
    if (clients.docs.length === 0) {
      console.log('  (no clients found)')
    }
    clients.docs.forEach((c: any) => {
      const name = c.name ?? c.companyName ?? c.clientName ?? '(no name)'
      console.log(`  ${c.id}  ${name}`)
    })
  } catch (err: any) {
    console.log(`  ERROR: ${err.message}`)
  }

  console.log('\n>>> DONE <<<')
  process.exit(0)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
