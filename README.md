# ShowMetra frontend

Minimal Next.js frontend for the first ShowMetra review loop. It uses the existing Supabase database, Auth, RLS policies, and RPC functions from `../metra-back`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- `@supabase/supabase-js`

The browser receives only the Supabase project URL and publishable key. Never add a Supabase secret key to this project.

The GitHub Pages build reads the same public values from `.env.production`. A publishable key is intentionally visible in the browser bundle and remains constrained by Row Level Security.

## Setup

Requirements: Node.js 20 LTS or newer and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://pccqaazumyqfdwicubvt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

For a local Supabase stack, obtain both values with `supabase status` from `../metra-back`.

## Routes

- `/login` — email/password authentication and Google OAuth entry point
- `/auth/callback` — OAuth and email-confirmation callback
- `/dashboard` — organization overview and first-time organization setup
- `/dashboard/shows` — agency show list
- `/dashboard/shows/new` — show creation
- `/dashboard/shows/[id]` — show rating summary, guest feedback, performance creation, and review-link generation
- `/r/[token]` — public review-link resolution, guest sign-in, review form, and rating result

## Supabase Auth configuration

In Supabase Dashboard → Authentication:

1. Enable Email authentication. Decide whether email confirmation should be required.
2. To use Google, enable the Google provider and add its OAuth client ID and secret.
3. Set the Site URL for the deployed frontend.
4. Add redirect URLs for each environment, including:
   - `http://localhost:3000/auth/callback`
   - `https://your-frontend-domain.example/auth/callback`

The app passes the original `/r/[token]` path through the callback so a guest returns to the same review after authentication.

## Validation

```bash
npm run lint
npm run build
```

## GitHub Pages

Pushes to `main` run `.github/workflows/deploy-pages.yml`, build a static export under the `/metra-front` base path, and deploy it to GitHub Pages.

Enable the workflow once in GitHub under **Settings → Pages → Build and deployment → Source → GitHub Actions**. The expected URL is:

```text
https://showmetra.github.io/metra-front/
```

Because Pages is a static host, the deployed app uses `/review/?token=...` and `/dashboard/shows/view/?id=...` entry points. The included 404 bridge redirects existing `/r/[token]` and `/dashboard/shows/[id]` links to those pages.

The backend must already contain the ShowMetra migration with `resolve_review_link`, `submit_review`, `get_show_rating_summary`, and `get_show_rating_breakdown`.
