import fs from "node:fs";
const research = JSON.parse(
  fs.readFileSync("data/campus-directory.json", "utf8"),
);
const categoryMap = {
  entrance: "Entrances",
  medical: "Medical",
  library: "Study spaces",
  academic: "Academic",
  food: "Food",
  hostel: "Hostels",
  committee: "Support",
  counselling: "Support",
};
const rows = research.records
  .filter(
    (r) =>
      ["place", "service"].includes(r.kind) && r.id !== "nust-sports-complex",
  )
  .map((r) => ({
    id: r.id,
    name: r.name,
    category: categoryMap[r.category] || "Other",
    description: r.guideMarkers.length
      ? `Listed as marker ${r.guideMarkers.join(", ")} in the supplied campus guide. Current facility details and access need confirmation.`
      : "Reported in supplied research. Original sources and current details need confirmation.",
    aliases: r.aliases,
    guide_markers: r.guideMarkers,
    accessibility: r.accessibility,
    evidence: r.evidence,
    limitations: r.limitations,
    published: true,
  }));
const json = JSON.stringify(rows).replaceAll("'", "''");
fs.writeFileSync(
  "supabase/seed.sql",
  `-- Research records only. No candidate coordinates or unverified access claims imported.\n-- Repeatable: existing records and admin edits are preserved.\ninsert into public.places(id,name,category,description,aliases,guide_markers,accessibility,evidence,limitations,published)\nselect id,name,category,description,aliases,guide_markers,accessibility,evidence,limitations,published\nfrom jsonb_populate_recordset(null::public.places, '${json}'::jsonb)\non conflict(id) do nothing;\n`,
);
console.log(`Generated ${rows.length} research records.`);
