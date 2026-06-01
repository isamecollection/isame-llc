import Link from 'next/link'

type StatCardProps = {
  title: string
  value: number | string
  isCurrency?: boolean
  variant?: 'default' | 'urgent' | 'warning' | 'success'
  href?: string
}

export function StatCard({ title, value, isCurrency, variant = 'default', href }: StatCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    urgent: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  }

  const textStyles = {
    default: '',
    urgent: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-700 dark:text-yellow-300',
    success: 'text-green-700 dark:text-green-300',
  }

  const displayValue = isCurrency
    ? `$${typeof value === 'number' ? value.toLocaleString() : value}`
    : typeof value === 'number'
      ? value.toLocaleString()
      : value

  const card = (
    <div
      className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${variantStyles[variant]}`}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${textStyles[variant]}`}>{displayValue}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
