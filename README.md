# Driftworks Invoice Dashboard

A modern invoice management experience for Driftworks teams. The app ships with a cinematic login screen, a Supabase-backed dashboard for invoices and clients, and ready-to-use CRUD flows for managing billing from any device. Built with the Next.js App Router for an optimal Vercel deployment path.

## Tech Stack
- Next.js 15 (App Router) + React 19
- Tailwind CSS 4 with custom theming
- Supabase for authentication, row-level security, and Postgres storage
- TypeScript throughout, Zod for server-side validation, lucide-react icons

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Populate the values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(optional – only required for admin tasks)*
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` for local dev)
3. **Provision Supabase**
   - Open the Supabase SQL editor (or connect via `psql`) and run `supabase/schema.sql` located in this repo:
     ```sql
     -- inside Supabase SQL editor
     -- paste the contents of supabase/schema.sql and run it once
     ```
   - Enable the **Email** auth provider and set the redirect URL to `http://localhost:3000/login`.
   - Create at least one user from the Supabase Auth dashboard or by using the hosted `/auth/v1/signup` endpoint.
4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The dashboard will be live at [http://localhost:3000](http://localhost:3000).

### Optional Checks
- `npm run lint` – type-aware linting via ESLint.

## Supabase Schema Cheatsheet
The included `supabase/schema.sql` file creates:
- `profiles` – mirrors `auth.users` for display data.
- `clients`, `invoices`, `invoice_items` – full invoice data model.
- Row Level Security policies locking every table to the authenticated `auth.uid()` owner.
- Updated-at triggers for clients & invoices.

Re-run the script at any time; policies are dropped/recreated idempotently.

## Deploying to Vercel
1. Push the repo to GitHub (or your preferred VCS).
2. Create a new Vercel project targeting this directory.
3. Add the environment variables from `.env.example` to the Vercel dashboard.
4. Configure the Supabase authentication redirect for production (e.g. `https://your-vercel-app.vercel.app/login`).

Vercel will build the project with `npm run build` automatically.

## Project Structure
```
src/
  app/
    (auth)/login          # Login experience & server actions
    (dashboard)/          # All authenticated routes (dashboard, invoices, clients, etc)
  components/             # Reusable UI, including forms and tables
  lib/                    # Supabase helpers, env parsing, utilities
supabase/schema.sql        # Database + RLS definition for Supabase
```

## Credentials & Access
- The middleware guards every dashboard route. Anonymous users are redirected to `/login`.
- Successful login returns users to the originally requested path (`redirectTo`) or `/dashboard`.

## Contributing & Next Steps
- Extend the `reports` or `settings` routes as new features ship.
- Hook in PDF generation or payment providers by integrating with the `/invoices/[id]` detail view.

Enjoy building with Driftworks!