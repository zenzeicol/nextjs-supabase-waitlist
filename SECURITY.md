# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub's private vulnerability reporting: open the
repository's **Security** tab and choose **Report a vulnerability**. Include
steps to reproduce, the affected file or route, and the impact you expect.

You can expect an acknowledgement within a few days. This is a template
maintained on a best-effort basis; fixes land on the `main` branch.

## Scope

In scope:

- The RLS / grant setup in `supabase/migrations` (for example, a way to read,
  update or delete rows with the anon key).
- Secrets reaching the browser bundle (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`).
- Bypassing server-side validation, the consent record, the honeypot or the
  Turnstile check in the Server Actions.
- Issues in the password reset flow (`app/reset-password`).

Out of scope:

- The anon key or the Turnstile site key being visible: they are public by
  design.
- Cloudflare's published Turnstile test keys in `.env.example`.
- Vulnerabilities in your own deployment's configuration (dashboard settings,
  email templates, keys you committed).

## If you deploy this template

- Never put the `service_role` key in this app or in any `NEXT_PUBLIC_*`
  variable.
- Replace the Turnstile test keys with your own before going live.
- Run `supabase test db` after every schema change.
