'use server';

import { createClient } from '@/utils/supabase/server';
import { computeMatchResult, SURFACE_THRESHOLD } from '@/services/matching';
import type { Database } from '@/types/supabase';

type MatchRequestStatus = Database['public']['Enums']['match_request_status'];

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
  score: number;
  tier: 'strong' | 'good' | 'borderline' | 'incompatible';
  conflicts: { type: string; clause: string }[];
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
  return t.replace(/[^a-z0-9]/gi, '').toLowerCase();
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
  error: string | null;
}> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { matches: [], userRole: null, preferredTagNames: [], userBinaryPrefs: [], userPreferredGender: null, prefAgeMin: null, prefAgeMax: null, prefBudgetMin: null, prefBudgetMax: null, prefLat: null, prefLng: null, prefMaxDistance: null, prefReferenceLocation: null, bufferKm: null, error: 'Not authenticated', userAmenityNames: [], userRoomTypeNames: [] };

  // Fetch current user's profile + preference fields
  const { data: myProfile, error: myErr } = await supabase
    .from('profiles')
    .select('v_wd, v_we, role, pref_budget_min, pref_budget_max, preferred_gender, lifestyle_tags, age_min, age_max, pref_lat, pref_lng, pref_max_distance, pref_reference_location')
    .eq('id', user.id)
    .single();

  if (myErr || !myProfile) {
    return { matches: [], userRole: null, preferredTagNames: [], userBinaryPrefs: [], userPreferredGender: null, prefAgeMin: null, prefAgeMax: null, prefBudgetMin: null, prefBudgetMax: null, prefLat: null, prefLng: null, prefMaxDistance: null, prefReferenceLocation: null, bufferKm: null, error: 'Could not load your profile', userAmenityNames: [], userRoomTypeNames: [] };
  }

  const myVWd = toVec(myProfile.v_wd);
  const myVWe = toVec(myProfile.v_we);

  // Binary preference tags saved by the Settings modal into profiles.lifestyle_tags
  const BINARY_PREF_KEYS = ['Pet Allowed', 'Pet Friendly', 'Non-Smoker', 'LGBTQ+ Friendly', 'Same Gender Only', 'Vegan Friendly'];
  const userBinaryPrefs: string[] = (myProfile.lifestyle_tags ?? []).filter((t: string) => BINARY_PREF_KEYS.includes(t));

  // Used to highlight matching tags on candidate cards
  const preferredTagNames: string[] = userBinaryPrefs;

  // Fetch current user's saved profile IDs
  const { data: savedRows } = await supabase
    .from('saved_profiles')
    .select('saved_user_id')
    .eq('user_id', user.id);
  const savedIds = new Set((savedRows ?? []).map((r: any) => r.saved_user_id));

  // Fetch match requests sent by the current user
  const { data: requestRows } = await supabase
    .from('match_requests')
    .select('receiver_id, status')
    .eq('sender_id', user.id);
  const sentRequestMap = new Map((requestRows ?? []).map((r: any) => [r.receiver_id, r.status]));

  // Server-side location pre-filter: bounding box at 2× saved preference distance (capped at 100 km).
  const prefLat: number | null = myProfile.pref_lat ?? null;
  const prefLng: number | null = myProfile.pref_lng ?? null;
  const prefMaxDist: number | null = myProfile.pref_max_distance ?? null;
  const bufferKm: number | null =
    prefLat !== null && prefLng !== null && prefMaxDist !== null
      ? Math.min(prefMaxDist * 2, 100)
      : null;

  let candidateQuery = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, age, location, lat, lng, role, bio, budget_min, budget_max, lifestyle_tags, preferred_gender, v_wd, v_we')
    .neq('id', user.id)
    .not('v_wd', 'is', null)
    .not('v_we', 'is', null);

  if (bufferKm !== null && prefLat !== null && prefLng !== null) {
    const box = latLngBoundingBox(prefLat, prefLng, bufferKm);
    candidateQuery = candidateQuery
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .gte('lat', box.latMin)
      .lte('lat', box.latMax)
      .gte('lng', box.lngMin)
      .lte('lng', box.lngMax);
  }

  const { data: candidates, error: candErr } = await candidateQuery;
  const userPreferredGender: string | null = myProfile.preferred_gender ?? null;

  if (candErr) {
    return { matches: [], userRole: myProfile.role, preferredTagNames, userBinaryPrefs, userPreferredGender, prefAgeMin: null, prefAgeMax: null, prefBudgetMin: null, prefBudgetMax: null, prefLat: null, prefLng: null, prefMaxDistance: null, prefReferenceLocation: null, bufferKm: null, error: 'Could not load candidates', userAmenityNames: [], userRoomTypeNames: [] };
  }

  const prefNormalized = preferredTagNames.map(normalizeTag);

  const scored: MatchedProfile[] = (candidates ?? [])
    .map(p => {
      const result = computeMatchResult(myVWd, myVWe, toVec(p.v_wd), toVec(p.v_we));
      const tags: string[] = p.lifestyle_tags ?? [];
      const highlightedTags = prefNormalized.length > 0
        ? tags.filter(t => prefNormalized.includes(normalizeTag(t)))
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
        score: Math.round(result.score),
        tier: result.tier,
        conflicts: result.conflicts,
      };
    })
    .sort((a, b) => b.score - a.score);

  const [{ data: amenityRows }, { data: roomTypeRows }] = await Promise.all([
    supabase.from('seeker_amenity_preferences').select('amenities(name)').eq('user_id', user.id),
    supabase.from('seeker_room_type_preferences').select('room_types(name)').eq('user_id', user.id),
  ]);

  const userAmenityNames  = (amenityRows  ?? []).map((r: any) => r.amenities?.name).filter(Boolean);
  const userRoomTypeNames = (roomTypeRows ?? []).map((r: any) => r.room_types?.name).filter(Boolean);

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
    error: null,
  };
}

export async function sendMatchRequest(receiverId: string, message?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('match_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
      message
    });

  if (error) {
    console.error('Error sending match request:', error);
    return { error: error.message };
  }

  return { success: true };
}
