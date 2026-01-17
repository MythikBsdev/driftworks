# Multi-brand Workshop Dashboard

A cinematic Supabase + Next.js dashboard for automotive teams. The project now ships with five ready-made identities (Driftworks, Benny's, Los Santos Customs, Synline Auto, and Big Tuna) and a scalable brand system so you can spin up additional client portals by editing a single config file.

## Tech Stack
- Next.js 15 (App Router) + React 19
- Tailwind CSS 4 with CSS-variable driven theming
- Supabase for auth/Postgres/RLS
- TypeScript + Zod + lucide-react icons

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Populate:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(needed for server actions that write to Supabase)*
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)
   - `NEXT_PUBLIC_BRAND` (defaults to `driftworks`, set to `bennys` for Benny's, `lscustoms` for Los Santos Customs, `synlineauto` for Synline Auto, or `bigtuna` for Big Tuna)
   - `DISCORD_WEBHOOK_DRIFTWORKS` / `DISCORD_WEBHOOK_BENNYS` / `DISCORD_WEBHOOK_LSCUSTOMS` / `DISCORD_WEBHOOK_SYNLINELAUTO` / `DISCORD_WEBHOOK_BIGTUNA` for brand-specific sale alerts (optional)
   - `DISCORD_BOT_TOKEN` for the `!buy` Discord bot (optional)
   - `DISCORD_BRAND_SLUG` for the `!buy` bot to tag purchases to the correct brand (defaults to `NEXT_PUBLIC_BRAND`)
   - `DISCORD_BRAND_GUILD_MAP` optional mapping for a shared bot: comma-separated `guildId:brand_slug` pairs so each guild routes to its brand (e.g. `123456789012345678:lscustoms,987654321098765432:bennys`)
   - `DISCORD_CART_IMAGE` optional thumbnail URL for the bot embed (optional)
   - `DISCORD_CURRENCY` currency code for the bot totals (defaults to `USD`)
3. **Provision Supabase**
   - Run `supabase/schema.sql` inside the Supabase SQL editor.
   - Enable the Email auth provider and allow redirects to `http://localhost:3000/login`.
   - Create an initial user from Supabase Auth or via the REST signup endpoint.
4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000).

### Optional Checks
- `npm run lint` - ESLint with type-aware rules.

## Discord !buy Bot
- Apply `supabase/schema.sql` so the `discord_purchases` table exists.
- Create a Discord bot token with Message Content intent enabled and set `DISCORD_BOT_TOKEN` (plus `DISCORD_CART_IMAGE` / `DISCORD_CURRENCY` if you want a thumbnail or different currency).
- Start the bot with `npm run discord:dev`. It listens for `!buy <amount>` and replies with an embed showing the price and running total (persisted in Supabase).
- Inviting the bot: grant the `Send Messages` and `Embed Links` permissions in the channels where it should run.

## Branding
- All presets live in `src/config/brands.ts` (logo paths, colors, copy, domains).
- `NEXT_PUBLIC_BRAND` selects which preset to load at build/runtime. You can also match by domain via `findBrandByHost`.
- Tailwind reads from CSS variables that the root layout injects, so new palettes automatically flow through every component.
- To add a client, drop their logo in `public/`, add a brand entry, and update your env/domain mapping.
- Discord sale alerts can be pointed at different channels per brand via `DISCORD_WEBHOOK_*` env vars listed above.

## Supabase Schema Cheatsheet
`supabase/schema.sql` creates:
- `profiles`, `clients`, `invoices`, `invoice_items`, `sales_orders`, loyalty tables, etc.
- RLS policies scoped to `auth.uid()`.
- Updated-at triggers for key tables.

Re-run the script safely; it drops/recreates policies.

## Deploying to Vercel
1. Push to GitHub (or your VCS).
2. Create a Vercel project pointing at this folder.
3. Add the env vars from `.env.example` in the Vercel dashboard (including `NEXT_PUBLIC_BRAND`).
4. Configure Supabase auth redirects for your production domain (e.g. `https://bennysmechanic.com/login` or `https://bigtunamechanic.com/login`).

Vercel runs `npm run build` automatically.

## Project Structure
```
src/
  app/
    (auth)/login          # Auth UI + server actions
    (dashboard)/          # Authenticated routes (sales, clients, loyalty, etc.)
  components/             # Reusable UI pieces
  config/                 # Brand definitions
  lib/                    # Supabase helpers, env parsing, utilities
supabase/schema.sql       # Database + RLS definition
```

## Access Control
- Middleware guards every dashboard route and bounces anonymous users to `/login`.
- Successful auth redirects back to `redirectTo` or `/dashboard`.

Enjoy building for Driftworks, Benny's, Los Santos Customs, Synline Auto, Big Tuna, or your next client drop!
