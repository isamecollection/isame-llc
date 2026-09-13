// scripts/reconcile-raw.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

const FIX = process.argv.includes('--fix')

const TEST_ACCOUNTS = new Set([
  'TEWST001',
  'TST002',
  'TST0012',
  'MickTest',
  'Tester 2',
  'Testy',
  'Test Account',
  'Test2',
])

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
  console.log(`\n=== SURGICAL RECONCILE (${FIX ? 'FIX MODE' : 'DRY RUN'}) ===\n`)
  console.log(`Scanning ${accounts.length} accounts...\n`)

  let skipTest = 0
  let skipLegacy = 0
  let skipPaidInFull = 0
  let alreadyCorrect = 0
  let fixable = 0
  let fixableFee = 0
  let fixableSummons = 0
  let unknown = 0

  const unknownAccounts: any[] = []

  for (const a of accounts) {
    const accountNumber = a.accountNumber || ''
    const debtorName = a.debtorName || ''

    // Skip test accounts
    if (TEST_ACCOUNTS.has(accountNumber) || /^test/i.test(debtorName)) {
      skipTest++
      continue
    }

    // Skip legacy accounts with no initialAccount
    if (a.initialAccount == null || a.initialAccount === 0) {
      skipLegacy++
      continue
    }

    const initial = round2(a.initialAccount)
    const summons = round2(a.summonsAmount ?? 0)
    const court = round2(a.courtCharge ?? 0)
    const paid = round2(a.paymentsReceived ?? 0)

    const overridePercent = a.feeOverrides?.customCollectionFeePercent
    const feeRate = overridePercent != null ? Number(overridePercent) / 100 : 0.2
    const expectedFee = round2(initial * feeRate)
    const expectedTotal = round2(initial + expectedFee + summons + court)
    const expectedBalance = round2(Math.max(0, expectedTotal - paid))

    const storedFee = round2(a.fee20Percent ?? 0)
    const storedTotal = round2(a.totalCollectable ?? 0)
    const storedBalance = round2(a.currentBalance ?? 0)

    const feeOk = Math.abs(storedFee - expectedFee) < 0.01
    const totalOk = Math.abs(storedTotal - expectedTotal) < 0.01
    const balanceOk = Math.abs(storedBalance - expectedBalance) < 0.01

    if (feeOk && totalOk && balanceOk) {
      alreadyCorrect++
      continue
    }

    // Skip accounts already paid in full (avoid touching closed books)
    if (paid >= expectedTotal - 0.01) {
      skipPaidInFull++
      continue
    }

    // Classify the fix
    const feeNeedsFix = !feeOk
    const summonsCourtMissing = feeOk && !balanceOk && summons + court > 0

    if (!feeNeedsFix && !summonsCourtMissing) {
      unknown++
      unknownAccounts.push({
        accountNumber,
        debtorName,
        initial,
        storedFee,
        expectedFee,
        storedTotal,
        expectedTotal,
        storedBalance,
        expectedBalance,
        paid,
      })
      continue
    }

    if (feeNeedsFix) fixableFee++
    if (summonsCourtMissing) fixableSummons++
    fixable++

    console.log(
      `${accountNumber.padEnd(18)} ` +
        `fee: ${storedFee} → ${expectedFee}  ` +
        `bal: ${storedBalance} → ${expectedBalance}  ` +
        (feeNeedsFix ? '[FEE] ' : '') +
        (summonsCourtMissing ? '[SUMMONS+COURT]' : ''),
    )

    if (FIX) {
      await db.collection('accounts').updateOne(
        { _id: a._id },
        {
          $set: {
            fee20Percent: expectedFee,
            totalCollectable: expectedTotal,
            currentBalance: expectedBalance,
          },
        },
      )
    }
  }

  console.log('\n=== SUMMARY ===')
  console.log(`  Already correct:            ${alreadyCorrect}`)
  console.log(`  Fixable (fee wrong):        ${fixableFee}`)
  console.log(`  Fixable (summons missing):  ${fixableSummons}`)
  console.log(`  TOTAL FIXABLE:              ${fixable}`)
  console.log()
  console.log(`  Skipped (test accounts):    ${skipTest}`)
  console.log(`  Skipped (legacy):           ${skipLegacy}`)
  console.log(`  Skipped (paid in full):     ${skipPaidInFull}`)
  console.log(`  Unknown (needs review):     ${unknown}`)

  if (unknownAccounts.length > 0) {
    console.log('\n=== NEEDS MANUAL REVIEW ===')
    for (const u of unknownAccounts) {
      console.log(`  ${u.accountNumber} (${u.debtorName})`)
      console.log(
        `    initial: ${u.initial}  fee: ${u.storedFee}→${u.expectedFee}  total: ${u.storedTotal}→${u.expectedTotal}  paid: ${u.paid}`,
      )
      console.log(`    balance: ${u.storedBalance}→${u.expectedBalance}`)
    }
  }

  if (!FIX && fixable > 0) {
    console.log('\n✅ Dry run complete. Re-run with --fix to apply.')
  } else if (FIX && fixable > 0) {
    console.log('\n✅ Fix applied.')
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
