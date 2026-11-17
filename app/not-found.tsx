import Link from 'next/link'
import { Footer } from '@/components/sections/Footer'
import { PageHeader } from '@/components/sections/PageHeader'

// Existing is half the fix. Next's default 404 renders INSIDE the root layout
// and injects its own <title>, so the document ended up with two <title> tags.
// With a custom page there is only one.
//
// No `export const metadata` here: not-found.tsx is neither a page nor a
// layout, so Next does not read it. The <title> comes from the root layout's
// default, and Next adds noindex by itself because of the 404 status.
export default function NotFound() {
  return (
    <>
      <PageHeader />

      <main className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-dotgrid opacity-70" />

        <div className="relative mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-24">
          <p className="num text-sm font-medium text-mint">404</p>

          <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white sm:text-4xl">
            This page doesn’t exist
          </h1>

          <p className="mt-5 max-w-lg text-pretty leading-relaxed text-slate-300">
            The address may be mistyped, or the page is no longer where it used to be.
          </p>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-mint transition-colors duration-200 hover:text-white"
          >
            <span aria-hidden>&larr;</span> Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  )
}
