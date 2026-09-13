// scripts/inspect-raw.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

// ─── Manually load .env.local ───
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    console.log(`Loading env from: ${envPath}`)
    const content = readFileSync(envPath, 'utf-8')

    let loaded = 0
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eq = trimmed.indexOf('=')
      if (eq === -1) continue

      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()

      // Strip surrounding quotes if present
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }

      if (!process.env[key]) {
        process.env[key] = val
        loaded++
      }
    }

    console.log(`✅ Loaded ${loaded} env var(s) from .env.local`)
  } catch (err: any) {
    console.error(`⚠️  Could not read .env.local: ${err.message}`)
  }
}

loadEnvLocal()

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL not found')
    console.error('   Check that .env.local exists at project root and has DATABASE_URL=...')
    process.exit(1)
  }

  const dbName = url.match(/\/([^/?]+)\?/)?.[1] || url.match(/\/([^/?]+)$/)?.[1] || 'isame-llc'

  console.log(`\n>>> Connecting to DB: ${dbName}\n`)

  const client = new MongoClient(url, { serverSelectionTimeoutMS: 10000 })

  try {
    await client.connect()
    console.log('✅ Connected\n')

    const db = client.db(dbName)
    const collections = ['accounts', 'clients', 'payments', 'users']

    console.log('>>> COUNTS <<<')
    for (const name of collections) {
      const count = await db.collection(name).countDocuments()
      console.log(`  ${name.padEnd(12)} ${count}`)
    }

    console.log('\n>>> SAMPLE ACCOUNTS (first 10) <<<')
    const accounts = await db.collection('accounts').find({}).limit(10).toArray()
    if (accounts.length === 0) console.log('  (none)')
    accounts.forEach((a: any) => {
      console.log(
        `  ${a.accountNumber ?? a._id}  ${a.debtorName ?? ''}  bal: $${a.currentBalance ?? 0}  orig: $${a.originalBalance ?? 0}  status: ${a.status ?? '-'}`,
      )
    })

    console.log('\n>>> SAMPLE CLIENTS (first 10) <<<')
    const clients = await db.collection('clients').find({}).limit(10).toArray()
    if (clients.length === 0) console.log('  (none)')
    clients.forEach((c: any) => {
      const name = c.name ?? c.companyName ?? c.clientName ?? '(no name)'
      console.log(`  ${c._id}  ${name}`)
    })

    console.log('\n>>> DONE <<<')
  } catch (err: any) {
    console.error('❌ MongoDB Error:', err.message)
    console.error(err.stack)
  } finally {
    await client.close()
    process.exit(0)
  }
}

main()
