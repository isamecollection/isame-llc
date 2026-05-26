// src/components/crm/AgreementsTable.tsx
export function AgreementsTable({ agreements }: { agreements: any[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Account</th>
        </tr>
      </thead>
      <tbody>
        {agreements.map((a: any) => (
          <tr key={a.id}>
            <td>{a.type}</td>
            <td>{a.status}</td>
            <td>${a.totalAmount}</td>
            <td>{typeof a.account === 'object' ? a.account?.id : a.account}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
