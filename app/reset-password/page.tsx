'use client'

import { useEffect, useRef, useState, type FormEvent, type Ref } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  createClient,
  isAuthRetryableFetchError,
  type AuthError,
  type SupabaseClient,
} from '@supabase/supabase-js'
import { BRAND_NAME } from '@/lib/site'

const MIN_PASSWORD_LENGTH = 8

// Target of the link in the Supabase Auth "Reset Password" email. The template
// (in the Supabase dashboard, outside this repo) builds the URL with
// token_hash and type=recovery; see the README.
//
// Verification does NOT run on load: many mail filters (Outlook Safe Links,
// corporate antivirus) open every link to scan it, and if the page spent the
// token on load, the person would arrive at an already used link. That is why
// the first step is a button.

type Step = 'initial' | 'form' | 'done' | 'expired'

// The client in lib/supabase.ts is server-only; this one lives in the browser
// and is created on the first click, not when the module loads. The recovery
// session stays in memory only (persistSession: false): it never touches
// localStorage and disappears when the tab closes. detectSessionInUrl is off
// because the token is consumed by verifyOtp by hand, not by the client on
// startup.
let supabaseClient: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return supabaseClient
}

// Errors where retrying makes sense: the response never arrived, the server
// failed, or there is rate limiting. Anything else from verifyOtp means the
// token is no good (expired, already used or mangled).
function isRetryable(error: AuthError): boolean {
  return isAuthRetryableFetchError(error) || error.status === 429 || (error.status ?? 0) >= 500
}

function retryMessage(error: AuthError | null, action: string): string {
  if (error?.status === 429) {
    return 'Too many attempts in a row. Wait a moment and try again.'
  }
  return `We couldn't ${action}. Check your connection and try again.`
}

export default function ResetPassword() {
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const linkComplete = Boolean(tokenHash) && searchParams.get('type') === 'recovery'

  const [step, setStep] = useState<Step>('initial')
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmationError, setConfirmationError] = useState<string | null>(null)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<HTMLInputElement>(null)

  // When the step changes the content is replaced entirely, and the button
  // that had focus disappears. Focus moves to where the task continues (the
  // first field) or to the title, so keyboard and screen reader users are not
  // left on <body>. On load it is left alone: there, focus belongs to the
  // browser.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (step === 'form') passwordRef.current?.focus()
    else titleRef.current?.focus()
  }, [step])

  async function verify() {
    if (loading || !tokenHash) return
    setLoading(true)
    setGeneralError(null)

    try {
      const { data, error } = await getClient().auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })

      if (error) {
        if (isRetryable(error)) {
          setGeneralError(retryMessage(error, 'verify your link'))
        } else {
          setStep('expired')
        }
        return
      }
      if (!data.session) {
        setStep('expired')
        return
      }

      setEmail(data.user?.email ?? null)
      setStep('form')
    } catch (error) {
      console.error('[reset-password] verifyOtp', error)
      setGeneralError(retryMessage(null, 'verify your link'))
    } finally {
      setLoading(false)
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const lengthError =
      password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : null
    const matchError = confirmation !== password ? "The passwords don't match." : null

    setPasswordError(lengthError)
    setConfirmationError(lengthError ? null : matchError)
    setGeneralError(null)

    if (lengthError) {
      passwordRef.current?.focus()
      return
    }
    if (matchError) {
      confirmationRef.current?.focus()
      return
    }

    setLoading(true)
    const supabase = getClient()

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setLoading(false)
        if (error.code === 'weak_password') {
          setPasswordError(
            'That password is too easy to guess. Try a longer one, or mix letters, numbers and symbols.'
          )
          passwordRef.current?.focus()
        } else if (error.code === 'same_password') {
          setPasswordError('The new password must be different from your current one.')
          passwordRef.current?.focus()
        } else if (
          error.status === 401 ||
          error.code === 'session_not_found' ||
          error.code === 'session_expired' ||
          error.code === 'bad_jwt'
        ) {
          // The recovery session expired between the click and the submit.
          setStep('expired')
        } else {
          setGeneralError(retryMessage(error, 'save your password'))
        }
        return
      }
    } catch (error) {
      console.error('[reset-password] updateUser', error)
      setLoading(false)
      setGeneralError(retryMessage(null, 'save your password'))
      return
    }

    // The password has changed. signOut (global scope by default) revokes the
    // recovery session and any other session opened with the old password. If
    // it fails nothing changes for the person: the change is already done.
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[reset-password] signOut', error)
    }

    setPassword('')
    setConfirmation('')
    setLoading(false)
    setStep('done')
  }

  if (!linkComplete) {
    return (
      <LinkUnusable
        titleRef={titleRef}
        title="This link is incomplete"
        text="It is missing the information needed to reset your password; it may have been cut off when copied."
      />
    )
  }

  if (step === 'expired') {
    return (
      <LinkUnusable
        titleRef={titleRef}
        title="This link has expired or was already used"
        text="For security, each link works only once and for a limited time."
      />
    )
  }

  if (step === 'done') {
    return (
      <div>
        <StatusIcon kind="ok" />
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mt-6 text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white focus:outline-none focus-visible:ring-0 sm:text-4xl"
        >
          Done, your password has changed.
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-slate-300">
          Go back to the app and sign in.
        </p>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white focus:outline-none focus-visible:ring-0 sm:text-4xl"
        >
          Choose your new password
        </h1>
        {email && (
          <p className="mt-4 text-pretty leading-relaxed text-slate-300">
            For the account <span className="font-medium text-white">{email}</span>
          </p>
        )}

        <form onSubmit={save} noValidate className="glass mt-8 rounded-2xl px-6 py-7">
          {/* So the password manager saves the new password under the right
              email. Not visible and never focused. */}
          {email && (
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={email}
              readOnly
              tabIndex={-1}
              aria-hidden
              className="sr-only"
            />
          )}

          <PasswordField
            id="password"
            label="New password"
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            value={password}
            onChange={(value) => {
              setPassword(value)
              setPasswordError(null)
            }}
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            error={passwordError}
            inputRef={passwordRef}
          />

          <div className="mt-5">
            <PasswordField
              id="confirmation"
              label="Confirm the password"
              value={confirmation}
              onChange={(value) => {
                setConfirmation(value)
                setConfirmationError(null)
              }}
              visible={showConfirmation}
              onToggle={() => setShowConfirmation((v) => !v)}
              error={confirmationError}
              inputRef={confirmationRef}
            />
          </div>

          <PrimaryButton loading={loading} loadingText="Saving...">
            Save password
          </PrimaryButton>

          {generalError && <ErrorMessage>{generalError}</ErrorMessage>}
        </form>
      </>
    )
  }

  return (
    <>
      <h1
        ref={titleRef}
        tabIndex={-1}
        className="text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white focus:outline-none focus-visible:ring-0 sm:text-4xl"
      >
        Reset your password
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-slate-300">
        Tap Continue to verify your link and choose a new password.
      </p>

      <div className="glass mt-8 rounded-2xl px-6 py-7">
        <PrimaryButton loading={loading} loadingText="Verifying..." onClick={verify}>
          Continue
        </PrimaryButton>
        {generalError && <ErrorMessage>{generalError}</ErrorMessage>}
      </div>
    </>
  )
}

