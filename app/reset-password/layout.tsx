import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Footer } from '@/components/sections/Footer'
import { PageHeader } from '@/components/sections/PageHeader'

// This layout exists because page.tsx is a Client Component, and a 'use client'
// file cannot export `metadata`. It holds the two things the page needs from
// the server: noindex and per-request rendering.
//
// noindex + nofollow: the URL only makes sense with the token_hash from the
// recovery email. The Disallow in robots.ts and the absence from sitemap.ts are
// the other two parts of the same decision.
export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // No caching: the route renders on every request and Next responds with
  // `Cache-Control: private, no-cache, no-store`, so neither a CDN nor the
  // browser stores a response for a URL that carries the token in its query.
  // As a bonus, useSearchParams already has the token during the server render
  // and the initial HTML comes out in the right state (button or error), with
  // no flicker.
  await connection()

  return (
    <>
      <PageHeader />

      <main className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-dotgrid opacity-70" />

        {/* Same width as the header so the title lines up with the logo; the
            inner max-w-md is the form's reading width. */}
        <div className="relative mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="max-w-md">{children}</div>
        </div>
      </main>

      <Footer />
    </>
  )
}
