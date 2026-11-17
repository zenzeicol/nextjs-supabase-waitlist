'use client'

import { useEffect, useRef } from 'react'

/**
 * Altimeter: a fixed vertical rail where the mint dot climbs with the scroll
 * percentage of the whole page. It writes straight to the DOM via rAF so React
 * does not re-render on every scroll event.
 */
export function ScrollProgress() {
  const dotRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0

      if (fillRef.current) fillRef.current.style.transform = `scaleY(${pct})`
      // `top` in % resolves against the rail's height; translateY would resolve
      // against the dot's own height (7px), which is not what we want.
      if (dotRef.current) dotRef.current.style.top = `${(1 - pct) * 100}%`
      if (labelRef.current) labelRef.current.textContent = String(Math.round(pct * 100)).padStart(2, '0')
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex xl:right-9"
    >
      <span
        ref={labelRef}
        className="num text-[10px] font-medium text-mint/45"
      >
        00
      </span>

      <div className="relative h-40 w-px overflow-visible bg-white/10">
        {/* Fill that grows from the bottom up. */}
        <div
          ref={fillRef}
          className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-gradient-to-t from-teal to-mint"
          style={{ transform: 'scaleY(0)' }}
        />
        {/* The dot climbs from the bottom of the rail to the top as you scroll. */}
        <div
          ref={dotRef}
          className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-mint shadow-[0_0_10px_2px_rgba(94,234,212,0.6)]"
          style={{ top: '100%' }}
        />
      </div>

      <span className="h-1 w-1 rounded-full bg-white/20" />
    </div>
  )
}
