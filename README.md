# anastasiia-portfolio-assets

Static media and runtime code for Anastasiia Sheviakova's portfolio, built in Webflow (site `anastasiia-yyz`).
Everything here is served through the jsDelivr CDN:

```
https://cdn.jsdelivr.net/gh/dimibukr-cell/anastasiia-portfolio-assets@<tag>/<path>
```

## Contents

| Path | What it is |
|---|---|
| `media/<project>/*.mp4` | Looping inline videos (muted, `+faststart`). The four large installation films and the hero/BF loops were re-encoded with H.264 CRF 24. Timing is unchanged, including the BF clips that were already sped up. The gold-tag alpha video is untouched because its packed colour/alpha channels must stay lossless-aligned. |
| `dist/portfolio.css` / `.min.css` | Original `site.css` + `mobile.css` + `contact.css` with a small Webflow integration layer (base-style neutralisation, real-text line rendering, font faces pointing at the Webflow-hosted Satoshi/Melodrama files). |
| `dist/portfolio.js` / `.min.js` | Original `mobile.js`, `site.js`, `illustration.js`, `navigation.js`, `contact.js` in load order, plus a short shim at the top (see below). |

Images, fonts, the CV and the Open Graph images are hosted by Webflow, not here.

## Webflow integration shim (top of `portfolio.js`)

- Webflow classes cannot store CSS custom properties, so each element's `--x/--y/--w/--h/--ratio/--focal…` values (and a few properties that need inline priority) live in a `data-vars` attribute. The shim copies them into the inline style before anything else runs.
- Webflow Image elements don't keep `loading`, `decoding` or `draggable`, so marker classes (`ld-eager`, `no-drag`) restore them.
- The phone layout is a hidden `#mobile-layout` div instead of a `<template>`. On phones `mobile.js` moves its children into the body, as before. Otherwise it removes the div.
- The Figma-fitted SVG text was replaced by real, editable HTML text. Wherever the original showed the SVG text, `.flow-as-svg` renders the same lines with calibrated line height and baseline offsets (`--flow-lh`, `--flow-dy`).

## Updating

Change a file, commit, then create a new tag (`v1.0.1`, …) and update the version in Webflow (Site settings → Custom code `<link>` and the registered `portfolio` script). Tagged URLs are cached permanently by jsDelivr. Branch URLs (`@main`) are cached for up to 12 hours.
