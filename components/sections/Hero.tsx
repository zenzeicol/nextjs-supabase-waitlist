import { FadeIn } from '@/components/FadeIn'
import { BRAND_NAME, TAGLINE_PART_1, TAGLINE_PART_2, TAGLINE_PART_3 } from '@/lib/site'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-mesh-hero pt-32 lg:pt-40">
      <div aria-hidden className="absolute inset-0 bg-dotgrid opacity-70" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/25 to-transparent"
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-24 text-center sm:px-8 lg:pb-32">
        <FadeIn>
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/[0.07] px-3.5 py-1.5 text-xs font-medium text-mint">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-mint" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
            </span>
            Early access coming soon
          </span>
        </FadeIn>

        <FadeIn delay={80}>
          <h1 className="mt-6 text-balance text-[2.6rem] font-extrabold leading-[1.06] tracking-tightest text-white sm:text-6xl lg:text-[4.1rem]">
            {TAGLINE_PART_1} <span className="text-mint">{TAGLINE_PART_2}</span>{' '}
            {TAGLINE_PART_3}
          </h1>
        </FadeIn>

        <FadeIn delay={160}>
          <p className="mx-auto mt-6 max-w-lg text-pretty text-lg leading-relaxed text-slate-300">
            {BRAND_NAME} is a placeholder product. Replace this paragraph with one
            sentence about what you are building and who it is for.
          </p>
        </FadeIn>

        <FadeIn delay={240}>
          <div className="mt-9 flex justify-center">
            <a
              href="#waitlist"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-[15px] font-semibold text-navy transition-all duration-200 hover:bg-white hover:shadow-glow active:scale-[0.98]"
            >
              Join the waitlist
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </FadeIn>
      </div>

      <div aria-hidden className="mx-auto h-px max-w-5xl rule-fade opacity-60" />
    </section>
  )
}
