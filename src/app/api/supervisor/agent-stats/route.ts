import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getHighestRole, canViewAgentStats } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedAgentId = searchParams.get('agentId')

  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roles: string[] = user.roles || []
  const effectiveRole = getHighestRole(roles)

  if (!canViewAgentStats(effectiveRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const isManager = ['admin', 'crm-manager'].includes(effectiveRole)
  const isSupervisor = effectiveRole === 'supervisor'

  let agentId: string

  if (isManager && requestedAgentId) {
    agentId = requestedAgentId
  } else if (isSupervisor) {
    if (requestedAgentId) {
      const teamMember = await payload.find({
        collection: 'users',
        where: {
          and: [
            { id: { equals: requestedAgentId } },
            { supervisor: { equals: user.id } },
            { roles: { contains: 'collector' } },
          ],
        },
      })
      if (teamMember.totalDocs === 0) {
        return NextResponse.json({ error: 'Not authorized to view this agent' }, { status: 403 })
      }
      agentId = requestedAgentId
    } else {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const accounts = await payload.find({
    collection: 'accounts',
    where: { assignedCollector: { equals: agentId } },
    limit: 9999,
  })
  const accountIds = accounts.docs.map((a: any) => a.id)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const [payments, activeAgreements, promisesBroken, futurePromises] = await Promise.all([
    accountIds.length > 0
      ? payload.find({
          collection: 'payments',
          where: {
            and: [
              { status: { equals: 'completed' } },
              { account: { in: accountIds } },
              { date: { greater_than_equal: startOfMonth } },
              { date: { less_than_equal: endOfMonth } },
            ],
          },
          limit: 9999,
        })
      : { docs: [] },
    accountIds.length > 0
      ? payload.count({
          collection: 'agreements',
          where: { and: [{ account: { in: accountIds } }, { status: { equals: 'active' } }] },
        })
      : { totalDocs: 0 },
    accountIds.length > 0
      ? payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [
              { status: { equals: 'missed' } },
              { account: { in: accountIds } },
              { updatedAt: { greater_than_equal: startOfMonth } },
              { updatedAt: { less_than_equal: endOfMonth } },
            ],
          },
        })
      : { totalDocs: 0 },
    accountIds.length > 0
      ? payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [
              { status: { equals: 'pending' } },
              { account: { in: accountIds } },
              { dueDate: { greater_than_equal: now.toISOString() } },
            ],
          },
        })
      : { totalDocs: 0 },
  ])

  const totalCollected = payments.docs.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
  const totalOutstanding = accounts.docs.reduce(
    (sum: number, a: any) => sum + (a.currentBalance ?? 0),
    0,
  )

  return NextResponse.json({
    totalAccounts: accounts.totalDocs,
    totalOutstanding,
    totalCollected,
    activeAgreements: activeAgreements.totalDocs,
    brokenPromisesCount: promisesBroken.totalDocs,
    futurePromisesTotal: futurePromises.totalDocs,
  })
}
