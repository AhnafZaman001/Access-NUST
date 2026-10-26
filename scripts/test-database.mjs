import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
let checks = 0;
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333";
await db.exec(
  `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
);
await db.exec(
  fs.readFileSync("supabase/migrations/202610260001_initial.sql", "utf8"),
);
await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
const result = await db.query(
  "select count(*)::int as count from public.places",
);
assert.equal(result.rows[0].count, 65);
checks++;
await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));
assert.equal(
  (await db.query("select count(*)::int as count from public.places")).rows[0]
    .count,
  65,
);
checks++;
await db.exec(
  `insert into auth.users(id) values('${owner}'),('${other}'),('${admin}'); insert into public.admin_users values('${admin}');`,
);
async function as(role, id = "") {
  await db.exec(
    `reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
async function denied(sql) {
  await assert.rejects(db.exec(sql));
  checks++;
}
await as("anon");
assert.equal(
  (await db.query("select count(*)::int as count from places")).rows[0].count,
  65,
);
checks++;
await denied("select * from profiles");
await denied(
  "update places set name='attacker' where id='nust-medical-centre'",
);
await as("authenticated", owner);
assert.equal((await db.query("select * from profiles")).rows.length, 1);
checks++;
await db.exec(
  `update profiles set preferences=array['Avoid steps'] where id='${owner}';`,
);
assert.deepEqual(
  (await db.query("select preferences from profiles")).rows[0].preferences,
  ["Avoid steps"],
);
checks++;
assert.equal(
  (
    await db.query(
      `update profiles set display_name='attacker' where id='${other}' returning id`,
    )
  ).rows.length,
  0,
);
checks++;
assert.equal(
  (
    await db.query(
      "update places set name='attacker' where id='nust-medical-centre' returning id",
    )
  ).rows.length,
  0,
);
checks++;
await denied(`insert into admin_users values('${owner}')`);
await denied(
  "insert into places(id,name,category) values('bad-place','Bad','Other')",
);
await denied(
  `update profiles set preferences=array['arbitrary diagnosis'] where id='${owner}'`,
);
await db.exec(
  `insert into saved_places(user_id,place_id) values('${owner}','nust-medical-centre')`,
);
assert.equal((await db.query("select * from saved_places")).rows.length, 1);
checks++;
await denied(
  `insert into saved_places(user_id,place_id) values('${other}','nust-central-library')`,
);
await as("authenticated", other);
assert.equal((await db.query("select * from saved_places")).rows.length, 0);
checks++;
await as("authenticated", admin);
assert.equal(
  (await db.query("select is_admin() as allowed")).rows[0].allowed,
  true,
);
checks++;
assert.equal((await db.query("select * from profiles")).rows.length, 3);
checks++;
assert.equal((await db.query("select * from saved_places")).rows.length, 0);
checks++;
await db.exec(
  `update profiles set display_name='Updated by admin' where id='${other}';`,
);
await db.exec(
  "update places set description='Admin-reviewed description' where id='nust-medical-centre'",
);
await db.exec(
  "insert into places(id,name,category,published) values('draft-place','Draft','Other',false)",
);
await denied("update places set latitude=33 where id='draft-place'");
await denied(
  "update places set latitude=200,longitude=73 where id='draft-place'",
);
await denied("update places set location_verified=true where id='draft-place'");
await denied(
  "update places set accessibility=jsonb_set(accessibility,'{ramp}','\"yes\"') where id='draft-place'",
);
await denied("update places set accessibility='{}' where id='draft-place'");
await db.exec(
  `update places set latitude=33.64,longitude=72.99,location_source='https://example.org/survey',location_verified=true,checked_at=current_date,evidence='[{"claim":"Test fixture only"}]',accessibility=jsonb_set(accessibility,'{ramp}','"yes"') where id='draft-place'`,
);
checks++;
await as("authenticated", owner);
assert.equal(
  (await db.query("select * from places where id='draft-place'")).rows.length,
  0,
);
checks++;
await denied(
  `insert into saved_places(user_id,place_id) values('${owner}','draft-place')`,
);
await as("anon");
assert.equal(
  (await db.query("select * from places where id='draft-place'")).rows.length,
  0,
);
checks++;
await as("authenticated", admin);
await db.exec("delete from places where id='nust-medical-centre'");
await as("authenticated", owner);
assert.equal((await db.query("select * from saved_places")).rows.length, 0);
checks++;
await db.close();
console.log(
  `${checks} database checks passed: migration, repeatable seed, profile privacy, admin grants, bookmarks, drafts, constraints and cascade deletion.`,
);
