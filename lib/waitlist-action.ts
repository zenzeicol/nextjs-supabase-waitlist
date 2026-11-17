'use server'

import { after } from 'next/server'

import { isPlatform } from './platform'
import { POLICY_VERSION } from './policy'
import { BRAND_NAME } from './site'
import { supabase } from './supabase'
import { TOKEN_FIELD, verifyTurnstile } from './turnstile'
import { sendWelcomeEmail } from './welcome-email'

export type WaitlistState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

// At least one digit. A full phone-number format is NOT enforced on purpose:
// people type "+1 (555) 010-0100", paste numbers with dashes or extra spaces,
// and rejecting that means losing a sign-up over a format that is perfectly
// understandable. What is stopped is input that is not a phone number at all.
// The CHECK constraint in the database is even looser: length only.
const PHONE_RE = /\d/

// These limits are stricter than the database CHECK constraints, which is the
// right direction: the database is the safety ceiling, the Server Action is the
// product rule.
const NAME_MIN = 2
const NAME_MAX = 60
const PHONE_MIN = 7
const PHONE_MAX = 20

// The form sends value="true"; 'on' is what a checkbox without a value would
// send, so that removing that attribute does not open the gate by accident.
const VALID_CONSENT = new Set(['true', 'on'])

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  // Honeypot: bots fill in every field, people never see this one. Same
  // message as a real success, so the response does not reveal the filter.
  if (formData.get('company')) {
    return { status: 'ok', message: "You're on the list." }
  }

  // Turnstile before anything else: if there is no person on the other side,
  // it is not worth validating the fields or, above all, touching Supabase. It
  // is the only check that costs a network call, so it is also the one that
  // should cut things short earliest.
  //
  // Fail closed: verifyTurnstile returns false both when Cloudflare rejects the
  // token and when it could not be asked. See lib/turnstile.ts for why.
  const isHuman = await verifyTurnstile(String(formData.get(TOKEN_FIELD) ?? ''))

  if (!isHuman) {
    return {
      status: 'error',
      message: "We couldn't verify that you're a person. Reload the page and try again.",
    }
  }

  // Consent. This is THE validation, not a second opinion: the disabled button
  // and the checkbox's `required` are browser UX helpers, and a direct POST to
  // the Server Action skips them. It runs before touching any personal data:
  // without consent there is nothing to store.
  const consent = String(formData.get('consent') ?? '')

  if (!VALID_CONSENT.has(consent)) {
    return {
      status: 'error',
      message: 'We need your consent to process your data before saving your email.',
    }
  }

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!email) {
    return { status: 'error', message: 'Enter your email to continue.' }
  }

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { status: 'error', message: "That email doesn't look valid. Check it and try again." }
  }

  const name = String(formData.get('name') ?? '')
    .trim()
    // Collapses inner whitespace: "Ada    Lovelace" pasted from elsewhere is
    // stored as "Ada Lovelace". It does not change the name, only its spacing.
    .replace(/\s+/g, ' ')

  if (!name) {
    return { status: 'error', message: 'Enter your name to continue.' }
  }

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return {
      status: 'error',
      message: `That name doesn't look valid. It must be between ${NAME_MIN} and ${NAME_MAX} characters.`,
    }
  }

  // Stored exactly as typed, without normalizing to digits only or prepending
  // a country code. Normalizing would force a canonical format nobody needs
  // yet, and would lose what the person actually wrote.
  const phone = String(formData.get('phone') ?? '').trim()

  if (!phone) {
    return { status: 'error', message: 'Enter your phone number to continue.' }
  }

  if (phone.length < PHONE_MIN || phone.length > PHONE_MAX || !PHONE_RE.test(phone)) {
    return {
      status: 'error',
      message: "That phone number doesn't look valid. Check it and try again.",
    }
  }

  // A closed list, not free text: the CHECK constraint accepts exactly these
  // values, and both the form and this check read them from lib/platform.ts.
  // No trim or toLowerCase on purpose: nobody types this value, it comes from
  // the radio button's `value` attribute, so anything other than
  // 'android'/'ios' is not a typo to forgive but a POST that did not come from
  // the form.
  //
  // One message for both "didn't pick" and "picked something that doesn't
  // exist": the second can only come from a raw POST, and for someone filling
  // in the form both are fixed the same way.
  const platform = String(formData.get('platform') ?? '')

  if (!isPlatform(platform)) {
    return {
      status: 'error',
      message: `Choose whether you'll use ${BRAND_NAME} on Android or iOS.`,
    }
  }

  const utmRaw = String(formData.get('utm_source') ?? '').trim()
  const utm_source = utmRaw ? utmRaw.slice(0, 120) : null

  // consent_at and policy_version are set by the server, not the client: they
  // are the evidence that this row went through the validation above and of
  // WHICH document was accepted. Neither column has a default on purpose (see
  // the migration), so an insert that omits them fails.
  //
  // policy_version comes from lib/policy.ts, the same constant the legal page
  // shows on screen: a single source, so a different version from the one that
  // was displayed can never be recorded.
  //
  // No .select() chained: anon has INSERT but not SELECT.
  const { error } = await supabase.from('waitlist_lead').insert({
    email,
    name,
    phone,
    platform,
    utm_source,
    consent_at: new Date().toISOString(),
    policy_version: POLICY_VERSION,
  })

  if (error) {
    // 23505 = unique_violation. Already signed up; for the person it's a success.
    if (error.code === '23505') {
      return { status: 'ok', message: "You were already on the list. We'll let you know as soon as we open." }
    }
    console.error('[waitlist] insert failed:', error.message)
    return {
      status: 'error',
      message: "We couldn't save your email. Please try again in a moment.",
    }
  }

  // The email goes AFTER the response, not inside it. `after` from next/server
  // schedules the function for when the Server Action has already returned,
  // which turns "the email can never break the insert" into something
  // structural instead of a promise of good behavior: even if sendWelcomeEmail
  // hung for ten seconds or blew up, it cannot delay or change what the person
  // sees, because by the time it runs they have already seen it. The try/catch
  // in lib/welcome-email.ts is still needed, so a failure shows up as a
  // readable log line and not as an unhandled rejection.
  //
  // It sits right here, after `if (error)`, on purpose: this point is only
  // reached when the row is NEW. The 23505 branch above already returned, so a
  // double submit does not trigger a second email.
  after(() => sendWelcomeEmail(email, name))

  return { status: 'ok', message: "You're on the list. We'll write to you as soon as a spot opens up." }
}
