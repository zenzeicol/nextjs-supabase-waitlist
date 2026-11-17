import type { MetadataRoute } from 'next'
import { BRAND_NAME, DESCRIPTION } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Fixed `id`: if `start_url` ever changes, the browser keeps treating it as
    // the same installed app instead of offering to install a second one.
    id: '/',
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: DESCRIPTION,
    lang: 'en',
    start_url: '/',
    display: 'standalone',
    // Same value as the <meta name="theme-color"> in the layout and the body
    // background. All three must match, or Android paints the splash in one
    // shade and the page immediately paints another.
    background_color: '#091029',
    theme_color: '#091029',
    // Next publishes app/icon.svg at /icon.svg. Add PNG fallbacks here if you
    // need them.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
