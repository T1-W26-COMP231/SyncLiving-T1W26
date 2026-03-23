'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../../app/onboarding/actions';
import { createClient } from '@/utils/supabase/client';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Sun, Moon, Sparkles, Users, VolumeX, Heart, Ban, Star,
  Camera, Plus, X, Home, Building2, UserSearch,
  Check, ChevronLeft, ChevronRight, Search, Trash2, MapPin
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingFormProps {
  initialData?: any;
  isModal?: boolean;
  onClose?: () => void;
}

type HousingPurpose = 'find_roommate' | 'find_home' | 'have_room' | 'have_space';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFESTYLE_OPTIONS = [
  { label: 'Early Bird',      icon: Sun      },
  { label: 'Night Owl',       icon: Moon     },
  { label: 'Tidy',            icon: Sparkles },
  { label: 'Social',          icon: Users    },
  { label: 'Quiet',           icon: VolumeX  },
  { label: 'Pet Friendly',    icon: Heart    },
  { label: 'LGBTQ+ Friendly', icon: Star     },
  { label: 'Non-Smoker',      icon: Ban      },
];

const HOUSING_OPTIONS: {
  value: HousingPurpose;
  label: string;
  desc: string;
  Icon: React.FC<any>;
}[] = [
  {
    value: 'find_roommate',
    label: 'Looking for a Roommate',
    desc:  'I want to find someone to share my current space with',
    Icon:  UserSearch,
  },
  {
    value: 'find_home',
    label: 'Find a Shared Home',
    desc:  'I want to move into an existing shared living space',
    Icon:  Home,
  },
  {
    value: 'have_room',
    label: 'I Have a Room',
    desc:  'I have a spare room available in my home',
    Icon:  Building2,
  },
  {
    value: 'have_space',
    label: 'Space Available',
    desc:  'I live in a shared house and have a space for someone',
    Icon:  Building2,
  },
];

