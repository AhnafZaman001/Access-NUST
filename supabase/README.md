# Connect Supabase

The app uses Supabase Auth and its generated PostgREST API. Row-level security is the authorization boundary; hiding an admin button is not a security control. No service-role key is needed by the application.

## One-time project setup

1. Create your Supabase project.
2. Run `migrations/202610260001_initial.sql`, then `migrations/202610260002_access_profiles.sql` in the Supabase SQL editor. Each is a one-time migration wrapped in a transaction. For an existing installation, run only unapplied migrations.
3. Run `seed.sql` in the same editor. It imports 65 researched records and is safe to repeat: existing records and edits are preserved. No candidate coordinates are imported.
4. In Authentication settings, enable email/password sign-in, keep email confirmation enabled, configure the Site URL to the final Vercel origin, and configure SMTP for reliable production confirmation delivery. Validate confirmation in the real project before accepting users.
5. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel's environment settings and rebuild. These are public client configuration, protected by database policies. Never use a service-role key here.
6. Create and confirm your own account through `/account`.
7. In the SQL editor, appoint only your account as administrator using its exact Auth user UUID:

```sql
insert into public.admin_users(user_id)
values ('YOUR-EXACT-AUTH-USER-UUID')
on conflict do nothing;
```

Sign out and back in, then open `/admin`. Do not grant administrator access based on user-controlled signup metadata.

## Data model

- `places`: published directory records are public; drafts and edits are admin-only. Coordinates are independently reviewed before mapping. All imported accessibility values are unknown.
- `profiles`: a row is created when an Auth user is created. Users can read/edit their own profile. Admin can manage profiles. Preferences are constrained to the four supported functional options; no medical-history field exists.
- `saved_places`: each user can read and change only their own bookmarks, including when the reader is an admin. References cascade on account/place deletion.
- `admin_users`: no anonymous/authenticated table access. Only trusted database administration can add roles. `is_admin()` uses a fixed search path and reads the current authenticated user ID.

Account deletion can be performed by the owner in Supabase Auth after confirming a user's request; related profile/bookmark records are deleted automatically. Do not collect sensitive records until your privacy/contact process is ready.

## Validation and boundaries

`npm run test:db` executes the actual migration and seed in PGlite (PostgreSQL compiled to WASM). It supplies a minimal test `auth.users` and `auth.uid()` to test real SQL policies under anon/authenticated roles. It verifies privacy, forbidden writes, admin rights, constraints, seed repeatability and cascades. It does not validate Supabase's hosted Auth delivery, session refresh, network policy or your deployed project.

`npm run test:e2e` currently exercises the unconfigured directory and guest mode. Real signup, confirmation, signed-in bookmarking, admin editing and deployment still need a smoke test after configuration.

The initial admin interface loads up to 500 campus records and 200 profiles. Pagination and auditing are future production work if usage exceeds those limits. No verified route engine is implemented.


## Upgrade: mobility access profiles

If the initial schema is already installed, run only `migrations/202610260002_access_profiles.sql`. Do not rerun the initial migration or reset the database. This adds a separate `access_profiles` table and policies without changing existing records.

Signed-in users can voluntarily submit their campus role, mobility aids, barriers, facilities needed, assistance needs and up to ten regular destinations. Consent is required. Other questions are optional. Users can edit or delete their access profile. Only its owner and the site administrator can read it. Admin can see submitted responses under User profiles and delete a response when requested. Guest responses stay in browser storage and are never automatically uploaded at sign-in. No diagnoses, medical documents, continuous location or visit tracking is collected.

The old `Prefer quiet spaces` preference is no longer offered. Existing database values are retained for compatibility and hidden in the user interface; users' prior records are not bulk-deleted. This does not affect the new mobility-specific profile fields.
