'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createListing(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to manage listings.' };
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const address = formData.get('address') as string;
  const rental_fee = parseFloat(formData.get('rent') as string) || 0;
  const house_rules = formData.get('description') as string;
  const status = formData.get('status') as 'draft' | 'published';
  const room_type_id = formData.get('room_type_id') as string;
  const amenities_ids_raw = formData.get('amenities_ids') as string;
  const amenities_ids = amenities_ids_raw ? JSON.parse(amenities_ids_raw) : [];

  const photos_raw = formData.get('photos') as string;
  const photos = photos_raw ? JSON.parse(photos_raw) : [];

  // New location fields
  const city = (formData.get('city') as string) || 'Default City';
  const postal_code = (formData.get('postal_code') as string) || 'A1B 2C3';
  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;

  // Debugging logs
  console.log('--- CREATE/UPDATE LISTING ---');
  console.log('ID:', id);
  console.log('Photos:', photos);
  console.log('Address:', address);

  let listingId = id;

  const listingData: any = {
    provider_id: user.id,
    title,
    address,
    city,
    postal_code,
    rental_fee,
    house_rules,
    status,
    photos,
    vacant_start_date: new Date().toISOString().split('T')[0],
  };

  // Ensure coords are added as valid PostGIS string
  if (lat && lng && lat !== '' && lng !== '') {
    listingData.location_coords = `POINT(${lng} ${lat})`;
    listingData.lat = parseFloat(lat);
    listingData.lng = parseFloat(lng);
  } else {
    console.warn('Coordinates missing, field will be NULL in DB.');
  }

  try {
    if (id) {
      // Update existing listing
      const { error: updateError } = await supabase
        .from('room_listings')
        .update(listingData)
        .eq('id', id);

      if (updateError) throw updateError;
    } else {
      // Insert new listing
      const { data: listing, error: insertError } = await supabase
        .from('room_listings')
        .insert(listingData)
        .select()
        .single();

      if (insertError) throw insertError;
      listingId = listing.id;
    }

    // Handle Room Type
    if (room_type_id) {
      const { error: rtError } = await supabase.from('listing_room_types').upsert({
        listing_id: listingId,
        room_type_id: room_type_id,
      });
      if (rtError) throw rtError;
    }

    // Handle Amenities
    if (id) {
      await supabase.from('listing_amenities').delete().eq('listing_id', id);
    }
    
    if (amenities_ids.length > 0) {
      const amenitiesToInsert = amenities_ids.map((aid: string) => ({
        listing_id: listingId,
        amenity_id: aid,
      }));
      const { error: amError } = await supabase.from('listing_amenities').insert(amenitiesToInsert);
      if (amError) throw amError;
    }
  } catch (err: any) {
    console.error('Database Error:', err);
    return { error: err.message || 'An unexpected database error occurred.' };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateListingStatus(id: string, status: 'published' | 'archived' | 'draft') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('room_listings')
    .update({ status })
    .eq('id', id)
    .eq('provider_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { error: null };
}

export async function deleteListing(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('room_listings')
    .delete()
    .eq('id', id)
    .eq('provider_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { error: null };
}