const STEP_PERCENTS = [33, 66, 100];
const STEP_NAMES    = ['About You', 'Lifestyle', 'Photos'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasSpacePurpose(p: HousingPurpose) {
  return p === 'have_room' || p === 'have_space';
}

function purposeToRole(p: HousingPurpose): 'seeker' | 'provider' {
  return hasSpacePurpose(p) ? 'provider' : 'seeker';
}

const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-dark';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ emoji, label, optional }: { emoji: string; label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {optional && (
        <span className="text-[10px] font-normal italic text-slate-400 normal-case tracking-normal">optional</span>
      )}
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {optional && <span className="ml-1.5 text-[10px] font-normal italic text-slate-400">optional</span>}
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const OnboardingForm: React.FC<OnboardingFormProps> = ({ initialData, isModal, onClose }) => {
  const router   = useRouter();
  const supabase = createClient();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const morePhotosInputRef = useRef<HTMLInputElement>(null);

  // Poll for google maps availability
  useEffect(() => {
    const checkGoogle = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }, []);

  // Parse initial PostGIS / GeoJSON coordinates
  let initialLat: number | undefined;
  let initialLng: number | undefined;
  if (initialData?.location_coords) {
    if (typeof initialData.location_coords === 'string') {
      const m = initialData.location_coords.match(/POINT\((.+) (.+)\)/);
      if (m) { initialLng = parseFloat(m[1]); initialLat = parseFloat(m[2]); }
    } else if (initialData.location_coords.coordinates) {
      initialLng = initialData.location_coords.coordinates[0];
      initialLat = initialData.location_coords.coordinates[1];
    }
  }

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name:        initialData?.full_name        || '',
    age:              initialData?.age              || 25,
    location:         initialData?.location         || '',
    latitude:         initialLat                    as number | undefined,
    longitude:        initialLng                    as number | undefined,
    housingPurpose:  'find_roommate'                as HousingPurpose,
    budget_min:       initialData?.budget_min       || 800,
    budget_max:       initialData?.budget_max       || 2500,
    preferred_gender: initialData?.preferred_gender || 'Any Gender',
    move_in_date:     initialData?.move_in_date     || '',
    lifestyle_tags:  (initialData?.lifestyle_tags   || []) as string[],
    bio:              initialData?.bio              || '',
  });

  // ── Google Places Autocomplete ───────────────────────────────────────────────
  const {
    ready,
    value: addressValue,
    suggestions: { status: addressStatus, data: addressData },
    setValue: setAddressValue,
    clearSuggestions: clearAddressSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "ca" },
    },
    debounce: 300,
    defaultValue: initialData?.location || '',
    initOnMount: isGoogleLoaded,
  });

  const handleAddressSelect = async (suggestion: any) => {
    const address = suggestion.description;
    setAddressValue(address, false);
    clearAddressSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      setFormData(prev => ({
        ...prev,
        location: address,
        latitude: lat,
        longitude: lng
      }));
    } catch (error) {
      console.error("Error selecting address: ", error);
    }
  };

  // ── Photo state ─────────────────────────────────────────────────────────────
  const [profilePhotoUrl,  setProfilePhotoUrl]  = useState<string | null>(
    initialData?.avatar_url 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${initialData.avatar_url}` 
      : null
  );
  const [avatarFile,       setAvatarFile]       = useState<File | null>(null);
  
  // Dynamic photos state
  const [morePhotos,       setMorePhotos]       = useState<{file?: File, url: string, path?: string}[]>(
    (initialData?.photos || []).map((path: string) => ({
      path,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`
    }))
  );
  const [spacePhotos,      setSpacePhotos]      = useState<{file?: File, url: string}[]>([]);
  const [spaceNote,        setSpaceNote]        = useState('');

  // ── My Space toggle — default ON when housing purpose has space ─────────────
  const [includeMySpace, setIncludeMySpace] = useState(false);

  useEffect(() => {
    setIncludeMySpace(hasSpacePurpose(formData.housingPurpose));
  }, [formData.housingPurpose]);

  // ── Photo pickers ────────────────────────────────────────────────────────────
  const pickProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleMorePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPhotos = newFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setMorePhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removeMorePhoto = (index: number) => {
    setMorePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpacePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPhotos = newFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setSpacePhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removeSpacePhoto = (index: number) => {
    setSpacePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ── Lifestyle tags ────────────────────────────────────────────────────────────
  const toggleTag = (tag: string) => {
    setFormData(p => ({
      ...p,
      lifestyle_tags: p.lifestyle_tags.includes(tag)
        ? p.lifestyle_tags.filter((t: string) => t !== tag)
        : [...p.lifestyle_tags, tag],
    }));
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleClose = () => {
    setVisible(false);
    if (onClose)      { onClose(); return; }
    if (isModal)      { router.back(); }
    else              { router.push('/'); }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let finalAvatarUrl = initialData?.avatar_url;

      // 1. Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, avatarFile, {
            contentType: avatarFile.type,
            upsert: true
          });

        if (uploadError) throw uploadError;
        finalAvatarUrl = data.path;
      }

      // 2. Upload "More Photos"
      const finalPhotos: string[] = [];
      for (const photo of morePhotos) {
        if (photo.file) {
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `${user.id}/more_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, photo.file, {
              contentType: photo.file.type,
              upsert: true
            });

          if (uploadError) throw uploadError;
          finalPhotos.push(data.path);
        } else if (photo.path) {
          finalPhotos.push(photo.path);
        }
      }

      const result = await updateProfile({
        full_name:        formData.full_name,
        age:              formData.age,
        location:         formData.location,
        longitude:        formData.longitude,
        latitude:         formData.latitude,
        role:             purposeToRole(formData.housingPurpose),
        lifestyle_tags:   formData.lifestyle_tags,
        budget_min:       formData.budget_min,
        budget_max:       formData.budget_max,
        preferred_gender: formData.preferred_gender,
        move_in_date:     formData.move_in_date,
        avatar_url:       finalAvatarUrl,
        photos:           finalPhotos,
        bio:              formData.bio,
      });

      if (result?.error) {
        alert('Error: ' + result.error);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Progress header ────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-0 shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Step {step}
              </span>
              <h2 className="text-2xl font-extrabold text-dark leading-tight">
                {STEP_NAMES[step - 1]}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${STEP_PERCENTS[step - 1]}%` }}
            />
          </div>

          <p className="text-sm text-slate-500 mt-3 pb-6">
            {step === 1 && 'Help us find your perfect match by sharing a few details.'}
            {step === 2 && 'Tell us about your daily habits and preferences to find the best match.'}
            {step === 3 && 'Help your matches get to know you. Profiles with photos get 3× more connections.'}
          </p>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-8">

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — About You                                             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              {/* Personal details */}
              <section>
                <SectionLabel emoji="👤" label="Personal Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FieldLabel>Full Name</FieldLabel>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel>Age</FieldLabel>
                    <input
                      type="number"
                      min={18} max={99}
                      value={formData.age}
                      onChange={e => setFormData(p => ({ ...p, age: parseInt(e.target.value) || 18 }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel>Preferred Gender to Live With</FieldLabel>
                    <select
                      value={formData.preferred_gender}
                      onChange={e => setFormData(p => ({ ...p, preferred_gender: e.target.value }))}
                      className={inputCls}
                    >
                      <option>Any Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Location - GOOGLE MAPS IMPLEMENTATION */}
              <section>
                <SectionLabel emoji="📍" label="Location" />
                <div className="relative">
                  <div className="relative rounded-xl shadow-sm">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                    <input
                      value={addressValue}
                      onChange={(e) => setAddressValue(e.target.value)}
                      disabled={!ready || !isGoogleLoaded}
                      placeholder={isGoogleLoaded ? "Search city or neighborhood…" : "Loading address service..."}
                      className={`${inputCls} pl-10`}
                      autoComplete="off"
                    />
                  </div>

                  {addressStatus === "OK" && (
                    <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      {addressData.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => handleAddressSelect(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-medium text-dark">{suggestion.structured_formatting.main_text}</p>
                              <p className="text-[10px] text-slate-500">{suggestion.structured_formatting.secondary_text}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {formData.latitude && (
                    <p className="text-[10px] text-slate-400 mt-1.5 pl-1 flex items-center gap-1">
                      <Check size={10} className="text-green-500" /> Location verified
                    </p>
                  )}
                </div>
              </section>

              {/* Housing purpose */}
              <section>
                <SectionLabel emoji="🏠" label="What Describes You Best?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HOUSING_OPTIONS.map(({ value, label, desc, Icon }) => {
                    const active = formData.housingPurpose === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, housingPurpose: value }))}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-100 bg-slate-50 hover:border-primary/40'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 p-1.5 rounded-xl transition-colors ${
                          active ? 'bg-primary/20 text-dark' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${active ? 'text-dark' : 'text-slate-700'}`}>{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                        </div>
                        {active && (
                          <div className="shrink-0 size-5 rounded-full bg-primary flex items-center justify-center">
                            <Check size={11} strokeWidth={3} className="text-dark" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Budget range */}
              <section>
                <SectionLabel emoji="💰" label="Monthly Budget Range" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">Minimum</span>
                      <span className="font-bold text-primary">${formData.budget_min.toLocaleString()}</span>
                    </div>
                    <input
                      type="range" min={500} max={5000} step={100}
                      value={formData.budget_min}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        setFormData(p => ({ ...p, budget_min: Math.min(v, p.budget_max - 100) }));
                      }}
                      className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">Maximum</span>
                      <span className="font-bold text-primary">${formData.budget_max.toLocaleString()}</span>
                    </div>
                    <input
                      type="range" min={500} max={5000} step={100}
                      value={formData.budget_max}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        setFormData(p => ({ ...p, budget_max: Math.max(v, p.budget_min + 100) }));
                      }}
                      className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 px-1">
                    <span>$500</span><span>$5,000+</span>
                  </div>
                </div>
              </section>

              {/* Move-in date */}
              <section>
                <SectionLabel emoji="📅" label="Estimated Move-in Date" />
                <input
                  type="date"
                  value={formData.move_in_date}
                  onChange={e => setFormData(p => ({ ...p, move_in_date: e.target.value }))}
                  className={inputCls}
                />
              </section>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — Lifestyle Tags                                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <section>
                <SectionLabel emoji="✨" label="Your Lifestyle Tags" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LIFESTYLE_OPTIONS.map(({ label, icon: Icon }) => {
                    const active = formData.lifestyle_tags.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleTag(label)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 text-dark'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-primary/40'
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-primary/20' : 'bg-slate-200'}`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-xs font-bold text-center leading-tight">{label}</span>
                        {active && (
                          <div className="size-4 rounded-full bg-primary flex items-center justify-center">
                            <Check size={9} strokeWidth={3} className="text-dark" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionLabel emoji="📝" label="Describe Yourself" optional />
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  rows={4}
                  placeholder="Share a bit about your daily routine, habits, or anything you'd like potential roommates to know…"
                  className={`${inputCls} resize-none`}
                />
              </section>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 3 — Upload Photos                                         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <>
              {/* Profile photo — circular upload zone */}
              <section>
                <SectionLabel emoji="🖼️" label="Profile Photo" />
                <div className="flex justify-center">
                  <label className="relative group cursor-pointer">
                    <div className={`w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                      profilePhotoUrl
                        ? 'border-primary'
                        : 'border-slate-300 bg-slate-50 group-hover:border-primary group-hover:bg-primary/5'
                    }`}>
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={24} className="text-slate-400 group-hover:text-primary transition-colors mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-primary">
                            Add Photo
                          </span>
                        </>
                      )}
                    </div>
                    {/* Floating + badge */}
                    <div className="absolute bottom-0.5 right-0.5 bg-primary size-7 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <Plus size={12} className="text-dark" strokeWidth={3} />
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={pickProfilePhoto} />
                  </label>
                </div>
              </section>

              {/* More photos — Dynamic selection */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">📷</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">More Photos</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 italic">Show more of your personality</span>
                </div>
                
                {/* Add Photo Button */}
                <div 
                  onClick={() => morePhotosInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer mb-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={24} className="text-primary" />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-bold text-dark">Add More Photos</p>
                    <p className="text-[10px] text-slate-500">Select multiple files</p>
                  </div>
                  <input 
                    ref={morePhotosInputRef}
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handleMorePhotosChange}
                  />
                </div>

                {/* Previews Grid */}
                {morePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {morePhotos.map((photo, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                        <img src={photo.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeMorePhoto(i)}
                          className="absolute top-1.5 right-1.5 size-7 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── My Space section ──────────────────────────────────── */}
              <section>
                {/* Toggle row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🏠</span>
                    <div>
                      <p className="text-sm font-bold text-dark">Include My Living Space</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {hasSpacePurpose(formData.housingPurpose)
                          ? 'Recommended — let potential housemates see your space'
                          : 'Optionally show others what your current living space looks like'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeMySpace}
                    onClick={() => setIncludeMySpace(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                      includeMySpace ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 bg-white rounded-full shadow-sm transition-transform ${
                        includeMySpace ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Expandable space details */}
                {includeMySpace && (
                  <div className="mt-4 space-y-5 pl-1">
                    {/* Space photos */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Space Photos</span>
                        <span className="text-[10px] italic text-slate-400">Common areas, room, etc.</span>
                      </div>
                      
                      {/* Space Photos Selection */}
                      <div className="flex flex-wrap gap-3">
                        {/* Previews */}
                        {spacePhotos.map((photo, i) => (
                          <div key={i} className="group relative size-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                            <img src={photo.url} alt={`Space ${i + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSpacePhoto(i)}
                              className="absolute top-1 right-1 size-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add Button Tile */}
                        <label className="size-20 cursor-pointer group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all">
                          <Plus size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="sr-only" 
                            multiple
                            onChange={handleSpacePhotosChange} 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Note to seekers */}
                    <div>
                      <FieldLabel optional>Note to Interested Seekers</FieldLabel>
                      <textarea
                        value={spaceNote}
                        onChange={e => setSpaceNote(e.target.value)}
                        rows={3}
                        placeholder="e.g. I'm a tenant — contact me to arrange a viewing and I'll connect you with the landlord."
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* ── Footer navigation ───────────────────────────────────────────── */}
        <div className="px-8 py-6 border-t border-slate-100 shrink-0">
          <div className="flex gap-3">
            {/* Back / Cancel */}
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3.5 rounded-full border border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3.5 rounded-full border border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {/* Continue / Complete */}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="flex-[2] py-3.5 rounded-full bg-primary text-dark font-bold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-[2] py-3.5 rounded-full bg-primary text-dark font-bold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving…' : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    Complete Profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
