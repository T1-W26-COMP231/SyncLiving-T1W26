import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Eye, Heart, Users, MapPin, Edit3, MoreVertical } from 'lucide-react';

export interface ListingType {
  id: string;
  title: string;
  price: number;
  location: string;
  distance: string;
  status: 'published' | 'draft' | 'archived';
  imageUrl: string;
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
  return (
    <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      {/* Image Section */}
      <div className="relative w-full md:w-64 h-48 md:h-auto">
        <img 
          src={listing.imageUrl} 
          alt={listing.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={listing.status}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-['Plus_Jakarta_Sans']">{listing.title}</h3>
            <div className="flex items-center text-gray-500 mt-2 text-sm">
              <MapPin size={16} className="mr-1" />
              <span>{listing.location}</span>
              <span className="mx-2">•</span>
              <span>{listing.distance}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#00e5d1]">${listing.price}</span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>
        </div>

        {/* Stats Section */}
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
          
          {/* Actions */}
          <div className="ml-auto flex gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center transition-colors">
              <Edit3 size={16} className="mr-2" />
              Edit Listing
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
