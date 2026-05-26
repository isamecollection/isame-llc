import { CollectionConfig } from 'payload'

export const Templates: CollectionConfig = {
  slug: 'templates',
  admin: { hidden: true },
  access: {
    create: ({ req: { user } }) =>
      user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false,
    read: ({ req: { user } }) =>
      user?.roles?.some((r) => ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r)) ??
      false,
    update: ({ req: { user } }) =>
      user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false,
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['crm-manager', 'supervisor', 'admin'].includes(r)) ?? false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'type',
      type: 'select',
      options: ['payment_reminder', 'promise_confirmation', 'settlement_offer', 'general'],
      defaultValue: 'general',
    },
  ],
}
