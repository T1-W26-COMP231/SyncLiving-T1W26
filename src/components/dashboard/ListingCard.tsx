'use client';

import React, { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Eye, Heart, Users, MapPin, Edit3,
  Trash2, PauseCircle, PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateListingStatus, deleteListing } from '../../../app/dashboard/actions';

export type ListingStatus = 'published' | 'draft' | 'archived';

export interface ListingType {
  id: string;
  title: string;
  price: number;
  location: string;
  distance: string;
  status: ListingStatus;
  imageUrl?: string;
  photos?: string[];
  stats: {
    views: number;
    favorites: number;
    inquiries: number;
  };
}

interface ListingCardProps {
  listing: ListingType;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(listing.status);

  const displayImage =
    listing.photos && listing.photos.length > 0
      ? listing.photos[0]
      : listing.imageUrl || '/placeholder-property.jpg';

  const handleStatusChange = (newStatus: ListingStatus) => {
    setCurrentStatus(newStatus); // optimistic update
    startTransition(async () => {
      const result = await updateListingStatus(listing.id, newStatus);
      if (result?.error) {
        setCurrentStatus(listing.status); // revert on failure
        alert('Failed to update listing: ' + result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteListing(listing.id);
      if (result?.error) {
        alert('Failed to delete listing: ' + result.error);
        return;
      }
      router.refresh();
    });
  };

  // Contextual menu items per current status
  const menuItems =
    currentStatus === 'published' ? [
      { label: 'Archive',  Icon: PauseCircle, action: () => handleStatusChange('archived'), cls: 'text-amber-600' },
      { label: 'Delete', Icon: Trash2,      action: handleDelete,                       cls: 'text-red-500'   },
    ] : currentStatus === 'archived' ? [
      { label: 'Resume', Icon: PlayCircle, action: () => handleStatusChange('published'), cls: 'text-green-600' },
      { label: 'Delete', Icon: Trash2,     action: handleDelete,                          cls: 'text-red-500'   },
    ] : []; // draft

  return (
    <div 
      onClick={() => router.push(`/listings/${listing.id}`)}
      className={`flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md cursor-pointer group ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >

      {/* Image */}
      <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 overflow-hidden">
        <img 
          src={displayImage} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-3 left-3">
          <Badge variant={currentStatus}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-sans group-hover:text-primary transition-colors">{listing.title}</h3>
            <div className="flex items-center text-gray-500 mt-2 text-sm">
              <MapPin size={16} className="mr-1" />
              <span>{listing.location}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#00e5d1]">${listing.price.toLocaleString()}</span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>
        </div>

        {/* Stats + Actions */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-50">
          <div className="flex items-center text-gray-500">
            <Eye size={18} className="mr-2" />
            <span className="text-sm font-medium">{listing.stats.views} Views</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Heart size={18} className="mr-2" />
            <span className="text-sm font-medium">{listing.stats.favorites} Saves</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Users size={18} className="mr-2" />
            <span className="text-sm font-medium">{listing.stats.inquiries} Inquiries</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/dashboard/edit/${listing.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center transition-colors"
            >
              <Edit3 size={16} className="mr-2" />
              Edit Listing
            </Link>

            {/* Action icons shown directly based on status */}
            {menuItems.map(({ label, Icon, action, cls }) => (
              <button
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  action();
                }}
                disabled={isPending}
                title={label}
                className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${cls}`}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
