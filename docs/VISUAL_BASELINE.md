# JasVerse.com — Visual Baseline (APPROVED — do not redesign)

**Read this before touching any CSS on this site.** The Founder has
explicitly approved this visual language. `REALIZATION 001` (2026-09-08)
preserved it deliberately while rebuilding the site's structure — do not
let a future AI "improve" it into a generic SaaS look.

## Canonical philosophy

**KEEP THE DESIGN. EVOLVE THE PRODUCT.**

## Color tokens (canonical, as of this activation)

The pre-existing site used slightly different shades of the same two neon
colors across different pages (`index.html` used `#00b9ff`/`#ff0070`;
`privacy.html`/`terms.html`/`404.html` used `#00c8ff`/`#ff285c`). This
activation standardized on ONE set, defined once in
`assets/css/tokens.css`, and applied it everywhere — this is "reduced
visual duplication" (explicitly allowed), not a redesign: the colors are
the same family, just no longer drifting page-to-page.

```css
--jv-bg-1: #03050a;         /* background gradient start/end */
--jv-bg-2: #080910;         /* background gradient middle */
--jv-cyan: #00b9ff;         /* primary accent */
--jv-magenta: #ff0070;      /* primary accent */
--jv-text-primary: #ffffff;
--jv-text-secondary: #c0c0cc;
--jv-text-muted: #b8b8c4;
--jv-card-bg: rgba(3, 5, 10, 0.5);
--jv-card-border: rgba(255, 0, 100, 0.25);
--jv-card-border-hover: rgba(0, 185, 255, 0.4);
```

## Background

Layered radial + linear gradient, dark/black futuristic base:

```css
background:
  radial-gradient(circle at 50% 28%, rgba(0, 185, 255, 0.16), transparent 26%),
  radial-gradient(circle at 50% 40%, rgba(255, 0, 90, 0.18), transparent 30%),
  radial-gradient(circle at 50% 100%, rgba(255, 0, 90, 0.16), transparent 34%),
  linear-gradient(180deg, var(--jv-bg-1) 0%, var(--jv-bg-2) 55%, var(--jv-bg-1) 100%);
```

## Core composition (must survive any redesign)

```
      CREST (JasVerse emblem, drop-shadow cyan+magenta glow)
   JASVERSE® (large, centered, letter-spaced)
     TAGLINE (muted, centered)

    [ CARD ]  <- dark translucent, thin neon border, ~16px radius, subtle glow
    [ CARD ]
    [ CARD ]
```

- Centered composition, generous negative space.
- Cards: `border-radius: 16px`, `border: 1px solid var(--jv-card-border)`,
  background `var(--jv-card-bg)`, subtle `box-shadow` glow, border color
  shifts toward cyan on hover.
- Italian identity markers (🇮🇹, Italian contact copy) are part of the
  approved identity — preserved, not decorative filler to remove.
- Minimal futuristic aesthetic — no bright-white redesign, no generic
  corporate gradients, no glassmorphism overload, no stock imagery.

## What changed in REALIZATION 001 (and what did NOT)

**Changed (structure/functionality, not look):**
- Monolithic `index.html` → modular `assets/css/*.css` + `assets/js/*.js`
  (Part 4), same rendered appearance.
- Added global navigation (Home/Products/Lab/Ecosystem/Live) styled with
  the same card/neon language.
- Added new pages (`/products/`, `/lab/*`, `/ecosystem/`, `/live/`) using
  the identical token set and card composition as the homepage.

**NOT changed:**
- The crest, the centered brand composition, the cyan/magenta identity,
  the card style, the dark background, the Italian contact section.

## Forbidden without Founder approval (unchanged from mandate)

Bright white redesign · generic corporate gradients · generic Bootstrap
look · glassmorphism overload · giant marketing illustrations · random
stock imagery · replacing the JasVerse emblem · changing the core
cyan/magenta identity · a visual redesign done for its own sake.

## Ultimo aggiornamento
2026-09-08 (JASVERSE — REALIZATION 001)
