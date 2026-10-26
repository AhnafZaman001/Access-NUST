export const roleOptions = [
  "Student",
  "Staff",
  "Visitor",
  "Supporting someone",
] as const;
export const mobilityOptions = [
  "Manual wheelchair",
  "Powered wheelchair",
  "Walking frame or walker",
  "Crutches or walking stick",
  "No mobility aid",
  "Prefer not to say",
] as const;
export const barrierOptions = [
  "Steps or stairs",
  "Steep slopes",
  "Uneven surfaces",
  "Narrow entrances",
  "Heavy doors",
  "Long distances without rest",
  "Inaccessible washrooms",
] as const;
export const facilityOptions = [
  "Step-free entrance",
  "Ramp",
  "Lift",
  "Accessible washroom",
  "Accessible parking",
  "Seating or rest points",
] as const;
export const assistanceOptions = [
  "Usually independent",
  "Sometimes need assistance",
  "Usually accompanied",
  "Prefer not to say",
] as const;
export type AccessProfile = {
  role: string;
  mobility_aids: string[];
  barriers: string[];
  facilities: string[];
  assistance: string;
  frequent_place_ids: string[];
  consent_version: string;
};
export const emptyAccessProfile: AccessProfile = {
  role: "",
  mobility_aids: [],
  barriers: [],
  facilities: [],
  assistance: "",
  frequent_place_ids: [],
  consent_version: "",
};
export const consentVersion = "access-profile-v1";
export function validateAccessProfile(p: AccessProfile) {
  if (!roleOptions.includes(p.role as (typeof roleOptions)[number]))
    throw new Error("Choose how you use the campus.");
  if (
    p.mobility_aids.some(
      (x) => !mobilityOptions.includes(x as (typeof mobilityOptions)[number]),
    ) ||
    p.barriers.some(
      (x) => !barrierOptions.includes(x as (typeof barrierOptions)[number]),
    ) ||
    p.facilities.some(
      (x) => !facilityOptions.includes(x as (typeof facilityOptions)[number]),
    )
  )
    throw new Error("Choose one of the listed access needs.");
  if (
    p.assistance &&
    !assistanceOptions.includes(
      p.assistance as (typeof assistanceOptions)[number],
    )
  )
    throw new Error("Choose one of the listed assistance options.");
  if (p.frequent_place_ids.length > 10)
    throw new Error("Choose up to 10 regular destinations.");
  if (
    p.mobility_aids.includes("Prefer not to say") &&
    p.mobility_aids.length > 1
  )
    throw new Error("Choose either a mobility aid or “Prefer not to say”.");
  if (p.consent_version !== consentVersion)
    throw new Error("Please confirm how your access profile will be used.");
  return p;
}
