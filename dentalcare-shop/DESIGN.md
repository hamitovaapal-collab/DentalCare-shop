# DentalCare UI system

The application imports one stylesheet: `src/styles/design-system.css`. Removed legacy files (`site.css`, `reference.css`, `App.css`, `index.css`) must not be reintroduced as another override layer.

## Current visual direction — 10 November 2026: navy storefront

The latest explicit user request supersedes both the green restoration and the old teal collage: **preserve all original photographs and the existing animations; visibly redesign the remaining interface**. The current working design is `navy-storefront`, with navy text, teal actions, cool pale surfaces and a dedicated navy footer. No original image asset is replaced or edited. Floating hero photo/note, scroll reveals, counters, page entry and reduced-motion behavior remain.

The new visual structure includes a spacious split hero, a shaped photograph frame and separate caption, a two-tone headline using the existing translated text, segmented category navigation, a tinted header navigation band with filled active tabs, refreshed card edges/spacing, stronger buttons, shared form surfaces and the dark footer. Existing pages, links, cart, account/admin authorization and integration logic remain functional requirements, not decorative replacements.

Content normally caps at **1280px**; at viewport widths of 1600px and above, the existing wide-display rule allows **1360px**. Day and Night use the same semantic-token contract; footer colors have explicit `--footer-*` tokens for each theme. The current primary colors are `#075f70` / `#9ddfe3`, with page backgrounds `#f4f7fb` / `#0c1725`. Keep the existing touch targets, responsive grids and image fitting rules.

This redesign passed the full 126-test browser suite and seven production tests after a fresh build. All 19 original JPG hashes match. An independent review checked 78 header combinations (13 widths × 3 languages × 2 themes) and dark catalog screenshots. The live Netlify deployment cannot be inspected from this environment; source delivery and live publication are separate checks.

### Public build provenance

The Vite build emits `/build-info.json` containing only `design: "navy-storefront"`, a validated public Netlify `COMMIT_REF` as `revision`, and `builtAt`. A local build without a valid commit value uses `revision: null`. The Netlify configuration sets `Cache-Control: no-store` for that file. This diagnostic adds no implementation details to customer pages and never exposes environment variables, keys or credentials. It helps identify an older deployed version; it does not itself prove that a deployment succeeded.

## Theme contract

`AppProvider` owns the `light | dark` theme. `ThemeSwitch` sets an explicit value; its buttons never invert or guess the requested theme. The selected theme is stored under `localStorage.theme`. Invalid saved values fall back to the operating system preference. A small bootstrap in `index.html` applies that selection before React and the stylesheet finish loading; React then keeps the root `data-theme`, `color-scheme` and browser theme color aligned.

Use semantic CSS variables for every background, text, border and status color. Do not add hard-coded white backgrounds to forms/cards or dark text to buttons. Tokens are defined once per theme:

- `--bg`, `--surface`, `--surface-alt`, `--surface-hover`: page and component surfaces.
- `--text`, `--muted`: primary and secondary copy.
- `--primary`, `--primary-hover`, `--on-primary`: primary actions and their text.
- `--border`, `--ring`: boundaries and keyboard focus.
- `--danger`, `--danger-bg`, `--success`, `--success-bg`: status messages and destructive actions.

Compatibility aliases (`--t`, `--tx`, etc.) resolve to the same tokens; they do not define another palette. Core text/surface pairs and primary buttons are checked for contrast ≥ 4.5:1 in both themes.

## Components

- `Button`: primary / secondary / danger actions; pending spinner, disabled state and `aria-busy`. Submit buttons must specify `type="submit"`.
- `ThemeSwitch`: persistent, idempotent Day and Night choices.
- `PageHeading`: breadcrumb, page title and introduction.
- `EmptyState` / `LoadingState`: meaningful empty, loading and failure presentations.
- `ProductCard` / `ProductImage`: shared catalog cards and honest missing-image fallback.
- `ServiceCard`: shared clinic service cards on Home and Services.
- `Modal`: portal, keyboard focus containment, Escape, background and close action.
- `ConfirmProvider` / `useConfirm`: asynchronous destructive-action confirmation, using the same modal and button styles.

The base `.btn` class also styles navigational links. Secondary links use `.ghost-d`; WhatsApp uses `.whatsapp` or `.light-b`; Telegram uses `.telegram`. Do not use a button as a decorative substitute for a real navigation link.

