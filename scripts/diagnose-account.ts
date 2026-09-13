// scripts/diagnose-account.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

const ACCOUNT_NUMBER = process.argv[2] || 'JBW#0009-FPCB'

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

async function main() {
  const url = process.env.DATABASE_URL!
  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || 'isame-llc'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db(dbName)

  console.log(`\n=== Diagnostic for account: ${ACCOUNT_NUMBER} ===\n`)

  const account = await db.collection('accounts').findOne({ accountNumber: ACCOUNT_NUMBER })
  if (!account) {
    console.log('❌ Account not found')
    process.exit(1)
  }

  console.log('--- ACCOUNT ---')
  console.log('accountNumber:     ', account.accountNumber)
  console.log('originalBalance:   ', account.originalBalance)
  console.log('initialAccount:    ', account.initialAccount)
  console.log('fee20Percent:      ', account.fee20Percent)
  console.log('summonsAmount:     ', account.summonsAmount)
  console.log('courtCharge:       ', account.courtCharge)
  console.log('totalCollectable:  ', account.totalCollectable)
  console.log('paymentsReceived:  ', account.paymentsReceived)
  console.log('currentBalance:    ', account.currentBalance)
  console.log('status:            ', account.status)
  console.log()

  // Math check
  const computedTotal =
    (account.initialAccount ?? 0) +
    (account.fee20Percent ?? 0) +
    (account.summonsAmount ?? 0) +
    (account.courtCharge ?? 0)
  console.log('--- MATH CHECK ---')
  console.log(`initialAccount + fees = ${computedTotal.toFixed(2)}`)
  console.log(`stored totalCollectable = ${account.totalCollectable}`)
  console.log(
    `match: ${Math.abs(computedTotal - (account.totalCollectable ?? 0)) < 0.01 ? '✅' : '❌'}`,
  )
  console.log()

  console.log('--- PAYMENTS IN COLLECTION ---')
  const payments = await db.collection('payments').find({ account: account._id }).toArray()
  console.log(`Found ${payments.length} payment records:`)
  let totalCompleted = 0
  let totalAll = 0
  for (const p of payments) {
    console.log(
      `  ${p.status?.padEnd(12)} $${(p.amount ?? 0).toFixed(2).padStart(10)}  date: ${p.date || p.createdAt || '-'}  id: ${p._id}`,
    )
    totalAll += p.amount ?? 0
    if (p.status === 'completed') totalCompleted += p.amount ?? 0
  }
  console.log(`\n  Sum of ALL payments:       $${totalAll.toFixed(2)}`)
  console.log(`  Sum of COMPLETED payments: $${totalCompleted.toFixed(2)}`)
  console.log(`  Stored paymentsReceived:   $${(account.paymentsReceived ?? 0).toFixed(2)}`)
  console.log(
    `  Difference (stored - completed): $${((account.paymentsReceived ?? 0) - totalCompleted).toFixed(2)}`,
  )
  console.log()

  console.log('--- BALANCE FORMULA CHECK ---')
  console.log(
    `totalCollectable - completed payments = $${((account.totalCollectable ?? 0) - totalCompleted).toFixed(2)}`,
  )
  console.log(
    `totalCollectable - stored paymentsReceived = $${((account.totalCollectable ?? 0) - (account.paymentsReceived ?? 0)).toFixed(2)}`,
  )
  console.log(`Actual stored currentBalance = $${(account.currentBalance ?? 0).toFixed(2)}`)
  console.log(`\nWhich formula matches currentBalance?`)
  const f1 =
    Math.abs((account.totalCollectable ?? 0) - totalCompleted - (account.currentBalance ?? 0)) <
    0.01
  const f2 =
    Math.abs(
      (account.totalCollectable ?? 0) -
        (account.paymentsReceived ?? 0) -
        (account.currentBalance ?? 0),
    ) < 0.01
  console.log(
    `  Formula A (totalColl - sum(completed payments)): ${f1 ? '✅ MATCH' : '❌ no match'}`,
  )
  console.log(
    `  Formula B (totalColl - paymentsReceived field):  ${f2 ? '✅ MATCH' : '❌ no match'}`,
  )

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
