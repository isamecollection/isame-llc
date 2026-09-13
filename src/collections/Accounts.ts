import type { CollectionConfig, Where } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: { hidden: true },
  access: {
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      const roles: string[] = user.roles || []

      // ─────────────────────────────────────────────────────────────
      // HARD ADMIN OVERRIDE
      // Admins ALWAYS get full read access, regardless of what
      // x-active-role cookie is set (e.g. leftover from RoleSwitcher).
      // This was the root cause of "admin can't see all accounts".
      // ─────────────────────────────────────────────────────────────
      if (roles.includes('admin')) {
        return true
      }

      // ── Extract active role from the request cookie ──
      let activeRole: string | null = null
      try {
        const cookieHeader =
          typeof req.headers.get === 'function'
            ? req.headers.get('cookie')
            : (req.headers as any).cookie

        if (cookieHeader) {
          const cookie = cookieHeader
            .split(';')
            .find((c: string) => c.trim().startsWith('x-active-role='))
          if (cookie) {
            activeRole = cookie.split('=')[1]?.trim() || null
          }
        }
      } catch (_) {}

      // ─────────────────────────────────────────────────────────────
      // If a limited role is explicitly chosen, enforce its filter.
      // NOTE: admins are already handled above and never reach here.
      // ─────────────────────────────────────────────────────────────
      if (activeRole && roles.includes(activeRole)) {
        // Client – only their own accounts
        if (activeRole === 'client') {
          const clientId =
            typeof user.clientProfile === 'string'
              ? user.clientProfile
              : (user.clientProfile as any)?.id
          return clientId ? ({ client: { equals: clientId } } as Where) : false
        }

        // Collector – only assigned accounts
        if (activeRole === 'collector') {
          return { assignedCollector: { equals: user.id } } as Where
        }

        // Court agent – only assigned accounts
        if (activeRole === 'court-agent') {
          return { assignedCourtAgent: { equals: user.id } } as Where
        }

        // Process server – only assigned accounts
        if (activeRole === 'process-server') {
          return { assignedProcessServer: { equals: user.id } } as Where
        }

        // Claims officer – only legal accounts
        if (activeRole === 'claims-officer') {
          return { status: { equals: 'legal' } } as Where
        }

        // Supervisor / crm-manager as activeRole → fall through to full access
        if (activeRole === 'supervisor' || activeRole === 'crm-manager') {
          return true
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Full access for management roles (when no limited role is active)
      // ─────────────────────────────────────────────────────────────
      if (roles.some((r) => ['crm-manager', 'claims-officer', 'supervisor'].includes(r))) {
        return true
      }

      // ─────────────────────────────────────────────────────────────
      // Fallback: no active role cookie and no management roles
      // → union of everything this user can access
      // ─────────────────────────────────────────────────────────────
      const filters: Where[] = []

      if (roles.includes('court-agent')) {
        filters.push({ assignedCourtAgent: { equals: user.id } } as Where)
      }

      if (roles.includes('process-server')) {
        filters.push({
          assignedProcessServer: { equals: user.id },
          serviceStatus: { equals: 'pending_service' },
        } as Where)
      }

      if (roles.includes('collector')) {
        filters.push({ assignedCollector: { equals: user.id } } as Where)
      }

      if (roles.includes('client')) {
        const clientId =
          typeof user.clientProfile === 'string'
            ? user.clientProfile
            : (user.clientProfile as any)?.id
        if (clientId) filters.push({ client: { equals: clientId } } as Where)
      }

      return filters.length > 0 ? ({ or: filters } as Where) : false
    },

    // ─────────────────────────────────────────────────────────────
    // UPDATE: admin always passes; other roles as before.
    // (Fix: previously there was no explicit admin check, which
    // worked by accident because 'admin' was in the array — but
    // a hard override is clearer and more resilient.)
    // ─────────────────────────────────────────────────────────────
    update: ({ req: { user } }) => {
      if (!user) return false
      const roles: string[] = user.roles || []

      // Hard admin override
      if (roles.includes('admin')) return true

      return roles.some((r) =>
        [
          'crm-manager',
          'collector',
          'supervisor',
          'court-agent',
          'process-server',
          'claims-officer',
        ].includes(r),
      )
    },

    // ─────────────────────────────────────────────────────────────
    // CREATE: admin only (unchanged)
    // ─────────────────────────────────────────────────────────────
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.includes('admin') ?? false
    },

    // ─────────────────────────────────────────────────────────────
    // DELETE: admin + crm-manager (unchanged, but explicit admin check)
    // ─────────────────────────────────────────────────────────────
    delete: ({ req: { user } }) => {
      if (!user) return false
      const roles: string[] = user.roles || []
      if (roles.includes('admin')) return true
      return roles.includes('crm-manager')
    },
  },

  fields: [
    { name: 'accountNumber', type: 'text', required: true, unique: true },
    { name: 'debtorName', type: 'text' },
    { name: 'ssn', type: 'text' },
    { name: 'originalBalance', type: 'number' },
    {
      name: 'currentBalance',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'Computed from components − payments. Use "Adjust Balance" to change manually.',
      },
      access: {
        update: ({ req }) => {
          // Only internal hooks and the audited adjustment path can change this.
          return (
            req.context?.__balanceAdjustment === true ||
            req.context?.__paymentHookSkip === true ||
            req.context?.__paymentHook === true
          )
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: ['active', 'settled', 'paid', 'bankruptcy', 'legal', 'closed'],
    },
    { name: 'assignedCollector', type: 'relationship', relationTo: 'users' },
    { name: 'client', type: 'relationship', relationTo: 'clients' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
    { name: 'street', type: 'text' },
    { name: 'townCity', type: 'text' },
    { name: 'district', type: 'text' },
    { name: 'employer', type: 'text' },
    { name: 'workPhone', type: 'text' },
    { name: 'homePhone', type: 'text' },
    { name: 'lastContactedAt', type: 'date' },
    { name: 'lastContactNotes', type: 'textarea' },
    { name: 'loanNo', type: 'text' },
    { name: 'initialAccount', type: 'number' },
    { name: 'summonsAmount', type: 'number' },
    { name: 'courtCharge', type: 'number' },
    { name: 'fee20Percent', type: 'number' },
    {
      name: 'totalCollectable',
      type: 'number',
      admin: {
        description: 'Total amount to be collected (Initial + Fee + Summons + Court Charge)',
      },
    },
    { name: 'paymentsReceived', type: 'number' },
    { name: 'courtReceiptNo', type: 'text' },
    { name: 'lodge', type: 'text' },
    { name: 'suitNo', type: 'text' },
    { name: 'statusWithIsame', type: 'text' },
    { name: 'method', type: 'text' },
    {
      name: 'feeOverrides',
      type: 'group',
      label: 'Fee Overrides',
      admin: {
        description: 'Override default fees for this account (leave empty to use defaults)',
      },
      fields: [
        {
          name: 'customCollectionFeePercent',
          type: 'number',
          min: 0,
          max: 100,
          admin: { description: 'Override collection fee percentage' },
        },
        {
          name: 'customSummonsFee',
          type: 'number',
          min: 0,
          admin: { description: 'Override summons fee amount' },
        },
        {
          name: 'customCourtFee',
          type: 'number',
          min: 0,
          admin: { description: 'Override court filing fee' },
        },
      ],
    },
    {
      name: 'legalStatus',
      type: 'select',
      options: ['none', 'pending_review', 'assigned', 'in_court', 'closed'],
      defaultValue: 'none',
      admin: { hidden: true },
    },
    {
      name: 'assignedCourtAgent',
      type: 'relationship',
      relationTo: 'users',
      admin: { hidden: true },
    },
    {
      name: 'assignedProcessServer',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Process server assigned to this account for service of documents' },
    },
    {
      name: 'serviceStatus',
      type: 'select',
      options: ['not_assigned', 'pending_service', 'served', 'not_found', 'completed'],
      defaultValue: 'not_assigned',
      admin: { hidden: true },
    },
    {
      name: 'serviceDate',
      type: 'date',
      admin: { hidden: true, description: 'Date when summons was served to debtor' },
    },
    {
      name: 'serviceProof',
      type: 'upload',
      relationTo: 'media',
      admin: { hidden: true, description: 'Photo proof of served summons' },
    },
    {
      name: 'affidavitProof',
      type: 'upload',
      relationTo: 'media',
      admin: { hidden: true, description: 'Photo of the signed affidavit of service' },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Archive this account instead of deleting it.' },
      access: {
        update: ({ req: { user } }) => {
          if (!user) return false
          const roles: string[] = user.roles || []
          return roles.includes('admin') || roles.includes('crm-manager')
        },
        create: () => false,
      },
    },
  ],
}
