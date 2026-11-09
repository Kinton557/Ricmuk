# Ricmuk Enterprises: One Stop Hardware, Kadoma

A complete online hardware shop. No `npm install` needed: it uses only Node 22.5+ (built-in HTTP and SQLite).

## Run
1. Install Node.js 22.5 or newer.
2. `cp .env.example .env` and set `ADMIN_PASSWORD` and `SESSION_SECRET`.
3. `node server.js` then open http://localhost:3000
   (If no ADMIN_PASSWORD is set, one is generated and printed once in the console.)

## Pages
Home, Shop (search, categories, product pop-up), Cart and Checkout (guest or signed-in, collect or delivery), Order slip (printable) and Order tracking, Get a Quote, About, Contact, Sign in / Sign up, My Account, Terms, Privacy, 404, and the Admin Dashboard.

## Admin dashboard (/dashboard)
Orders (confirm, mark paid, message the customer, cancel returns stock), Products (add/edit, prices, stock, photo upload), Quotes, Messages, Customers, Settings (phones, hours, ZWG rate, delivery, EcoCash).

## BEFORE GOING LIVE
- **Prices are sample placeholders.** Update every product in Dashboard > Products, then tick "I have checked every product price" in Settings.
- Confirm in Settings: opening hours (assumed), email, delivery fee, EcoCash number (off until you add it).
- Replace flyer images with real product photos over time (Edit product > Photo).
- Set `NODE_ENV=production`, `ADMIN_PASSWORD`, `SESSION_SECRET`, serve over HTTPS, and keep `data/` on a persistent disk (set `DATA_DIR`). Never publish `data/` or `.env`.

## Deploy on Render (backend + website together)
1. Put this folder on GitHub (the `.gitignore` already keeps `data/` and `.env` out).
2. On render.com: **New > Blueprint**, pick the repo. Render reads `render.yaml`.
3. Enter `ADMIN_EMAIL` and `ADMIN_PASSWORD` when asked, then deploy.
4. Open your `onrender.com` link, go to `/login`, sign in with those details, then finish the "Before going live" list.
5. Add your own domain under Render > Settings > Custom Domains.

**Saving data:** everything (accounts, orders, products, uploads) lives in `/var/data` on the persistent disk, so it survives restarts and redeploys. A disk needs a paid Render plan (Starter). Do not use the free plan: it wipes data on every deploy. Use Dashboard > Settings > Download backup weekly.

**Forgot the admin password?** In Render > Environment set `ADMIN_PASSWORD` to a new value and `RESET_ADMIN_PASSWORD=1`, redeploy, sign in, then delete `RESET_ADMIN_PASSWORD`.
