'use client'

import { useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'
import { BRAND_NAME } from '@/lib/site'

const NAV = [{ href: '#faq', label: 'FAQ' }]

export function Header() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        compact
          ? 'border-b border-white/8 bg-navy-deep/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8 lg:h-[4.5rem]">
        <a href="#top" className="flex items-center" aria-label={`${BRAND_NAME}, home`}>
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-mint transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <a
          href="#waitlist"
          className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-navy transition-all duration-200 hover:bg-white hover:shadow-glow active:scale-[0.98]"
        >
          Join the list
        </a>
      </div>
    </header>
  )
}
