import { getPayload } from '@/payload'

async function getFeeSettings() {
  try {
    const payload = await getPayload()
    const settings = await payload.find({
      collection: 'crm-settings',
      limit: 1,
    })
    const fees = settings.docs[0]?.fees || {}
    return {
      collectionFeePercent: fees.collectionFeePercent ?? 20,
      summonsFeeBelizeCity: fees.summonsFeeBelizeCity ?? 25,
      summonsFeeOther: fees.summonsFeeOther ?? 50,
      courtFilingFee: fees.courtFilingFee ?? 4,
    }
  } catch {
    return {
      collectionFeePercent: 20,
      summonsFeeBelizeCity: 25,
      summonsFeeOther: 50,
      courtFilingFee: 4,
    }
  }
}

export async function calculateFee(amountToCollect: number): Promise<number> {
  const settings = await getFeeSettings()
  return Math.round(amountToCollect * (settings.collectionFeePercent / 100) * 100) / 100
}

// Sync version for client components that can't use async
export function calculateFeeSync(amountToCollect: number, percent = 20): number {
  return Math.round(amountToCollect * (percent / 100) * 100) / 100
}

export async function calculateCollectable(
  initial: number,
  paymentsReceived: number,
): Promise<number> {
  const amountToCollect = initial - paymentsReceived
  const fee = await calculateFee(amountToCollect)
  return Math.round((amountToCollect + fee) * 100) / 100
}

export function calculateBalance(totalCollectable: number, paymentsReceived: number): number {
  return Math.max(0, Math.round((totalCollectable - paymentsReceived) * 100) / 100)
}

export async function calculateSummonsCharge(townCity: string): Promise<number> {
  const settings = await getFeeSettings()
  return townCity?.toLowerCase().includes('belize city')
    ? settings.summonsFeeBelizeCity
    : settings.summonsFeeOther
}

export async function calculateCourtCharge(): Promise<number> {
  const settings = await getFeeSettings()
  return settings.courtFilingFee
}
