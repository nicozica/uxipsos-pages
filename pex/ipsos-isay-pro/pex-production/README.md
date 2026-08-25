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
  legal-pages/*.html            → paste into PEX's Markup field, one per legal page
  legal-pages/stylesheet.css    → paste into PEX's Stylesheet field for EACH of the
                                   four legal pages (identical imports for all four,
                                   so one file covers all of them — not duplicated
                                   per page)

cdn/deploy/PanelOne/resources/css/ipsos-isay-pro/
  styles.css                    → upload to cdn.ipsosinteractive.com at this same path
  inter.css                     → upload to cdn.ipsosinteractive.com at this same path
                                   (unchanged, reused byte-for-byte from old-pex-production)

reference-preview/*.html        → standalone docs, NOT pasted anywhere — open directly
                                   in a browser for visual QA (wired to the local cdn/ files)
                                   (legal-*.html previews included alongside home/about-us)
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

### Collision hardening (final pass)

`.container`, `.btn`/`.btn-primary`/`.btn-outline`, and `.card`/`.card--blue`/
`.card--peach`/`.card-lg` were renamed to `.isaypro-container`,
`.isaypro-btn`(`-primary`/`-outline`), and `.isaypro-card`(`--blue`/`--peach`/
`-lg`) — these are the names most likely to already exist, unscoped, on a
real PEX page. `.card-grid` and `.card-with-icon` were **not** renamed: they
never co-occur with the bare `card` class in the markup, so a host `.card {}`
rule can't match them anyway — they're already distinct tokens. Nothing else
was touched (`.hero`, `.section`, `.split`, `.badge-invite`, etc. are already
specific enough).

This closes the one gap the previous collision test surfaced: with the old
`.container` name, a host page defining a bare `.container` rule with (say)
a `background` this component's own rule never set could still show through,
since there was no competing declaration to win on. With `.isaypro-container`,
a host `.container` rule simply doesn't match at all — confirmed in a
re-run of the collision test (see below).

### Link-state hardening (found on the real PEX preview)

The class-name collision hardening above didn't catch everything — PEX's own
**Raw HTML component wrapper** (not a naming collision, an actual incoming
rule) ships its own anchor treatment for any link inside embedded content,
confirmed by inspecting the live unpublished preview's stylesheets
(`_nuxt/RAWHTML.BGARJq3p.css`):

```css
.component-rawHtml a:hover:not(.generic-button),
.component-rawHtml a:active:not(.generic-button) {
  filter: saturate(150%) / saturate(190%);
  text-decoration: underline;
}
```

That selector's specificity — a class, an attribute selector, `:hover`/
`:active`, and `:not()` — is `(0,4,1)`, higher than any 2-class selector this
stylesheet can write, which is what forced an underline and an oversaturated
hover/active color (the `filter` applies to the whole rendered box, border
included) onto every CTA button. `.isaypro-btn`/`.isaypro-btn-primary`/
`.isaypro-btn-outline` now define `:link`/`:visited`/`:hover`/`:focus`/
`:focus-visible`/`:active` explicitly, with `!important` on just
`text-decoration` and `filter` — the two contested properties — since
inspection proved out-specifying `(0,4,1)` wasn't realistic without a
repeated-class hack. Everything else (color/background/border) already wins
on ordinary specificity. Verified by injecting the updated CSS into the live
preview page and diffing computed styles before/after.

No `.component-rawHtml a:focus` rule exists on the host, so `:focus`/
`:focus-visible` needed no `!important` — just an intentional on-brand
outline (white ring on the filled primary button, dark-blue ring on the
outline button) instead of the browser default, using the standard
`:focus { outline: none } :focus-visible { outline: ... }` pattern so mouse
clicks stay clean but keyboard focus stays clearly visible.

`.link-inline` (the "Login" text link) was deliberately left out of this —
it's a normal inline link, not a CTA, and picking up the host's
underline-on-hover is completely normal/expected link behavior. Confirmed
unaffected by this change on the live preview.

### Button text vertical alignment (found on the real PEX preview)

A second, separate bug from the same host wrapper: CTA button text rendered
stuck to the top of the button instead of centered. Root cause, confirmed
via Chrome DevTools Protocol (`CSS.getMatchedStylesForNode` — the same API
the DevTools Styles panel itself uses, since the CDN's cross-origin headers
block plain `document.styleSheets` introspection of this file entirely) on
the live unpublished preview:

```css
.component-rawHtml[data-v-804fada5] a,
.component-rawHtml a[data-v-804fada5] { display: inline-block; }
```

The attribute selector `[data-v-804fada5]` counts in the same specificity
column as a class, so this rule is `(0,2,1)` — tied with our
`.ipsos-isay-pro-page .isaypro-btn` on class-count, but its extra `a` type
selector wins the tiebreak. `display` was silently losing to `inline-block`,
which — per the CSS Display spec's "blockification" of flex items — computes
to plain `block` rather than `flex` (our `inline-flex`, once blockified as a
flex item of `.hero-actions`, correctly stays `flex` and keeps its internal
flex behavior). With no flex context, `align-items`/`justify-content` had
nothing to act on, and the inherited `line-height: 1.5` (from the host's
global reset) left text sitting at the top of the fixed-height box.
`.isaypro-btn` now has `display: inline-flex !important` (specificity alone
can't beat `(0,2,1)` without a repeated-class hack) plus an explicit
`line-height: normal`. Verified by injecting the fix into the live preview:
computed `display` goes from `block` to `flex`, `line-height` from `36px` to
`normal`, and a cropped screenshot of both buttons confirms centered text.

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
  `about-us.html`, which only works in `reference-preview/`. This is
  **intentionally left unresolved** — About Us needs to exist in PEX first
  and get a real URL, then this one link gets updated before Home publishes.
  Do not guess this URL.
- **`intro-hero-mobile.webp`**: this file exists on the CDN (verified: HTTP
  200) but is **not referenced anywhere** in `original/index.html`, and
  never was in this package either — `original/` uses a single
  `intro-hero.webp` at every breakpoint, with no `<picture>`/`srcset`. I did
  not add responsive markup to wire it in, since that would be new structure
  beyond a straight URL swap and outside what's currently in the approved
  design. Flagging in case this asset was meant to be adopted and the
  reference in `original/` is what's actually missing.
- **`html { scroll-behavior: smooth }`** is intentionally not reproduced (see
  above) — a minor, non-functional regression (anchor links still jump).

## Legal pages

`original/legal-pages/*.html` arrived as plain content fragments (no CSS
classes, no design-system dependency) with no PEX encapsulation at all — on
the real PEX preview they picked up host defaults (default typography, PEX's
magenta link color, browser default heading/list spacing, full-width text).
Brought into the same system as Home/About Us:

**Wrapper**, identical for all four pages:
```html
<main class="ipsos-isay-pro-page isaypro-legal-page">
  <div class="isaypro-container">
    <div class="isaypro-legal-content">
      ...existing content, unchanged except for the two edits below...
    </div>
  </div>
</main>
```
`.isaypro-container` is the *same* class Home/About use — reused, not
duplicated, per the instruction to use existing classes where one already
exists. `.isaypro-legal-content` narrows further to `max-width: 800px`
inside it, for a comfortable prose measure without inventing a second
container concept.

**Markup edits**, verified by diff to touch nothing else — every paragraph,
heading, link (href, target, rel), anchor id, list, and table cell was
diffed against `original/legal-pages/` and confirmed identical in content,
order, and count:
- Stripped inline `style="margin-top:...; margin-bottom:...;"` from every
  `<h2>` (67 across the four files) and from 4 spacing-only `<p>` tags in
  `cookies-policy.html` — these directly fought the new CSS's own vertical
  rhythm, and were pure presentational cruft (no bearing on the copy
  itself). Table-internal inline styles (`padding`, `width`,
  `white-space:nowrap` on `<td>`/`<th>`, and `overflow-x:auto` on the
  table-scroll wrapper) were left completely alone — those are functional,
  not spacing rhythm, and removing them would risk breaking table
  readability on narrow viewports.
- Replaced the header-image wrapper's inline style with a class:
  `<div style="margin-top:0; margin-bottom:30px;">` → `<div
  class="isaypro-legal-header-image">`.
- Added `class="isaypro-legal-toc"` to the one `<ul>` that follows a "Table
  of Contents:" heading in `privacy-policy.html` and
  `terms-and-conditions.html` (each file has exactly one `<ul>` — verified
  before touching it), so its spacing/line-height could be tuned without
  affecting `trusted-list.html`'s and `cookies-policy.html`'s unrelated
  content lists, which keep default list styling. Already-semantic; no
  list needed converting from plain numbered text.
- No in-content `<h1>` exists in any of the four documents (every heading,
  including what reads as the "page title," is an `<h2>`) — the real page
  title is handled by PEX's own template via the `<!-- PEX page title -->`
  comment above the component, same as before. Rather than invent a
  duplicate `<h1>`, the opening `<h2>` (before "Table of Contents" and
  every numbered section) gets a larger `:first-of-type` treatment as the
  closest equivalent to a primary heading.

**New CSS**, appended to the end of `cdn/.../styles.css` under one
`/* Legal pages */` section, scoped to
`.ipsos-isay-pro-page.isaypro-legal-page` /
`.ipsos-isay-pro-page .isaypro-legal-content`: page title/section heading
(`h2`, with the `:first-of-type` primary-heading variant), paragraphs,
lists, `strong`/`em`, tables, the restrained Table-of-Contents treatment
(no card/pill — just spacing, line-height, and link color), and link
states. All colors and the font come from the same tokens Home/About
already define (`--c-navy`, `--c-blue`, `--c-blue-dark`, `--c-gray-700`,
`--c-blue-bg`, `--c-border`, `'Inter'`) — nothing new was invented. No
separate stylesheet file — appended to the existing one, per the explicit
instruction not to split it without a compelling reason.

**Link-state protection from PEX host styles** — same underlying collision
as the CTA buttons, re-verified for this new selector by injecting the
legal markup directly into the real `.component-rawHtml` element on the
live preview:
- Host's base `.component-rawHtml[data-v] a { color: ...; }` is `(0,2,1)`;
  our `.isaypro-legal-page a:link/:visited` is `(0,3,1)` — wins outright,
  no `!important` needed for `color`.
- Host's `.component-rawHtml a:hover/:active { filter: saturate(...);
  text-decoration: underline; }` is `(0,4,1)`, still higher than our
  `(0,3,1)` — but its forced `text-decoration: underline` happens to match
  what we *want* for a content link on hover anyway, so only `filter` is
  actually contested. `filter: none !important` is the only `!important`
  in this whole block.
- Confirmed on the live preview: injected TOC/content links compute to
  `color: rgb(47, 70, 156)` (our blue) at rest and `rgb(29, 53, 144)` (our
  darker blue) with `underline` and `filter: none` on hover — no magenta,
  no saturation shift.
- These rules deliberately do **not** reuse `.isaypro-btn` — content links
  keep normal underline-on-hover behavior, unlike CTAs.

## PEX packaging

`legal-pages/` needed a Stylesheet-field file it didn't have before (the
pages were plain-content fragments with no styling dependency until now) —
added `pex-fields/legal-pages/stylesheet.css`, the same two `@import` lines
as Home/About's, since all four legal pages need identical imports. Paste
that same file into each of the four legal pages' PEX Stylesheet field.

## QA

Verified for all four pages, desktop (1440px) and mobile (390px): Inter
applies, `.isaypro-legal-content` holds to a max 800px reading measure
inside the shared `.isaypro-container`, headings/lists/tables use the new
typography, the wide cookie-tables' `overflow-x:auto` wrapper prevents
page-level horizontal scroll at either width (`document.documentElement.
scrollWidth` measured equal to `clientWidth` on both), and clicking a Table
of Contents link scrolls to its target section (anchor ids all preserved
and confirmed present). Re-screenshotted Home at 1440px afterward — pixel
match against the prior baseline, confirming the new CSS block (purely
appended, nothing earlier in the file touched) didn't affect Home/About.

## Untouched

`original/`, `old-pex-implementation/`, and `old-pex-production/` were only
ever read, never written to.
