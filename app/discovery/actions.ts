"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { computeMatchResult, SURFACE_THRESHOLD } from "@/services/matching";
import type { Database } from "@/types/supabase";
import { logActivity } from "@/utils/activity-logger";

type MatchRequestStatus = Database["public"]["Enums"]["match_request_status"];

export interface MatchedProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  role: string | null;
  bio: string | null;
  budget_min: number | null;
  budget_max: number | null;
  lifestyle_tags: string[];
  highlightedTags?: string[];
  preferred_gender: string | null;
  isSaved: boolean;
  requestStatus: MatchRequestStatus | null;
  /** ID of a pending request sent FROM this person TO the current user, if any */
  incomingRequestId: string | null;
  score: number;
  tier: "strong" | "good" | "borderline" | "incompatible";
  conflicts: { type: string; clause: string }[];
  feedbackRating: number | null;
}

export interface MatchedListing {
  id: string;
  provider_id: string;
  provider_name: string | null;
  provider_avatar: string | null;
  title: string;
  address: string;
  lat: number | null;
  lng: number | null;
  rental_fee: number;
  photos: string[];
  room_type: string | null;
  amenities: string[];
}

// Default vector (all 0.5) used when a dimension is unset
const DEFAULT_VEC = [0.5, 0.5, 0.5, 0.5, 0.5];

// Compute a lat/lng bounding box for a given center + radius (km).
// Used to pre-filter candidates on the server before client-side Haversine.
function latLngBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}

function toVec(raw: unknown): number[] {
  if (Array.isArray(raw) && raw.length === 5) return raw as number[];
  return DEFAULT_VEC;
}

