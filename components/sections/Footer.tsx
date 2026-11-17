import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  TAGLINE_PART_1,
  TAGLINE_PART_2,
  TAGLINE_PART_3,
} from '@/lib/site'

// The footer renders on every page, so it is the one place from which any
// route of the site can be reached without going through the home page.
const LEGAL = [
  { href: '/legal', label: 'Privacy Policy and Terms' },
  { href: '/account-deletion', label: 'Delete my account' },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/8 bg-navy">
      <div aria-hidden className="absolute inset-0 bg-dotgrid opacity-30" />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-16">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex" aria-label={`${BRAND_NAME}, home`}>
              <Logo />
            </Link>

            <p className="mt-5 text-pretty text-sm leading-relaxed text-slate-400">
              {TAGLINE_PART_1} <span className="text-mint">{TAGLINE_PART_2}</span>{' '}
              {TAGLINE_PART_3}
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm leading-relaxed text-slate-500 transition-colors duration-200 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <nav aria-label="Footer">
            <h2 className="num text-xs font-semibold uppercase tracking-[0.16em] text-mint/70">
              Legal
            </h2>
            <ul className="mt-5 space-y-3.5">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-pretty text-sm leading-snug text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="num text-xs text-slate-500">&copy; 2026 {BRAND_NAME}.</p>
          <p className="text-xs text-slate-500">Early access coming soon.</p>
        </div>
      </div>
    </footer>
  )
}
