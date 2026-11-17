import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Only public, indexable routes. Left out: /reset-password (only useful with
// the token from the recovery email) and /legal (placeholder text with
// noindex). A page enters here the same day it drops `robots: { index: false }`:
// listing a noindex page in the sitemap sends search engines two contradictory
// signals.
//
// No `lastModified`: the only value available here is the build date, which
// changes on every deploy even if the page did not. A lying lastmod ends up
// ignored by crawlers.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // Indexable on purpose: it is the URL you declare in app store forms
      // that require an account deletion link, and the one people search for.
      url: `${SITE_URL}/account-deletion`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
