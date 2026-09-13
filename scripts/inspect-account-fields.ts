// scripts/inspect-account-fields.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const k = t.slice(0, eq).trim()
      let v = t.slice(eq + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      if (!process.env[k]) process.env[k] = v
    }
  } catch (err: any) {
    console.error('⚠️  Could not read .env.local:', err.message)
    process.exit(1)
  }
}
loadEnvLocal()

async function main() {
  const url = process.env.DATABASE_URL!
  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || 'isame-llc'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db(dbName)

  const accounts = await db.collection('accounts').find({}).limit(20).toArray()

  console.log('\n=== FIRST 20 ACCOUNTS — ALL RELEVANT FIELDS ===\n')
  console.log(
    'accountNumber'.padEnd(16),
    'origBal'.padStart(10),
    'initialAcct'.padStart(12),
    'fee20%'.padStart(10),
    'summons'.padStart(10),
    'courtChg'.padStart(10),
    'totalColl'.padStart(12),
    'payReceived'.padStart(12),
    'curBal'.padStart(12),
    'status'.padStart(10),
  )

  for (const a of accounts) {
    console.log(
      (a.accountNumber || '').padEnd(16),
      String(a.originalBalance ?? '-').padStart(10),
      String(a.initialAccount ?? '-').padStart(12),
      String(a.fee20Percent ?? '-').padStart(10),
      String(a.summonsAmount ?? '-').padStart(10),
      String(a.courtCharge ?? '-').padStart(10),
      String(a.totalCollectable ?? '-').padStart(12),
      String(a.paymentsReceived ?? '-').padStart(12),
      String(a.currentBalance ?? '-').padStart(12),
      String(a.status ?? '-').padStart(10),
    )
  }

  // Count how many accounts have each field populated
  console.log('\n=== FIELD COVERAGE (out of 315 accounts) ===')
  const all = await db.collection('accounts').find({}).toArray()
  const fields = [
    'originalBalance',
    'initialAccount',
    'fee20Percent',
    'summonsAmount',
    'courtCharge',
    'totalCollectable',
    'paymentsReceived',
    'currentBalance',
  ]
  for (const f of fields) {
    const populated = all.filter((a) => a[f] !== null && a[f] !== undefined).length
    console.log(`  ${f.padEnd(20)} ${populated}/${all.length}`)
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
