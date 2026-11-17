'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Delay in ms, to stagger children within the same section. */
  delay?: number
  className?: string
  as?: ElementType
}

/**
 * Fade + slide entrance using the native IntersectionObserver (no animation
 * library). It disconnects after the first trigger: it does not replay when
 * scrolling back up.
 *
 * Only for content BELOW the fold. Above the fold use <FadeIn>, which does not
 * depend on hydration.
 *
 * The attribute is written straight to the DOM instead of through useState:
 * that avoids a React re-render for every revealed element.
 */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const show = () => {
      el.dataset.visible = 'true'
    }

    if (typeof IntersectionObserver === 'undefined') {
      show()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show()
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      data-visible="false"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  )
}
