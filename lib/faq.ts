import { BRAND_NAME } from './site'

// The landing page FAQ. Single source: <FAQ> renders it and the home page
// publishes it as FAQPage JSON-LD.
//
// Both must come from here, not from two copies: if the text is duplicated, the
// structured data ends up promising answers the page no longer shows, which is
// exactly what search engines flag as a misleading FAQ.
//
// `answer` is always the full plain text: that is what the JSON-LD publishes.
// `link` only marks which part of that text <FAQ> renders as a link;
// `link.text` must appear verbatim in `answer`, or the build fails (see
// answerWithLink in components/sections/FAQ.tsx).
//
// Replace these placeholder questions with your own.
export type Question = {
  question: string
  answer: string
  link?: { text: string; href: string }
}

export const QUESTIONS: Question[] = [
  {
    question: `What is ${BRAND_NAME}?`,
    answer: `${BRAND_NAME} is a placeholder brand for this waitlist template. Replace this text in lib/faq.ts with a description of your product.`,
  },
  {
    question: 'What happens when I join the waitlist?',
    answer:
      "We store your name, phone number, email and the platform you chose, together with the moment you gave consent and the version of the policy you accepted. We'll contact you when early access opens.",
  },
  {
    question: 'How is my data used?',
    answer:
      'Only to contact you about the launch, as described in our Privacy Policy and Terms.',
    link: { text: 'Privacy Policy and Terms', href: '/legal' },
  },
  {
    question: 'How do I request deletion of my account?',
    answer: 'Send us a request through the account deletion form and we will process it.',
    link: { text: 'account deletion form', href: '/account-deletion' },
  },
]
