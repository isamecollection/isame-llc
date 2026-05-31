import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

function safeParseFloat(value: string): number {
  if (!value || value.trim() === '') return 0
  const parsed = parseFloat(value.replace(/[^0-9.\-]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

export async function POST(request: Request) {
  const { csv, clientId } = await request.json()

  console.log('=== IMPORT START ===')
  console.log('Client ID:', clientId)
  console.log('CSV length:', csv?.length || 0)

  if (!csv || !clientId) {
    return NextResponse.json({ message: 'Missing CSV data or client ID' }, { status: 400 })
  }

  const payload = await getPayload()

  let client
  try {
    client = await payload.findByID({ collection: 'clients', id: clientId })
    console.log('Client:', client.name, 'Prefix:', client.prefix)
  } catch {
    return NextResponse.json({ message: 'Client not found' }, { status: 400 })
  }
  const prefix = (client.prefix as string).toUpperCase()

  // Handle both \n and \r\n line endings
  const normalizedCsv = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedCsv.trim().split('\n')

  console.log('Total lines (including header):', lines.length)

  if (lines.length < 2) {
    return NextResponse.json(
      { message: 'CSV must have header and at least one row' },
      { status: 400 },
    )
  }

  const headers = parseCSVLine(lines[0]).map((h: string) => h.trim())
  console.log('Headers found:', headers)

  const dataRows = lines.slice(1).filter((line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.replace(/,/g, '').trim() === '') return false
    return true
  })

  console.log('Data rows after filtering:', dataRows.length)

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const values = parseCSVLine(dataRows[i]).map((v: string) => v.trim())
    const record: Record<string, string> = {}
    headers.forEach((h: string, j: number) => {
      record[h] = values[j] || ''
    })

    try {
      // ── Extract fields ──
      let loanNo = record['Loan No.']?.trim() || ''
      if (!loanNo) {
        const custName = (record['Customer Name'] || '').replace(/\s+/g, '-').slice(0, 20)
        loanNo = `AUTO-${custName}-${i + 1}`
      }
      const debtorName = record['Customer Name']?.trim() || ''

      if (!debtorName && !loanNo) {
        console.log(`Row ${i + 1}: Empty name and loan, skipping`)
        continue
      }

      // Address components
      let street = record['Street']?.trim() || ''
      let townCity = record['City/Town']?.trim() || ''
      let district = record['District']?.trim() || ''

      // Fallback: parse combined Address if separate fields are empty
      if (!street && !townCity && record['Address']) {
        const addressParts = record['Address']
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
        street = addressParts[0] || ''
        townCity = addressParts[1] || ''
        district = addressParts[2] || ''
      }

      const addressRaw = [street, townCity, district].filter((s) => s.length > 0).join(', ')

      // Financial fields – safe parsing
      const initialAccount = safeParseFloat(record['Initial Account'] || '')
      const paymentAgreement = safeParseFloat(record['Payment Agreement'] || '')
      const paymentsReceived = safeParseFloat(record['Payments Received'] || '')

      // Other fields
      const method = record['Method']?.trim() || ''
      const comment = record['Comment']?.trim() || ''
      const courtReceiptNo = record['Court Receipt NO.']?.trim() || ''
      const lodge = record['Lodge']?.trim() || ''
      const suitNo = record['Suit No.']?.trim() || ''
      const statusWithIsame = record['STATUS W/ISAME']?.trim() || ''

      // ── Calculate financial fields ──
      const isBelizeCity = townCity.toLowerCase().includes('belize city')
      const courtCharge = 4
      const summonsAmount = isBelizeCity ? 25 : 50
      const fee20Percent = Math.round(initialAccount * 0.2 * 100) / 100
      const totalCollectable =
        Math.round((initialAccount + fee20Percent + summonsAmount + courtCharge) * 100) / 100
      const currentBalance = Math.max(
        0,
        Math.round((totalCollectable - paymentsReceived) * 100) / 100,
      )

      // ── Determine account status ──
      let status: 'active' | 'settled' | 'paid' | 'bankruptcy' | 'legal' | 'closed' = 'active'
      if (statusWithIsame.toUpperCase() === 'PAID') {
        status = 'paid'
      } else if (paymentsReceived >= totalCollectable) {
        status = 'settled'
      }

      // ── Determine legalStatus based on Method field ──
      let legalStatus: 'none' | 'pending_review' | 'assigned' | 'in_court' | 'closed' = 'none'
      const methodLower = method.toLowerCase()

      if (methodLower.includes('court')) {
        // Method explicitly says "Court" - account is in court
        legalStatus = 'in_court'
        status = 'legal'
      } else if (methodLower.includes('personally served')) {
        // Personally served - already served, in court process
        legalStatus = 'in_court'
        status = 'legal'
      } else if (methodLower.includes('served on') || methodLower.includes('served')) {
        // Served by someone - assigned stage
        legalStatus = 'assigned'
      } else if (methodLower.includes('agreement') || methodLower.includes('payment')) {
        // Payment agreement - not in legal process
        legalStatus = 'none'
      } else if (
        methodLower.includes('adjutant') ||
        methodLower.includes('supervisor') ||
        methodLower.includes('mother') ||
        methodLower.includes('aunt') ||
        methodLower.includes('sent to pg') ||
        methodLower.includes('to serve over')
      ) {
        // Needs attention but not yet in court
        legalStatus = 'pending_review'
      }

      // ── Determine serviceStatus based on Method field ──
      let serviceStatus: 'not_assigned' | 'pending_service' | 'served' | 'not_found' | 'completed' =
        'not_assigned'

      if (methodLower.includes('personally served')) {
        serviceStatus = 'served'
      } else if (methodLower.includes('served on')) {
        serviceStatus = 'served'
      } else if (methodLower.includes('served')) {
        serviceStatus = 'served'
      } else if (methodLower.includes('to serve over')) {
        serviceStatus = 'pending_service'
      }

      // Debug first 3 rows
      if (i < 3) {
        console.log(`Row ${i + 1}: ${debtorName}`)
        console.log(
          `  Method: ${method} → status: ${status}, legalStatus: ${legalStatus}, serviceStatus: ${serviceStatus}`,
        )
        console.log(
          `  Financial: Initial=${initialAccount}, Fee=${fee20Percent}, Summons=${summonsAmount}, Court=${courtCharge}`,
        )
        console.log(
          `  Total=${totalCollectable}, Paid=${paymentsReceived}, Balance=${currentBalance}`,
        )
      }

      // Generate account number
      const accountNumber = `${prefix}#${(i + 1).toString().padStart(4, '0')}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`

      // Find existing account by loan number
      let accountId: string | null = null
      if (loanNo) {
        const existing = await payload.find({
          collection: 'accounts',
          where: {
            and: [{ loanNo: { equals: loanNo } }, { client: { equals: clientId } }],
          },
        })
        if (existing.docs.length > 0) {
          accountId = existing.docs[0].id as string
        }
      }

      // ── Build account data ──
      const accountData = {
        debtorName,
        address: addressRaw,
        street,
        townCity,
        district,
        loanNo: loanNo || undefined,
        initialAccount,
        fee20Percent,
        summonsAmount,
        courtCharge,
        totalCollectable,
        paymentsReceived,
        currentBalance,
        originalBalance: initialAccount,
        status,
        legalStatus,
        serviceStatus,
        method,
        courtReceiptNo: courtReceiptNo || undefined,
        lodge: lodge || undefined,
        suitNo: suitNo || undefined,
        statusWithIsame: statusWithIsame || undefined,
        client: clientId,
      }

      // ── Create or update the account ──
      if (accountId) {
        await payload.update({
          collection: 'accounts',
          id: accountId,
          data: accountData,
        })
        updated++
        console.log(`  ✓ Updated: ${debtorName}`)
      } else {
        await payload.create({
          collection: 'accounts',
          data: {
            ...accountData,
            accountNumber,
          },
        })
        created++
        console.log(`  ✓ Created: ${debtorName}`)
      }

      // Get account ID for related records
      if (!accountId) {
        const newAccount = await payload.find({
          collection: 'accounts',
          where: { accountNumber: { equals: accountNumber } },
        })
        accountId = newAccount.docs[0]?.id as string
      }

      // ── Create payment agreement (if any) ──
      if (paymentAgreement > 0 && accountId) {
        await payload.create({
          collection: 'agreements',
          data: {
            account: accountId,
            type: 'promise_to_pay',
            totalAmount: paymentAgreement,
            status: 'active',
          },
          overrideAccess: true,
        })
      }

      // ── Record payments received (if any) ──
      if (paymentsReceived > 0 && accountId) {
        await payload.create({
          collection: 'payments',
          data: {
            account: accountId,
            amount: paymentsReceived,
            method: 'check',
            status: 'completed',
            date: new Date().toISOString().split('T')[0],
          },
          overrideAccess: true,
        })
      }

      // ── Save comment as a note ──
      if (comment && accountId) {
        await payload.create({
          collection: 'notes',
          data: {
            account: accountId,
            content: `[Import] ${comment}`,
          },
          overrideAccess: true,
        })
      }

      // ── Create legal case if method mentions court ──
      // ── Create legal case if method mentions court ──
      if (methodLower.includes('court') && accountId) {
        const existingCases = await payload.find({
          collection: 'legal-cases',
          where: { account: { equals: accountId } },
        })
        if (existingCases.totalDocs === 0) {
          await payload.create({
            collection: 'legal-cases',
            data: {
              account: accountId,
              status: 'filed', // ← CHANGE FROM 'in_court' TO 'filed'
              caseNumber: suitNo || courtReceiptNo || undefined,
              court: lodge || undefined,
              reason: `Imported from CSV. Method: ${method}. Court Receipt: ${courtReceiptNo || 'N/A'}`,
            },
            overrideAccess: true,
          })
        }
      }
    } catch (error: any) {
      console.error(`Error on row ${i + 1}:`, error.message)
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  console.log(`=== IMPORT COMPLETE ===`)
  console.log(`Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`)
  console.log(`Total rows processed: ${dataRows.length}`)

  return NextResponse.json({
    message: `Import complete. Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`,
    created,
    updated,
    errors: errors.length ? errors : undefined,
  })
}
