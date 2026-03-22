'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../../app/onboarding/actions';
import {
  Sun, Moon, Sparkles, Users, VolumeX, Heart, Ban, Star,
  Camera, Plus, X, Home, Building2, UserSearch,
  Check, ChevronLeft, ChevronRight, Search,
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
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

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
    bio:              '',
  });

  // ── Photo state ─────────────────────────────────────────────────────────────
  const [profilePhotoUrl,  setProfilePhotoUrl]  = useState<string | null>(null);
  const [morePhotoUrls,    setMorePhotoUrls]    = useState<(string | null)[]>(Array(5).fill(null));
  const [spacePhotoUrls,   setSpacePhotoUrls]   = useState<(string | null)[]>(Array(4).fill(null));
  const [spaceNote,        setSpaceNote]        = useState('');

  // ── My Space toggle — default ON when housing purpose has space ─────────────
  const [includeMySpace, setIncludeMySpace] = useState(false);

  useEffect(() => {
    setIncludeMySpace(hasSpacePurpose(formData.housingPurpose));
  }, [formData.housingPurpose]);

  // ── Location autocomplete ────────────────────────────────────────────────────
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions,     setShowSuggestions]     = useState(false);

  const searchLocation = async (query: string) => {
    setFormData(p => ({ ...p, location: query }));
    if (query.length < 3) { setLocationSuggestions([]); return; }
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleSelectSuggestion = (s: any) => {
    setFormData(p => ({
      ...p,
      location:  s.display_name,
      latitude:  parseFloat(s.lat),
      longitude: parseFloat(s.lon),
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  // ── Photo pickers ────────────────────────────────────────────────────────────
  const pickProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfilePhotoUrl(URL.createObjectURL(file));
  };

  const pickMorePhoto = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMorePhotoUrls(prev => { const n = [...prev]; n[i] = URL.createObjectURL(file); return n; });
  };

  const pickSpacePhoto = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSpacePhotoUrls(prev => { const n = [...prev]; n[i] = URL.createObjectURL(file); return n; });
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
      });
      if (result?.error) {
        alert('Error: ' + result.error);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Submit error:', err);
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

              {/* Location */}
              <section>
                <SectionLabel emoji="📍" label="Location" />
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => searchLocation(e.target.value)}
                    onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search city or neighborhood…"
                    className={`${inputCls} pl-10`}
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      {locationSuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <p className="font-medium text-dark truncate">{s.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.latitude && (
                    <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
                      📌 {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)}
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

              {/* More photos — 3-col grid */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">📷</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">More Photos</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 italic">Add up to 5 more</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <label key={i} className="aspect-square cursor-pointer group block">
                      <div className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                        morePhotoUrls[i]
                          ? 'border-primary'
                          : 'border-slate-200 bg-slate-50 group-hover:border-primary group-hover:bg-primary/5'
                      }`}>
                        {morePhotoUrls[i] ? (
                          <img src={morePhotoUrls[i]!} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <input type="file" accept="image/*" className="sr-only" onChange={e => pickMorePhoto(i, e)} />
                    </label>
                  ))}
                  {/* Tips tile */}
                  <div className="aspect-square rounded-xl bg-secondary/20 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-lg mb-1">💡</span>
                    <span className="text-[9px] font-bold text-slate-600 leading-tight">
                      Shoot in natural light for best results!
                    </span>
                  </div>
                </div>
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
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Space Photos</span>
                        <span className="text-[10px] italic text-slate-400">Common areas, room, etc. — up to 4</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <label key={i} className="aspect-square cursor-pointer group block">
                            <div className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                              spacePhotoUrls[i]
                                ? 'border-primary'
                                : 'border-slate-200 bg-slate-50 group-hover:border-primary group-hover:bg-primary/5'
                            }`}>
                              {spacePhotoUrls[i] ? (
                                <img src={spacePhotoUrls[i]!} alt={`Space ${i + 1}`} className="w-full h-full object-cover" />
                              ) : (
                                <Camera size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                              )}
                            </div>
                            <input type="file" accept="image/*" className="sr-only" onChange={e => pickSpacePhoto(i, e)} />
                          </label>
                        ))}
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
