import { BRAND_NAME } from '@/lib/site'

/**
 * Neutral placeholder logo: a simple SVG mark plus the brand name from
 * lib/site.ts. Replace it with your own lockup.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-mint" />
        <path d="M9 22 16 9l7 13" fill="none" stroke="#091029" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-white">{BRAND_NAME}</span>
    </span>
  )
}
