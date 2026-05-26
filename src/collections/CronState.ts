import { CollectionConfig } from 'payload'

export const CronState: CollectionConfig = {
  slug: 'cron-state',
  admin: { hidden: true },
  access: {
    // Only admins can manage this, but the API will read/write via server operations
    read: () => true,
    update: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'value',
      type: 'date',
      required: true,
    },
  ],
}
