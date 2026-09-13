// scripts/reconcile-balances.ts
//
// Reconciles account balances against the sum of their completed payments.
// Fixes drift caused by the pre-fix hook logic (payments created with
// status: 'completed' that never decremented the balance, or that were
// double-counted when status changed from pending -> completed via update).
//
// Usage:
//   pnpm payload run scripts/reconcile-balances.ts          # dry-run (safe)
//   pnpm payload run scripts/reconcile-balances.ts --fix    # apply changes
//
// ⚠️  DO NOT run --fix against production without a DB backup first.

import { getPayload } from 'payload'
import config from '../src/payload.config'

const FIX = process.argv.includes('--fix')

const run = async () => {
  const payload = await getPayload({ config })

  console.log(`\n=== Balance Reconciliation (${FIX ? 'FIX MODE' : 'DRY RUN'}) ===\n`)

  const accounts = await payload.find({
    collection: 'accounts',
    limit: 10000,
    pagination: false,
    depth: 0,
  })

  console.log(`Scanning ${accounts.docs.length} accounts...\n`)

  let fixed = 0
  let correct = 0
  let skipped = 0
  const errors: string[] = []
  const drifts: Array<{
    accountNumber: string
    actual: number
    expected: number
    drift: number
  }> = []

  for (const account of accounts.docs) {
    try {
      // Skip accounts with no originalBalance — can't compute expected
      if (account.originalBalance === null || account.originalBalance === undefined) {
        skipped++
        continue
      }

      // Sum all COMPLETED payments (excludes pending, failed, refunded)
      const payments = await payload.find({
        collection: 'payments',
        where: {
          account: { equals: account.id },
          status: { equals: 'completed' },
        },
        limit: 10000,
        pagination: false,
        depth: 0,
      })

      const totalPaid = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

      const expectedBalance = Math.max(0, (account.originalBalance ?? 0) - totalPaid)
      const actualBalance = account.currentBalance ?? 0
      const drift = actualBalance - expectedBalance

      if (Math.abs(drift) < 0.01) {
        correct++
        continue
      }

      drifts.push({
        accountNumber: account.accountNumber,
        actual: actualBalance,
        expected: expectedBalance,
        drift,
      })

      console.log(
        `${(account.accountNumber || 'N/A').padEnd(20)} ` +
          `actual: $${actualBalance.toFixed(2).padStart(10)}  ` +
          `expected: $${expectedBalance.toFixed(2).padStart(10)}  ` +
          `drift: $${drift.toFixed(2).padStart(10)}`,
      )

      if (FIX) {
        const updateData: Record<string, any> = {
          currentBalance: expectedBalance,
          paymentsReceived: totalPaid,
        }

        // Flip status to 'paid' if balance hit 0
        if (expectedBalance <= 0 && account.status !== 'paid') {
          updateData.status = 'paid'
        }
        // Flip status back to 'active' if it was 'paid' but balance > 0
        else if (expectedBalance > 0 && account.status === 'paid') {
          updateData.status = 'active'
        }

        await payload.update({
          collection: 'accounts',
          id: account.id,
          data: updateData,
          // Skip any account hooks that might interfere
          context: { __reconcile: true },
        })
      }

      fixed++
    } catch (err: any) {
      errors.push(`${account.accountNumber || account.id}: ${err.message}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`  ${correct} accounts already correct`)
  console.log(`  ${fixed} accounts with drift ${FIX ? 'FIXED' : 'found (dry run)'}`)
  console.log(`  ${skipped} accounts skipped (no originalBalance)`)

  if (errors.length) {
    console.log(`  ${errors.length} errors:`)
    errors.forEach((e) => console.log(`    ${e}`))
  }

  if (drifts.length) {
    const totalDrift = drifts.reduce((s, d) => s + Math.abs(d.drift), 0)
    const positiveDrift = drifts.filter((d) => d.drift > 0).length
    const negativeDrift = drifts.filter((d) => d.drift < 0).length

    console.log('\n=== Drift Analysis ===')
    console.log(`  Total absolute drift: $${totalDrift.toFixed(2)}`)
    console.log(`  Accounts with balance HIGHER than expected: ${positiveDrift}`)
    console.log(`  Accounts with balance LOWER than expected:  ${negativeDrift}`)
    console.log(
      '\n  (HIGHER = payments were never deducted from balance — the pre-fix bug)',
    )
    console.log(
      '  (LOWER  = payments were double-deducted — status-change double-count)',
    )
  }

  if (!FIX && fixed > 0) {
    console.log('\n✅ Dry run complete. Re-run with --fix to apply changes.')
  } else if (FIX && fixed > 0) {
    console.log('\n✅ Fix complete.')
  } else {
    console.log('\n✅ No changes needed.')
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})