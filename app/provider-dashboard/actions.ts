'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createListing(formData: FormData) {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to create a listing.');
  }

  const title = formData.get('title') as string;
  const address = formData.get('address') as string;
  const rental_fee = parseFloat(formData.get('rent') as string) || 0;
  const house_rules = formData.get('description') as string;
  const status = formData.get('status') as 'draft' | 'published';
  const room_type_id = formData.get('room_type_id') as string;
  const amenities_ids = formData.get('amenities_ids') ? JSON.parse(formData.get('amenities_ids') as string) : [];

  // Insert main listing
  // Note: city and postal_code are NOT NULL in schema, providing defaults for now
  const { data: listing, error: listingError } = await supabase
    .from('room_listings')
    .insert({
      provider_id: user.id,
      title,
      address,
      city: 'Default City', // Temporary default to satisfy NOT NULL constraint
      postal_code: 'A1B 2C3', // Temporary default to satisfy NOT NULL constraint
      rental_fee,
      house_rules,
      status,
      vacant_start_date: new Date().toISOString().split('T')[0], // Default to today
    })
    .select()
    .single();

  if (listingError) {
    console.error('Listing Error:', listingError);
    return { error: listingError.message };
  }

  // Insert Room Type relation
  if (room_type_id) {
    await supabase.from('listing_room_types').insert({
      listing_id: listing.id,
      room_type_id: room_type_id,
    });
  }

  // Insert Amenities relations
  if (amenities_ids.length > 0) {
    const amenitiesToInsert = amenities_ids.map((id: string) => ({
      listing_id: listing.id,
      amenity_id: id,
    }));
    await supabase.from('listing_amenities').insert(amenitiesToInsert);
  }

  revalidatePath('/provider-dashboard');
  redirect('/provider-dashboard');
}
