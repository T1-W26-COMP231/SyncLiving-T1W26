'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { updateSeekerPreferences } from '../../../app/seeker-preferences/actions';
import Script from 'next/script';
import AddressAutocomplete from '@/components/dashboard/AddressAutocomplete';
import { 
  CheckCircle2, 
  PlusCircle, 
  Sparkles, 
  Home, 
  Save,
  Loader2,
  MapPin,
  Search,
  DollarSign,
  LocateFixed,
  Building2
} from 'lucide-react';
import SettingsModal from '@/components/settings/SettingsModal';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/utils/supabase/client';

interface Tag {
  id: string;
  name: string;
  category: string | null;
}

interface Amenity {
  id: string;
  name: string;
  category: string | null;
}

interface RoomType {
  id: string;
  name: string;
}

interface SeekerPreferencesClientProps {
  allTags: Tag[];
  allAmenities: Amenity[];
  allRoomTypes: RoomType[];
  initialTagIds: string[];
  initialAmenityIds: string[];
  initialRoomTypeIds: string[];
  initialData: {
    reference_location: string;
    latitude?: number;
    longitude?: number;
    max_distance: number;
    budget_min: number;
    budget_max: number;
  };
}

export default function SeekerPreferencesClient({ 
  allTags, 
  allAmenities, 
  allRoomTypes,
  initialTagIds, 
  initialAmenityIds,
  initialRoomTypeIds,
  initialData
}: SeekerPreferencesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // States
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenityIds);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(initialRoomTypeIds);
  
  const [prefData, setPrefData] = useState({
    location: initialData.reference_location,
    latitude: initialData.latitude,
    longitude: initialData.longitude,
    maxDistance: initialData.max_distance,
    budgetMin: initialData.budget_min,
    budgetMax: initialData.budget_max,
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAddressSelect = (address: string, _city: string, _zip: string, lat: number, lng: number) => {
    setPrefData(prev => ({
      ...prev,
      location: address,
      latitude: lat,
      longitude: lng
    }));
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleRoomType = (id: string) => {
    setSelectedRoomTypes(prev => 
      prev.includes(id) ? prev.filter(rt => rt !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaveStatus('idle');
    startTransition(async () => {
      const result = await updateSeekerPreferences({
        lifestyle_tag_ids: selectedTags,
        amenity_ids: selectedAmenities,
        room_type_ids: selectedRoomTypes,
        reference_location: prefData.location,
        latitude: prefData.latitude,
        longitude: prefData.longitude,
        max_distance: prefData.maxDistance,
        budget_min: prefData.budgetMin,
        budget_max: prefData.budgetMax,
      });

      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar activeTab="Preferences" />
        
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight text-dark sm:text-5xl uppercase">Roommate Preferences</h1>
            <p className="mt-3 text-lg font-medium text-slate-500">
              Tell us who you&apos;d love to live with and what your dream home looks like.
            </p>
          </div>

          <div className="space-y-10">
            {/* Success/Error Message */}
            {saveStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 size={20} />
                <span className="font-bold text-sm">Preferences saved successfully!</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3">
                <PlusCircle size={20} className="rotate-45" />
                <span className="font-bold text-sm">Failed to save preferences. Please try again.</span>
              </div>
            )}

            {/* 1. Location & Distance */}
            <Card>
              <CardHeader 
                title="Where do you want to live?" 
                subtitle="Set a reference point and maximum commute distance" 
              />
              <CardContent className="space-y-8">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Location</label>
                  <AddressAutocomplete
                    defaultValue={prefData.location}
                    onAddressSelect={handleAddressSelect}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Maximum Distance</label>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      within {prefData.maxDistance} km
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={100} step={1}
                    value={prefData.maxDistance}
                    onChange={e => setPrefData(p => ({ ...p, maxDistance: parseInt(e.target.value) }))}
                    className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer bg-slate-100"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                    <span>1 km</span><span>50 km</span><span>100 km+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Budget Range */}
            <Card>
              <CardHeader 
                title="Monthly Budget" 
                subtitle="What is your comfortable rent range?" 
              />
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">Minimum</span>
                        <span className="font-bold text-primary">${prefData.budgetMin.toLocaleString()}</span>
                      </div>
                      <input
                        type="range" min={500} max={5000} step={100}
                        value={prefData.budgetMin}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          setPrefData(p => ({ ...p, budgetMin: Math.min(v, p.budgetMax - 100) }));
                        }}
                        className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">Maximum</span>
                        <span className="font-bold text-primary">${prefData.budgetMax.toLocaleString()}</span>
                      </div>
                      <input
                        type="range" min={500} max={5000} step={100}
                        value={prefData.budgetMax}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          setPrefData(p => ({ ...p, budgetMax: Math.max(v, p.budgetMin + 100) }));
                        }}
                        className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                    <span>$500</span><span>$2,500</span><span>$5,000+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2.5 Room Type Selection */}
            <Card>
              <CardHeader 
                title="Preferred Room Type" 
                subtitle="What kind of living arrangement are you looking for?" 
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {allRoomTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleRoomType(type.id)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all gap-2
                        ${selectedRoomTypes.includes(type.id)
                          ? 'border-primary bg-primary/10 text-dark shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }
                      `}
                    >
                      {selectedRoomTypes.includes(type.id) 
                        ? <CheckCircle2 size={20} className="text-primary" /> 
                        : <div className="size-5 rounded-full border-2 border-slate-200" />
                      }
                      <span className="text-center">{type.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 3. Ideal Roommate Habits */}
            <Card>
              <CardHeader 
                title="Ideal Roommate Habits" 
                subtitle="Select the traits you're looking for in a roommate" 
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all
                        ${selectedTags.includes(tag.id)
                          ? 'border-primary bg-primary/10 text-dark shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }
                      `}
                    >
                      {selectedTags.includes(tag.id) 
                        ? <CheckCircle2 size={16} className="text-primary" /> 
                        : <PlusCircle size={16} className="text-slate-300" />
                      }
                      {tag.name.replace('#', '')}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 4. Must-have Amenities */}
            <Card>
              <CardHeader 
                title="Must-have Amenities" 
                subtitle="What equipment should your next home definitely have?" 
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allAmenities.map((amenity) => (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`
                        flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all
                        ${selectedAmenities.includes(amenity.id)
                          ? 'border-primary bg-primary/10 text-dark shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }
                      `}
                    >
                      {selectedAmenities.includes(amenity.id) 
                        ? <CheckCircle2 size={16} className="text-primary" /> 
                        : <PlusCircle size={16} className="text-slate-300" />
                      }
                      {amenity.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4 pb-10">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 bg-dark text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-dark/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />
    </>
  );
}
