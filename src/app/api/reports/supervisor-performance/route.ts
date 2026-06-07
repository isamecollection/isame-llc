import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getHighestRole, canViewAgentStats } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedSupervisorId = searchParams.get('supervisorId')

  // Authenticate
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roles: string[] = user.roles || []
  const effectiveRole = getHighestRole(roles)
  const isManager = ['admin', 'crm-manager'].includes(effectiveRole)
  const isSupervisor = effectiveRole === 'supervisor'

  // Authorization
  let supervisorId: string

  if (isManager && requestedSupervisorId) {
    supervisorId = requestedSupervisorId
  } else if (isSupervisor) {
    // Supervisor can only view their own performance
    supervisorId = user.id
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get team members
  const team = await payload.find({
    collection: 'users',
    where: {
      and: [{ supervisor: { equals: supervisorId } }, { roles: { contains: 'collector' } }],
    },
    limit: 9999,
  })

  const collectorIds = team.docs.map((m: any) => m.id)
  const accountIds: string[] = []

  // Get all accounts for the team
  if (collectorIds.length > 0) {
    const teamAccounts = await payload.find({
      collection: 'accounts',
      where: { assignedCollector: { in: collectorIds } },
      limit: 9999,
    })
    teamAccounts.docs.forEach((a: any) => accountIds.push(a.id))
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString()

  // Daily collections for last 7 days (using account IDs, not collectedBy)
  const dailyCollections: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]

    const payments =
      accountIds.length > 0
        ? await payload.find({
            collection: 'payments',
            where: {
              and: [
                { status: { equals: 'completed' } },
                { account: { in: accountIds } },
                { date: { greater_than_equal: dayStr } },
                { date: { less_than: nextDayStr } },
              ],
            },
          })
        : { docs: [] }

    const total = payments.docs.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
    dailyCollections.push({ date: dayStr, amount: total })
  }

  // Promises per collector (collector-specific)
  const promisesPerCollector = await Promise.all(
    team.docs.map(async (member: any) => {
      const memberAccounts = await payload.find({
        collection: 'accounts',
        where: { assignedCollector: { equals: member.id } },
        limit: 9999,
      })
      const memberAccountIds = memberAccounts.docs.map((a: any) => a.id)

      const [kept, broken] = await Promise.all([
        memberAccountIds.length > 0
          ? payload.count({
              collection: 'scheduled-payments',
              where: {
                and: [
                  { status: { equals: 'paid' } },
                  { account: { in: memberAccountIds } },
                  { updatedAt: { greater_than_equal: startOfMonth } },
                  { updatedAt: { less_than_equal: endOfMonth } },
                ],
              },
            })
          : { totalDocs: 0 },
        memberAccountIds.length > 0
          ? payload.count({
              collection: 'scheduled-payments',
              where: {
                and: [
                  { status: { equals: 'missed' } },
                  { account: { in: memberAccountIds } },
                  { updatedAt: { greater_than_equal: startOfMonth } },
                  { updatedAt: { less_than_equal: endOfMonth } },
                ],
              },
            })
          : { totalDocs: 0 },
      ])

      return { name: member.name, kept: kept.totalDocs, broken: broken.totalDocs }
    }),
  )

  // Calls per collector this month
  const callsPerCollector = await Promise.all(
    team.docs.map(async (member: any) => {
      const calls = await payload.count({
        collection: 'call-attempts',
        where: {
          and: [
            { createdBy: { equals: member.id } },
            { createdAt: { greater_than_equal: startOfMonth } },
            { createdAt: { less_than_equal: endOfMonth } },
          ],
        },
      })
      return { name: member.name, calls: calls.totalDocs }
    }),
  )

  return NextResponse.json({
    dailyCollections,
    promisesPerCollector,
    callsPerCollector,
  })
}
