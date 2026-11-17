import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // The Allow for /_next/static/ is more specific than the Disallow for
      // /_next/, and in robots.txt the longest matching path wins (not the
      // order). So Next internals are blocked (image optimizer, RSC payloads)
      // but CSS and JS stay crawlable, which is what crawlers need to render
      // the page. Blocking all of /_next/ would make them render it unstyled.
      allow: ['/', '/_next/static/'],
      // /reset-password only works with the token_hash from the Supabase Auth
      // recovery email; without it, it shows an error. Its noindex lives in
      // app/reset-password/layout.tsx.
      disallow: ['/_next/', '/reset-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
