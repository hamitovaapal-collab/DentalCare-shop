# DentalCare UI system

The application imports one stylesheet: `src/styles/design-system.css`. Removed legacy files (`site.css`, `reference.css`, `App.css`, `index.css`) must not be reintroduced as another override layer.

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

The content width caps at 1240px, increasing on wide displays. Responsive grids use 4/3/2 columns for products and 3/2/1 for clinic content. On phones, the header separates primary shopping tools from language/theme settings, and the menu becomes a scrollable panel. Every main form becomes one column. Touch controls are at least 44px high. Motion respects `prefers-reduced-motion`.

Product names, prices, stock, descriptions and images come from the existing data source. Bundled images known to be project illustrations are explicitly marked; real photography and commerce claims must not be fabricated. `productImages.js` accepts supported filenames and external HTTP(S) image URLs, without adding a second extension.

## Validation

Run `npm test`, `npm run test:db`, `npm run test:e2e` and `npm run build`. `tests/theme.spec.js` checks theme selection, reload persistence, every route in both themes, contrast, responsive layouts, URL filters, image zoom and missing-image fallback. Account tests use an isolated Supabase contract and verify real UI logic; they do not prove live database permissions or notification delivery.

Transactional checkout lives in `supabase/checkout.sql` and is invoked only by the backend. Apply that migration before deploying the updated API. Do not reintroduce direct browser inserts into orders or client-supplied prices. Database tests run in isolated PGlite and native PostgreSQL 17 with separate concurrent connections, not the production Supabase project.

## Card images

Use the shared `.card .im` 4:3 frame, independent of intrinsic image dimensions. Its direct image fills the frame and stays centered. All product, service, doctor and article cards use `cover` with centered positioning. Product image padding is zero on every breakpoint; hover does not change product scale. Missing-image placeholders fill the same frame. Cart thumbnails stay square at each breakpoint. Categories retain their existing SVG icons. Do not change original image files to adjust layout. `tests/photos.spec.js` checks all groups at 320/390/768/1440px.

## Mobile navigation

Below 820px keep the logo/menu row and a separate row of search, favorites, profile and cart actions. Keep 44px targets. Header ResizeObserver owns `--header-height`; use it for menu/scrim offsets, scroll padding and notifications instead of hardcoded heights. Review arrows remain available below the slide. On phones admin tables scroll within the named, keyboard-focusable region. Preserve two product columns and the shared image frame.

## Original visual identity restored — 9 November 2026

Use the original teal identity: light primary `#0a5865`, hover `#06414c`, white page surface, pale cyan secondary surfaces; night surfaces follow the original `#0b1b1f` / `#12292e` palette with readable light cyan actions. Keep existing semantic tokens and theme persistence.

Home restores the original four `hero1..hero4` photographs, collage proportions, original clinic headline/copy, teal gradient, floating photos with staggered phases and animated background orbs. Retain the working shop/booking/service links, category navigation and all responsive fixes. Do not re-import conflicting legacy stylesheets. The hero has intentionally high-contrast white/outline actions on its teal background.

Continuous motion uses transform only; scroll reveals and counters remain. Page entry is a short opacity transition. Under `prefers-reduced-motion: reduce`, photos remain visible and decorative continuous motion stops. `tests/original-design.spec.js` checks actual changing transforms, original assets, responsive width, navigation and reduced motion. Palette tests preserve contrast ≥4.5:1.
