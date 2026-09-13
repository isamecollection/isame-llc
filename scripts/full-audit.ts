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
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERROR: DATABASE_URL not set')
    process.exit(1)
  }

  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || 'isame-llc'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db(dbName)

  const accounts = await db.collection('accounts').find({}).toArray()
  console.log('\n=== FULL AUDIT - ' + accounts.length + ' accounts ===\n')

  let feeOk = 0, feeWrong = 0, feeMissing = 0
  let balanceOk = 0, balanceWrong = 0, balanceMissing = 0
  let fullyClean = 0, needsFix = 0

  const affected = []

  for (const a of accounts) {
    const initial = round2(a.initialAccount ?? a.originalBalance ?? 0)
    const storedFee = round2(a.fee20Percent ?? 0)
    const storedBalance = round2(a.currentBalance ?? 0)
    const summons = round2(a.summonsAmount ?? 0)
    const court = round2(a.courtCharge ?? 0)
    const paid = round2(a.paymentsReceived ?? 0)

    const overridePercent = a.feeOverrides?.customCollectionFeePercent
    const feeRate = overridePercent != null ? Number(overridePercent) / 100 : 0.2
    const expectedFee = round2(initial * feeRate)
    const expectedTotal = round2(initial + expectedFee + summons + court)
    const expectedBalance = round2(Math.max(0, expectedTotal - paid))

    const feeStatus = a.fee20Percent == null ? 'missing'
      : Math.abs(storedFee - expectedFee) < 0.01 ? 'ok' : 'wrong'

    const balanceStatus = a.currentBalance == null ? 'missing'
      : Math.abs(storedBalance - expectedBalance) < 0.01 ? 'ok' : 'wrong'

    if (feeStatus === 'ok') feeOk++
    else if (feeStatus === 'wrong') feeWrong++
    else feeMissing++

    if (balanceStatus === 'ok') balanceOk++
    else if (balanceStatus === 'wrong') balanceWrong++
    else balanceMissing++

    if (feeStatus === 'ok' && balanceStatus === 'ok') {
      fullyClean++
    } else {
      needsFix++
      affected.push({
        accountNumber: a.accountNumber,
        debtorName: a.debtorName,
        status: a.status,
        initial, storedFee, expectedFee,
        feeDelta: round2(storedFee - expectedFee),
        paid, storedBalance, expectedBalance,
        balanceDelta: round2(storedBalance - expectedBalance),
        feeStatus, balanceStatus,
      })
    }
  }

  console.log('=== FEE HEALTH ===')
  console.log('  Correct: ' + feeOk)
  console.log('  Wrong:   ' + feeWrong)
  console.log('  Missing: ' + feeMissing)
  console.log('')
  console.log('=== BALANCE HEALTH ===')
  console.log('  Correct: ' + balanceOk)
  console.log('  Wrong:   ' + balanceWrong)
  console.log('  Missing: ' + balanceMissing)
  console.log('')
  console.log('=== OVERALL ===')
  console.log('  Fully clean:      ' + fullyClean)
  console.log('  Need correction:  ' + needsFix)
  console.log('')

  if (affected.length > 0) {
    console.log('=== AFFECTED ACCOUNTS ===')
    for (const r of affected) {
      const flags = []
      if (r.feeStatus !== 'ok') flags.push('FEE')
      if (r.balanceStatus !== 'ok') flags.push('BAL')
      console.log(
        String(r.accountNumber || '').padEnd(18) +
        ' ' + String(r.debtorName || '').slice(0, 22).padEnd(22) +
        ' init:' + String(r.initial).padStart(10) +
        ' fee:' + String(r.storedFee).padStart(9) + '->' + String(r.expectedFee).padStart(9) +
        ' paid:' + String(r.paid).padStart(10) +
        ' bal:' + String(r.storedBalance).padStart(10) + '->' + String(r.expectedBalance).padStart(10) +
        ' [' + flags.join('+') + ']'
      )
    }
    console.log('')

    const pos = affected.filter((x) => x.balanceDelta > 0).length
    const neg = affected.filter((x) => x.balanceDelta < 0).length
    const zero = affected.filter((x) => Math.abs(x.balanceDelta) < 0.01).length
    const totalAbs = affected.reduce((s, x) => s + Math.abs(x.balanceDelta), 0)

    console.log('=== DRIFT ANALYSIS ===')
    console.log('  Balance HIGHER than expected: ' + pos)
    console.log('  Balance LOWER than expected:  ' + neg)
    console.log('  Balance OK but fee wrong:     ' + zero)
    console.log('  Total absolute drift: $' + totalAbs.toFixed(2))
  }

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
