import type { MatchedProfile } from "../../app/discovery/actions";

export type FilterKey = "roommate" | "roommate_with_room" | "room" | "all";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "roommate", label: "Roommate" },
  { key: "roommate_with_room", label: "Roommate with Room" },
  { key: "room", label: "Room" },
];

export function defaultFilters(role: string | null): FilterKey[] {
  if (role === "provider") return ["roommate"];
  return ["all"];
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function applyFilters(
  matches: MatchedProfile[],
  active: FilterKey[],
  savedIds: Set<string>,
  showSaved: boolean,
  activeTagFilters: string[],
  userPreferredGender: string | null,
  // Advanced numeric filters
  filterAgeMin: number | null,
  filterAgeMax: number | null,
  filterBudgetMin: number | null,
  filterBudgetMax: number | null,
  filterMaxDist: number | null,
  userLat: number | null,
  userLng: number | null,
  showIncompatible: boolean,
): MatchedProfile[] {
  let result = active.includes("all")
    ? matches
    : matches.filter((p) => {
        if (active.includes("roommate") && p.role === "seeker") return true;
        if (active.includes("roommate_with_room") && p.role === "provider")
          return true;
        if (active.includes("room") && p.role === "provider") return true;
        return false;
      });

  // Tag / gender filters
  if (activeTagFilters.length > 0) {
    result = result.filter((p) => {
      for (const tag of activeTagFilters) {
        if (tag === "__same_gender__") {
          if (
            p.preferred_gender &&
            p.preferred_gender !== "Prefer not to say" &&
            p.preferred_gender !== userPreferredGender
          )
            return false;
        } else {
          if (!p.lifestyle_tags.includes(tag)) return false;
        }
      }
      return true;
    });
  }

  // Age range filter
  if (filterAgeMin !== null && filterAgeMax !== null) {
    result = result.filter((p) => {
      if (p.age === null) return true; // keep unset ages
      return p.age >= filterAgeMin && p.age <= filterAgeMax;
    });
  }

  // Budget overlap filter
  if (filterBudgetMin !== null && filterBudgetMax !== null) {
    result = result.filter((p) => {
      if (p.budget_min === null && p.budget_max === null) return true;
      const cMin = p.budget_min ?? 0;
      const cMax = p.budget_max ?? 999999;
      // Ranges overlap when: candidate_min <= filter_max AND candidate_max >= filter_min
      return cMin <= filterBudgetMax && cMax >= filterBudgetMin;
    });
  }

  // Distance filter — exclude profiles without coords when filter is active
  if (filterMaxDist !== null && userLat !== null && userLng !== null) {
    result = result.filter((p) => {
      if (p.lat === null || p.lng === null) return false;
      return haversineKm(userLat, userLng, p.lat, p.lng) <= filterMaxDist;
    });
  }

  // Hide incompatible tier unless user explicitly enables it
  if (!showIncompatible) {
    result = result.filter((p) => p.tier !== "incompatible");
  }

  if (showSaved) return result.filter((p) => savedIds.has(p.id));
  return result;
}

export const BINARY_TAGS = [
  "Pet Allowed",
  "Non-Smoker",
  "LGBTQ+ Friendly",
  "Vegan Friendly",
];
export function getBinaryTags(tags: string[]): string[] {
  return tags.filter((t) => BINARY_TAGS.includes(t));
}

export function tierLabel(tier: MatchedProfile["tier"]): string {
  switch (tier) {
    case "strong":
      return "Strong Match";
    case "good":
      return "Good Match";
    case "borderline":
      return "Weak Match";
    case "incompatible":
      return "Poor Match";
    default:
      return "Neutral Match";
  }
}

export function conflictHint(type: string): string {
  switch (type) {
    case "Social Density":
      return "May differ on guest habits";
    case "Acoustic Environment":
      return "May differ on noise levels";
    case "Sanitary Standards":
      return "May differ on cleanliness";
    case "Circadian Rhythm (Resource Bottleneck)":
      return "May have similar daily schedules";
    case "Circadian Rhythm (Extreme Mismatch)":
      return "May have opposite sleep schedules";
    case "Boundary Philosophy":
      return "May differ on shared space boundaries";
    case "Weekend Lifestyle Divergence":
      return "May differ on weekend lifestyle";
    default:
      return type;
  }
}

export function tierBadgeClass(tier: MatchedProfile["tier"]): string {
  switch (tier) {
    case "strong":
      return "bg-primary text-dark";
    case "good":
      return "bg-emerald-100 text-emerald-800";
    case "borderline":
      return "bg-amber-100 text-amber-800";
    case "incompatible":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export const QUICK_FILTER_TAGS = [
  { tag: "Pet Allowed", label: "Pet Allowed" },
  { tag: "Non-Smoker", label: "Non-Smoker" },
  { tag: "LGBTQ+ Friendly", label: "LGBTQ+ Friendly" },
  { tag: "Vegan Friendly", label: "Vegan Friendly" },
  { tag: "__same_gender__", label: "Same Gender" },
];
