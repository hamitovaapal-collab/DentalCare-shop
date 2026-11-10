# DentalCare UI system

The application imports one stylesheet: `src/styles/design-system.css`. Removed legacy files (`site.css`, `reference.css`, `App.css`, `index.css`) must not be reintroduced as another override layer.

## Current visual direction — 10 November 2026: cobalt and ivory storefront

The latest explicit request is a **fully different interface**, not merely a Day/Night adjustment. Preserve all original photographs and existing animations; change the remaining visual design. The current working revision is `cobalt-storefront`, with cobalt actions, ivory page/hero surfaces and blue-toned text. It supersedes navy revision `92fa65e` previously pushed to main, the green restoration and the old teal collage.

On desktop the hero now places the original photograph **on the left and the text on the right**. Category navigation uses separate cards. The catalog has an actual filter sidebar beside results and sorting; it must remain functional and adapt to a stacked mobile layout. Main CTAs are pill-shaped with a minimum 52px height, compact actions retain 44px targets, and icon actions are circular. Page headings and forms use boxed surfaces. The daytime footer is light and has a separate brand row; Night uses coordinated semantic footer tokens. Quantity controls retain a visible keyboard-focus treatment. The chat launcher is a 44px action in the header, next to the mobile menu rather than over the products. Opening chat closes the mobile menu; the existing conversation panel, keyboard behavior and commands remain.

All original image files, image-to-content mappings, floating hero photo/note, scroll reveals, counters, page-entry animation and reduced-motion behavior remain. Existing routes, cart, account/admin authorization and API integrations are preserved. The default content cap is 1280px, increasing to 1360px at viewport widths of 1600px and above. Current primary colors are `#294aa0` / `#b6c8ff`, with page backgrounds `#faf9f6` / `#111725`.

The final cobalt revision passed all 127 browser tests and seven production tests after a fresh build. All 19 original JPG hashes match. Independent checks covered 96 header combinations (16 widths × 3 languages × 2 themes) and ten catalog layouts/interactions across five widths in both themes. Photo animation, theme persistence, keyboard controls and the chat overlap fix are verified locally. Source delivery targets GitHub main; live Netlify publication remains unverified from this environment.

### Public build provenance

The Vite build marker for the new revision is `design: "cobalt-storefront"` in `/build-info.json`, alongside a validated public Netlify `COMMIT_REF` as `revision` and `builtAt`. A local build without a valid commit value uses `revision: null`. The file has `Cache-Control: no-store`. No environment values, keys or credentials are exposed, and implementation details do not appear in customer pages. This marker distinguishes deployed revisions; it does not prove that a deployment succeeded.

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

The default content cap is 1280px, increasing to 1360px at viewport widths of 1600px and above. General product grids use 4/3/2 columns; the catalog beside its filter sidebar uses three desktop columns and two at narrower widths. Clinic content uses 3/2/1 columns. On phones, the header separates primary shopping tools from language/theme settings, and the menu becomes a scrollable panel. Every main form becomes one column. Touch controls are at least 44px high. Motion respects `prefers-reduced-motion`.

Product names, prices, stock, descriptions and images come from the existing data source. Bundled images known to be project illustrations are explicitly marked; real photography and commerce claims must not be fabricated. `productImages.js` accepts supported filenames and external HTTP(S) image URLs, without adding a second extension.

## Validation

Run `npm test`, `npm run test:db`, `npm run test:e2e` and `npm run build`. `tests/theme.spec.js` checks theme selection, reload persistence, every route in both themes, contrast, responsive layouts, URL filters, image zoom and missing-image fallback. Account tests use an isolated Supabase contract and verify real UI logic; they do not prove live database permissions or notification delivery.

Transactional checkout lives in `supabase/checkout.sql` and is invoked only by the backend. Apply that migration before deploying the updated API. Do not reintroduce direct browser inserts into orders or client-supplied prices. Database tests run in isolated PGlite and native PostgreSQL 17 with separate concurrent connections, not the production Supabase project.

## Card images

Use the shared `.card .im` 4:3 frame, independent of intrinsic image dimensions. Its direct image fills the frame and stays centered. All product, service, doctor and article cards use `cover` with centered positioning. Product image padding is zero on every breakpoint; hover does not change product scale. Missing-image placeholders fill the same frame. Cart thumbnails stay square at each breakpoint. Categories retain their existing SVG icons. Do not change original image files to adjust layout. `tests/photos.spec.js` checks all groups at 320/390/768/1440px.

## Mobile navigation

Below 820px keep the logo/menu row and a separate row of search, favorites, profile and cart actions. Keep 44px targets. Header ResizeObserver owns `--header-height`; use it for menu/scrim offsets, scroll padding and notifications instead of hardcoded heights. Review arrows remain available below the slide. On phones admin tables scroll within the named, keyboard-focusable region. Preserve two product columns and the shared image frame.

## Historical visual revisions

These records describe previous revisions, not the current design direction:

- **9 November 2026:** the original teal clinic hero and four-photo collage were restored. The later user request superseded that layout.
- **Earlier on 10 November 2026:** the modern green storefront was restored with one original hero photograph and gentle motion. Functional audit commit `1744af2` was pushed to main; its browser and production evidence is recorded in the audit documents.
- **Navy revision `92fa65e`:** a navy/teal storefront with a shaped photograph, tinted navigation, segmented categories and dark footer was pushed to main. Its full 126-test browser suite, seven production tests, 19 original JPG hashes and independent header review passed at that stage. The latest explicit full-redesign request supersedes it with the cobalt/ivory structure above.

## Admin entry and configuration bootstrap

Admin is a public navigation entry in the desktop header and a labeled mobile header shortcut, not a footer link. Its visibility does not grant any privileges. Auth and RLS still protect data. `initializeSupabase()` finishes before AppProvider mounts: use safe build variables or bounded same-origin public runtime configuration, otherwise preserve the storefront. No secret/server credential may enter the browser or static bundle.
