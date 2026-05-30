import { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: { hidden: true },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) =>
          ['crm-manager', 'collector', 'supervisor', 'court-agent', 'admin'].includes(r),
        ) ?? false
      )
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) =>
          ['crm-manager', 'collector', 'supervisor', 'court-agent', 'admin'].includes(r),
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
    { name: 'employer', type: 'text' },
    { name: 'workPhone', type: 'text' },
    { name: 'homePhone', type: 'text' },
    { name: 'lastContactedAt', type: 'date' },
    { name: 'lastContactNotes', type: 'textarea' },
    // 👇 NEW FIELD
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
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Archive this account instead of deleting it.',
      },
      access: {
        // Only admins and CRM managers can toggle this flag
        update: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
        create: () => false, // never set during creation
      },
    },
  ],
}
