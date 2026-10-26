# Access NUST

Disability and mobility access at NUST H-12, Islamabad, with a focus on wheelchair users, physical access barriers, and access-needs profiles. Next.js/React frontend, Supabase Auth/Postgres backend, and Vercel deployment support.

## Run

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Production: `npm run build` then `npm run start`.

Without Supabase configuration, the public app serves 65 researched records and saves guest preferences/bookmarks only in the browser. Account and admin pages clearly explain that the backend is disconnected. A configured but unreachable backend produces an error; the directory labels its bundled research fallback.

## Frontend

- Search and category filters across researched campus records.
- Campus-guide marker numbers, evidence links, source-access limitations and accessibility status on place cards.
- Map pins only for reviewed coordinates. All initial coordinates are null; there are no fabricated facility or route pins.
- Optional accounts, private preferences/bookmarks, and a voluntary access-needs profile covering mobility aids, barriers, required facilities, assistance and regular destinations.
- Explicit consent, optional questions, profile editing/deletion, and administrator visibility disclosed before submission. Guest answers remain on the browser.
- Admin place creation, editing, publishing, deletion, coordinate review, accessibility observations and supporting evidence; profile management.
- Responsive layout, map/list parity, keyboard focus containment and reduced-motion support.
- Ordinary trackpad scrolling moves the page; intentional Ctrl+wheel/pinch zooms around the map centre in controlled increments. Zoom buttons and touchscreen pinch remain available.

## Backend setup

Follow [supabase/README.md](supabase/README.md). Run the migration, then the seed. Configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

An example is provided in `.env.example`. Do not place private credentials in `NEXT_PUBLIC_*` variables. The database enforces user/admin permissions with row-level security. There is no signup flow that grants admin access.

Public endpoints:

- `GET /api/places`: published Supabase directory, or bundled research if the backend is unconfigured.
- `GET /api/health`: process/configuration status, not a live database health check.

Authenticated writes use the Supabase client and database policies directly. No service-role bypass is used.

## Research

`data/campus-directory.json` preserves the 73-record research consolidation, 46 guide markers, evidence and isolated uncertain coordinates. `lib/places.ts` selects 65 place/service records for the public directory. Unresolved entities, policy/aggregate/road records, and the disputed remote Sports Complex object are not public destinations. The campus guide is historical; omission is not evidence of nonexistence. None of the imported data establishes wheelchair accessibility. No route guidance is offered without a route survey.

Original PDF imagery is not redistributed. Sources are linked in each record; research excerpts and provenance are retained for review.

## Verify

```sh
npm run build
npm run typecheck
npm run test:db
# Start production server in a separate terminal, then:
npx playwright install chromium
npm run test:e2e
```

When browser downloads are blocked, the included development-only Chromium package can supply a binary:

```sh
node --input-type=module -e "import chromium from '@sparticuz/chromium'; console.log(await chromium.executablePath())"
CHROMIUM_EXECUTABLE_PATH=/tmp/chromium npm run test:e2e
```

Use the actual path printed. Database tests run the real schema/policies locally with a simulated auth identity; hosted Auth and email delivery require separate verification in your Supabase project.

## Deploy

Import `AhnafZaman001/Access-NUST` into Vercel as a Next.js project. Build command: `npm run build`. Add the public Supabase configuration and rebuild when the database is ready. Configure the matching Auth Site URL in Supabase. Map tiles require browser access to `tile.openstreetmap.org` and retain OpenStreetMap attribution.

Before accepting real users, verify email confirmation, two-user privacy, owner-only admin access, saving across devices, and published changes on the deployed site. Establish a contact and account-deletion process. No continuous location tracking, medical-history collection or verified route engine is implemented.

Existing Supabase projects must apply `supabase/migrations/202610260002_access_profiles.sql` before collecting signed-in access profiles. Existing accounts and campus data are preserved.
