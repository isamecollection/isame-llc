import { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: { hidden: true },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false

      const roles = user.roles || []

      // Admin, CRM Manager, Claims Officer, Supervisor can see all accounts
      if (
        roles.some((r: string) =>
          ['admin', 'crm-manager', 'claims-officer', 'supervisor'].includes(r),
        )
      ) {
        return true
      }

      // Court Agent can only see accounts assigned to them
      if (roles.includes('court-agent')) {
        return {
          and: [{ assignedCourtAgent: { equals: user.id } }],
        }
      }

      // Process Server can only see accounts assigned to them
      if (roles.includes('process-server')) {
        return {
          and: [{ assignedProcessServer: { equals: user.id } }],
        }
      }

      // Collector can only see accounts assigned to them
      if (roles.includes('collector')) {
        return {
          and: [{ assignedCollector: { equals: user.id } }],
        }
      }

      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) =>
          [
            'crm-manager',
            'collector',
            'supervisor',
            'court-agent',
            'process-server',
            'claims-officer',
            'admin',
          ].includes(r),
        ) ?? false
      )
    },
    create: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
  },
  fields: [
    { name: 'accountNumber', type: 'text', required: true, unique: true },
    { name: 'debtorName', type: 'text' },
    { name: 'ssn', type: 'text' },
    { name: 'originalBalance', type: 'number' },
    { name: 'currentBalance', type: 'number' },
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
        update: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
        create: () => false,
      },
    },
  ],
}
