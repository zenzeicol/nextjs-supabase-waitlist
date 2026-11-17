# assets/

Files the server reads at build time and that are **not** served to the
browser. That is why they live here and not in `public/`: nothing here should be
exposed as a URL.

## Fonts

`PlusJakartaSans-Medium.ttf` and `PlusJakartaSans-ExtraBold.ttf` are used by
`lib/og-image.tsx` to render the social card.

They are versioned copies for two reasons, both limitations of the
`ImageResponse` engine (Satori), not preferences:

1. **They must be `.ttf`.** `ImageResponse` only accepts `ttf`/`otf`/`woff`.
   What `next/font/google` leaves in `.next/static/media` is `.woff2`, which
   does not work, besides being an internal build detail.
2. **They must be static instances, not the variable font.** Satori does not
   apply variation axes: with the variable Plus Jakarta Sans `.ttf`, everything
   renders at the default weight (400) regardless of the `fontWeight` requested.

They are the same family and weights that `app/layout.tsx` loads through
`next/font/google` for the site, so the card and the page share typography.

License: SIL Open Font License 1.1 (see `OFL.txt`). The OFL applies to these
font files only; the rest of the repository is MIT.

### Downloading them again

Google Fonts serves `.ttf` only when the User-Agent does not support `woff2`. To
get the current URLs:

```sh
curl -s "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 6.1; rv:1.0)"
```

That returns one `@font-face` per weight with a `src: url(...ttf)` you can
download directly.
