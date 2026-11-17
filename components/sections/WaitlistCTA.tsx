import { Reveal } from '@/components/Reveal'
import { WaitlistForm } from '@/components/WaitlistForm'
import { BRAND_NAME } from '@/lib/site'

export function WaitlistCTA() {
  return (
    <section id="waitlist" className="relative overflow-hidden bg-navy-deep py-28 lg:py-36">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-mint/[0.08] blur-[100px]"
      />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tightest text-white sm:text-5xl">
            Be among the first to try {BRAND_NAME}
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-slate-300 lg:text-lg">
            Leave your details and we’ll let you know as soon as a spot opens up.
          </p>
        </Reveal>

        <Reveal delay={180} className="mt-10">
          <WaitlistForm />
        </Reveal>
      </div>
    </section>
  )
}
