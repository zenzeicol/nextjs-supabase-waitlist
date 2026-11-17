import { renderOgImage } from '@/lib/og-image'

// The composition lives in lib/og-image.tsx. Only the file convention that
// Next needs to emit the <meta property="og:image:*"> tags remains here.
export { alt, size, contentType } from '@/lib/og-image'

export default function Image() {
  return renderOgImage()
}
