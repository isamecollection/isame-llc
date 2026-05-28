import { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: { useAsTitle: 'name', hidden: true },
  access: {
    create: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
    read: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager', 'supervisor', 'collector'].includes(r)) ??
      false,
    update: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
    delete: ({ req: { user } }) =>
      user?.roles?.some((r) => ['admin', 'crm-manager'].includes(r)) ?? false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
    { name: 'phone', type: 'text' },
    { name: 'contactPerson', type: 'text' },
    {
      name: 'prefix',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: '3‑4 letter code, e.g. ABC, used in account numbers (ABC#12345)' },
    },
    // 👇 NEW FIELD
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Archive this client instead of deleting it.' },
      access: {
        update: ({ req: { user } }) =>
          (user?.roles?.includes('admin') || user?.roles?.includes('crm-manager')) ?? false,
        create: () => false,
      },
    },
  ],
}
