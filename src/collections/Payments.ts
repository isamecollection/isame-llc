import { CollectionConfig } from 'payload'
import { afterChangePayment } from '../hooks/afterChangePayment'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: { hidden: true },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'method', type: 'select', options: ['credit_card', 'ach', 'check', 'cash'] },
    { name: 'status', type: 'select', options: ['pending', 'completed', 'failed', 'refunded'] },
    { name: 'transactionId', type: 'text' },
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
