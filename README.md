# Access NUST

An independent accessibility-map concept for NUST H-12, Islamabad. Built with Next.js, React, TypeScript and Leaflet. Designed for Vercel.

## Run

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Production: `npm run build` then `npm run start`.

## Demo features

- Campus map with category filters, search and matching place list.
- Place details and clearly labeled illustrative route previews.
- Saved places and preferences stored only in the current browser.
- Admin interface preview that edits sample place names for the current page session.
- Responsive layout, keyboard controls, modal focus containment and reduced-motion support.

## Data boundaries

All six records in `lib/places.ts` are illustrative. Coordinates, accessibility features and route segments are not verified. Do not use this prototype as navigation or emergency guidance. OpenStreetMap tiles provide geographic context, not wheelchair-accessibility certification. The official NUST site could not be retrieved in the build environment (proxy HTTP 403); no official accessibility facts were established.

The admin demo has no authentication and must never contain real student data. There is no Supabase integration yet. No continuous location tracking, diagnosis collection, payments or messaging is implemented.

## Validate

```sh
npm run build
npm run typecheck
npx playwright install chromium
# With the production server running in another terminal:
npx playwright test
```

For environments that block Playwright's download host, an npm-distributed Chromium is included as a development dependency:

```sh
node --input-type=module -e "import chromium from '@sparticuz/chromium'; console.log(await chromium.executablePath())"
CHROMIUM_EXECUTABLE_PATH=/tmp/chromium npx playwright test
```

Use the path actually printed by the first command. The two browser tests exercise filters, search, saving, preference persistence, route preview, admin editing, mobile width and empty states.

## Deploy to Vercel

Import `AhnafZaman001/Access-NUST` into Vercel, select the Next.js framework and repository root, then deploy. No environment variables or database credentials are needed for this demo. Build command: `npm run build`; output uses the Next.js default. Test map tiles from the deployed browser; outbound requests to `tile.openstreetmap.org` must be permitted.

Alternatively, with authorized Vercel CLI authentication, run `npx vercel` for a preview deployment. Do not put tokens in source, remote URLs or chat.

## Pitch walkthrough

1. Explain the mission: campus accessibility information in one place.
2. Filter by a destination category and open its details.
3. Show what is known versus what still requires verification.
4. Preview an illustrative route and explain the planned campus survey.
5. Save a place and select functional preferences without providing medical history.
6. Show the admin interface and describe the future verification workflow.

## Next milestone

Survey actual campus facilities; retain source and verification dates. Then add Supabase Auth, database tables, owner-only preference policies and admin-only campus-data policies before collecting any personal information. Validate continuous wheelchair routes, surfaces, gradients and barriers before offering navigation.
