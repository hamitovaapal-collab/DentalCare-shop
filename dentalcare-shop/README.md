# DentalCare Shop (React + Vite + Supabase)

Dental clinic site + shop. Frontend: React Router, 3 languages (KG/RU/EN), light/dark theme, cart, favorites, booking, reviews, admin, FAQ chatbot.
Backend: two small serverless functions in `api/` (`order.js`, `booking.js`) that validate input, recompute prices from the database, save with the Supabase service key, and send Telegram + email notifications.

## 1. Run in VS Code

1. Install Node.js 24+. 2. Open the `dentalcare-shop` folder in VS Code. 3. Terminal: `npm ci`
2. Optional: copy `.env.example` to `.env` (fill it in as described below — **the site also runs without it**: shop browsing, cart, favorites, booking form validation, WhatsApp and the chatbot work; login/orders/reviews/admin show "Supabase is not configured").
3. `npm run dev` → open http://localhost:5173 (frontend) — local API runs on :5000 and is proxied automatically.

## 2. Supabase (needs your account — required for login, orders, bookings, reviews, admin)

1. supabase.com → New project.
2. SQL Editor → paste all of `supabase/schema.sql` → Run. Then run `supabase/checkout.sql` to enable transactional checkout and inventory updates. (Creates tables, Row Level Security policies, seed products.)
3. Project Settings → API: copy **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`; **anon key** → `VITE_SUPABASE_ANON_KEY`; **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server only, never commit/expose).
4. Authentication → URL Configuration: add `http://localhost:5173` and your Vercel URL to Site URL / Redirect URLs (needed for password reset links). Optionally disable "Confirm email" while testing.
5. Register on the site, then make yourself admin in the SQL Editor (the only way — users cannot change their own role, enforced by RLS):
   `update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');`

## 3. Telegram notifications (needs your bot)

1. In Telegram open @BotFather → `/newbot` → copy the token → `TELEGRAM_BOT_TOKEN`.
2. Open your new bot and press **Start** (or add it to a group). Then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` → `TELEGRAM_CHAT_ID`.
3. A phone number alone cannot receive bot messages; the number +996502820642 is only displayed/linked as the contact on the site.
   The UI shows "Telegram notification sent" only if Telegram's API confirmed it; otherwise it shows the failure reason.

## 4. Email (needs a Resend account)

resend.com → API Keys → `RESEND_API_KEY`. `ADMIN_EMAIL` = where notifications go. `FROM_EMAIL` = a verified sender (for testing `DentalCare <onboarding@resend.dev>` only delivers to your own Resend account email). Same honest success/failure display as Telegram.

## 5. WhatsApp (no setup)

Buttons open `https://wa.me/996502474860?text=…` with the order/booking details URL-encoded; works on mobile and desktop. Number is in `src/lib/wa.js`.

## 6. Deploy to Vercel

Push to GitHub → Vercel → Import → add every variable from `.env` in Project Settings → Environment Variables → Deploy. `api/*.js` become serverless functions automatically.

## Security notes

Secrets exist only in server env vars. Orders/bookings can only be created through the API (no insert policy for browsers). Order totals are recalculated server-side from DB prices. Admin pages are guarded in the UI **and** by RLS (`is_admin()`).

## Before you go live

Replace the sample address/email on the Contact page, and replace the placeholder product photos in `public/images/` (they are crops from your reference screenshot, so they are low-resolution and not real product shots; the admin panel accepts a file name or a full image URL).

## Regression checks

Run `npm test` (isolated API tests), `npm run test:e2e` (Chromium browser checks) and `npm run build`. Browser tests use system Chromium when available; otherwise run `npx playwright install chromium`. See `AUDIT.md` for coverage and outstanding integration requirements. Node.js 24 is required for optional env-file loading and proxy-aware local API requests.

Telegram contact uses the existing number +996502820642 through `https://t.me/+996502820642`. The Contact page also offers `tg://resolve?phone=996502820642` for an installed Telegram app. Account discovery depends on Telegram privacy settings; the website cannot override them. Bot notifications separately require TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.

## Interface and themes

The redesigned UI uses one stylesheet (`src/styles/design-system.css`) and explicit Day / Night controls. See `DESIGN.md` for theme tokens and shared components, and `AUDIT.md` for current scope, test evidence and external-service limitations. The original product data is preserved; bundled sample illustrations are labelled and should be replaced with verified product photos before publication.

## Required checkout migration

Before deploying the updated API to an existing Supabase project, apply **`supabase/checkout.sql` first**. It adds `orders.stock_reserved`, the backend-only `place_order` function, and a trigger that restores stock on cancellation and reserves it again when reactivating an order. Existing unreserved orders are not artificially restocked. Without the migration the updated API returns 503 instead of falling back to unsafe nontransactional writes. Run `npm run test:db` for isolated SQL checks; this does not access your Supabase project.

## Финальная проверка и production

Актуальный отчёт: [FINAL_CHECK.md](FINAL_CHECK.md), исправления фотографий: [AUDIT.md](AUDIT.md). Настройки, SQL-миграции и точные команды запуска: [PRODUCTION.md](PRODUCTION.md). После настройки среды: `npm ci`, `npm run build`, `npm start`. Требуется Node.js 24+. До публикации API примените `supabase/checkout.sql`. Секреты задавайте только в защищённой среде хостинга.

Настройка Telegram-бота, `/start` и webhook: [TELEGRAM.md](TELEGRAM.md). Локальные проверки без отправки сообщений: `npm run test:telegram`. Диагностика подключения: `npm run telegram:check`.

Для опубликованного сайта на Netlify: [NETLIFY.md](NETLIFY.md). Нужна публикация исходников с Functions; загрузки одного `dist` недостаточно.
