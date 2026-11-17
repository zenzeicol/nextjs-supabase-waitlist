import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ScrollProgress } from '@/components/ScrollProgress'
import { BRAND_NAME, DESCRIPTION, SITE_URL, TAGLINE } from '@/lib/site'
import './globals.css'

const sans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const TITLE = `${BRAND_NAME} | ${TAGLINE}`

export const metadata: Metadata = {
  // The production domain lives in lib/site.ts. It resolves the absolute URLs
  // of the OG image.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: BRAND_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#091029',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        {/* Without JS, IntersectionObserver never fires and everything below
            the fold would stay invisible. This keeps content always visible. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <ScrollProgress />
        {children}
      </body>
    </html>
  )
}
