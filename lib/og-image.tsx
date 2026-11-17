import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BRAND_NAME, TAGLINE, TAGLINE_PART_1, TAGLINE_PART_2, TAGLINE_PART_3 } from '@/lib/site'

// Social card used by app/opengraph-image.tsx. X/Twitter falls back to
// og:image when there is no twitter:image, so one card covers both.
//
// 1200x630 is the size Facebook/LinkedIn/WhatsApp ask for and the one the
// `twitter:card: summary_large_image` declared in app/layout.tsx expects.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${BRAND_NAME} — ${TAGLINE}`

// Tokens copied by hand from tailwind.config.ts. They cannot be imported:
// Satori (the engine behind ImageResponse) does not run Tailwind or read
// stylesheets, it only understands inline styles in the JSX we pass it.
const NAVY = '#0F1B3D'
const NAVY_DEEP = '#091029'
const MINT = '#5EEAD4'

/**
 * Reads from disk what Satori cannot resolve on its own.
 *
 * The fonts are .ttf on purpose: ImageResponse only accepts ttf/otf/woff, and
 * what next/font/google leaves in .next/static/media is .woff2, which does not
 * work here. That is why they are versioned in assets/.
 *
 * They are static instances, not the variable font: Satori does not apply
 * variation axes, so with the variable .ttf everything would render at the
 * default weight (400) regardless of the fontWeight requested.
 */
async function loadFonts() {
  const [medium, extraBold] = await Promise.all([
    readFile(join(process.cwd(), 'assets/PlusJakartaSans-Medium.ttf')),
    readFile(join(process.cwd(), 'assets/PlusJakartaSans-ExtraBold.ttf')),
  ])
  return { medium, extraBold }
}

export async function renderOgImage() {
  const { medium, extraBold } = await loadFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
          fontFamily: 'Plus Jakarta Sans',
        }}
      >
        {/* Neutral placeholder mark + brand name. Replace with your own logo. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: MINT,
            }}
          />
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, color: '#FFFFFF' }}>
            {BRAND_NAME}
          </div>
        </div>

        {/* Satori only does flexbox layout (no inline text flow), so the
            accent word goes in its own span. */}
        <div
          style={{
            display: 'flex',
            gap: 22,
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: '-3.5px',
            lineHeight: 1.08,
          }}
        >
          <span style={{ color: '#FFFFFF' }}>{TAGLINE_PART_1}</span>
          <span style={{ color: MINT }}>{TAGLINE_PART_2}</span>
          <span style={{ color: '#FFFFFF' }}>{TAGLINE_PART_3}</span>
        </div>

        <div style={{ display: 'flex', fontSize: 28, fontWeight: 500, color: '#94A3B8' }}>
          Join the waitlist
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Plus Jakarta Sans', data: medium, style: 'normal', weight: 500 },
        { name: 'Plus Jakarta Sans', data: extraBold, style: 'normal', weight: 800 },
      ],
    }
  )
}
