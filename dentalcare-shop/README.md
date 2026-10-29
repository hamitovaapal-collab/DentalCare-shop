# DentalCare Shop (React + Vite + Supabase)

Dental clinic site + shop. Frontend: React Router, 3 languages (KG/RU/EN), light/dark theme, cart, favorites, booking, reviews, admin, FAQ chatbot.
Backend: two small serverless functions in `api/` (`order.js`, `booking.js`) that validate input, recompute prices from the database, save with the Supabase service key, and send Telegram + email notifications.

## 1. Run in VS Code

1. Install Node.js 20.6+. 2. Open the `dentalcare-shop` folder in VS Code. 3. Terminal: `npm install`
2. Copy `.env.example` to `.env` (fill it in as described below — **the site also runs without it**: shop browsing, cart, favorites, booking form validation, WhatsApp and the chatbot work; login/orders/reviews/admin show "Supabase is not configured").
3. `npm run dev` → open http://localhost:5173 (frontend) — local API runs on :5000 and is proxied automatically.

## 2. Supabase (needs your account — required for login, orders, bookings, reviews, admin)

1. supabase.com → New project.
2. SQL Editor → paste all of `supabase/schema.sql` → Run. (Creates tables, Row Level Security policies, seed products.)
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
