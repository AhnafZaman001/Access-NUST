-- Additive migration. Run after 202610260001_initial.sql.
-- Does not alter existing campus records, accounts, bookmarks or preferences.
begin;
create table public.access_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('Student','Staff','Visitor','Supporting someone')),
 mobility_aids text[] not null default '{}' check(mobility_aids <@ array['Manual wheelchair','Powered wheelchair','Walking frame or walker','Crutches or walking stick','No mobility aid','Prefer not to say']::text[] and cardinality(mobility_aids)<=6 and array_position(mobility_aids,null) is null),
 barriers text[] not null default '{}' check(barriers <@ array['Steps or stairs','Steep slopes','Uneven surfaces','Narrow entrances','Heavy doors','Long distances without rest','Inaccessible washrooms']::text[] and cardinality(barriers)<=7 and array_position(barriers,null) is null),
 facilities text[] not null default '{}' check(facilities <@ array['Step-free entrance','Ramp','Lift','Accessible washroom','Accessible parking','Seating or rest points']::text[] and cardinality(facilities)<=6 and array_position(facilities,null) is null),
 assistance text not null default '' check(assistance in ('','Usually independent','Sometimes need assistance','Usually accompanied','Prefer not to say')),
 frequent_place_ids text[] not null default '{}' check(cardinality(frequent_place_ids)<=10 and array_position(frequent_place_ids,null) is null and octet_length(frequent_place_ids::text)<=2000),
 consent_version text not null check(consent_version='access-profile-v1'),
 consented_at timestamptz not null check(consented_at<=now()+interval '5 minutes'),
 updated_at timestamptz not null default now(),
 check(not ('Prefer not to say'=any(mobility_aids)) or cardinality(mobility_aids)=1)
);
alter table public.access_profiles enable row level security;
grant select,insert,update,delete on public.access_profiles to authenticated;
revoke all on public.access_profiles from anon;
create policy access_profile_read on public.access_profiles for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy access_profile_insert on public.access_profiles for insert to authenticated with check(user_id=auth.uid());
create policy access_profile_update on public.access_profiles for update to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy access_profile_delete on public.access_profiles for delete to authenticated using(user_id=auth.uid() or public.is_admin());
create trigger access_profiles_updated before update on public.access_profiles for each row execute function public.touch_updated_at();
commit;
