export type Category = "Entrances" | "Washrooms" | "Medical" | "Study spaces";
export type Place = {
  id: number;
  name: string;
  category: Category;
  area: string;
  lat: number;
  lng: number;
  features: string[];
  note: string;
};
// Illustrative coordinates and attributes. Not field-verified navigation data.
export const initialPlaces: Place[] = [
  {
    id: 1,
    name: "Central Library",
    category: "Study spaces",
    area: "Academic core",
    lat: 33.6427,
    lng: 72.9909,
    features: ["Entrance review needed", "Quiet-space review needed"],
    note: "Explore how accessible study spaces could be documented. Entrance and facility details require a campus survey.",
  },
  {
    id: 2,
    name: "Student Centre",
    category: "Entrances",
    area: "Student life",
    lat: 33.646,
    lng: 72.9919,
    features: ["Ramp review needed", "Door-width review needed"],
    note: "A sample entrance record. Ramp location, gradient and opening hours have not been verified.",
  },
  {
    id: 3,
    name: "Campus Medical Centre",
    category: "Medical",
    area: "Campus services",
    lat: 33.6449,
    lng: 72.9864,
    features: ["Access review needed", "Hours unconfirmed"],
    note: "A sample medical-facility record, not an emergency service directory. Confirm the real location and services with campus staff.",
  },
  {
    id: 4,
    name: "Academic Block · washroom",
    category: "Washrooms",
    area: "Academic core",
    lat: 33.6415,
    lng: 72.9884,
    features: ["Transfer-space review needed", "Access review needed"],
    note: "Illustrates a washroom listing. The existence and accessibility of this facility are not confirmed.",
  },
  {
    id: 5,
    name: "Academic Block · entrance",
    category: "Entrances",
    area: "Academic core",
    lat: 33.6404,
    lng: 72.993,
    features: ["Step-free review needed", "Surface review needed"],
    note: "A sample entrance pin for demonstrating filters. Do not use this location as an accessibility guarantee.",
  },
  {
    id: 6,
    name: "Student Commons",
    category: "Study spaces",
    area: "Student life",
    lat: 33.6478,
    lng: 72.9889,
    features: ["Seating review needed", "Access review needed"],
    note: "A sample shared-space record. Location and accessibility attributes await verification.",
  },
];