function LinkUnusable({
  titleRef,
  title,
  text,
}: {
  titleRef: Ref<HTMLHeadingElement>
  title: string
  text: string
}) {
  return (
    <div>
      <StatusIcon kind="error" />
      <h1
        ref={titleRef}
        tabIndex={-1}
        className="mt-6 text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white focus:outline-none focus-visible:ring-0 sm:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-slate-300">{text}</p>
      <p className="mt-3 text-pretty leading-relaxed text-slate-300">
        Open the {BRAND_NAME} app and request a password reset again to get a new link
        by email.
      </p>
    </div>
  )
}

function PasswordField({
  id,
  label,
  hint,
  value,
  onChange,
  visible,
  onToggle,
  error,
  inputRef,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  error: string | null
  inputRef: Ref<HTMLInputElement>
}) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-[13px] text-slate-400">
          {hint}
        </p>
      )}

      <div className="relative mt-3">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`w-full rounded-xl border bg-white/[0.04] py-3.5 pl-4 pr-14 text-[15px] text-white placeholder:text-slate-500 transition-colors duration-200 focus:bg-white/[0.06] ${
            error
              ? 'border-[#F87171]/60 focus:border-[#F87171]'
              : 'border-white/12 hover:border-white/20 focus:border-mint/60'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-controls={id}
          aria-pressed={visible}
          aria-label="Show password"
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors duration-200 hover:text-white"
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-[#F87171]">
          {error}
        </p>
      )}
    </div>
  )
}

function PrimaryButton({
  loading,
  loadingText,
  onClick,
  children,
}: {
  loading: boolean
  loadingText: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-mint px-6 py-3.5 text-[15px] font-semibold text-navy transition-all duration-200 first:mt-0 hover:bg-white hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-mint disabled:hover:shadow-none disabled:active:scale-100"
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy"
        />
      )}
      {loading ? loadingText : children}
    </button>
  )
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-3 text-sm text-[#F87171]">
      {children}
    </p>
  )
}

function StatusIcon({ kind }: { kind: 'ok' | 'error' }) {
  return (
    <span
      aria-hidden
      className={`flex h-11 w-11 items-center justify-center rounded-full ${
        kind === 'ok' ? 'bg-mint text-navy' : 'bg-[#F87171]/15 text-[#F87171]'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        {kind === 'ok' ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
      </svg>
    </span>
  )
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {crossed ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}
