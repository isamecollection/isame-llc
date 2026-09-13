// scripts/inspect-account.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient, ObjectId } from 'mongodb'

const SEARCH = process.argv[2]

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

  console.log(`\n=== SEARCH: "${SEARCH}" ===\n`)

  // Search by account number OR debtor name (case insensitive)
  const accounts = await db
    .collection('accounts')
    .find({
      $or: [
        { accountNumber: { $regex: SEARCH, $options: 'i' } },
        { debtorName: { $regex: SEARCH, $options: 'i' } },
      ],
    })
    .toArray()

  if (accounts.length === 0) {
    console.log('❌ No accounts found')
    await client.close()
    process.exit(0)
  }

  for (const account of accounts) {
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`ACCOUNT: ${account.accountNumber}  (id: ${account._id})`)
    console.log('═══════════════════════════════════════════════════════════\n')

    console.log('--- DEBTOR ---')
    console.log('Name:        ', account.debtorName)
    console.log('SSN:         ', account.ssn ?? '-')
    console.log('Phone:       ', account.phone ?? '-')
    console.log('Client:      ', account.client)
    console.log()

    console.log('--- STATUS ---')
    console.log('Status:      ', account.status)
    console.log('Legal status:', account.legalStatus ?? '-')
    console.log('Service:     ', account.serviceStatus ?? '-')
    console.log()

    console.log('--- BALANCE FIELDS (stored) ---')
    console.log('originalBalance:   ', account.originalBalance)
    console.log('initialAccount:    ', account.initialAccount)
    console.log('fee20Percent:      ', account.fee20Percent)
    console.log('summonsAmount:     ', account.summonsAmount)
    console.log('courtCharge:       ', account.courtCharge)
    console.log('totalCollectable:  ', account.totalCollectable)
    console.log('paymentsReceived:  ', account.paymentsReceived)
    console.log('currentBalance:    ', account.currentBalance)
    console.log()

    console.log('--- COMPUTED CHECK ---')
    const components =
      (account.initialAccount ?? 0) +
      (account.fee20Percent ?? 0) +
      (account.summonsAmount ?? 0) +
      (account.courtCharge ?? 0)
    console.log('Components sum (initial + fee + summons + court):', components.toFixed(2))
    console.log('Stored totalCollectable:                          ', account.totalCollectable)
    console.log(
      'Match:',
      Math.abs(components - (account.totalCollectable ?? 0)) < 0.01 ? '✅' : '❌',
    )
    console.log()
    console.log(
      'Formula: components − paymentsReceived =',
      (components - (account.paymentsReceived ?? 0)).toFixed(2),
    )
    console.log('Stored currentBalance:                 ', account.currentBalance)
    console.log(
      'Match:',
      Math.abs(components - (account.paymentsReceived ?? 0) - (account.currentBalance ?? 0)) < 0.01
        ? '✅'
        : '❌',
    )
    console.log()

    console.log('--- PAYMENTS IN COLLECTION ---')
    const payments = await db.collection('payments').find({ account: account._id }).toArray()
    console.log(`Found ${payments.length} payment records:\n`)

    let totalAll = 0
    let totalCompleted = 0
    for (const p of payments) {
      const amt = p.amount ?? 0
      totalAll += amt
      if (p.status === 'completed') totalCompleted += amt
      console.log(
        `  [${p.status?.padEnd(10)}] $${amt.toFixed(2).padStart(10)}  date: ${p.date ?? p.createdAt ?? '-'}  by: ${p.collectedBy ?? '-'}  id: ${p._id}`,
      )
      if (p.notes) console.log(`             notes: ${p.notes}`)
    }
    console.log()
    console.log('Sum of ALL payments:       ', totalAll.toFixed(2))
    console.log('Sum of COMPLETED payments: ', totalCompleted.toFixed(2))
    console.log('Stored paymentsReceived:   ', account.paymentsReceived)
    console.log()

    console.log('--- BALANCE ADJUSTMENTS (if any) ---')
    try {
      const adjustments = await db
        .collection('balance-adjustments')
        .find({ account: account._id })
        .sort({ createdAt: 1 })
        .toArray()
      if (adjustments.length === 0) {
        console.log('(none)')
      } else {
        for (const adj of adjustments) {
          console.log(
            `  ${adj.createdAt?.toISOString?.() ?? adj.createdAt}  prev: $${adj.previousBalance}  new: $${adj.newBalance}  delta: $${adj.delta}  by: ${adj.adjustedBy}`,
          )
          console.log(`    reason: ${adj.reason}`)
        }
      }
    } catch {
      console.log('(collection does not exist yet)')
    }
    console.log()

    console.log('--- AUDIT LOG ENTRIES (if any) ---')
    try {
      const audits = await db
        .collection('audit-logs')
        .find({
          $or: [
            { 'data.accountId': account._id.toString() },
            { 'data.account': account._id.toString() },
            { docId: account._id.toString() },
            { 'data.accountNumber': account.accountNumber },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray()
      if (audits.length === 0) {
        console.log('(none)')
      } else {
        for (const a of audits) {
          console.log(
            `  ${a.createdAt?.toISOString?.() ?? a.createdAt}  [${a.action ?? a.type ?? '?'}]  ${JSON.stringify(a.data ?? a.changes ?? {}).slice(0, 200)}`,
          )
        }
      }
    } catch (e: any) {
      console.log('(error reading audit-logs:', e.message, ')')
    }
    console.log()

    console.log('--- FULL RAW DOCUMENT ---')
    console.log(JSON.stringify(account, null, 2))
    console.log()
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