## Layout and content

The default content cap is 1280px, increasing to 1360px at viewport widths of 1600px and above. Responsive grids use 4/3/2 columns for products and 3/2/1 for clinic content. On phones, the header separates primary shopping tools from language/theme settings, and the menu becomes a scrollable panel. Every main form becomes one column. Touch controls are at least 44px high. Motion respects `prefers-reduced-motion`.

Product names, prices, stock, descriptions and images come from the existing data source. Bundled images known to be project illustrations are explicitly marked; real photography and commerce claims must not be fabricated. `productImages.js` accepts supported filenames and external HTTP(S) image URLs, without adding a second extension.

## Validation

Run `npm test`, `npm run test:db`, `npm run test:e2e` and `npm run build`. `tests/theme.spec.js` checks theme selection, reload persistence, every route in both themes, contrast, responsive layouts, URL filters, image zoom and missing-image fallback. Account tests use an isolated Supabase contract and verify real UI logic; they do not prove live database permissions or notification delivery.

Transactional checkout lives in `supabase/checkout.sql` and is invoked only by the backend. Apply that migration before deploying the updated API. Do not reintroduce direct browser inserts into orders or client-supplied prices. Database tests run in isolated PGlite and native PostgreSQL 17 with separate concurrent connections, not the production Supabase project.

## Card images

Use the shared `.card .im` 4:3 frame, independent of intrinsic image dimensions. Its direct image fills the frame and stays centered. All product, service, doctor and article cards use `cover` with centered positioning. Product image padding is zero on every breakpoint; hover does not change product scale. Missing-image placeholders fill the same frame. Cart thumbnails stay square at each breakpoint. Categories retain their existing SVG icons. Do not change original image files to adjust layout. `tests/photos.spec.js` checks all groups at 320/390/768/1440px.

## Mobile navigation

Below 820px keep the logo/menu row and a separate row of search, favorites, profile and cart actions. Keep 44px targets. Header ResizeObserver owns `--header-height`; use it for menu/scrim offsets, scroll padding and notifications instead of hardcoded heights. Review arrows remain available below the slide. On phones admin tables scroll within the named, keyboard-focusable region. Preserve two product columns and the shared image frame.

## Historical direction — original visual identity restored, 9 November 2026

Historical record, superseded by the current navy storefront: the original teal identity used light primary `#0a5865`, hover `#06414c`, white page surface, pale cyan secondary surfaces; night surfaces follow the original `#0b1b1f` / `#12292e` palette with readable light cyan actions. Keep existing semantic tokens and theme persistence.

At that stage Home restored the original four `hero1..hero4` photographs, collage proportions, original clinic headline/copy, teal gradient, floating photos with staggered phases and animated background orbs. Retain the working shop/booking/service links, category navigation and all responsive fixes. Do not re-import conflicting legacy stylesheets. The hero has intentionally high-contrast white/outline actions on its teal background.

Continuous motion uses transform only; scroll reveals and counters remain. Page entry is a short opacity transition. Under `prefers-reduced-motion: reduce`, photos remain visible and decorative continuous motion stops. `tests/original-design.spec.js` checks actual changing transforms, original assets, responsive width, navigation and reduced motion. Palette tests preserve contrast ≥4.5:1.

## Admin entry and configuration bootstrap

Admin is a public navigation entry in the desktop header and a labeled mobile header shortcut, not a footer link. Its visibility does not grant any privileges. Auth and RLS still protect data. `initializeSupabase()` finishes before AppProvider mounts: use safe build variables or bounded same-origin public runtime configuration, otherwise preserve the storefront. No secret/server credential may enter the browser or static bundle.

## Historical direction — green restoration, earlier on 10 November 2026

At that stage the owner requested the **modern green storefront**. This direction has now been superseded by the explicit navy redesign above. That revision of Home had the rounded pale green hero panel, shop-first copy, one original photograph and category shortcuts, with gentle floating photo/note animation. Keep scroll reveals and counter animations. Do not restore the legacy collage/teal palette when asked to preserve motion. Motion tests in `original-design.spec.js` follow the current requested identity despite the historical filename. Header admin access, runtime bootstrap, phone validation and other functional fixes stay intact.
