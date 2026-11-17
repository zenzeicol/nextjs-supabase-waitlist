import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BRAND_NAME } from '@/lib/site'

/**
 * Logo-only header for every page except the home page. The landing <Header>
 * navigates with anchors (#faq, #waitlist) that lead nowhere outside the home
 * page.
 */
export function PageHeader() {
  return (
    <header className="border-b border-white/8">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-5 sm:px-8 lg:h-[4.5rem]">
        <Link href="/" className="flex items-center" aria-label={`${BRAND_NAME}, home`}>
          <Logo />
        </Link>
      </div>
    </header>
  )
}
