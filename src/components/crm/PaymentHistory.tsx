// src/components/crm/PaymentHistory.tsx
export function PaymentHistory({ payments }: { payments: any[] }) {
  return (
    <ul>
      {payments.map((p: any) => (
        <li key={p.id}>
          {p.amount} via {p.method} on {p.date}
        </li>
      ))}
    </ul>
  )
}
