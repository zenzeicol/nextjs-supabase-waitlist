// Version of the Privacy Policy / Terms that the waitlist form asks people to
// accept.
//
// It is a single source on purpose: the legal page (app/legal/page.tsx) shows
// this value on screen, and the waitlist Server Action stores the same value in
// waitlist_lead.policy_version. If the string were typed in two places, the day
// you publish a new version the page would say one thing and the database would
// record another, and the consent record would stop proving what was accepted.
//
// Bump it every time the policy text changes.
export const POLICY_VERSION = '1.0'

// Shown next to the version on the legal page.
export const POLICY_UPDATED = '2026-01-01'
