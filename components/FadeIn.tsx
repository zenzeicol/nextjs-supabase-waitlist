import type { ElementType, ReactNode } from 'react'

type FadeInProps = {
  children: ReactNode
  /** Delay in ms, to stagger the entrance. */
  delay?: number
  className?: string
  as?: ElementType
}

/**
 * Staggered entrance on page load, 100% CSS.
 *
 * For content ABOVE THE FOLD. Unlike <Reveal>, it is not a client component and
 * does not wait for hydration: if JS fails or is slow, the content still
 * appears. Below the fold use <Reveal>, which does depend on scrolling.
 */
export function FadeIn({ children, delay = 0, className = '', as: Tag = 'div' }: FadeInProps) {
  return (
    <Tag
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={`fade-in ${className}`}
    >
      {children}
    </Tag>
  )
}
