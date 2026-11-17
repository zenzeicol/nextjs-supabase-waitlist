// Cloudflare Turnstile verification for the public forms.
//
// THIS IS A SERVER-ONLY SECRET, and that is what sets it apart from
// lib/supabase.ts. Those two variables are NEXT_PUBLIC_*: Next inlines them
// into the browser bundle at build time, and that is fine, because the anon key
// is public by design. TURNSTILE_SECRET_KEY is not: without the prefix, Next
// never puts it in the bundle and it only exists in the server process. Adding
// NEXT_PUBLIC_ out of habit would publish it in the page's JS, and with it
// anyone could forge verifications from their own machine.
//
// `import 'server-only'` is the seatbelt: if someone ever imports this module
// from a Client Component, the build fails instead of shipping the key to the
// browser.
import 'server-only'

const secret = process.env.TURNSTILE_SECRET_KEY

// NOTE: this does NOT fail the build. This module is only imported by
// lib/waitlist-action.ts, which is 'use server', and module-level code of a
// Server Action does not run at compile time: it runs on the first request that
// uses it. So a missing variable is discovered by the first person who submits
// the form, not by the deploy. Set it in your hosting provider before deploying.
if (!secret) {
  throw new Error(
    'Missing TURNSTILE_SECRET_KEY. Copy .env.example to .env.local, or set it in your hosting provider.'
  )
}

// The secret was validated above; from here on it is a string.
const SECRET = secret

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// The Cloudflare widget sends the token in this field. Turnstile picks the
// name, not us.
export const TOKEN_FIELD = 'cf-turnstile-response'

// Turnstile either answers fast or not at all. 10s is plenty for a POST to
// Cloudflare and keeps a hang on their side from leaving the Server Action
// waiting until the platform timeout.
const TIMEOUT_MS = 10_000

/**
 * Verifies the widget token against Cloudflare.
 *
 * FAIL CLOSED: returns false both when Cloudflare rejects the token and when it
 * could not be asked (timeout, DNS, a 500 on their side). The alternative
 * (saving anyway when verification is unavailable) turns the captcha into
 * decoration exactly when it matters most: cutting the connection to
 * Cloudflare would be enough to bypass it. If Cloudflare is down, sign-ups stop
 * until it comes back; that is the accepted cost of a check that cannot be
 * evaded.
 *
 * The return value does not distinguish the reason on purpose: the caller has
 * nothing different to decide based on it, and Cloudflare's error codes stay
 * in the server log.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false

  // The endpoint expects form-encoded data, not JSON.
  const body = new URLSearchParams({ secret: SECRET, response: token })

  let response: Response

  try {
    response = await fetch(SITEVERIFY, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    // Timeout or network error. We could not ask, so it does not pass.
    console.error('[turnstile] could not verify:', (error as Error).message)
    return false
  }

  if (!response.ok) {
    console.error('[turnstile] siteverify responded', response.status)
    return false
  }

  const data = (await response.json()) as {
    success: boolean
    'error-codes'?: string[]
  }

  if (!data.success) {
    // The useful codes are invalid-input-response (fake or already used token)
    // and timeout-or-duplicate (expired or resubmitted token). Both are normal
    // in production and do not warrant an alarm, but without the log there is
    // no way to tell whether the widget is misconfigured.
    console.error('[turnstile] rejected:', data['error-codes']?.join(', ') ?? 'no code')
    return false
  }

  return true
}
