'use server'

import { BRAND_NAME } from './site'
import { supabase } from './supabase'

export type AccountDeletionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

// The form sends value="true"; 'on' is what a checkbox without a value would
// send, so that removing that attribute does not open the gate by accident.
const VALID_CONFIRMATION = new Set(['true', 'on'])

const OK_MESSAGE = `We'll verify that this email belongs to an existing ${BRAND_NAME} account. Once verified, we'll delete it and confirm to that same address.`

export async function requestAccountDeletion(
  _prev: AccountDeletionState,
  formData: FormData
): Promise<AccountDeletionState> {
  // Honeypot: bots fill in every field, people never see this one. Same message
  // as a real success, so the response does not reveal the filter.
  if (formData.get('company')) {
    return { status: 'ok', message: OK_MESSAGE }
  }

  // Explicit confirmation. This is THE validation, not a second opinion: the
  // disabled button and the checkbox's `required` are browser UX helpers, and a
  // direct POST to the Server Action skips them. It runs before touching the
  // email: without confirmation there is no request to record.
  const confirmation = String(formData.get('confirmation') ?? '')

  if (!VALID_CONFIRMATION.has(confirmation)) {
    return {
      status: 'error',
      message: 'Tick the confirmation box to send your deletion request.',
    }
  }

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!email) {
    return { status: 'error', message: 'Enter the email of your account to continue.' }
  }

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return {
      status: 'error',
      message: "That email doesn't look valid. Check it and try again.",
    }
  }

  // confirmed_at is set by the server, not the client: it is the evidence that
  // this row went through the validation above. The column has no default on
  // purpose, so an insert that omits it fails instead of recording a request
  // nobody confirmed.
  //
  // No .select() chained: anon has INSERT but not SELECT, and reading back the
  // freshly written row would fail with 42501.
  const { error } = await supabase
    .from('account_deletion_request')
    .insert({ email, confirmed_at: new Date().toISOString() })

  if (error) {
    // No unique constraint on `email` on purpose: asking for deletion twice is
    // legitimate, and deduplication happens when processing, not here.
    console.error('[account-deletion] insert failed:', error.message)
    return {
      status: 'error',
      message: "We couldn't record your request. Please try again in a moment.",
    }
  }

  return { status: 'ok', message: OK_MESSAGE }
}
