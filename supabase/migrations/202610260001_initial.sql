begin;
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
-- Only an owner using the SQL editor/service role may appoint an administrator.
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.valid_accessibility(value jsonb) returns boolean language sql immutable as $$
 select jsonb_typeof(value) = 'object'
 and value ?& array['stepFreeEntrance','ramp','lift','accessibleWashroom','accessibleParking']
 and (select count(*)=5 and bool_and(v in ('"unknown"'::jsonb,'"yes"'::jsonb,'"no"'::jsonb)) from jsonb_each(value) as x(k,v));
$$;
create table public.places (
 id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,100}$'),
 name text not null check(length(trim(name)) between 1 and 160),
 category text not null check(category in ('Entrances','Washrooms','Medical','Study spaces','Academic','Food','Hostels','Support','Other')),
 description text not null default '' check(length(description)<=4000),
 aliases text[] not null default '{}', guide_markers integer[] not null default '{}',
 latitude double precision, longitude double precision,
 location_verified boolean not null default false,
 location_source text check(location_source is null or (location_source ~ '^https://' and length(location_source)<=2000)),
 accessibility jsonb not null default '{"stepFreeEntrance":"unknown","ramp":"unknown","lift":"unknown","accessibleWashroom":"unknown","accessibleParking":"unknown"}' check(public.valid_accessibility(accessibility)),
 evidence jsonb not null default '[]' check(jsonb_typeof(evidence)='array'),
 limitations text[] not null default '{}',
 checked_at date, published boolean not null default false,
 updated_at timestamptz not null default now(),
 check((latitude is null and longitude is null) or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)),
 check(not location_verified or (latitude is not null and longitude is not null and location_source is not null)),
 check(accessibility = '{"stepFreeEntrance":"unknown","ramp":"unknown","lift":"unknown","accessibleWashroom":"unknown","accessibleParking":"unknown"}'::jsonb or (checked_at is not null and jsonb_array_length(evidence)>0))
);
alter table public.places enable row level security;
grant select on public.places to anon, authenticated;
grant insert,update,delete on public.places to authenticated;
create policy places_public_read on public.places for select using(published or public.is_admin());
create policy places_admin_insert on public.places for insert to authenticated with check(public.is_admin());
create policy places_admin_update on public.places for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy places_admin_delete on public.places for delete to authenticated using(public.is_admin());

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(length(display_name)<=100),
 preferences text[] not null default '{}' check(preferences <@ array['Avoid steps','Prefer gentle slopes','Find accessible washrooms','Prefer quiet spaces']::text[] and cardinality(preferences)<=4),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select,update on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id) values(new.id); return new; end;
$$;
revoke all on function public.create_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create table public.saved_places (
 user_id uuid not null references auth.users(id) on delete cascade,
 place_id text not null references public.places(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,place_id)
);
alter table public.saved_places enable row level security;
grant select,insert,delete on public.saved_places to authenticated;
create policy saved_read on public.saved_places for select to authenticated using(user_id=auth.uid());
create policy saved_insert on public.saved_places for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.places where id=place_id and published));
create policy saved_delete on public.saved_places for delete to authenticated using(user_id=auth.uid());
create index saved_places_place on public.saved_places(place_id);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
 begin new.updated_at=now();return new;end;
$$;
create trigger places_updated before update on public.places for each row execute function public.touch_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
commit;
