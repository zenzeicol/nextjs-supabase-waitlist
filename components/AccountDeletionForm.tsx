'use client'

import { useActionState, useState, useSyncExternalStore } from 'react'
import { requestAccountDeletion, type AccountDeletionState } from '@/lib/account-deletion'
import { BRAND_NAME } from '@/lib/site'

const INITIAL: AccountDeletionState = { status: 'idle' }

// "Hydrated yet?" without setState in an effect: false in the static HTML, true
// as soon as React takes over. It keeps the button from being disabled in the
// HTML: without JS nothing could re-enable it and the form would be dead (there,
// confirmation is enforced by the checkbox's `required`). Once hydrated, the
// checkbox state is in charge.
const NO_SUBSCRIPTION = () => () => {}
const ON_CLIENT = () => true
const ON_SERVER = () => false

export function AccountDeletionForm() {
  const [state, formAction, isPending] = useActionState(requestAccountDeletion, INITIAL)
  const [confirmed, setConfirmed] = useState(false)
  const hydrated = useSyncExternalStore(NO_SUBSCRIPTION, ON_CLIENT, ON_SERVER)

  if (state.status === 'ok') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="glass flex flex-col items-start gap-4 rounded-2xl px-6 py-7"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-navy">
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

        <div>
          <p className="text-lg font-semibold text-white">We received your request</p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-slate-300">
            {state.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="glass rounded-2xl px-6 py-7">
      <label htmlFor="email" className="block text-sm font-medium text-white">
        Email of your {BRAND_NAME} account
      </label>
      <p className="mt-1 text-[13px] text-slate-400">
        Use the same email you sign in with.
      </p>

      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        aria-describedby={state.status === 'error' ? 'deletion-error' : undefined}
        className="mt-3 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 transition-colors duration-200 hover:border-white/20 focus:border-mint/60 focus:bg-white/[0.06]"
      />

      {/* Anti-spam honeypot: invisible to people, tempting to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <div className="mt-5 flex items-start gap-3">
        <input
          id="confirmation"
          name="confirmation"
          type="checkbox"
          value="true"
          required
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-mint"
        />
        <label htmlFor="confirmation" className="text-[13px] leading-relaxed text-slate-300">
          I confirm that I want to delete my {BRAND_NAME} account and the data associated
          with it.
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || (hydrated && !confirmed)}
        className="mt-6 w-full rounded-xl bg-mint px-6 py-3.5 text-[15px] font-semibold text-navy transition-all duration-200 hover:bg-white hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Sending...' : 'Send deletion request'}
      </button>

      {state.status === 'error' && (
        <p id="deletion-error" role="alert" className="mt-3 text-sm text-[#F87171]">
          {state.message}
        </p>
      )}
    </form>
  )
}
