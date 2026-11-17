// Brand and site configuration: the single place to rebrand this template.
//
// Everything that shows the brand (metadata, header, footer, hero, OG card,
// manifest, welcome email) reads from here. If each one had its own copy, the
// day the name or domain changes one of them would be left behind.

export const BRAND_NAME = 'Acme'

// Split in three so the middle word can get the accent color in the hero and
// the footer. TAGLINE is the flat version for places that cannot be styled
// (<title>, og:title, alt text).
export const TAGLINE_PART_1 = 'Plan.'
export const TAGLINE_PART_2 = 'Build.'
export const TAGLINE_PART_3 = 'Launch.'
export const TAGLINE = `${TAGLINE_PART_1} ${TAGLINE_PART_2} ${TAGLINE_PART_3}`

// Canonical production URL. Shared by metadataBase, robots.ts, sitemap.ts and
// the JSON-LD. Set NEXT_PUBLIC_SITE_URL in your deployment; the fallback is a
// placeholder domain.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.example.com'

export const DESCRIPTION = `${TAGLINE} Join the ${BRAND_NAME} waitlist and be the first to know when early access opens.`

// Public contact address, shown in the footer.
export const CONTACT_EMAIL = 'hello@example.com'

// Sender and reply-to for the welcome email (lib/welcome-email.ts). The sender
// domain must be verified in your Resend account.
export const EMAIL_FROM = `${BRAND_NAME} <noreply@example.com>`
export const EMAIL_REPLY_TO = 'support@example.com'
