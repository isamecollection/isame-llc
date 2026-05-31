'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Media } from '@/payload-types'

// -----------------------------
// UI-safe normalized props
// -----------------------------
type LargeGradientProps = {
  heroHeight?: 'screen' | '80vh' | '60vh' | '40vh' | 'custom'
  customHeight?: string

  backgroundImage?: Media | string | null

  overlayType?: 'solid' | 'gradient'
  solidColor?: string
  gradientType?: 'linear' | 'radial'
  gradientDirection?: string
  gradientStops?: { color: string; position: string }[]

  overlayOpacity?: number

  headline?: string
  headlineColor?: string
  subheadline?: string
  subheadlineColor?: string

  primaryCta?: {
    label?: string
    url?: string
    newTab?: boolean
    bgColor?: string
    textColor?: string
  }

  secondaryCta?: {
    label?: string
    url?: string
    newTab?: boolean
    borderColor?: string
    textColor?: string
  }

  showScrollIndicator?: boolean
  scrollIndicatorColor?: string
  enableAnimation?: boolean
}

// -----------------------------
// gradient builder
// -----------------------------
const buildGradient = (
  type: 'linear' | 'radial',
  direction: string,
  stops: { color: string; position: string }[] | null | undefined,
): string => {
  if (!stops?.length || stops.length < 2) return 'transparent'

  const sorted = [...stops].sort((a, b) => parseFloat(a.position) - parseFloat(b.position))

  const colorString = sorted.map((s) => `${s.color} ${s.position}`).join(', ')

  return type === 'radial'
    ? `radial-gradient(circle, ${colorString})`
    : `linear-gradient(${direction}, ${colorString})`
}

// -----------------------------
// height map
// -----------------------------
const heightClasses: Record<string, string> = {
  screen: 'h-screen',
  '80vh': 'h-[80vh]',
  '60vh': 'h-[60vh]',
  '40vh': 'h-[40vh]',
}

// -----------------------------
// component
// -----------------------------
export function LargeGradientComponent(props: LargeGradientProps) {
  const {
    heroHeight = 'screen',
    customHeight,
    backgroundImage,
    overlayType = 'gradient',
    solidColor,
    gradientType = 'linear',
    gradientDirection = 'to right',
    gradientStops,
    overlayOpacity = 0.85,
    headline,
    headlineColor,
    subheadline,
    subheadlineColor,
    primaryCta,
    secondaryCta,
    showScrollIndicator = false,
    scrollIndicatorColor,
    enableAnimation = true,
  } = props

  const heightClass = heroHeight !== 'custom' ? heightClasses[heroHeight] || 'h-screen' : ''

  const heightStyle = heroHeight === 'custom' && customHeight ? { height: customHeight } : undefined

  // -----------------------------
  // safe media resolver
  // -----------------------------
  const bgUrl =
    typeof backgroundImage === 'object' && backgroundImage !== null && 'url' in backgroundImage
      ? backgroundImage.url
      : typeof backgroundImage === 'string'
        ? backgroundImage
        : undefined

  const overlayStyle: React.CSSProperties = {
    opacity: overlayOpacity,
    background:
      overlayType === 'solid'
        ? solidColor || 'var(--color-primary)'
        : buildGradient(gradientType, gradientDirection, gradientStops),
  }

  const Wrapper = enableAnimation ? motion.div : 'div'

  const animProps = enableAnimation
    ? {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8 },
      }
    : {}

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${heightClass} pt-16 md:pt-0`}
      style={heightStyle}
    >
      {/* background */}
      <div className="absolute inset-0">
        {bgUrl ? (
          <img src={bgUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[var(--color-background)]" />
        )}

        <div className="absolute inset-0" style={overlayStyle} />
      </div>

      {/* content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Wrapper {...animProps}>
          {headline && (
            <h1
              className="mb-6 text-5xl md:text-7xl"
              style={{
                fontFamily: 'var(--font-heading)',
                color: headlineColor || 'var(--color-primary)',
              }}
            >
              {headline}
            </h1>
          )}

          {subheadline && (
            <p
              className="mx-auto mb-8 max-w-3xl text-xl md:text-2xl"
              style={{ color: subheadlineColor || 'var(--color-text)' }}
            >
              {subheadline}
            </p>
          )}

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {primaryCta?.label && primaryCta?.url && (
              <Link
                href={primaryCta.url}
                target={primaryCta.newTab ? '_blank' : undefined}
                className="rounded-lg px-8 py-4 text-lg transition hover:shadow-lg"
                style={{
                  backgroundColor: primaryCta.bgColor || 'var(--color-primary)',
                  color: primaryCta.textColor || '#1A1A1A',
                }}
              >
                {primaryCta.label}
              </Link>
            )}

            {secondaryCta?.label && secondaryCta?.url && (
              <Link
                href={secondaryCta.url}
                target={secondaryCta.newTab ? '_blank' : undefined}
                className="rounded-lg border-2 px-8 py-4 text-lg transition hover:bg-gray-50"
                style={{
                  borderColor: secondaryCta.borderColor || 'var(--color-secondary)',
                  color: secondaryCta.textColor || 'var(--color-text)',
                }}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </Wrapper>
      </div>

      {/* scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            className="flex h-10 w-6 items-start justify-center rounded-full border-2 p-2"
            style={{ borderColor: scrollIndicatorColor || 'var(--color-primary)' }}
          >
            <div
              className="h-3 w-1 rounded-full"
              style={{
                backgroundColor: scrollIndicatorColor || 'var(--color-primary)',
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default LargeGradientComponent
