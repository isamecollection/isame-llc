import { getPayload } from '@/payload'

export async function sendToLegal(accountId: string, addCourtCharges: boolean, townCity?: string) {
  const payload = await getPayload()
  const account = await payload.findByID({ collection: 'accounts', id: accountId })
  const data: any = { legalStatus: 'pending_review', status: 'legal' }
  if (addCourtCharges) {
    const isBelizeCity = (townCity || account.townCity || '').toLowerCase().includes('belize city')
    data.summonsAmount = isBelizeCity ? 25 : 50
    data.courtCharge = 4
  }
  return payload.update({ collection: 'accounts', id: accountId, data })
}

export async function assignCourtAgent(accountId: string, courtAgentId: string) {
  const payload = await getPayload()
  return payload.update({
    collection: 'accounts',
    id: accountId,
    data: { assignedCourtAgent: courtAgentId, legalStatus: 'assigned' },
  })
}

export async function assignProcessServer(accountId: string, processServerId: string) {
  const payload = await getPayload()
  return payload.update({
    collection: 'accounts',
    id: accountId,
    data: { assignedProcessServer: processServerId, serviceStatus: 'pending_service' },
  })
}
