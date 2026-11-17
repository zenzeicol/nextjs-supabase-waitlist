import Link from 'next/link'
import { Reveal } from '@/components/Reveal'
import { QUESTIONS, type Question } from '@/lib/faq'
import { BRAND_NAME } from '@/lib/site'

// Wraps the `link.text` part of the answer in a <Link>. If that part is not in
// the text, it throws: the home page is prerendered at build time, so a
// rewritten answer that loses the link phrase breaks `npm run build` instead
// of publishing an FAQ without its link.
function answerWithLink({ answer, link }: Question) {
  if (!link) return answer

  const start = answer.indexOf(link.text)
  if (start === -1) {
    throw new Error(`[faq] link text "${link.text}" does not appear in the answer: "${answer}"`)
  }
  const end = start + link.text.length

  return (
    <>
      {answer.slice(0, start)}
      <Link
        href={link.href}
        className="font-medium text-mint underline decoration-mint/40 underline-offset-2 transition-colors duration-200 hover:text-white hover:decoration-white/60"
      >
        {link.text}
      </Link>
      {answer.slice(end)}
    </>
  )
}

// Accordion with native <details>/<summary>, no React state or custom JS. Two
// reasons, and both matter here:
//
// 1. The answers are in the HTML from the first byte even when collapsed, so
//    search engines index them and they match what the FAQPage JSON-LD
//    promises. An accordion that mounts the text on click would leave the
//    structured data describing content the crawler cannot see.
// 2. It opens and closes without hydration, like <FadeIn> in the hero. This
//    section is below the fold, so it uses <Reveal>, but the accordion itself
//    works even if JS never loads.
export function FAQ() {
  return (
    <section id="faq" className="relative bg-navy-deep py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <Reveal>
            <span className="num text-xs font-medium uppercase tracking-[0.2em] text-mint/70">
              FAQ
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white sm:text-[2.6rem]">
              Questions about {BRAND_NAME}?
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 space-y-3">
          {QUESTIONS.map((item, i) => (
            <Reveal key={item.question} delay={80 + i * 60}>
              <details className="group rounded-2xl border border-white/10 bg-white/[0.025] transition-colors duration-300 open:border-white/20 open:bg-white/[0.045] hover:border-white/20">
                {/* list-none removes the triangle in Firefox and Chrome;
                    ::-webkit-details-marker, the one in Safari. */}
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 px-6 py-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-pretty text-base font-semibold leading-snug text-white sm:text-lg">
                    {item.question}
                  </h3>

                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/12 text-mint transition-all duration-300 group-open:rotate-180 group-open:border-mint/40 group-open:bg-mint/10"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>

                <p className="text-pretty px-6 pb-6 pr-14 text-sm leading-relaxed text-slate-400 sm:text-base">
                  {answerWithLink(item)}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
