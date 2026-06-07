export function calculateFee(amountToCollect: number): number {
  return Math.round(amountToCollect * 0.2 * 100) / 100
}

export function calculateCollectable(initial: number, paymentsReceived: number): number {
  const amountToCollect = initial - paymentsReceived
  const fee = calculateFee(amountToCollect)
  return Math.round((amountToCollect + fee) * 100) / 100
}

export function calculateBalance(totalCollectable: number, paymentsReceived: number): number {
  return Math.max(0, Math.round((totalCollectable - paymentsReceived) * 100) / 100)
}

export function calculateSummonsCharge(townCity: string): number {
  return townCity?.toLowerCase().includes('belize city') ? 25 : 50
}

export function calculateCourtCharge(): number {
  return 4
}
