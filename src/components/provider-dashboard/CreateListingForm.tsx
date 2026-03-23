'use client';

import React, { useState, useActionState, useRef, startTransition } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { FormInput, FormTextarea } from '@/components/ui/FormElements';
import { createListing } from '../../../app/provider-dashboard/actions';
import AddressAutocomplete from './AddressAutocomplete';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface RoomType {
  id: string;
  name: string;
}

interface Amenity {
  id: string;
  name: string;
  category: string | null;
}

interface CreateListingFormProps {
  roomTypes: RoomType[];
  amenities: Amenity[];
  initialData?: {
    id: string;
    title: string;
    address: string;
    rental_fee: number;
    house_rules: string;
    room_type_id: string;
    amenities_ids: string[];
    city?: string;
    postal_code?: string;
    lat?: number;
    lng?: number;
    photos?: string[];
  };
}

export default function CreateListingForm({ roomTypes, amenities, initialData }: CreateListingFormProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, formAction, isPending] = useActionState(createListing, null);
  
  const [selectedRoomType, setSelectedRoomType] = useState(initialData?.room_type_id || roomTypes[0]?.id || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities_ids || []);
  const [submitStatus, setSubmitStatus] = useState<'draft' | 'published'>('draft');
  
  // State for property photos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>(initialData?.photos || []);

  // State for location details extracted from Google Maps
  const [location, setLocation] = useState({
    city: initialData?.city || '',
    postalCode: initialData?.postal_code || '',
    lat: initialData?.lat || null as number | null,
    lng: initialData?.lng || null as number | null,
  });

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAddressSelect = (address: string, city: string, postalCode: string, lat: number, lng: number) => {
    setLocation({ city, postalCode, lat, lng });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // If it's a new file, remove it from selectedFiles
    // Note: This logic assumes new previews are added after initialData photos
    const initialPhotosCount = initialData?.photos?.length || 0;
    if (index >= initialPhotosCount) {
      setSelectedFiles(prev => prev.filter((_, i) => i !== (index - initialPhotosCount)));
    } else {
      setUploadedPaths(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newUploadedPaths = [...uploadedPaths];

      // Upload new files
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log(`Attempting to upload to: property-images/${filePath}`);

        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true
          });

        if (error) {
          console.error("Supabase Storage Error:", error);
          throw error;
        }
        newUploadedPaths.push(data.path);
      }

      // Add photos to formData
      formData.append('photos', JSON.stringify(newUploadedPaths));
      
      // Wrap in startTransition to satisfy React 19's requirements for useActionState
      startTransition(() => {
        formAction(formData);
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />
      
      <form className="space-y-10" action={handleSubmit}>
        {/* Error Message Display */}
        {state?.error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
            Error: {state.error}
          </div>
        )}

        {/* Hidden inputs to pass state to Server Action */}
        {isEditMode && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="status" value={submitStatus} />
        <input type="hidden" name="room_type_id" value={selectedRoomType} />
        <input type="hidden" name="amenities_ids" value={JSON.stringify(selectedAmenities)} />
        
        {/* Location hidden inputs */}
        <input type="hidden" name="city" value={location.city} />
        <input type="hidden" name="postal_code" value={location.postalCode} />
        <input type="hidden" name="lat" value={location.lat || ''} />
        <input type="hidden" name="lng" value={location.lng || ''} />

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
                  defaultValue={initialData?.title}
                  required
                />
              </div>
              
              <div className="col-span-full">
                <AddressAutocomplete 
                  defaultValue={initialData?.address}
                  onAddressSelect={handleAddressSelect}
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-semibold text-slate-700">Room Type</label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {roomTypes.map((type) => (
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
                        name="room-type-radio" 
                        value={type.id} 
                        className="sr-only" 
                        checked={selectedRoomType === type.id}
                        onChange={() => setSelectedRoomType(type.id)}
                      />
                      <span className="text-xs font-bold">{type.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-1">
                <FormInput 
                  label="Monthly Rent" 
                  placeholder="1200+" 
                  name="rent" 
                  type="number"
                  defaultValue={initialData?.rental_fee}
                  required
                  iconLeft={<span className="text-slate-500 sm:text-sm">$</span>}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities Section */}
        <Card>
          <CardHeader title="Amenities" subtitle="Step 2" />
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`
                    flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                    ${selectedAmenities.includes(amenity.id)
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-lg">
                    {selectedAmenities.includes(amenity.id) ? 'check_circle' : 'add_circle'}
                  </span>
                  {amenity.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* House Rules Section */}
        <Card>
          <CardHeader title="House Rules" subtitle="Step 3" />
          <CardContent>
            <FormTextarea 
              label="Property Rules & Description" 
              name="description" 
              rows={5} 
              defaultValue={initialData?.house_rules}
              placeholder="Describe any house rules, expectations, or additional details..." 
            />
          </CardContent>
        </Card>

        {/* Property Photos Section */}
        <Card>
          <CardHeader title="Property Photos" subtitle="Step 4" />
          <CardContent>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <p className="text-base font-bold text-slate-900">Add Property Photos</p>
                <p className="text-sm text-slate-500">Click to browse your gallery</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {previews.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {previews.map((src, index) => (
                  <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img 
                      src={src.startsWith('blob:') ? src : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${src}`} 
                      alt={`Preview ${index}`} 
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-6 pt-6">
          <button 
            type="submit" 
            onClick={() => setSubmitStatus('draft')}
            disabled={isPending || isUploading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {(isPending || isUploading) && submitStatus === 'draft' ? 'Saving...' : 'Save as Draft'}
          </button>
          <button 
            type="submit" 
            onClick={() => setSubmitStatus('published')}
            disabled={isPending || isUploading}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-primary px-8 py-4 text-sm font-bold text-dark shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {(isPending || isUploading) && submitStatus === 'published' 
              ? 'Processing...' 
              : (isEditMode ? 'Update & Publish' : 'Publish Listing')
            }
          </button>
        </div>
      </form>
    </>
  );
}
