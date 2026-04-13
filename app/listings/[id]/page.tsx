'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import {
  MapPin, Banknote, Home, Check,
  ChevronLeft, Edit3, Calendar, Info,
  ShieldCheck, Sparkles, ScrollText, X,
  ChevronRight, Maximize2
} from 'lucide-react';
import { useParams, notFound } from 'next/navigation';

export default function ListingDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [listing, setListing] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [roomType, setRoomType] = useState<string>('Private Room');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const [
        listingRes,
        roomTypesRes,
        amenitiesRes,
        userRes
      ] = await Promise.all([
        supabase
          .from('room_listings')
          .select(`
            *,
            profiles:provider_id (
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('listing_room_types')
          .select('room_types(name)')
          .eq('listing_id', id)
          .single(),
        supabase
          .from('listing_amenities')
          .select('amenities(name)')
          .eq('listing_id', id),
        supabase.auth.getUser()
      ]);

      if (listingRes.error || !listingRes.data) {
        setLoading(false);
        return;
      }

      const data = listingRes.data;
      setListing(data);
      setProvider(data.profiles);
      setRoomType((roomTypesRes.data?.room_types as any)?.name || 'Private Room');
      setAmenities(amenitiesRes.data?.map((a: any) => a.amenities?.name) || []);

      const resolvedPhotos = (data.photos || []).map((path: string) => {
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`;
      });
      setPhotos(resolvedPhotos);

      setIsOwner(userRes.data?.user?.id === data.provider_id);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!listing) return notFound();

  const mainPhoto = photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
  const subPhotos = photos.slice(1, 4);
  const remainingCount = photos.length > 4 ? photos.length - 4 : 0;

  const nextPhoto = () => setSelectedPhotoIndex(i => (i !== null && i < photos.length - 1) ? i + 1 : 0);
  const prevPhoto = () => setSelectedPhotoIndex(i => (i !== null && i > 0) ? i - 1 : photos.length - 1);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased pb-20">
      <Navbar activeTab="Listings" />

      {/* Photo Gallery Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-dark transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>

          {/* Adaptive Grid Layout based on photo count */}
          <div className={`relative grid gap-3 overflow-hidden rounded-3xl ${photos.length === 1 ? 'grid-cols-1 h-[450px]' :
            photos.length === 2 ? 'grid-cols-2 h-[450px]' :
              photos.length === 3 ? 'grid-cols-3 h-[450px]' :
                'grid-cols-4 h-[500px]'
            }`}>

            {/* Main Photo (Always shown) */}
            <div
              onClick={() => photos.length > 0 && setSelectedPhotoIndex(0)}
              className={`relative overflow-hidden border border-slate-100 shadow-sm bg-slate-100 cursor-pointer group ${photos.length === 1 ? 'col-span-1' :
                photos.length === 2 ? 'col-span-1' :
                  photos.length === 3 ? 'col-span-2' :
                    'col-span-2 row-span-2'
                }`}
            >
              {photos.length > 0 ? (
                <img src={mainPhoto} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                  <Home size={32} className="text-primary opacity-60 mb-4" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">No Photos Available</span>
                </div>
              )}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-extrabold text-dark shadow-xl uppercase tracking-wider">
                  {listing.status}
                </span>
              </div>
            </div>

            {/* Sub Photos Logic */}
            {photos.length === 2 && (
              <div
                onClick={() => setSelectedPhotoIndex(1)}
                className="relative overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group"
              >
                <img src={photos[1]} alt="Room detail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            )}

            {photos.length === 3 && (
              <div className="grid grid-rows-2 gap-3 col-span-1">
                {photos.slice(1, 3).map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPhotoIndex(i + 1)}
                    className="relative overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group rounded-xl"
                  >
                    <img src={url} alt={`Room detail ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            )}

            {photos.length >= 4 && subPhotos.map((url, i) => (
              <div
                key={i}
                onClick={() => setSelectedPhotoIndex(i + 1)}
                className={`relative overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer group ${i === 2 ? 'md:col-span-2' : ''}`}
              >
                <img src={url} alt={`Room detail ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {i === 2 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-dark/60 flex flex-col items-center justify-center backdrop-blur-[2px] group-hover:bg-dark/40 transition-colors">
                    <span className="text-white font-bold text-3xl">+{remainingCount}</span>
                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">More Photos</span>
                  </div>
                )}
              </div>
            ))}

            {/* View All Button */}
            {photos.length > 4 && (
              <button
                onClick={() => setSelectedPhotoIndex(0)}
                className="absolute bottom-6 right-6 px-6 py-2.5 bg-white/90 backdrop-blur-md hover:bg-white text-dark text-sm font-bold rounded-2xl shadow-2xl border border-slate-200 transition-all active:scale-95 flex items-center gap-2 z-10"
              >
                <Maximize2 size={16} />
                Show All Photos
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Header info */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                  {roomType}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Available {new Date(listing.vacant_start_date).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-dark tracking-tight leading-tight mb-4">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <MapPin size={18} className="text-primary" />
                {listing.address}, {listing.city}
              </div>
            </div>

            {/* House Rules */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <ScrollText size={20} />
                </div>
                <h2 className="text-xl font-bold text-dark tracking-tight">House Rules</h2>
              </div>
              {Array.isArray(listing.house_rules) && listing.house_rules.length > 0 ? (
                <ul className="space-y-3">
                  {listing.house_rules.map((rule: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                      <div className="size-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No specific house rules provided.</p>
              )}
            </section>

            {/* Amenities Grid */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-xl font-bold text-dark tracking-tight">Amenities</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
                {amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-3 py-1">
                    <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-bold text-dark tracking-tight">Location</h2>
              </div>
              <p className="text-slate-600 font-medium text-lg pl-1">
                {listing.address}, {listing.city} {listing.postal_code}
              </p>
            </section>
          </div>

          {/* Right Column: Pricing & Provider */}
          <div className="space-y-8">

            {/* Price Card */}
            <div className="bg-dark rounded-[2.5rem] p-8 text-white shadow-2xl shadow-dark/30 sticky top-24 border border-white/5">
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-primary">${listing.rental_fee.toLocaleString()}</span>
                <span className="text-slate-400 font-bold text-lg">/month</span>
              </div>

              {isOwner ? (
                <Link
                  href={`/dashboard/edit/${listing.id}`}
                  className="w-full py-4 bg-primary hover:brightness-105 text-dark rounded-full font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Edit3 size={18} />
                  Edit Listing
                </Link>
              ) : (
                <button className="w-full py-4 bg-primary hover:brightness-105 text-dark rounded-full font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  Apply to Room
                </button>
              )}
            </div>

            {/* Provider Card */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Listed by</h4>
              <div className="flex items-center gap-4 mb-6">
                {provider?.avatar_url ? (
                  <img src={provider.avatar_url} className="size-16 rounded-3xl object-cover ring-4 ring-primary/10" alt={provider.full_name} />
                ) : (
                  <div className="size-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <Home size={32} />
                  </div>
                )}
                <div>
                  <h5 className="text-xl font-bold text-dark">{provider?.full_name || 'SyncLiving Provider'}</h5>
                  <p className="text-sm text-slate-500 font-medium">Verified Property Owner</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-primary/30 pl-4">
                "{provider?.bio || "Hello! I'm looking for a respectful roommate to share this wonderful space."}"
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* ── Photo Lightbox Modal ── */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between text-white z-10">
            <span className="text-sm font-bold uppercase tracking-widest opacity-60">
              {selectedPhotoIndex + 1} / {photos.length}
            </span>
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Photo Area */}
          <div className="w-full h-full flex items-center justify-center px-4 relative">
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-6 size-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronLeft size={32} />
            </button>

            <img
              src={photos[selectedPhotoIndex]}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all duration-500"
              alt="Listing full view"
            />

            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-6 size-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Thumbnails Strip */}
          <div className="absolute bottom-8 left-0 right-0 overflow-x-auto">
            <div className="flex items-center justify-center gap-3 px-8">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`size-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedPhotoIndex === idx ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
