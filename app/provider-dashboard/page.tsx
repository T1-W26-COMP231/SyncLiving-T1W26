import React from 'react';
import { createClient } from '@/utils/supabase/server';
import ProviderDashboardClient from '@/components/provider-dashboard/ProviderDashboardClient';
import { ListingType } from '@/components/provider-dashboard/ListingCard';
import { redirect } from 'next/navigation';

export default async function ProviderDashboard() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userName = user.email?.split('@')[0] || 'User';
  const name = profile?.full_name || user.email?.split('@')[0] || 'User';

  // Fetch room types, amenities, and user's existing seeker preferences
  const [roomTypesRes, amenitiesRes, amenityPrefsRes, roomTypePrefsRes] = await Promise.all([
    supabase.from('room_types').select('id, name').order('name'),
    supabase.from('amenities').select('id, name, category').order('name'),
    supabase.from('seeker_amenity_preferences').select('amenity_id').eq('user_id', user.id),
    supabase.from('seeker_room_type_preferences').select('room_type_id').eq('user_id', user.id),
  ]);

  // Fetch real listings for this provider
  const { data: listingsData, error } = await supabase
    .from('room_listings')
    .select('*')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
  }

  // Map database data to ListingType
  const listings: ListingType[] = (listingsData || []).map(item => {
    const firstPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    const imageUrl = firstPhoto 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${firstPhoto}`
      : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    return {
      id: item.id,
      title: item.title,
      price: item.rental_fee,
      location: item.address,
      distance: 'Calculating...',
      status: item.status as 'published' | 'draft' | 'archived',
      imageUrl: imageUrl,
      photos: item.photos || [],
      stats: {
        views: 0,
        favorites: 0,
        inquiries: 0,
      }
    };
  });

  return (
    <ProviderDashboardClient
      initialListings={listings}
      inquiries={[]}
      initialProfile={profile}
      roomTypes={roomTypesRes.data || []}
      amenities={amenitiesRes.data || []}
      initialAmenityIds={amenityPrefsRes.data?.map(p => p.amenity_id) || []}
      initialRoomTypeIds={roomTypePrefsRes.data?.map(p => p.room_type_id) || []}
    />
  );
}