// Normalize tag names for loose comparison (e.g. "Non-Smoker" ↔ "#NonSmoker")
function normalizeTag(t: string): string {
  return t.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export async function getMatches(): Promise<{
  matches: MatchedProfile[];
  userRole: string | null;
  preferredTagNames: string[];
  userBinaryPrefs: string[];
  userPreferredGender: string | null;
  prefAgeMin: number | null;
  prefAgeMax: number | null;
  prefBudgetMin: number | null;
  prefBudgetMax: number | null;
  prefLat: number | null;
  prefLng: number | null;
  prefMaxDistance: number | null;
  prefReferenceLocation: string | null;
  bufferKm: number | null;
  userAmenityNames: string[];
  userRoomTypeNames: string[];
  allAmenityNames: string[];
  allRoomTypeNames: string[];
  roomListings: MatchedListing[];
  error: string | null;
}> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      matches: [],
      userRole: null,
      preferredTagNames: [],
      userBinaryPrefs: [],
      userPreferredGender: null,
      prefAgeMin: null,
      prefAgeMax: null,
      prefBudgetMin: null,
      prefBudgetMax: null,
      prefLat: null,
      prefLng: null,
      prefMaxDistance: null,
      prefReferenceLocation: null,
      bufferKm: null,
      error: "Not authenticated",
      userAmenityNames: [],
      userRoomTypeNames: [],
      allAmenityNames: [],
      allRoomTypeNames: [],
      roomListings: [],
    };

  // Fetch current user's profile + preference fields
  const { data: myProfile, error: myErr } = await supabase
    .from("profiles")
    .select(
      "v_wd, v_we, role, pref_budget_min, pref_budget_max, preferred_gender, lifestyle_tags, age_min, age_max, pref_lat, pref_lng, pref_max_distance, pref_reference_location",
    )
    .eq("id", user.id)
    .single();

  if (myErr || !myProfile) {
    return {
      matches: [],
      userRole: null,
      preferredTagNames: [],
      userBinaryPrefs: [],
      userPreferredGender: null,
      prefAgeMin: null,
      prefAgeMax: null,
      prefBudgetMin: null,
      prefBudgetMax: null,
      prefLat: null,
      prefLng: null,
      prefMaxDistance: null,
      prefReferenceLocation: null,
      bufferKm: null,
      error: "Could not load your profile",
      userAmenityNames: [],
      userRoomTypeNames: [],
      allAmenityNames: [],
      allRoomTypeNames: [],
      roomListings: [],
    };
  }

  const myVWd = toVec(myProfile.v_wd);
  const myVWe = toVec(myProfile.v_we);

  // Binary preference tags saved by the Settings modal into profiles.lifestyle_tags
  const BINARY_PREF_KEYS = [
    "Pet Allowed",
    "Pet Friendly",
    "Non-Smoker",
    "LGBTQ+ Friendly",
    "Same Gender Only",
    "Vegan Friendly",
  ];
  const userBinaryPrefs: string[] = (myProfile.lifestyle_tags ?? []).filter(
    (t: string) => BINARY_PREF_KEYS.includes(t),
  );

  // Used to highlight matching tags on candidate cards
  const preferredTagNames: string[] = userBinaryPrefs;

  // Fetch current user's saved profile IDs
  const { data: savedRows } = await supabase
    .from("saved_profiles")
    .select("saved_user_id")
    .eq("user_id", user.id);
  const savedIds = new Set((savedRows ?? []).map((r: any) => r.saved_user_id));

  // Fetch match requests sent by the current user
  const { data: requestRows } = await supabase
    .from("match_requests")
    .select("receiver_id, status")
    .eq("sender_id", user.id);
  const sentRequestMap = new Map(
    (requestRows ?? []).map((r: any) => [r.receiver_id, r.status]),
  );

  // Fetch pending match requests received by the current user (incoming from others)
  const { data: receivedRows } = await supabase
    .from('match_requests')
    .select('sender_id, id')
    .eq('receiver_id', user.id)
    .eq('status', 'pending');
  const receivedRequestMap = new Map((receivedRows ?? []).map((r: any) => [r.sender_id, r.id]));

  // Fetch match feedback already provided by the current user
  const { data: feedbackRows } = await supabase
    .from("match_feedback")
    .select("target_id, feedback_rating")
    .eq("user_id", user.id);
  const feedbackMap = new Map((feedbackRows ?? []).map((r: any) => [r.target_id, r.feedback_rating]));

  // Server-side location pre-filter: bounding box at 2× saved preference distance (capped at 100 km).
  const prefLat: number | null = myProfile.pref_lat ?? null;
  const prefLng: number | null = myProfile.pref_lng ?? null;
  const prefMaxDist: number | null = myProfile.pref_max_distance ?? null;
  const bufferKm: number | null =
    prefLat !== null && prefLng !== null && prefMaxDist !== null
      ? Math.min(prefMaxDist * 2, 100)
      : null;

  let candidateQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, age, location, lat, lng, role, bio, budget_min, budget_max, lifestyle_tags, preferred_gender, v_wd, v_we",
    )
    .neq("id", user.id)
    .eq("is_admin", false);

  if (bufferKm !== null && prefLat !== null && prefLng !== null) {
    const box = latLngBoundingBox(prefLat, prefLng, bufferKm);
    candidateQuery = candidateQuery
      .not("lat", "is", null)
      .not("lng", "is", null)
      .gte("lat", box.latMin)
      .lte("lat", box.latMax)
      .gte("lng", box.lngMin)
      .lte("lng", box.lngMax);
  }

  const { data: candidates, error: candErr } = await candidateQuery;
  const userPreferredGender: string | null = myProfile.preferred_gender ?? null;

  if (candErr) {
    return {
      matches: [],
      userRole: myProfile.role,
      preferredTagNames,
      userBinaryPrefs,
      userPreferredGender,
      prefAgeMin: null,
      prefAgeMax: null,
      prefBudgetMin: null,
      prefBudgetMax: null,
      prefLat: null,
      prefLng: null,
      prefMaxDistance: null,
      prefReferenceLocation: null,
      bufferKm: null,
      error: "Could not load candidates",
      userAmenityNames: [],
      userRoomTypeNames: [],
      allAmenityNames: [],
      allRoomTypeNames: [],
      roomListings: [],
    };
  }

  const prefNormalized = preferredTagNames.map(normalizeTag);

  const scored: MatchedProfile[] = (candidates ?? [])
    .map((p) => {
      const result = computeMatchResult(
        myVWd,
        myVWe,
        toVec(p.v_wd),
        toVec(p.v_we),
      );
      const tags: string[] = p.lifestyle_tags ?? [];
      const highlightedTags =
        prefNormalized.length > 0
          ? tags.filter((t) => prefNormalized.includes(normalizeTag(t)))
          : [];

      return {
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        age: p.age,
        location: p.location,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        role: p.role,
        bio: p.bio,
        budget_min: p.budget_min,
        budget_max: p.budget_max,
        lifestyle_tags: tags,
        highlightedTags,
        preferred_gender: p.preferred_gender ?? null,
        isSaved: savedIds.has(p.id),
        requestStatus: (sentRequestMap.get(p.id) as any) ?? null,
        incomingRequestId: (receivedRequestMap.get(p.id) as string) ?? null,
        score: Math.round(result.score),
        tier: result.tier,
        conflicts: result.conflicts,
        feedbackRating: feedbackMap.get(p.id) ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Fetch user's saved preferences AND all available options for the Room view filter panel
  const [
    { data: amenityRows },
    { data: roomTypeRows },
    { data: allAmenitiesRows },
    { data: allRoomTypesRows },
  ] = await Promise.all([
    supabase
      .from("seeker_amenity_preferences")
      .select("amenities(name)")
      .eq("user_id", user.id),
    supabase
      .from("seeker_room_type_preferences")
      .select("room_types(name)")
      .eq("user_id", user.id),
    supabase.from("amenities").select("name").order("name"),
    supabase.from("room_types").select("name").order("name"),
  ]);

  const userAmenityNames = (amenityRows ?? [])
    .map((r: any) => r.amenities?.name)
    .filter(Boolean);
  const userRoomTypeNames = (roomTypeRows ?? [])
    .map((r: any) => r.room_types?.name)
    .filter(Boolean);
  const allAmenityNames = (allAmenitiesRows ?? [])
    .map((r: any) => r.name)
    .filter(Boolean);
  const allRoomTypeNames = (allRoomTypesRows ?? [])
    .map((r: any) => r.name)
    .filter(Boolean);

  // Fetch published room listings (excluding the current user's own listings)
  const { data: listingRows } = await supabase
    .from("room_listings")
    .select(
      `
      id, provider_id, title, address, lat, lng, rental_fee, photos,
      profiles!provider_id(full_name, avatar_url),
      listing_room_types(room_types(name)),
      listing_amenities(amenities(name))
    `,
    )
    .eq("status", "published")
    .neq("provider_id", user.id);

  const roomListings: MatchedListing[] = (listingRows ?? []).map(
    (row: any) => ({
      id: row.id,
      provider_id: row.provider_id,
      provider_name: row.profiles?.full_name ?? null,
      provider_avatar: row.profiles?.avatar_url ?? null,
      title: row.title,
      address: row.address,
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      rental_fee: Number(row.rental_fee),
      photos: row.photos ?? [],
      room_type: row.listing_room_types?.[0]?.room_types?.name ?? null,
      amenities: (row.listing_amenities ?? [])
        .map((a: any) => a.amenities?.name)
        .filter(Boolean),
    }),
  );

  return {
    matches: scored,
    userRole: myProfile.role,
    preferredTagNames,
    userBinaryPrefs,
    userPreferredGender,
    prefAgeMin: myProfile.age_min ?? null,
    prefAgeMax: myProfile.age_max ?? null,
    prefBudgetMin: myProfile.pref_budget_min ?? null,
    prefBudgetMax: myProfile.pref_budget_max ?? null,
    prefLat,
    prefLng,
    prefMaxDistance: prefMaxDist,
    prefReferenceLocation: myProfile.pref_reference_location ?? null,
    bufferKm,
    userAmenityNames,
    userRoomTypeNames,
    allAmenityNames,
    allRoomTypeNames,
    roomListings,
    error: null,
  };
}

export async function sendMatchRequest(receiverId: string, message?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("match_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
    message,
  });

  if (error) {
    console.error("Error sending match request:", error);
    return { error: error.message };
  }

  // Log activity
  await logActivity(user.id, "match_request_sent", {
    receiver_id: receiverId,
    has_message: !!message,
  });

  return { success: true };
}

export async function submitMatchFeedback({
  targetId,
  matchScore,
  rating,
  reasons,
}: {
  targetId: string;
  matchScore: number;
  rating: -1 | 1;
  reasons?: string[];
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User is not authenticated." };
  }

  const feedbackData = {
    user_id: user.id,
    target_id: targetId,
    match_score: matchScore,
    feedback_rating: rating,
    reasons: reasons ?? [],
  };

  const { error } = await supabase
    .from("match_feedback" as any)
    .upsert([feedbackData], { onConflict: "user_id, target_id" });

  if (error) {
    console.error("Error submitting match feedback:", error);
    return { success: false, error: "Failed to submit feedback." };
  }

  // Log the feedback activity
  await logActivity(user.id, "match_feedback_submitted", {
    target_id: targetId,
    rating,
    match_score: matchScore,
  });

  revalidatePath("/discovery");

  return { success: true };
}
