import type { MatchedProfile } from "../../app/discovery/actions";

/**
 * Valid filter types for discovery results.
 */
export type FilterKey = "roommate" | "roommate_with_room" | "room" | "all";

/**
 * Filter configuration for UI display.
 */
export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "roommate", label: "Roommate" },
  { key: "roommate_with_room", label: "Roommate with Room" },
  { key: "room", label: "Room" },
];

/**
 * Returns default active filters based on user role.
 * 
 * @param role - Current user's role ('seeker' or 'provider')
 * @returns Array of default filter keys
 */
export function defaultFilters(role: string | null): FilterKey[] {
  if (role === "provider") return ["roommate"];
  return ["all"];
}

/**
 * Earth's radius in kilometers.
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points on a sphere
 * using the Haversine formula.
 * 
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Applies a comprehensive set of filters to the matched profiles.
 * Includes role-based filtering, tag/gender filtering, age range,
 * budget overlap, and geographic distance.
 * 
 * @param matches - List of candidate profiles
 * @param active - Active role filters
 * @param savedIds - Set of IDs the user has saved
 * @param showSaved - Whether to only show saved profiles
 * @param activeTagFilters - List of lifestyle tags to filter by
 * @param userPreferredGender - User's own gender preference
 * @param filterAgeMin - Minimum age limit
 * @param filterAgeMax - Maximum age limit
 * @param filterBudgetMin - Minimum budget threshold
 * @param filterBudgetMax - Maximum budget threshold
 * @param filterMaxDist - Maximum allowed distance (km)
 * @param userLat - User's current latitude
 * @param userLng - User's current longitude
 * @param showIncompatible - Whether to include 'incompatible' tier results
 * @returns Filtered list of profiles
 */
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

  // Budget overlap filter (§4.1 Logic)
  // Two budget ranges [minA, maxA] and [minB, maxB] overlap if
  // minA <= maxB AND maxA >= minB
  if (filterBudgetMin !== null && filterBudgetMax !== null) {
    result = result.filter((p) => {
      if (p.budget_min === null && p.budget_max === null) return true;
      const cMin = p.budget_min ?? 0;
      const cMax = p.budget_max ?? 999999;
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

/**
 * Core set of lifestyle tags that can be treated as binary preferences.
 */
export const BINARY_TAGS = [
  "Pet Allowed",
  "Non-Smoker",
  "LGBTQ+ Friendly",
  "Vegan",
];

/**
 * Extracts only binary (boolean) preference tags from a list.
 */
export function getBinaryTags(tags: string[]): string[] {
  return tags.filter((t) => BINARY_TAGS.includes(t));
}

/**
 * Returns a user-friendly label for a match tier.
 */
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

/**
 * Provides a short summary hint based on the conflict type.
 */
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

/**
 * Returns Tailwind CSS classes for match tier badges.
 */
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

/**
 * Predefined set of tags for quick filtering in the discovery UI.
 */
export const QUICK_FILTER_TAGS = [
  { tag: "Pet Allowed", label: "Pet Allowed" },
  { tag: "Non-Smoker", label: "Non-Smoker" },
  { tag: "LGBTQ+ Friendly", label: "LGBTQ+ Friendly" },
  { tag: "Vegan", label: "Vegan" },
  { tag: "__same_gender__", label: "Same Gender" },
];
