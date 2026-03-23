'use client';

import React, { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createListing } from '../../../app/provider-dashboard/actions';
import AddressAutocomplete from './AddressAutocomplete';
import Script from 'next/script';
import {
  FileText, MapPin, DollarSign, Home, Sparkles,
  ScrollText, Images, Check, ChevronLeft, ChevronRight,
  Camera, X, Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  isModal?: boolean;
  onClose?: () => void;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_NAMES    = ['Listing Details', 'Amenities', 'House Rules', 'Photos'];
const STEP_PERCENTS = [25, 50, 75, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-dark';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  Icon, label,
}: {
  Icon: React.FC<any>; label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} className="text-primary shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="ml-1 text-red-400">*</span>}
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateListingForm({ roomTypes, amenities, isModal, onClose, initialData }: CreateListingFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createListing, null);
  const isEditMode = !!initialData;

  // ── Step state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [selectedRoomType,  setSelectedRoomType]  = useState(initialData?.room_type_id || roomTypes[0]?.id || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities_ids || []);
  const [submitStatus,      setSubmitStatus]      = useState<'draft' | 'published'>('draft');

  // Location from Google Maps autocomplete
  const [location, setLocation] = useState({
    city:       initialData?.city        || '',
    postalCode: initialData?.postal_code || '',
    lat:        initialData?.lat         || null as number | null,
    lng:        initialData?.lng         || null as number | null,
  });

  // Photo previews
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>(Array(4).fill(null));

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAddressSelect = (_address: string, city: string, postalCode: string, lat: number, lng: number) => {
    setLocation({ city, postalCode, lat, lng });
  };

  const pickPhoto = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrls(prev => { const n = [...prev]; n[i] = URL.createObjectURL(file); return n; });
  };

  const handleClose = () => {
    if (onClose) { onClose(); return; }
    router.push('/provider-dashboard');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const formContent = (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />

      <form action={formAction}>
        {/* Hidden inputs — always in DOM so FormData picks them up on submit */}
        {isEditMode && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="status"        value={submitStatus} />
        <input type="hidden" name="room_type_id"  value={selectedRoomType} />
        <input type="hidden" name="amenities_ids" value={JSON.stringify(selectedAmenities)} />
        <input type="hidden" name="city"          value={location.city} />
        <input type="hidden" name="postal_code"   value={location.postalCode} />
        <input type="hidden" name="lat"           value={location.lat ?? ''} />
        <input type="hidden" name="lng"           value={location.lng ?? ''} />

        {/* ── Wizard card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

          {/* ── Progress header ────────────────────────────────────────────── */}
          <div className="px-8 pt-8 pb-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Step {step}
                </span>
                <h2 className="text-2xl font-extrabold text-dark leading-tight">
                  {STEP_NAMES[step - 1]}
                </h2>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold text-slate-400">Step {step} of 4</span>
                {isModal && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X size={18} />
                  </button>
                )}
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
              {step === 1 && 'Provide the core details about your listing.'}
              {step === 2 && 'Select the amenities available at your property.'}
              {step === 3 && 'Describe house rules and any important expectations.'}
              {step === 4 && 'Add photos to attract more quality applicants.'}
            </p>
          </div>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {state?.error && (
            <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {state.error}
            </div>
          )}

          {/* ── Step content ─────────────────────────────────────────────── */}
          <div className="px-8 pb-2 space-y-8">

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 1 — Listing Details                                      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <>
                {/* Basic info */}
                <section>
                  <SectionLabel Icon={FileText} label="Basic Information" />
                  <div className="space-y-4">
                    <div>
                      <FieldLabel required>Listing Title</FieldLabel>
                      <input
                        type="text"
                        name="title"
                        defaultValue={initialData?.title}
                        placeholder="e.g. Bright private room in downtown condo"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel required>Monthly Rent</FieldLabel>
                      <div className="relative">
                        <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          name="rent"
                          defaultValue={initialData?.rental_fee}
                          placeholder="1200"
                          min={0}
                          className={`${inputCls} pl-10`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Address */}
                <section>
                  <SectionLabel Icon={MapPin} label="Location" />
                  <AddressAutocomplete
                    defaultValue={initialData?.address}
                    onAddressSelect={handleAddressSelect}
                  />
                  {location.lat && (
                    <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
                      Coordinates: {location.lat.toFixed(4)}, {location.lng?.toFixed(4)}
                    </p>
                  )}
                </section>

                {/* Room type */}
                <section>
                  <SectionLabel Icon={Home} label="Room Type" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {roomTypes.map(type => {
                      const active = selectedRoomType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedRoomType(type.id)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                            active
                              ? 'border-primary bg-primary/5 text-dark'
                              : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/40'
                          }`}
                        >
                          {active && (
                            <div className="size-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check size={9} strokeWidth={3} className="text-dark" />
                            </div>
                          )}
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 2 — Amenities                                            */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <section>
                <SectionLabel Icon={Sparkles} label="Available Amenities" />
                {amenities.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">No amenities available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenities.map(amenity => {
                      const active = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all text-left ${
                            active
                              ? 'border-primary bg-primary/5 text-dark'
                              : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/40'
                          }`}
                        >
                          <div className={`shrink-0 size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            active ? 'bg-primary border-primary' : 'border-slate-300'
                          }`}>
                            {active && <Check size={10} strokeWidth={3} className="text-dark" />}
                          </div>
                          {amenity.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedAmenities.length > 0 && (
                  <p className="text-xs text-slate-400 mt-4">
                    <span className="font-bold text-primary">{selectedAmenities.length}</span> amenit{selectedAmenities.length === 1 ? 'y' : 'ies'} selected
                  </p>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 3 — House Rules                                          */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <section>
                <SectionLabel Icon={ScrollText} label="House Rules & Description" />
                <textarea
                  name="description"
                  rows={8}
                  defaultValue={initialData?.house_rules}
                  placeholder="Describe house rules, living expectations, nearby transport, and any other details that help potential roommates decide..."
                  className={`${inputCls} resize-none`}
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Be specific — listings with detailed rules receive more serious inquiries.
                </p>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 4 — Property Photos                                      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <section>
                <SectionLabel Icon={Images} label="Property Photos" />

                {/* Main upload drop zone */}
                <label className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer mb-6">
                  <div className="size-14 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-100 mb-4">
                    <Camera size={24} className="text-primary" />
                  </div>
                  <p className="text-sm font-bold text-dark">Add Property Photos</p>
                  <p className="text-xs text-slate-400 mt-1">Drag and drop or click to browse</p>
                  <input type="file" name="photos" className="absolute inset-0 opacity-0 cursor-pointer" multiple />
                </label>

                {/* Photo grid — 4 slots matching OnboardingForm style */}
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <label key={i} className="aspect-square cursor-pointer group block">
                      <div className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                        photoUrls[i]
                          ? 'border-primary'
                          : 'border-slate-200 bg-slate-50 group-hover:border-primary group-hover:bg-primary/5'
                      }`}>
                        {photoUrls[i] ? (
                          <img src={photoUrls[i]!} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                            <span className="text-[9px] font-bold text-slate-300 group-hover:text-primary transition-colors uppercase tracking-wide">
                              Photo {i + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" className="sr-only" onChange={e => pickPhoto(i, e)} />
                    </label>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 mt-3">
                  Listings with at least 4 photos receive significantly more inquiries.
                </p>
              </section>
            )}
          </div>

          {/* ── Footer navigation ──────────────────────────────────────────── */}
          <div className="px-8 py-6 mt-4 border-t border-slate-100">
            <div className="flex gap-3">
              {/* Back / spacer */}
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
                <a
                  href="/provider-dashboard"
                  className="flex-1 py-3.5 rounded-full border border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Cancel
                </a>
              )}

              {/* Continue — steps 1–3 */}
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="flex-[2] py-3.5 rounded-full bg-primary text-dark font-bold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              )}

              {/* Final step — two submit actions */}
              {step === 4 && (
                <>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus('draft')}
                    disabled={isPending}
                    className="flex-1 py-3.5 rounded-full border-2 border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {isPending && submitStatus === 'draft' ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus('published')}
                    disabled={isPending}
                    className="flex-[2] py-3.5 rounded-full bg-primary text-dark font-bold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending && submitStatus === 'published'
                      ? 'Publishing…'
                      : (
                        <>
                          <Check size={16} strokeWidth={3} />
                          {isEditMode ? 'Update & Publish' : 'Publish Listing'}
                        </>
                      )
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="w-full max-w-2xl my-auto"
          onClick={e => e.stopPropagation()}
        >
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
}
