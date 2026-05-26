import { CollectionConfig } from 'payload'

export const ScheduledPayments: CollectionConfig = {
  slug: 'scheduled-payments',
  admin: { hidden: true },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
        false
      )
    },
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'paid', 'missed', 'cancelled'],
      defaultValue: 'pending',
    },
    {
      name: 'agreement',
      type: 'relationship',
      relationTo: 'agreements',
    },
  ],
}
