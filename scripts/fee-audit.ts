// scripts/fee-audit.ts
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
  } catch {}
}
loadEnvLocal()

const round2 = (n: number) => Math.round(n * 100) / 100

async function main() {
  const url = process.env.DATABASE_URL!
  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || 'isame-llc'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db(dbName)

  const accounts = await db.collection('accounts').find({}).toArray()
  console.log(`\nAuditing ${accounts.length} accounts...\n`)

  let feeMatches = 0
  let feeWrong = 0
  let feeMissing = 0
  let feeOverrideUsed = 0
  const wrongFeeSamples: any[] = []

  for (const a of accounts) {
    const initial = a.initialAccount ?? a.originalBalance ?? 0
    const overridePercent = a.feeOverrides?.customCollectionFeePercent
    const percent = overridePercent != null ? overridePercent / 100 : 0.2
    if (overridePercent != null) feeOverrideUsed++

    const expectedFee = round2(initial * percent)
    const storedFee = round2(a.fee20Percent ?? 0)

    if (a.fee20Percent == null) {
      feeMissing++
    } else if (Math.abs(expectedFee - storedFee) < 0.01) {
      feeMatches++
    } else {
      feeWrong++
      if (wrongFeeSamples.length < 20) {
        wrongFeeSamples.push({
          accountNumber: a.accountNumber,
          initial,
          stored: storedFee,
          expected: expectedFee,
          delta: round2(storedFee - expectedFee),
          status: a.status,
          overridePercent,
        })
      }
    }
  }

  console.log('=== FEE AUDIT (20% of initialAccount, or fee override) ===')
  console.log(`  ✅ Fee matches expected:        ${feeMatches}`)
  console.log(`  ❌ Fee WRONG:                   ${feeWrong}`)
  console.log(`  ⚠️  Fee missing (null/undefined): ${feeMissing}`)
  console.log(`  ℹ️  Accounts with fee override:  ${feeOverrideUsed}`)
  console.log()

  if (wrongFeeSamples.length) {
    console.log('=== SAMPLE WRONG FEES (first 20) ===')
    console.log(
      'account#'.padEnd(20),
      'initial'.padStart(10),
      'stored'.padStart(10),
      'expected'.padStart(10),
      'delta'.padStart(10),
      'override%'.padStart(10),
      'status'.padStart(10),
    )
    for (const s of wrongFeeSamples) {
      console.log(
        (s.accountNumber || '').padEnd(20),
        String(s.initial).padStart(10),
        String(s.stored).padStart(10),
        String(s.expected).padStart(10),
        String(s.delta).padStart(10),
        String(s.overridePercent ?? '-').padStart(10),
        String(s.status || '').padStart(10),
      )
    }
  } else {
    console.log('✅ No wrong fees detected.')
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
