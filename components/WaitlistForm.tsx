'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { joinWaitlist, type WaitlistState } from '@/lib/waitlist-action'
import { PLATFORMS } from '@/lib/platform'
import { BRAND_NAME } from '@/lib/site'

const INITIAL: WaitlistState = { status: 'idle' }

// The PUBLIC widget key. It carries NEXT_PUBLIC_ because it has to reach the
// browser; the private one (TURNSTILE_SECRET_KEY) lives only on the server, in
// lib/turnstile.ts, and is never imported from here.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// `render=explicit` instead of automatic rendering: we need the widget id to be
// able to reset it. The Turnstile token is single-use, so after any server
// error the widget must issue a new one or every retry fails with the same
// message.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileAPI = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
      theme?: 'light' | 'dark' | 'auto'
    }
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

// "Hydrated yet?" without setState in an effect: false in the static HTML, true
// as soon as React takes over. It keeps the button from being disabled in the
// HTML: without JS nothing could re-enable it and the form would be dead (there,
// consent is enforced by the checkbox's `required`). Once hydrated, the
// checkbox state and the Turnstile token are in charge.
const NO_SUBSCRIPTION = () => () => {}
const ON_CLIENT = () => true
const ON_SERVER = () => false

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(joinWaitlist, INITIAL)
  const [consented, setConsented] = useState(false)
  const [token, setToken] = useState('')
  // Controlled inputs: React 19 resets the form after running an `action`, so a
  // server error would wipe every field and force the person to retype it all.
  // With their own state they survive the re-render and the person only fixes
  // what failed.
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  // Starts empty on purpose: neither option is preselected, so the choice is
  // the person's and not the default's. It is state for the same reason as the
  // other fields (surviving React 19's reset after an error) and also because a
  // radio checked by the user cannot be "unchecked": without state, the reset
  // would leave the DOM clean but the value lost.
  const [platform, setPlatform] = useState('')
  const hydrated = useSyncExternalStore(NO_SUBSCRIPTION, ON_CLIENT, ON_SERVER)
  const utmRef = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)

  // Read from the query string on the client so we neither force a Suspense
  // boundary with useSearchParams nor take the page out of static rendering.
  // Written straight to the input (not to state) to avoid re-rendering the form.
  useEffect(() => {
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm && utmRef.current) utmRef.current.value = utm
  }, [])

  // Load the script and render the widget. Only once: the dependencies are
  // empty and `widgetRef` stops StrictMode's double render in development,
  // which would otherwise leave two widgets stacked.
  useEffect(() => {
    if (!SITE_KEY) {
      console.error(
        '[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing. The form cannot be submitted without the widget.'
      )
      return
    }

    let cancelled = false

    function mountWidget() {
      if (cancelled || widgetRef.current !== null) return
      if (!window.turnstile || !turnstileRef.current) return

      widgetRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: SITE_KEY as string,
        callback: setToken,
        // The token expires after ~5 minutes. If someone leaves the form open
        // and comes back, the button disables itself instead of failing on
        // submit.
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
        theme: 'dark',
      })
    }

    if (window.turnstile) {
      mountWidget()
      return
    }

    // It may already exist if another component loaded it, or if this effect
    // was remounted: two <script> tags with the same src would load Turnstile
    // twice.
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)

    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', mountWidget)

    return () => {
      cancelled = true
      script?.removeEventListener('load', mountWidget)

      if (widgetRef.current !== null) {
        // Cloudflare throws if the widget no longer exists (e.g. because the
        // node went away with the unmount). Nothing to do about it.
        try {
          window.turnstile?.remove(widgetRef.current)
        } catch {}
        widgetRef.current = null
      }
    }
  }, [])

  // The token is single-use: Cloudflare invalidates it when verifying. It is
  // cleared ON SUBMIT and not in a later effect because that is the moment it is
  // actually spent; an effect would only find out afterwards, and meanwhile the
  // button would stay enabled with a burnt token.
  function submit(formData: FormData) {
    setToken('')
    formAction(formData)
  }

  // This IS synchronization with an external system: asking the widget for a
  // new token. Without it, the second attempt after an error always fails with
  // "timeout-or-duplicate" and the person is stuck. `reset()` does not fire
  // expired-callback, which is why the token was already cleared above.
  useEffect(() => {
    if (state.status !== 'error' || widgetRef.current === null) return

    try {
      window.turnstile?.reset(widgetRef.current)
    } catch {}
  }, [state])

  if (state.status === 'ok') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="glass mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl px-6 py-8 text-center shadow-glow"
      >
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint/30" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-mint text-navy">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </span>

        <div>
          <p className="text-lg font-semibold text-white">Done, you’re in</p>
          <p className="mt-1.5 text-pretty text-sm text-slate-300">{state.message}</p>
        </div>
      </div>
    )
  }

  const field =
    'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 transition-colors duration-200 hover:border-white/20 focus:border-mint/60 focus:bg-white/[0.06]'

  // Same base as `field` so both controls read as one family; it only adds the
  // checked state. `peer-focus-visible` instead of `peer-focus` because the
  // radio gets focus on click, and a ring there is noise.
  const option =
    'flex cursor-pointer items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-[15px] text-slate-300 transition-colors duration-200 hover:border-white/20 peer-checked:border-mint/60 peer-checked:bg-mint/10 peer-checked:text-white peer-focus-visible:border-mint/60 peer-focus-visible:ring-2 peer-focus-visible:ring-mint/40'

  const describedBy = state.status === 'error' ? 'waitlist-error' : undefined

  return (
    <form action={submit} className="mx-auto w-full max-w-xl">
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="name" className="sr-only">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={60}
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={describedBy}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="phone" className="sr-only">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-describedby={describedBy}
              className={field}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="email" className="sr-only">
              Your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={describedBy}
              className={field}
            />
          </div>
        </div>

        {/* No option preselected on purpose: which platform each sign-up wants
            is exactly the data point being measured, and a default would
            pollute it with everyone who didn't pay attention. For the same
            reason it is not inferred from the user agent: we ask. */}
        <fieldset aria-describedby={describedBy}>
          <legend className="mb-2 text-[13px] text-slate-400">
            Which phone will you use {BRAND_NAME} on?
          </legend>

          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map(({ value, label }) => (
              <label key={value} className="relative block">
                {/* sr-only rather than `hidden`: the radio is still there for
                    keyboard and screen reader users, and `peer` lets the
                    sibling <span> paint the state. `required` on both makes
                    the whole group mandatory; the validation that cannot be
                    skipped is still the Server Action's. */}
                <input
                  type="radio"
                  name="platform"
                  value={value}
                  required
                  checked={platform === value}
                  onChange={() => setPlatform(value)}
                  className="peer sr-only"
                />
                <span className={option}>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Anti-spam honeypot: invisible to people, tempting to bots. It stays
            even with Turnstile: it costs nothing and catches dumb bots without
            spending a network call to Cloudflare. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
        <input type="hidden" name="utm_source" ref={utmRef} defaultValue="" />

        {/* Turnstile injects its iframe and the hidden cf-turnstile-response input here. */}
        <div ref={turnstileRef} className="min-h-[65px]" />

        <button
          type="submit"
          disabled={isPending || (hydrated && (!consented || !token))}
          className="group relative shrink-0 overflow-hidden rounded-xl bg-mint px-6 py-3.5 text-[15px] font-semibold text-navy transition-all duration-200 hover:bg-white hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative z-10">{isPending ? 'Saving...' : 'Join the waitlist'}</span>
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 text-left">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          value="true"
          required
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-mint"
        />
        <label htmlFor="consent" className="text-[13px] leading-relaxed text-slate-400">
          I accept the{' '}
          {/* New tab on purpose: going back would empty the already filled form. */}
          <Link
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-mint underline decoration-mint/40 underline-offset-2 transition-colors duration-200 hover:text-white hover:decoration-white/60"
          >
            Privacy Policy and Terms
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>{' '}
          of {BRAND_NAME} and authorize the use of my name, phone number and email to
          contact me about the launch.
        </label>
      </div>

      {state.status === 'error' && (
        <p id="waitlist-error" role="alert" className="mt-3 text-sm text-[#F87171]">
          {state.message}
        </p>
      )}
    </form>
  )
}
