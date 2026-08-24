/* Shared chrome for every Doors Survey cell.
   Adapted from /srv/repos/work/ipsos/prepost-survey/assets/partials.js —
   the account-balance / star-rating helpers from that project are not used
   by any Doors Survey cell and have been trimmed; header/footer/mountScreen
   are kept, plus footer() gains a `links` option (Cells 1-3 show a
   logo-only footer, Cells 4-5 show the logo + Help + Privacy Policy row,
   matching the supplied screenshots).
   Icons via Font Awesome (CDN). Logos via Ipsos CDN.
   Styling comes from Bootstrap + the Ipsos override layer (see styles.css);
   markup below sticks to stock Bootstrap classes + design-token utilities. */

const LOGO_ISAY  = "https://cdn.ipsosinteractive.com/deploy/PanelOne/resources/logos/ipsos_isay_logo.svg";
const LOGO_IPSOS = "https://cdn.ipsosinteractive.com/deploy/PanelOne/resources/logos/ipsos_logo.svg";

/* Completion seal — the Ipsos "badge-check" SVG (ported from astra).
   Filled via a design token so the same shape serves success/primary. */
function seal(colorVar) {
  return `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path style="fill:var(${colorVar})" d="M18 0C20.5312 0 22.7812 1.47656 23.9062 3.65625C26.2266 2.88281 28.8281 3.44531 30.7266 5.27344C32.5547 7.10156 33.0469 9.77344 32.3438 12.0938C34.5234 13.2188 36 15.4688 36 18C36 20.6016 34.5234 22.8516 32.3438 23.9766C33.1172 26.2969 32.5547 28.8984 30.7266 30.7266C28.8281 32.5547 26.2266 33.1172 23.9062 32.4141C22.7812 34.5938 20.5312 36 18 36C15.3984 36 13.1484 34.5938 12.0234 32.4141C9.70312 33.1172 7.10156 32.5547 5.20312 30.7266C3.375 28.8984 2.88281 26.2969 3.58594 23.9766C1.40625 22.8516 0 20.6016 0 18C0 15.4688 1.40625 13.2188 3.58594 12.0938C2.8125 9.77344 3.375 7.10156 5.20312 5.27344C7.10156 3.44531 9.70312 2.88281 12.0234 3.65625C13.1484 1.47656 15.3984 0 18 0ZM24.75 15.8203C25.4531 15.1875 25.4531 14.1328 24.75 13.4297C24.1172 12.7969 23.0625 12.7969 22.4297 13.4297L15.75 20.1797L12.9375 17.3672C12.3047 16.7344 11.25 16.7344 10.6172 17.3672C9.91406 18.0703 9.91406 19.125 10.6172 19.7578L14.5547 23.6953C15.1875 24.3984 16.2422 24.3984 16.875 23.6953L24.75 15.8203Z"/>
  </svg>`;
}

const ICON = {
  star:       '<i class="fa-solid fa-star text-warning" aria-hidden="true"></i>',
  checkGreen: seal('--bg-success-default'),
};

/* Header. Every Doors Survey screenshot shows a brand-only header, with no
   account-balance / user chip (unlike prepost-survey's header, which this
   was adapted from), so those options were dropped rather than kept unused. */
function header() {
  return `<header class="app-header">
    <div class="container-xl px-0 d-flex justify-content-between align-items-center gap-3">
      <a class="brand" href="../index.html"><img src="${LOGO_ISAY}" alt="Ipsos iSay"></a>
    </div>
  </header>`;
}

/* Footer. opts: { links:Boolean } — Cells 1-3 show the Ipsos logo alone;
   Cells 4-5 add the Help / Privacy Policy row, matching the supplied screens. */
function footer(opts = {}) {
  const { links = true } = opts;
  return `<footer class="app-footer">
    <div class="container-xl px-0 d-flex align-items-center flex-wrap gap-3 gap-md-4">
      <span class="foot-logo"><img src="${LOGO_IPSOS}" alt="Ipsos"></span>
      ${links ? `<a class="foot-link" href="#">Privacy Policy</a>
      <a class="foot-help" href="#">Help</a>` : ''}
    </div>
  </footer>`;
}

/* Inject the shared chrome around page content.
   opts: { footerLinks:Boolean } — forwarded to footer(). */
function mountScreen(opts = {}) {
  const host = document.getElementById('screen');
  const content = document.getElementById('screen-content').innerHTML;
  host.innerHTML =
    header() +
    `<main class="screen-main"><div class="container-xl">${content}</div></main>` +
    footer({ links: opts.footerLinks !== false });
}
