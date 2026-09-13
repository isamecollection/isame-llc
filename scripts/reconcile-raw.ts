// scripts/reconcile-raw.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

const FIX = process.argv.includes('--fix')

const round2 = (n: number) => Math.round(n * 100) / 100

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
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || url.match(/\/([^/?]+)$/)?.[1] || 'isame-llc'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db(dbName)

  console.log(`\n=== Balance Reconciliation (${FIX ? 'FIX MODE' : 'DRY RUN'}) ===`)
  console.log(`Database: ${dbName}\n`)

  const accounts = await db.collection('accounts').find({}).toArray()
  console.log(`Scanning ${accounts.length} accounts...\n`)

  let correct = 0
  let fixed = 0
  let skipped = 0
  const errors: string[] = []
  const drifts: {
    accountNumber: string
    actual: number
    expected: number
    drift: number
    reason: string
  }[] = []

  for (const account of accounts) {
    try {
      // Determine the correct totalCollectable
      let totalCollectable: number | null = null

      // Prefer the stored totalCollectable if populated
      if (typeof account.totalCollectable === 'number') {
        totalCollectable = account.totalCollectable
      } else if (typeof account.initialAccount === 'number') {
        // Fallback: compute from components
        totalCollectable = round2(
          (account.initialAccount ?? 0) +
            (account.fee20Percent ?? 0) +
            (account.summonsAmount ?? 0) +
            (account.courtCharge ?? 0),
        )
      }

      if (totalCollectable === null || totalCollectable === 0) {
        skipped++
        continue
      }

      // Sum completed payments
      const payments = await db
        .collection('payments')
        .find({ account: account._id, status: 'completed' })
        .toArray()

      const totalPaidFromPayments = round2(payments.reduce((sum, p) => sum + (p.amount ?? 0), 0))

      const expectedBalance = round2(Math.max(0, totalCollectable - totalPaidFromPayments))
      const actualBalance = round2(account.currentBalance ?? 0)
      const drift = round2(actualBalance - expectedBalance)

      // Also check paymentsReceived drift
      const storedPaymentsReceived = round2(account.paymentsReceived ?? 0)
      const paymentsReceivedDrift = round2(storedPaymentsReceived - totalPaidFromPayments)

      if (Math.abs(drift) < 0.01 && Math.abs(paymentsReceivedDrift) < 0.01) {
        correct++
        continue
      }

      let reason = ''
      if (Math.abs(drift) >= 0.01) reason += `balance off by ${drift} `
      if (Math.abs(paymentsReceivedDrift) >= 0.01)
        reason += `paymentsReceived off by ${paymentsReceivedDrift}`

      drifts.push({
        accountNumber: account.accountNumber,
        actual: actualBalance,
        expected: expectedBalance,
        drift,
        reason: reason.trim(),
      })

      console.log(
        `${(account.accountNumber || 'N/A').padEnd(18)} ` +
          `actual: $${actualBalance.toFixed(2).padStart(9)}  ` +
          `expected: $${expectedBalance.toFixed(2).padStart(9)}  ` +
          `drift: $${drift.toFixed(2).padStart(9)}  ` +
          `(${reason.trim()})`,
      )

      if (FIX) {
        const updateData: Record<string, any> = {
          currentBalance: expectedBalance,
          paymentsReceived: totalPaidFromPayments,
        }

        if (expectedBalance <= 0 && account.status !== 'paid') {
          updateData.status = 'paid'
        } else if (expectedBalance > 0 && account.status === 'paid') {
          updateData.status = 'active'
        }

        await db.collection('accounts').updateOne({ _id: account._id }, { $set: updateData })
      }

      fixed++
    } catch (err: any) {
      errors.push(`${account.accountNumber || account._id}: ${err.message}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`  ${correct} accounts already correct`)
  console.log(`  ${fixed} accounts with drift ${FIX ? 'FIXED' : 'found (dry run)'}`)
  console.log(`  ${skipped} accounts skipped (no totalCollectable)`)
  if (errors.length) {
    console.log(`  ${errors.length} errors:`)
    errors.forEach((e) => console.log(`    ${e}`))
  }

  if (drifts.length) {
    const totalDrift = drifts.reduce((s, d) => s + Math.abs(d.drift), 0)
    const positive = drifts.filter((d) => d.drift > 0).length
    const negative = drifts.filter((d) => d.drift < 0).length

    console.log('\n=== Drift Analysis ===')
    console.log(`  Total absolute balance drift: $${totalDrift.toFixed(2)}`)
    console.log(`  Accounts with currentBalance HIGHER than expected: ${positive}`)
    console.log(`  Accounts with currentBalance LOWER than expected:  ${negative}`)
    console.log('  (HIGHER = over-collected or missed deduction)')
    console.log('  (LOWER  = under-collected / double-deducted)')
  }

  if (!FIX && fixed > 0) {
    console.log('\n✅ Dry run complete. Re-run with --fix to apply.')
  } else if (FIX && fixed > 0) {
    console.log('\n✅ Fix applied.')
  } else {
    console.log('\n✅ No changes needed.')
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
