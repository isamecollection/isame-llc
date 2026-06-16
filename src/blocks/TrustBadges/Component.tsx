'use client'

import React from 'react'
import {
  Users,
  Shield,
  Globe,
  Star,
  Heart,
  Award,
  BadgeCheck,
  ThumbsUp,
  Briefcase,
  Handshake,
  type LucideIcon,
} from 'lucide-react'

// Map of icon names → Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  shield: Shield,
  globe: Globe,
  star: Star,
  heart: Heart,
  award: Award,
  badgeCheck: BadgeCheck,
  thumbsUp: ThumbsUp,
  briefcase: Briefcase,
  handshake: Handshake,
}

type TrustBadgeProps = {
  backgroundColor?: string | null
  textColor?: string | null
  badges?: {
    icon: string
    text: string
    iconColor?: string | null
    textColor?: string | null
    id?: string | null
  }[]
  columns?: string | null
  id?: string | null
  settings?: {
    primaryColor?: string
    secondaryColor?: string
    linkColor?: string
  }
}

export const TrustBadgesBlockComponent: React.FC<TrustBadgeProps> = ({
  backgroundColor,
  textColor,
  badges,
  columns = '4',
  settings,
}) => {
  if (!badges || badges.length === 0) return null

  const cols = parseInt(columns || '4', 10)

  // Responsive grid classes based on column count
  const responsiveGridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }

  const colClass =
    responsiveGridCols[Math.min(Math.max(cols, 1), 6)] ||
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  // Resolve theme primary colour (fallback to CSS variable)
  const primary = settings?.primaryColor || 'var(--color-primary)'

  return (
    <div
      className="py-8"
      style={{
        backgroundColor: backgroundColor || 'var(--bg-body)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid ${colClass} gap-6`}>
          {badges.map((badge, idx) => {
            const IconComponent = ICON_MAP[badge.icon] || Star
            const iconColor = badge.iconColor || primary
            const resolvedTextColor = badge.textColor || textColor || 'var(--color-text)'

            return (
              <div key={badge.id || idx} className="flex items-start gap-3">
                <IconComponent className="h-6 w-6 shrink-0 mt-0.5" style={{ color: iconColor }} />
                <span className="text-sm" style={{ color: resolvedTextColor }}>
                  {badge.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TrustBadgesBlockComponent
