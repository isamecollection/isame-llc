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
    // Bank transfer details
    {
      name: 'bankFrom',
      type: 'text',
      admin: { description: 'Bank name the transfer came from' },
    },
    {
      name: 'accountFrom',
      type: 'text',
      admin: { description: 'Account number the transfer came from' },
    },
    {
      name: 'accountFromName',
      type: 'text',
      admin: { description: 'Name on the sending account' },
    },
    {
      name: 'bankTo',
      type: 'text',
      admin: { description: 'Bank name receiving the transfer' },
    },
    {
      name: 'accountTo',
      type: 'text',
      admin: { description: 'Account number receiving the transfer' },
    },
    {
      name: 'transferTime',
      type: 'text',
      admin: { description: 'Time the transfer was made' },
    },
    {
      name: 'receiptImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Photo or screenshot of the transfer receipt' },
    },
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
