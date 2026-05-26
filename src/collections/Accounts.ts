import { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: { hidden: true },
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
    // NEW contact fields
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
    { name: 'employer', type: 'text' },
    { name: 'workPhone', type: 'text' },
    { name: 'homePhone', type: 'text' },
    { name: 'lastContactedAt', type: 'date' },
    { name: 'lastContactNotes', type: 'textarea' },
  ],
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
    delete: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
}
