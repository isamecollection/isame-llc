export function maskSSN(ssn: string | null | undefined): string {
  if (!ssn) return '—'
  const cleaned = ssn.replace(/\D/g, '')
  if (cleaned.length < 4) return '***'
  return `***-**-${cleaned.slice(-4)}`
}
