import { CollectionConfig } from 'payload'

export const CRMSettings: CollectionConfig = {
  slug: 'crm-settings',
  admin: {
    description: 'Configure CRM fees, receipts, and reports',
    group: 'CRM',
  },
  access: {
    read: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    update: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    create: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    delete: () => false,
  },
  fields: [
    {
      name: 'fees',
      type: 'group',
      label: 'Fee Configuration',
      fields: [
        {
          name: 'collectionFeePercent',
          type: 'number',
          defaultValue: 20,
          min: 0,
          max: 100,
          admin: { description: 'Collection fee percentage (e.g., 20 for 20%)' },
        },
        {
          name: 'summonsFeeBelizeCity',
          type: 'number',
          defaultValue: 25,
          admin: { description: 'Summons fee for Belize City' },
        },
        {
          name: 'summonsFeeOther',
          type: 'number',
          defaultValue: 50,
          admin: { description: 'Summons fee for other locations' },
        },
        {
          name: 'courtFilingFee',
          type: 'number',
          defaultValue: 4,
          admin: { description: 'Court filing fee' },
        },
      ],
    },
    {
      name: 'receipt',
      type: 'group',
      label: 'Receipt & Report Branding',
      fields: [
        {
          name: 'companyName',
          type: 'text',
          defaultValue: 'ISAME CREDIT COLLECTION LTD',
        },
        {
          name: 'companyAddress',
          type: 'text',
          defaultValue: 'Belize City, Belize',
        },
        {
          name: 'companyPhone',
          type: 'text',
          admin: { description: 'Phone number shown on receipts' },
        },
        {
          name: 'companyEmail',
          type: 'email',
          admin: { description: 'Email shown on receipts' },
        },
        {
          name: 'companyWebsite',
          type: 'text',
          defaultValue: 'www.isame.co',
        },
        {
          name: 'receiptLogo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Logo shown on payment receipts' },
        },
        {
          name: 'receiptFooter',
          type: 'textarea',
          defaultValue: 'This receipt acknowledges payment received toward the referenced account.',
          admin: { description: 'Footer text shown at bottom of receipts' },
        },
      ],
    },
  ],
}
