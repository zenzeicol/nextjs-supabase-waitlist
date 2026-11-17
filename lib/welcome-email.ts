// Waitlist welcome email, sent through Resend. OPTIONAL: the site works
// without RESEND_API_KEY.
//
// WHY THIS MODULE DOES NOT LOOK LIKE lib/turnstile.ts
//
// turnstile.ts validates its secret at module level and throws if it is
// missing. Copying that pattern here would break the most important invariant
// of the form: lib/waitlist-action.ts imports this module at the top, so a
// throw while loading it would take down the WHOLE Server Action (insert
// included), and a misconfigured environment variable would silently stop
// saving sign-ups. It is not hypothetical: `new Resend(undefined)` throws
// 'Missing API key' inside the constructor.
//
// Hence the two rules of this file:
//
//   1. The Resend client is built LATE, inside the function, never on import.
//      Importing the class does not instantiate it, so the import below can
//      stay where it is.
//
//   2. Nothing that happens here leaves this file. The function does not
//      return a status or rethrow: it logs and returns. The email is an extra;
//      the sign-up is the product.
//
// Turnstile fails CLOSED (no verification, no insert). This module fails OPEN
// (no email, the sign-up still counts). Each choice matches what is at stake.
import 'server-only'

import { Resend } from 'resend'

import { BRAND_NAME, EMAIL_FROM, EMAIL_REPLY_TO, TAGLINE } from './site'

const SUBJECT = `You're on the ${BRAND_NAME} waitlist`

const BACKGROUND = '#0F1B3D'
const ACCENT = '#5EEAD4'

/**
 * Escapes the name before interpolating it into HTML.
 *
 * `name` comes from the form, i.e. from outside. Without this, a name with `<`
 * or `&` breaks the email markup, and one with `<img onerror=...>` turns it
 * into an HTML injection against the recipient's email client. The Server
 * Action validates length and collapses whitespace but does not filter
 * characters (on purpose, because real names contain them), so the escaping
 * has to happen here, exactly where text becomes markup.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlBody(name: string): string {
  const safe = escapeHtml(name)
  const font = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${BRAND_NAME}</title>
<style>
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BACKGROUND};">
  <!-- Preheader (hidden, shown as the preview in the inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${BACKGROUND};">
    You're on the ${BRAND_NAME} waitlist. We'll be in touch soon.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BACKGROUND};">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <tr>
            <td class="email-padding" style="padding:0 40px 32px 40px;${font}font-size:22px;font-weight:800;color:#FFFFFF;">
              ${BRAND_NAME}
            </td>
          </tr>
          <tr>
            <td class="email-padding" style="padding:0 40px;">
              <h1 style="margin:0 0 24px 0;${font}font-size:28px;line-height:1.25;font-weight:700;color:#FFFFFF;">
                Hi ${safe},
              </h1>
              <p style="margin:0 0 20px 0;${font}font-size:16px;line-height:1.6;color:#CBD5E1;">
                You're on the ${BRAND_NAME} waitlist. Thanks for your interest.
              </p>
              <p style="margin:32px 0 8px 0;${font}font-size:16px;line-height:1.5;font-weight:700;color:${ACCENT};">
                What's next?
              </p>
              <p style="margin:0 0 20px 0;${font}font-size:16px;line-height:1.6;color:#CBD5E1;">
                We'll contact you as soon as early access opens.
              </p>
              <p style="margin:0 0 32px 0;${font}font-size:16px;line-height:1.6;color:#CBD5E1;">
                Questions? Reply to <a href="mailto:${EMAIL_REPLY_TO}" style="color:${ACCENT};text-decoration:underline;">${EMAIL_REPLY_TO}</a>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #1E2F5A;padding-top:24px;">
                    <p style="margin:0 0 4px 0;${font}font-size:15px;line-height:1.5;color:#FFFFFF;">
                      — The ${BRAND_NAME} team
                    </p>
                    <p style="margin:0;${font}font-size:14px;line-height:1.5;color:#7C8DB5;">
                      ${TAGLINE}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Plain-text version of the same message. Always sent alongside the HTML: a
// multipart email scores better with spam filters than HTML-only, and it is
// what clients with HTML or images turned off show. The name goes in raw here
// because there is no markup to break.
function textBody(name: string): string {
  return `Hi ${name},

You're on the ${BRAND_NAME} waitlist. Thanks for your interest.

WHAT'S NEXT?
We'll contact you as soon as early access opens.

Questions? Reply to ${EMAIL_REPLY_TO}.

— The ${BRAND_NAME} team
${TAGLINE}`
}

/**
 * Sends the welcome email. NEVER throws.
 *
 * Every error path ends in a console.error and a return: missing API key,
 * rejection by the Resend API, and network failure. The caller has nothing to
 * decide with the result (the sign-up was saved before this runs), so the
 * function returns nothing.
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  // No NEXT_PUBLIC_ prefix, so Next never puts it in the browser bundle: it
  // only exists in the server process. Adding the prefix "to make it work"
  // would publish it.
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is missing, welcome email not sent')
    return
  }

  try {
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send(
      {
        from: EMAIL_FROM,
        to: email,
        replyTo: EMAIL_REPLY_TO,
        subject: SUBJECT,
        html: htmlBody(name),
        text: textBody(name),
      },
      {
        // Second seatbelt against double sending. The first is not calling
        // this function when the insert returns 23505 (see
        // lib/waitlist-action.ts); this one covers the rare case of two
        // concurrent requests that both believe they inserted. Resend drops
        // the repeated one instead of sending the email twice.
        idempotencyKey: `waitlist-welcome-${email}`,
      }
    )

    // The SDK does NOT throw when the API responds with an error: it returns it
    // in `error` and leaves `data` null. Without this branch, a rejection
    // (revoked key, misconfigured domain, invalid recipient) would pass as
    // success.
    if (error) {
      console.error('[email] Resend rejected the send:', error.message)
      return
    }
  } catch (error) {
    // Network failures and any throw from the constructor land here. Swallowed
    // on purpose: see the header of this file.
    console.error('[email] could not send the welcome email:', (error as Error).message)
  }
}
