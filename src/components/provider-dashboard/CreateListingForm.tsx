'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { FormInput, FormTextarea } from '@/components/ui/FormElements';

const ROOM_TYPES = [
  { id: 'private', label: 'Private Room' },
  { id: 'shared', label: 'Shared Room' },
  { id: 'entire', label: 'Entire Apartment' },
  { id: 'studio', label: 'Studio' },
];

export default function CreateListingForm() {
  const [selectedRoomType, setSelectedRoomType] = useState('private');

  return (
    <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
      {/* Listing Details Section */}
      <Card>
        <CardHeader title="Listing Details" subtitle="Step 1" />
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-full">
              <FormInput 
                label="Listing Title" 
                placeholder="Enter listing title" 
                name="title" 
              />
            </div>
            
            <div className="col-span-full">
              <FormInput 
                label="Address" 
                placeholder="Enter property address" 
                name="address" 
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-semibold text-slate-700">Room Type</label>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ROOM_TYPES.map((type) => (
                  <label 
                    key={type.id}
                    className={`relative flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 shadow-sm focus:outline-none transition-all
                      ${selectedRoomType === type.id 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <input 
                      type="radio" 
                      name="room-type" 
                      value={type.id} 
                      className="sr-only" 
                      checked={selectedRoomType === type.id}
                      onChange={() => setSelectedRoomType(type.id)}
                    />
                    <span className="text-xs font-bold">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-1">
              <FormInput 
                label="Monthly Rent" 
                placeholder="1200+" 
                name="rent" 
                iconLeft={<span className="text-slate-500 sm:text-sm">$</span>}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities & Rules Section */}
      <Card>
        <CardHeader title="Amenities & Rules" subtitle="Step 2" />
        <CardContent>
          <FormTextarea 
            label="Description" 
            name="description" 
            rows={5} 
            placeholder="Describe the property, amenities, and any house rules..." 
          />
        </CardContent>
      </Card>

      {/* Property Photos Section */}
      <Card>
        <CardHeader title="Property Photos" subtitle="Step 3" />
        <CardContent>
          <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <p className="text-base font-bold text-slate-900">Add Property Photos</p>
              <p className="text-sm text-slate-500">Drag and drop or click to browse</p>
            </div>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" multiple />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
                <span className="material-symbols-outlined text-4xl">image</span>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-tighter">image</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-6 pt-6">
        <button type="button" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
          Save as Draft
        </button>
        <button type="submit" className="inline-flex items-center justify-center rounded-xl border border-transparent bg-primary px-8 py-4 text-sm font-bold text-dark shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          Publish Listing
        </button>
      </div>
    </form>
  );
}
