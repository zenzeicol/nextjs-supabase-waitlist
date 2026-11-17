import type { Metadata } from 'next'
import Link from 'next/link'
import { AccountDeletionForm } from '@/components/AccountDeletionForm'
import { Footer } from '@/components/sections/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { BRAND_NAME } from '@/lib/site'

const SUMMARY = `Request deletion of your ${BRAND_NAME} account and its data.`

export const metadata: Metadata = {
  title: 'Account deletion request',
  description: SUMMARY,
  // Indexable on purpose: it is the URL you declare in app store forms that
  // require an account deletion link, and the one people search for.
  robots: { index: true, follow: true },
}

// What gets deleted when the request is processed. This is the list people see
// before confirming, so it must match what your process actually deletes.
// TODO: adapt it to your product's data.
const DATA_DELETED = [
  'Your profile and the credentials you sign in with',
  'All data associated with your account',
]

export default function AccountDeletion() {
  return (
    <>
      <PageHeader />

      <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white sm:text-4xl">
          Account deletion request
        </h1>

        <p className="mt-5 text-pretty leading-relaxed text-slate-300">
          You can ask us to delete your {BRAND_NAME} account and the data associated
          with it. Leave the email you signed up with and we’ll take care of the
          rest.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">What gets deleted</h2>
          <ul className="mt-4 space-y-3">
            {DATA_DELETED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                <span className="text-pretty leading-relaxed text-slate-300">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
            <p className="text-pretty text-sm leading-relaxed text-slate-200">
              <span className="font-semibold text-gold">This cannot be undone.</span> Once
              the account is deleted there is no way to recover your information. If you
              want to use {BRAND_NAME} again later, you’ll start from scratch with a
              new account.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">How we process it</h2>
          <p className="mt-4 text-pretty leading-relaxed text-slate-300">
            We review each request manually to verify that the email belongs to a real
            account before deleting anything, and we confirm in writing to that same
            email. Your data is handled according to our{' '}
            <Link
              href="/legal"
              className="font-medium text-mint underline decoration-mint/40 underline-offset-2 transition-colors duration-200 hover:text-white hover:decoration-white/60"
            >
              Privacy Policy and Terms
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="sr-only">Request form</h2>
          <AccountDeletionForm />
        </section>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-mint transition-colors duration-200 hover:text-white"
        >
          <span aria-hidden>&larr;</span> Back to home
        </Link>
      </main>

      <Footer />
    </>
  )
}
