import { CollectionConfig } from 'payload'

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: { hidden: true },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      // auto-populate from the authenticated user via hook
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user) {
          data.createdBy = req.user.id
        }
      },
    ],
  },
  timestamps: true, // adds createdAt, updatedAt automatically
}
