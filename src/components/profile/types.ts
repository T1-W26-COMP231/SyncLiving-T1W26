// src/components/profile/types.ts

export interface ProfileData {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  age?: number | null;
  location?: string | null;
  role?: string | null;
  /** Raw lifestyle_tags from DB — wd:/we: prefixed tags are filtered out before display */
  lifestyle_tags?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
  move_in_date?: string | null;
  bio?: string | null;
  occupation?: string | null;
  match_score?: number | null;
  reputation?: number | null;
  reviews?: ReviewData[];
  /** Per-dimension compatibility scores computed on the server */
  compatibility?: CompatibilityItem[];
  /** Personal/extra photos from profiles.photos — shown in About section */
  profile_photos?: string[];
  /** Space photos from room_listings.photos — shown in Living Space section */
  space_photos?: string[];
  /** Active listing info if the provider has created one */
  space_listing?: { title: string; address: string; rental_fee: number } | null;
}

export interface ReviewData {
  id: string;
  reviewer_name: string;
  reviewer_avatar?: string | null;
  duration: string;
  text: string;
  rating: number;
  scores?: { score: number; label: string }[];
  status: string;
}

export interface CompatibilityItem {
  label: string;
  percentage: number;
}
