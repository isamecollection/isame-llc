import { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: { hidden: true },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'accounts' },
    { name: 'type', type: 'text' },
    { name: 'data', type: 'json' },
    { name: 'createdAt', type: 'date', defaultValue: () => new Date().toISOString() },
  ],
}
