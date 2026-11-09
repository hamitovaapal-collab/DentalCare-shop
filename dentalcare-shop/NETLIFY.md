# Netlify deployment — DentalCare Shop

Checked 9 November 2026. Target: https://dentalcare-shop.netlify.app/.

## Confirmed locally

The repository had a Vercel rewrite and an Express server, but no Netlify configuration or Functions entry point. A static `dist` upload does not run Express and does not convert `api/*.js` into Netlify Functions. That deployment path cannot provide this project's relative `/api/order`, `/api/booking` and Telegram webhook endpoints by itself.

Added:

- Repository-root `netlify.toml`: base `dentalcare-shop`, build `npm run build`, publish `dist`, functions `netlify/functions`, Node 24, esbuild bundling.
- API rewrite before SPA fallback: `/api/*` → `/.netlify/functions/api/:splat`.
- `netlify/functions/api.mjs`: Netlify v2 Request/Response adapter for the existing real API handlers. Preserves authentication headers, webhook secret checks, validation, errors and notification logic. JSON is limited to 100 KiB. Unknown API routes return JSON 404; they are not silently replaced by HTML.
- SPA fallback for direct links/reloads such as `/shop/p1`, `/cart`, `/login`.
- `npm run test:netlify`: 9 adapter checks, using the actual API handlers.

## What is not confirmed

The Cloud proxy denied CONNECT to the public hostname with 403. This response came from the environment proxy before connecting to Netlify; it is **not evidence that the website returns 403**. No deployed HTML, asset versions, layout, live API response or deployment log was retrieved. The exact deployed commit and hosting settings remain unknown.

The managed environment has no shared Desktop/browser-control capability or offered desktop tool. Automated browser software can run locally, but cannot bypass the same outbound domain restriction. Environment ID at diagnosis: `ccarenv_b64_Y2NhcmVudl84ZTY4MjI5YWFiODQ4MTkxYmI4ZTA5Mjk0ZDk5OTYwMA`.

A Cloud Environment Onboarding network draft was saved for the exact domain `dentalcare-shop.netlify.app`. It needs review, Save and Publish in this chat's environment settings. Existing package-manager presets were preserved. Saving the draft did not apply it, grant Netlify account access or publish website changes.

## Publish the actual changed source

1. Preserve all current changes, including prior fixes, in the repository/branch that the existing Netlify project builds. These files are currently local; triggering a deployment of an unchanged old Git branch does not publish them.
2. Use the repository-root `netlify.toml`. Confirm in Netlify that the connected repository is this repository and the selected branch includes the fixes. Effective base is `dentalcare-shop`, build `npm run build`, publish `dist`, functions `netlify/functions`, relative to the base. Avoid duplicating the base into paths such as `dentalcare-shop/dentalcare-shop/dist`.
3. Set frontend `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time. Set private `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` and optional email settings for Functions runtime only. Set `SITE_URL=https://dentalcare-shop.netlify.app` when configuring the webhook. Never put private keys in `VITE_` variables or Git.
4. Apply the existing documented SQL migrations before updated checkout/webhook: `supabase/checkout.sql` and `supabase/telegram.sql`. Do not erase the existing database.
5. Deploy the changed source and confirm the **api** function is listed in the deployment. Uploading only `dist` through drag-and-drop is insufficient for this application.
6. Verify live `/api/health` returns JSON with configuration flags; flags establish configuration presence, not remote delivery. `/api/order` GET should return JSON 405. `/api/missing` should return JSON 404. Reload `/shop/p1` and `/cart` directly.
7. Inspect mobile header/cards, test cart and auth, then create one clearly marked test order using your own authorized account. Verify it in Supabase, stock, delivery to the configured Telegram chat, and cancellation/restoration. Follow `TELEGRAM.md` for webhook setup. Do not create a second order merely to retry a failed notification.

For CLI deployment from the repository root, on your trusted machine with your own authenticated Netlify account:

```sh
npx netlify-cli link
npx netlify-cli deploy --build --prod
```

Select the **existing** DentalCare project when linking; do not create a replacement site. These commands are instructions, not actions executed in this cloud session. No Netlify token/account access is configured here, so no deployment was made.

## Validation

- Netlify adapter: 9/9 checks passed (health/HEAD, original and rewritten paths, methods, authentication, booking validation, JSON/body limit, webhook protection, unknown routes).
- Bundled function compiled using esbuild for Node 24; imported standalone and returned a successful health response.
- TOML parsed; base/publish/functions paths and redirect ordering verified.
- Vite production build passed.
- Existing API 21/21 and Telegram 12/12 tests passed. These do not establish actual external service connectivity.
- `git diff --check` passed.

No external messages, customer data changes or public deployment were performed.
