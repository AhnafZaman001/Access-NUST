import research from "@/data/campus-directory.json";
export const categories = [
  "Entrances",
  "Washrooms",
  "Medical",
  "Study spaces",
  "Academic",
  "Food",
  "Hostels",
  "Support",
  "Other",
] as const;
export type Category = (typeof categories)[number];
export const accessKeys = [
  "stepFreeEntrance",
  "ramp",
  "lift",
  "accessibleWashroom",
  "accessibleParking",
] as const;
export type AccessStatus = "unknown" | "yes" | "no";
export type Place = {
  id: string;
  name: string;
  category: Category;
  area: string;
  lat: number | null;
  lng: number | null;
  features: string[];
  note: string;
  guideMarkers: number[];
  aliases: string[];
  accessibility: Record<(typeof accessKeys)[number], AccessStatus>;
  evidence: {
    claim: string;
    url?: string | null;
    evidenceAccess: string;
    publicationDate?: string | null;
    accessedDate?: string | null;
    sourceId?: string;
  }[];
  limitations: string[];
  published: boolean;
  location_verified: boolean;
  location_source: string | null;
  checked_at: string | null;
};
const categoryMap: Record<string, Category> = {
  entrance: "Entrances",
  medical: "Medical",
  library: "Study spaces",
  academic: "Academic",
  food: "Food",
  hostel: "Hostels",
  committee: "Support",
  counselling: "Support",
};
export const featureLabels: Record<(typeof accessKeys)[number], string> = {
  stepFreeEntrance: "Step-free entrance",
  ramp: "Ramp",
  lift: "Lift",
  accessibleWashroom: "Accessible washroom",
  accessibleParking: "Accessible parking",
};
export function featureTags(a: Place["accessibility"]) {
  const known = accessKeys.filter((k) => a[k] !== "unknown");
  return known.length
    ? known.map(
        (k) =>
          `${featureLabels[k]}: ${a[k] === "yes" ? "reported available" : "reported unavailable"}`,
      )
    : ["Accessibility not yet checked"];
}
export const initialPlaces: Place[] = research.records
  .filter((r) => r.kind === "place" || r.kind === "service")
  .filter((r) => r.id !== "nust-sports-complex")
  .map((r) => ({
    id: r.id,
    name: r.name,
    category: categoryMap[r.category] || "Other",
    area: "NUST H-12",
    lat: null,
    lng: null,
    features: ["Accessibility not yet checked"],
    note: r.guideMarkers.length
      ? `Listed as marker ${r.guideMarkers.join(", ")} in the supplied campus guide. Current facility details and access need confirmation.`
      : "Reported in supplied research. Original sources and current details need confirmation.",
    guideMarkers: r.guideMarkers,
    aliases: r.aliases,
    accessibility: r.accessibility as Place["accessibility"],
    evidence: r.evidence,
    limitations: r.limitations,
    published: true,
    location_verified: false,
    location_source: null,
    checked_at: null,
  }))
  .sort((a, b) => {
    const priority = [
      "nust-medical-centre",
      "nust-central-library",
      "nust-sada",
      "nust-gate-1",
      "nust-gate-2",
      "nust-cafeteria-c1",
      "nust-cafeteria-c2",
    ];
    const rank = (id: string) =>
      priority.includes(id) ? priority.indexOf(id) : 99;
    return rank(a.id) - rank(b.id) || a.name.localeCompare(b.name);
  });
export function fromRow(r: Record<string, unknown>): Place {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Category,
    area: "NUST H-12",
    lat: r.latitude as number | null,
    lng: r.longitude as number | null,
    features: featureTags(r.accessibility as Place["accessibility"]),
    note: r.description as string,
    guideMarkers: r.guide_markers as number[],
    aliases: r.aliases as string[],
    accessibility: r.accessibility as Place["accessibility"],
    evidence: r.evidence as Place["evidence"],
    limitations: r.limitations as string[],
    published: r.published as boolean,
    location_verified: r.location_verified as boolean,
    location_source: r.location_source as string | null,
    checked_at: r.checked_at as string | null,
  };
}
export function safeSource(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
