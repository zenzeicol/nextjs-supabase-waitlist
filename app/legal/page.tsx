import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/sections/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { POLICY_UPDATED, POLICY_VERSION } from '@/lib/policy'
import { BRAND_NAME, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy and Terms',
  description: `Placeholder Privacy Policy and Terms for ${BRAND_NAME}.`,
  // noindex while this is placeholder text. When you publish your real policy,
  // flip this to index: true and add the route to app/sitemap.ts.
  robots: { index: false, follow: true },
}

// STUB. This page exists so the waitlist consent checkbox has something to
// link to, and to show where POLICY_VERSION is displayed. It is NOT a real
// legal document. Replace it with your own Privacy Policy and Terms, reviewed
// by someone qualified for your jurisdiction, and bump POLICY_VERSION in
// lib/policy.ts every time the text changes.
export default function Legal() {
  return (
    <>
      <PageHeader />

      <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <span className="num inline-flex rounded-full border border-mint/20 bg-mint/[0.07] px-3 py-1 text-xs font-medium text-mint">
          Version {POLICY_VERSION} · Updated {POLICY_UPDATED}
        </span>

        <h1 className="mt-6 text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white sm:text-4xl">
          Privacy Policy and Terms
        </h1>

        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
          <p className="text-pretty text-sm leading-relaxed text-slate-200">
            <span className="font-semibold text-gold">Example text.</span> This page is a
            placeholder that ships with an open-source template. It is not legal advice
            and does not describe any real service.
          </p>
        </div>

        <section className="mt-10 space-y-4 text-pretty leading-relaxed text-slate-300">
          <h2 className="text-lg font-semibold text-white">1. What we collect</h2>
          <p>
            When you join the waitlist, {BRAND_NAME} stores your name, phone number,
            email address, the platform you chose, an optional campaign source, the date
            and time you gave consent, and the version of this document you accepted.
          </p>

          <h2 className="pt-4 text-lg font-semibold text-white">2. Why we collect it</h2>
          <p>To contact you about the launch of {BRAND_NAME}. Nothing else.</p>

          <h2 className="pt-4 text-lg font-semibold text-white">3. Your rights</h2>
          <p>
            You can ask us to delete your data at any time through the{' '}
            <Link
              href="/account-deletion"
              className="font-medium text-mint underline decoration-mint/40 underline-offset-2 transition-colors duration-200 hover:text-white"
            >
              account deletion form
            </Link>{' '}
            or by writing to {CONTACT_EMAIL}.
          </p>

          <h2 className="pt-4 text-lg font-semibold text-white">4. Terms</h2>
          <p>
            Replace this section with your terms of use. Keep the version above in sync
            with lib/policy.ts.
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}
