'use client';

import React from 'react';
import { MapPin, Building2, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { MatchedListing } from '../../../app/discovery/actions';

interface RoomListingCardProps {
  listing: MatchedListing;
  distKm: number | null;
  selectedRoomTags: string[];
  connectingId: string | null;
  onConnect: (providerId: string) => void;
  hideConnect?: boolean;
}

export const RoomListingCard: React.FC<RoomListingCardProps> = ({
  listing,
  distKm,
  selectedRoomTags,
  connectingId,
  onConnect,
  hideConnect = false,
}) => {
  const photo = listing.photos[0] ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group">

      {/* Photo */}
      <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={48} className="text-slate-300" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
          {distKm !== null && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/40 backdrop-blur-sm text-white shadow shrink-0">
              {distKm < 1
                ? `${Math.round(distKm * 1000)}m away`
                : `${distKm.toFixed(1)}km away`}
            </span>
          )}
          {listing.room_type && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow ml-auto shrink-0 transition-colors ${
                selectedRoomTags.includes(listing.room_type)
                  ? 'bg-primary text-dark'
                  : 'bg-black/40 backdrop-blur-sm text-white'
              }`}
            >
              {listing.room_type}
            </span>
          )}
        </div>

        {/* Price badge anchored to bottom-right of photo */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1.5 rounded-xl bg-dark/80 backdrop-blur-sm text-primary font-extrabold text-sm shadow">
            ${listing.rental_fee.toLocaleString()}
            <span className="text-white/50 font-normal text-xs">/mo</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">

        {/* Title */}
        <h3 className="font-bold text-dark text-base leading-snug mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-slate-500 text-xs mb-3">
          <MapPin size={12} className="shrink-0 mt-0.5 text-primary" />
          <span className="line-clamp-1">{listing.address}</span>
        </div>

        {/* Amenity chips */}
        {listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[...listing.amenities]
              .sort((a, b) => {
                const aOn = selectedRoomTags.includes(a) ? 0 : 1;
                const bOn = selectedRoomTags.includes(b) ? 0 : 1;
                return aOn - bOn;
              })
              .slice(0, 4)
              .map((amenity) => {
                const highlighted = selectedRoomTags.includes(amenity);
                return (
                  <span
                    key={amenity}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      highlighted
                        ? 'bg-primary text-dark'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {amenity}
                  </span>
                );
              })}
            {listing.amenities.length > 4 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100">
                +{listing.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="border-t border-slate-100 pt-3 mt-1">
          <div className="flex items-center justify-between">
            {/* Provider */}
            <div className="flex items-center gap-2 min-w-0">
              {listing.provider_avatar ? (
                <img
                  src={listing.provider_avatar}
                  alt={listing.provider_name ?? ''}
                  className="size-7 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <UserCircle2 size={20} className="text-slate-300 shrink-0" />
              )}
              <span className="text-xs text-slate-500 font-medium truncate">
                {listing.provider_name ?? 'Provider'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/listings/${listing.id}`}
                className="text-xs font-bold text-slate-500 hover:text-dark transition-colors"
              >
                View
              </Link>
              {!hideConnect && (
                <button
                  onClick={() => onConnect(listing.provider_id)}
                  disabled={connectingId === listing.provider_id}
                  className="px-3 py-1.5 bg-primary text-dark rounded-full text-xs font-bold hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {connectingId === listing.provider_id ? 'Requesting…' : 'Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
