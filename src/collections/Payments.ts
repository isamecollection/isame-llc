import { CollectionConfig } from 'payload'
import { afterChangePayment } from '../hooks/afterChangePayment'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: { hidden: true },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true },
    { name: 'amount', type: 'number', required: true },
    {
      name: 'method',
      type: 'select',
      options: ['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'online', 'other'],
    },
    { name: 'status', type: 'select', options: ['pending', 'completed', 'failed', 'refunded'] },
    {
      name: 'transactionId',
      type: 'text',
      admin: { description: 'Check #, Transaction ID, or reference number' },
    },
    { name: 'reference', type: 'text', admin: { description: 'Additional reference information' } },
    { name: 'notes', type: 'textarea' },
    { name: 'date', type: 'date' },
    {
      name: 'collectedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.collectedBy) {
          data.collectedBy = req.user.id
        }
      },
    ],
    afterChange: [afterChangePayment],
  },
}
