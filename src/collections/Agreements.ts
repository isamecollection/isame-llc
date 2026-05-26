import { CollectionConfig } from 'payload'

export const Agreements: CollectionConfig = {
  slug: 'agreements',
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
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true },
    { name: 'type', type: 'select', options: ['settlement', 'payment_plan', 'promise_to_pay'] },
    { name: 'totalAmount', type: 'number' },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'active', 'breached', 'completed', 'cancelled'],
    },
    { name: 'terms', type: 'textarea' },
    { name: 'signedDocument', type: 'upload', relationTo: 'media' },
    {
      name: 'payments',
      type: 'array',
      fields: [
        { name: 'dueDate', type: 'date' },
        { name: 'amount', type: 'number' },
        { name: 'status', type: 'select', options: ['pending', 'paid', 'missed'] },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.createdBy) {
          data.createdBy = req.user.id
        }
      },
    ],
  },
}
