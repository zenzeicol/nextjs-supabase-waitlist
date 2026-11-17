import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { FAQ } from '@/components/sections/FAQ'
import { WaitlistCTA } from '@/components/sections/WaitlistCTA'
import { Footer } from '@/components/sections/Footer'
import { QUESTIONS } from '@/lib/faq'

// Built from the same QUESTIONS that <FAQ> renders, not from a copy: the
// FAQPage requirement is that every question and answer is visible on the page
// with the same text.
const FAQ_PAGE = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: QUESTIONS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

// Escaping '<' prevents XSS: without it, a string containing HTML could close
// the <script> early. This is Next's recommendation for JSON-LD. It lives in a
// function, not repeated by hand in each block, because that is how it gets
// forgotten in the third one.
function asJsonLd(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}

export default function Home() {
  return (
    <>
      {/* Native <script>, not next/script: this is data, not code to run. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={asJsonLd(FAQ_PAGE)} />
      <Header />
      <main>
        <Hero />
        <FAQ />
        <WaitlistCTA />
      </main>
      <Footer />
    </>
  )
}
