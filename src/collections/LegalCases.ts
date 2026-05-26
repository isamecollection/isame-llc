import { CollectionConfig } from 'payload'

export const LegalCases: CollectionConfig = {
  slug: 'legal-cases',
  admin: { hidden: true },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.some((r) => ['court-agent', 'admin'].includes(r)) ?? false
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      return (
        user.roles?.some((r) =>
          ['collector', 'crm-manager', 'supervisor', 'court-agent', 'admin'].includes(r),
        ) ?? false
      )
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.some((r) => ['court-agent', 'admin'].includes(r)) ?? false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.roles?.some((r) => ['court-agent', 'admin'].includes(r)) ?? false
    },
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        'new',
        'under_review',
        'filed',
        'served',
        'discovery',
        'trial',
        'settled',
        'judgment',
        'dismissed',
        'appealed',
        'closed',
      ],
      defaultValue: 'new',
    },
    {
      name: 'attorney',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'caseNumber',
      type: 'text',
    },
    {
      name: 'court',
      type: 'text',
    },
    {
      name: 'caseType',
      type: 'select',
      options: ['small_claims', 'civil', 'default_judgment', 'garnishment', 'other'],
    },
    {
      name: 'filedDate',
      type: 'date',
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'documents',
      type: 'array',
      fields: [
        { name: 'file', type: 'upload', relationTo: 'media' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'courtEvents',
      type: 'array',
      fields: [
        { name: 'eventDate', type: 'date', required: true },
        {
          name: 'eventType',
          type: 'select',
          options: ['hearing', 'trial', 'deadline', 'conference', 'other'],
        },
        { name: 'notes', type: 'textarea' },
        { name: 'outcome', type: 'text' },
      ],
    },
    {
      name: 'judgment',
      type: 'group',
      fields: [
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'date' },
        { name: 'interestRate', type: 'number' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
