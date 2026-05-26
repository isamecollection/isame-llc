import { CollectionConfig } from 'payload'

export const DebtorReferences: CollectionConfig = {
  slug: 'debtor-references',
  admin: { hidden: true },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    { name: 'relationship', type: 'text' }, // e.g., "sister", "employer"
  ],
}
