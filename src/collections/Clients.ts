import { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: { useAsTitle: 'name', hidden: true },
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
  ],
}
