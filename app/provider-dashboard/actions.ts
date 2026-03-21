'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createListing(formData: FormData) {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to manage listings.');
  }

  const id = formData.get('id') as string; // Check if editing
  const title = formData.get('title') as string;
  const address = formData.get('address') as string;
  const rental_fee = parseFloat(formData.get('rent') as string) || 0;
  const house_rules = formData.get('description') as string;
  const status = formData.get('status') as 'draft' | 'published';
  const room_type_id = formData.get('room_type_id') as string;
  const amenities_ids = formData.get('amenities_ids') ? JSON.parse(formData.get('amenities_ids') as string) : [];

  let listingId = id;

  const listingData = {
    provider_id: user.id,
    title,
    address,
    city: 'Default City',
    postal_code: 'A1B 2C3',
    rental_fee,
    house_rules,
    status,
    vacant_start_date: new Date().toISOString().split('T')[0],
  };

  if (id) {
    // Update existing listing
    const { error: updateError } = await supabase
      .from('room_listings')
      .update(listingData)
      .eq('id', id);

    if (updateError) {
      console.error('Update Error:', updateError);
      return { error: updateError.message };
    }
  } else {
    // Insert new listing
    const { data: listing, error: insertError } = await supabase
      .from('room_listings')
      .insert(listingData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert Error:', insertError);
      return { error: insertError.message };
    }
    listingId = listing.id;
  }

  // Handle Room Type (One-to-One / Junction with Primary Key listing_id)
  if (room_type_id) {
    await supabase.from('listing_room_types').upsert({
      listing_id: listingId,
      room_type_id: room_type_id,
    });
  }

  // Handle Amenities (Many-to-Many)
  // Simple approach for update: Clear all and re-insert
  if (id) {
    await supabase.from('listing_amenities').delete().eq('listing_id', id);
  }
  
  if (amenities_ids.length > 0) {
    const amenitiesToInsert = amenities_ids.map((aid: string) => ({
      listing_id: listingId,
      amenity_id: aid,
    }));
    await supabase.from('listing_amenities').insert(amenitiesToInsert);
  }

  revalidatePath('/provider-dashboard');
  redirect('/provider-dashboard');
}
