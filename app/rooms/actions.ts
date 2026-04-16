'use server';

import { createClient } from '@/utils/supabase/server';
import type { MatchedListing } from '../discovery/actions';

export async function getAllRooms(): Promise<{ rooms: MatchedListing[]; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { rooms: [], error: 'Not authenticated' };
  }

  // Fetch published room listings (excluding the current user's own listings)
  const { data: listingRows, error } = await supabase
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
    .neq("provider_id", user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rooms:', error);
    return { rooms: [], error: 'Failed to fetch rooms' };
  }

  const rooms: MatchedListing[] = (listingRows ?? []).map(
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

  return { rooms, error: null };
}
