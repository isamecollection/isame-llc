'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import AnimateOnScroll from '../../components/AnimateOnScroll'

type TestimonialsProps = {
  backgroundColor?: string
  heading?: string
  headingColor?: string
  subheading?: string
  subheadingColor?: string
  testimonials?: {
    quote: string
    author: string
    business?: string
    quoteIconColor?: string
    cardBgColor?: string
    cardBorderColor?: string
    authorColor?: string
    businessColor?: string
    id?: string | null
  }[]
  columns?: string
  ctaLabel?: string
  ctaUrl?: string
  ctaNewTab?: boolean
  ctaBgColor?: string
  ctaTextColor?: string
  enableAnimation?: boolean
  id?: string | null
  settings?: {
    primaryColor?: string
    secondaryColor?: string
    linkColor?: string
  }
}

export const TestimonialsBlockComponent: React.FC<TestimonialsProps> = ({
  backgroundColor,
  heading,
  headingColor,
  subheading,
  subheadingColor,
  testimonials,
  columns = '2',
  ctaLabel,
  ctaUrl,
  ctaNewTab,
  ctaBgColor,
  ctaTextColor,
  enableAnimation = true,
  settings,
}) => {
  if (!testimonials || testimonials.length === 0) return null

  const totalTestimonials = testimonials.length
  const useSlider = totalTestimonials > 2

  const [currentIndex, setCurrentIndex] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)

  // Create cloned array for infinite loop: [last, ...all, first]
  const clonedTestimonials = [...testimonials]
  const firstClone = { ...testimonials[0], id: 'clone-first' }
  const lastClone = { ...testimonials[totalTestimonials - 1], id: 'clone-last' }
  const loopedTestimonials = [lastClone, ...clonedTestimonials, firstClone]

  // Start at index 1 (the real first slide)
  const [loopIndex, setLoopIndex] = useState(1)

  // Determine slides per view based on screen size
  useEffect(() => {
    const updateSlidesPerView = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setSlidesPerView(Math.min(parseInt(columns, 10) || 2, totalTestimonials))
      } else if (width >= 640) {
        setSlidesPerView(Math.min(2, totalTestimonials))
      } else {
        setSlidesPerView(1)
      }
    }

    updateSlidesPerView()
    window.addEventListener('resize', updateSlidesPerView)
    return () => window.removeEventListener('resize', updateSlidesPerView)
  }, [columns, totalTestimonials])

  const maxLoopIndex = totalTestimonials // Last real slide index in looped array

  // Handle transition end for seamless looping
  const handleTransitionEnd = useCallback(() => {
    if (loopIndex === 0) {
      // We're on the clone of the last slide, jump to real last slide
      setIsTransitioning(false)
      setLoopIndex(totalTestimonials)
    } else if (loopIndex === maxLoopIndex + 1) {
      // We're on the clone of the first slide, jump to real first slide
      setIsTransitioning(false)
      setLoopIndex(1)
    }
  }, [loopIndex, totalTestimonials, maxLoopIndex])

  // Re-enable transition after jumping
  useEffect(() => {
    if (!isTransitioning) {
      const timeout = setTimeout(() => {
        setIsTransitioning(true)
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [isTransitioning])

  // Update displayed currentIndex for dots
  useEffect(() => {
    if (loopIndex === 0) {
      setCurrentIndex(totalTestimonials - 1)
    } else if (loopIndex === maxLoopIndex + 1) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(loopIndex - 1)
    }
  }, [loopIndex, totalTestimonials, maxLoopIndex])

  const goNext = useCallback(() => {
    setLoopIndex((prev) => prev + 1)
  }, [])

  const goPrev = useCallback(() => {
    setLoopIndex((prev) => prev - 1)
  }, [])

  const goTo = useCallback((index: number) => {
    setLoopIndex(index + 1) // +1 because looped array has extra clone at start
  }, [])

  // Auto-play
  useEffect(() => {
    if (!useSlider || !isAutoPlaying) return
    const interval = setInterval(goNext, 5000)
    return () => clearInterval(interval)
  }, [useSlider, isAutoPlaying, goNext])

  const primary = settings?.primaryColor || 'var(--color-primary)'

  const wrapper = (children: React.ReactNode, delay: number = 0) =>
    enableAnimation ? (
      <AnimateOnScroll preset="fadeUp" delay={delay}>
        {children}
      </AnimateOnScroll>
    ) : (
      <>{children}</>
    )

  // Shared testimonial card renderer
  const renderCard = (testimonial: (typeof testimonials)[0]) => {
    const cardBg = testimonial.cardBgColor || 'var(--color-surface)'
    const cardBorder = testimonial.cardBorderColor || 'var(--color-border)'
    const iconColor = testimonial.quoteIconColor || primary
    const authorColor = testimonial.authorColor || 'var(--color-text)'
    const businessColor = testimonial.businessColor || 'var(--color-muted)'

    return (
      <div
        className="p-8 rounded-lg relative h-full"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <Quote
          className="absolute top-6 right-6 w-12 h-12 opacity-20"
          style={{ color: iconColor }}
        />
        <p className="text-lg mb-6 italic relative z-10" style={{ color: 'var(--color-text)' }}>
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <div className="border-t pt-4" style={{ borderColor: iconColor }}>
          <p className="text-gray-900" style={{ color: authorColor }}>
            {testimonial.author}
          </p>
          {testimonial.business && (
            <p className="text-sm" style={{ color: businessColor }}>
              {testimonial.business}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Render grid for 1-2 testimonials ──
  if (!useSlider) {
    const colsCount = parseInt(columns, 10)
    const gridCols: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2',
    }
    const colClass = gridCols[Math.min(Math.max(colsCount, 1), 3)] || 'grid-cols-1 md:grid-cols-2'
    const maxWidth = colsCount === 1 ? 'max-w-2xl' : colsCount === 2 ? 'max-w-5xl' : 'max-w-7xl'

    return (
      <section className="py-20" style={{ backgroundColor: backgroundColor || 'var(--bg-body)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {heading && (
              <h2
                className="text-4xl md:text-5xl mb-4"
                style={{ fontFamily: 'var(--font-heading)', color: headingColor || primary }}
              >
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-xl" style={{ color: subheadingColor || 'var(--color-muted)' }}>
                {subheading}
              </p>
            )}
          </div>

          <div className={`grid ${colClass} gap-8 ${maxWidth} mx-auto`}>
            {testimonials.map((testimonial, index) => (
              <React.Fragment key={testimonial.id || index}>
                {wrapper(renderCard(testimonial), index * 0.1)}
              </React.Fragment>
            ))}
          </div>

          {ctaLabel && ctaUrl && (
            <div className="mt-16 text-center">
              <Link
                href={ctaUrl}
                target={ctaNewTab ? '_blank' : undefined}
                rel={ctaNewTab ? 'noopener noreferrer' : undefined}
                className="inline-block px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg"
                style={{ backgroundColor: ctaBgColor || primary, color: ctaTextColor || '#1A1A1A' }}
              >
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── Render slider for 3+ testimonials ──
  return (
    <section className="py-20" style={{ backgroundColor: backgroundColor || 'var(--bg-body)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {heading && (
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: headingColor || primary }}
            >
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="text-xl" style={{ color: subheadingColor || 'var(--color-muted)' }}>
              {subheading}
            </p>
          )}
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex"
              style={{
                transform: `translateX(-${loopIndex * (100 / slidesPerView)}%)`,
                transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {loopedTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id || index}
                  className="shrink-0 px-3"
                  style={{ width: `${100 / slidesPerView}%` }}
                >
                  {renderCard(testimonial)}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => {
              goPrev()
              setIsAutoPlaying(false)
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            style={{ border: `2px solid ${primary}` }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: primary }} />
          </button>
          <button
            onClick={() => {
              goNext()
              setIsAutoPlaying(false)
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            style={{ border: `2px solid ${primary}` }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" style={{ color: primary }} />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  goTo(i)
                  setIsAutoPlaying(false)
                }}
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentIndex ? primary : 'var(--color-border)',
                  transform: i === currentIndex ? 'scale(1.25)' : 'scale(1)',
                }}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {ctaLabel && ctaUrl && (
          <div className="mt-16 text-center">
            <Link
              href={ctaUrl}
              target={ctaNewTab ? '_blank' : undefined}
              rel={ctaNewTab ? 'noopener noreferrer' : undefined}
              className="inline-block px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg"
              style={{ backgroundColor: ctaBgColor || primary, color: ctaTextColor || '#1A1A1A' }}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default TestimonialsBlockComponent
