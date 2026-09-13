import type { CollectionConfig } from 'payload'

export const BalanceAdjustments: CollectionConfig = {
  slug: 'balance-adjustments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'account',
      'previousBalance',
      'newBalance',
      'delta',
      'adjustedBy',
      'reason',
      'createdAt',
    ],
    group: 'CRM',
    description: 'Audit log of manual balance adjustments',
  },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const roles: string[] = user.roles || []
      return roles.some((r) => ['admin', 'crm-manager', 'supervisor'].includes(r))
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      const roles: string[] = user.roles || []
      return roles.some((r) => ['admin', 'crm-manager', 'supervisor', 'collector'].includes(r))
    },
    update: () => false,
    delete: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      index: true,
    },
    {
      name: 'previousBalance',
      type: 'number',
      required: true,
      admin: { readOnly: true, description: 'Balance before the adjustment' },
    },
    {
      name: 'newBalance',
      type: 'number',
      required: true,
      admin: { description: 'Balance after the adjustment' },
    },
    {
      name: 'delta',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
        description: 'Change applied (newBalance − previousBalance)',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Why is this adjustment being made? Include ticket/ref numbers.',
      },
    },
    {
      name: 'adjustedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const { payload } = req
        const accountId = typeof data.account === 'string' ? data.account : data.account?.id
        if (!accountId) throw new Error('Account is required')

        const account = await payload.findByID({
          collection: 'accounts',
          id: accountId,
        })
        if (!account) throw new Error('Account not found')

        const previousBalance = Math.round((account.currentBalance ?? 0) * 100) / 100
        const newBalance = Math.round((data.newBalance ?? 0) * 100) / 100
        const delta = Math.round((newBalance - previousBalance) * 100) / 100

        if (Math.abs(delta) < 0.01) {
          throw new Error('Adjustment has no effect (delta is zero)')
        }
        if (newBalance < 0) {
          throw new Error('Balance cannot be negative')
        }
        if (!data.reason || !data.reason.trim()) {
          throw new Error('Reason is required')
        }
        if (!req.user) {
          throw new Error('No authenticated user')
        }

        data.adjustedBy = req.user.id
        data.previousBalance = previousBalance
        data.delta = delta
        data.newBalance = newBalance

        // Apply to the account, bypassing the field-level guard via context
        await payload.update({
          collection: 'accounts',
          id: accountId,
          data: { currentBalance: newBalance },
          context: { __balanceAdjustment: true },
        })

        // Sync account status with the new balance
        if (newBalance <= 0 && account.status !== 'paid') {
          await payload.update({
            collection: 'accounts',
            id: accountId,
            data: { status: 'paid' },
          })
        } else if (newBalance > 0 && account.status === 'paid') {
          await payload.update({
            collection: 'accounts',
            id: accountId,
            data: { status: 'active' },
          })
        }

        return data
      },
    ],
  },
  timestamps: true,
}
