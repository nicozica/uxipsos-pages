# Ipsos iSay Pro — PEX production package

This is the new B2B design (from `../original/`) adapted into the same
integration pattern the old component used in production (`../old-pex-implementation/`
+ `../old-pex-production/`). It changes the **packaging**, not the design —
every page renders pixel-identical to `../original/` (verified with
Playwright screenshots at desktop 1440px and mobile 390px).

## Folder guide

```
pex-fields/                    → copy/paste content, one subfolder per page
  home/markup.html              → paste into PEX's Markup/HTML field
  home/stylesheet.css           → paste into PEX's Stylesheet/CSS field
  about-us/markup.html          → same, for the About Us page
  about-us/stylesheet.css
  legal-pages/*.html            → paste into PEX's plain content field for each legal page

cdn/deploy/PanelOne/resources/css/ipsos-isay-pro/
  styles.css                    → upload to cdn.ipsosinteractive.com at this same path
  inter.css                     → upload to cdn.ipsosinteractive.com at this same path
                                   (unchanged, reused byte-for-byte from old-pex-production)

reference-preview/*.html        → standalone docs, NOT pasted anywhere — open directly
                                   in a browser for visual QA (wired to the local cdn/ files)
```

This mirrors the old split: `pex-fields/` is the old `old-pex-implementation/`
role (what's typed into PEX), `cdn/` is the old `old-pex-production/` role
(what's hosted externally).

## Why the CSS looks the way it does

The old component used full Bootstrap 5.2.3 + Font Awesome, so it needed
`bootstrap-scoped.min.css` and `fontawesome-scoped.min.css` — every one of
their ~2,700 selectors run through a build step that prefixes `.ipsos-isay-pro-page`
onto each one, because PEX's own scoping doesn't reach into a separately
hosted CSS file pulled in via `@import`.

The new design **doesn't use Bootstrap or Font Awesome at all** — `original/`
only pulls in `bootstrap-reboot.min.css` for its base reset, and every visual
class (`.hero`, `.card`, `.btn`, `.section`, etc.) is bespoke. Its own
`styles.css` already re-declares everything Reboot would have given it
(`box-sizing`, heading margins, `a { text-decoration: none }`, body
font/color) — so Reboot was fully redundant, and rather than build a new
`bootstrap-reboot-scoped.min.css` CDN file, `cdn/.../styles.css` below simply
inlines that base reset itself, scoped, alongside the rest of the page CSS.
`bootstrap-scoped.min.css` and `fontawesome-scoped.min.css` are **not carried
over** — nothing in the new pages references them.

`cdn/.../styles.css` was generated from `original/styles.css` by
mechanically prefixing every selector with `.ipsos-isay-pro-page`, the same
technique the old build used for Bootstrap. Verified with a full
declaration-level diff against the source: all 393 property/value pairs
carried over unchanged except two deliberate edits:

- **Dropped**: `html { scroll-behavior: smooth; }` — this component doesn't
  own `<html>` inside PEX's shared page shell, so it can't set page-level
  scroll behavior. In-page anchors (e.g. "How it works") still jump, just
  without the smooth animation, unless the parent site sets this itself.
- **Added**: the CMS header-spacing rule, copied verbatim from
  `old-pex-production/styles.css`:
  `#header.component-header:has(+ main.layout-container .ipsos-isay-pro-page) { margin-bottom: 0 !important; }`
  — collapses the 120px the CMS header normally adds below itself, only on
  pages that embed this component. This selector is intentionally **not**
  prefixed with `.ipsos-isay-pro-page` — `#header` is a preceding sibling in
  PEX's shell, not a descendant of this component, so scoping it the normal
  way would silently break it. Confirmed working in a simulated PEX-shell
  test (header `margin-bottom` computed to `0px`).

`:root` custom properties and the bare `body` rule were merged into a single
`.ipsos-isay-pro-page { ... }` base rule (PEX doesn't let this component own
`<body>`); the bare `* { box-sizing: border-box; }` became
`.ipsos-isay-pro-page, .ipsos-isay-pro-page * { box-sizing: border-box; }`;
`body.page-intro` / `body.page-about` became `.ipsos-isay-pro-page.page-intro`
/ `.ipsos-isay-pro-page.page-about` — both classes now live on the same
`<main>` wrapper, replacing the standalone prototype's `<body class="...">`.

`inter.css` (self-hosted Inter, weights 400/700, `@font-face` only) is reused
unchanged from `old-pex-production/` — it already provides exactly the two
weights `original/styles.css` pulls from Google Fonts, so there was no reason
to rebuild it.

## Markup changes

Each page's `<main>` fragment is unchanged from `original/` except:

- Wrapped in `<main id="main-content" class="ipsos-isay-pro-page page-intro">`
  (home) / `class="ipsos-isay-pro-page page-about"` (About Us) instead of a
  full `<!doctype>`/`<head>`/`<body>` document — same wrapper convention as
  `old-pex-implementation/index.html`, including the nested-`<main>`
  structure (this component's `<main>` sits inside PEX's own
  `<main class="layout-container">`), because that's the exact pattern PEX
  already accepts in production.
- No standalone site header, nav, or footer — the new design never had one
  in `original/` either (it's content-only by design already).
- All CDN image/asset URLs preserved exactly as in `original/` — nothing was
  re-hosted, converted, or renamed.

Verified with an ignore-whitespace diff against `original/index.html` and
`original/about-us.html`: the only differences are structural comments added
for readability (e.g. `<!-- /.section -->`) and one `TODO` flag (below). No
copy, class, attribute, or URL was changed.

## Legal pages

`original/legal-pages/*.html` were already authored in a PEX-ready plain-content
format (no CSS classes, no design-system dependency — just semantic
`<p>`/`<h2>`/`<ul>`/`<table>` with inline styles), unlike the two marketing
pages. Two mechanical fixes only, verified byte-identical on the remaining
body text via diff:

1. The leading `Page Title: X` / `PageTitle: X` line is metadata for
   whoever sets the page's title field in PEX, not body copy — moved into
   an HTML comment (`<!-- PEX page title: X -->`) so it doesn't render as a
   stray line of text at the top of the page.
2. Stripped a trailing `<html xmlns:mso="...">...</html>` block present in
   `privacy-policy.html`, `terms-and-conditions.html`, and
   `trusted-list.html` — SharePoint/Word paste artifact, invalid trailing
   markup, not real content. `cookies-policy.html` didn't have this and was
   untouched.

No legal copy was reworded, reordered, or removed. `cookies-policy.html`'s
`<a class="toggle-cookie-banner" href="#">` is left as-is — it's a hook into
the site's global cookie-preference-center widget, outside this component's
scope.

## Things that need a human before this ships

- **`about-us.html` link on the home page** (`pex-fields/home/markup.html`,
  marked with a `TODO(PEX)` comment): points at the relative filename
  `about-us.html`, which only works in `reference-preview/`. Once the About
  Us page has a real PEX URL, that href needs to be updated — I have no way
  to know that URL from the files given.
- **CDN path/versioning**: `cdn/.../styles.css` and `inter.css` are placed at
  the *same* CDN path the old design used
  (`/deploy/PanelOne/resources/css/ipsos-isay-pro/`), per the existing
  convention, with `?v=1` cache-busting query params in the two
  `pex-fields/*/stylesheet.css` stubs. I can't tell from the given files
  whether this redesign should overwrite that path outright or ship under a
  new version/path while the old design is still live — that's a deploy-
  coordination decision, not something the files resolve on their own.
- **Generic class names**: `.container`, `.btn`, `.card`, `.section`, etc.
  are common names that could already exist, unscoped, elsewhere on a live
  PEX page (the old component scoped Bootstrap for exactly this reason).
  Every rule here is scoped with the `.ipsos-isay-pro-page` ancestor, which
  wins on specificity for anything both sides define — confirmed in a
  simulated collision test (this component's `.btn-primary`/`.card--blue`
  colors won over conflicting page-level `.btn`/`.card` rules, and none of
  this component's styles leaked out to surrounding content). The one
  residual gap: a property this component's CSS never sets at all (e.g. a
  stray `.container { background: ... }` on the host page) could still show
  through, since there's no competing declaration to win. Worth a quick
  visual pass after the first real paste into PEX, specifically watching
  `.container`/`.btn`/`.card`/`.section` elements.
- **`html { scroll-behavior: smooth }`** is intentionally not reproduced (see
  above) — a minor, non-functional regression (anchor links still jump).

## Untouched

`original/`, `old-pex-implementation/`, and `old-pex-production/` were only
ever read, never written to.
