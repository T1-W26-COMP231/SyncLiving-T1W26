'use client';

import React, { useState, useActionState, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createListing } from '../../../app/dashboard/actions';
import AddressAutocomplete from './AddressAutocomplete';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import {
  FileText, MapPin, DollarSign, Home, Sparkles,
  ScrollText, Images, Check, ChevronLeft, ChevronRight,
  Camera, X, Tag, Plus, Lightbulb
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
    house_rules: string[];
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
  const supabase = createClient();
  const [state, formAction, isPending] = useActionState(createListing, null);
  const isEditMode = !!initialData;
  const [isUploading, setIsUploading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // ── Step state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [selectedRoomType,  setSelectedRoomType]  = useState(initialData?.room_type_id || roomTypes[0]?.id || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities_ids || []);
  const [submitStatus,      setSubmitStatus]      = useState<'draft' | 'published'>('draft');

  const [listingData, setListingData] = useState({
    title:      initialData?.title      || '',
    rental_fee: initialData?.rental_fee || '',
  });

  // House rules stored as individual clauses
  const [houseRules, setHouseRules] = useState<string[]>(
    initialData?.house_rules || []
  );
  const [houseRuleInput, setHouseRuleInput] = useState('');

  // Location from Google Maps autocomplete
  const [location, setLocation] = useState({
    fullAddress: initialData?.address    || '',
    city:        initialData?.city       || '',
    postalCode:  initialData?.postal_code || '',
    lat:         initialData?.lat        || null as number | null,
    lng:         initialData?.lng        || null as number | null,
  });

  // Photo state
  const [photoUrls,  setPhotoUrls]  = useState<string[]>(initialData?.photos || []);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAddressSelect = (address: string, city: string, postalCode: string, lat: number, lng: number) => {
    setLocation({ fullAddress: address, city, postalCode, lat, lng });
  };

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newUrls = newFiles.map(f => URL.createObjectURL(f));
      setPhotoUrls(prev => [...prev, ...newUrls]);
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    const urlToRemove = photoUrls[index];
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
    // Remove from files if it's a newly added file
    const isNewFile = photoFiles.some(f => URL.createObjectURL(f) === urlToRemove);
    if (isNewFile) {
      setPhotoFiles(prev => prev.filter(f => URL.createObjectURL(f) !== urlToRemove));
    }
  };

  const handleClose = () => {
    if (onClose) { onClose(); return; }
    router.push('/dashboard');
  };

  const handleFinalSubmit = async (status: 'draft' | 'published') => {
    setSubmitStatus(status);
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Upload new photos to Supabase Storage
      const finalUrls: string[] = [...photoUrls.filter(url => url.startsWith('http'))];
      
      for (const file of photoFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);
          finalUrls.push(publicUrl);
        } else {
          console.error('Upload error:', uploadError);
        }
      }

      // 2. Prepare FormData and submit
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        formData.set('status', status);
        formData.set('photos', JSON.stringify(finalUrls));
        // Remove manual description set, relying on the hidden input in the form
        
        startTransition(() => {
          formAction(formData);
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const formContent = (
    <>
      <Script
        id="google-maps"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
      />

      <form ref={formRef}>
        {/* Hidden inputs — always in DOM so FormData picks them up on submit */}
        {isEditMode && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="status"        value={submitStatus} />
        <input type="hidden" name="room_type_id"  value={selectedRoomType} />
        <input type="hidden" name="amenities_ids" value={JSON.stringify(selectedAmenities)} />
        <input type="hidden" name="city"          value={location.city} />
        <input type="hidden" name="postal_code"   value={location.postalCode} />
        <input type="hidden" name="lat"           value={location.lat ?? ''} />
        <input type="hidden" name="lng"           value={location.lng ?? ''} />
        <input type="hidden" name="address"       value={location.fullAddress} />
        <input type="hidden" name="photos"        value="" /> {/* This will be set manually in handleFinalSubmit */}
        
        {/* Persistent values for multi-step FormData collection */}
        <input type="hidden" name="title"         value={listingData.title} />
        <input type="hidden" name="rent"          value={listingData.rental_fee} />
        <input type="hidden" name="description"   value={JSON.stringify(houseRules)} />

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
            {/* Step 1, 2, 3 content remains the same... I will only show Step 4 replacement here */}
            {/* [REDACTED FOR BREVITY - Step 1-3 included in actual tool call] */}
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
                        value={listingData.title}
                        onChange={e => setListingData(p => ({ ...p, title: e.target.value }))}
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
                          value={listingData.rental_fee}
                          onChange={e => setListingData(p => ({ ...p, rental_fee: e.target.value }))}
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
                    defaultValue={location.fullAddress}
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
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all text-left ${
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
                          <span className="truncate">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

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
                          <div className={`shrink-0 size-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            active ? 'bg-primary border-primary' : 'border-slate-300'
                          }`}>
                            {active && <Check size={11} strokeWidth={4} className="text-dark" />}
                          </div>
                          {amenity.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section>
                <SectionLabel Icon={ScrollText} label="House Rules & Description" />

                {/* Clause list */}
                {houseRules.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {houseRules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-dark">
                        <span className="flex-1 leading-snug">{rule}</span>
                        <button
                          type="button"
                          onClick={() => setHouseRules(prev => prev.filter((_, idx) => idx !== i))}
                          className="shrink-0 text-slate-300 hover:text-red-400 transition-colors mt-0.5"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Input + add button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={houseRuleInput}
                    onChange={e => setHouseRuleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = houseRuleInput.trim();
                        if (trimmed) {
                          setHouseRules(prev => [...prev, trimmed]);
                          setHouseRuleInput('');
                        }
                      }
                    }}
                    placeholder="e.g. No smoking inside the unit"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = houseRuleInput.trim();
                      if (trimmed) {
                        setHouseRules(prev => [...prev, trimmed]);
                        setHouseRuleInput('');
                      }
                    }}
                    className="shrink-0 size-[46px] flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section>
                <SectionLabel Icon={Images} label="Property Photos" />
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {/* Dynamic Preview List */}
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square group">
                      <div className="w-full h-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 size-6 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}

                  {/* Add Photo Button (only show if < 8) */}
                  {photoUrls.length < 8 && (
                    <label className="aspect-square cursor-pointer group">
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                        <Plus size={24} className="text-slate-300 group-hover:text-primary transition-colors mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-primary">
                          Add Photo
                        </span>
                      </div>
                      <input type="file" accept="image/*" className="sr-only" multiple onChange={addPhotos} />
                    </label>
                  )}

                  {photoUrls.length === 0 && (
                    <div className="aspect-square rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center p-3 text-center">
                      <Lightbulb size={16} className="text-amber-400 mb-1.5" />
                      <span className="text-[10px] font-bold text-slate-500 leading-tight">
                        Photos attract 3x more tenants!
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Footer navigation ──────────────────────────────────────────── */}
          <div className="px-8 py-6 mt-4 border-t border-slate-100">
            <div className="flex gap-3">
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
                  className="flex-1 py-3.5 rounded-full border border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              )}

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

              {step === 4 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('draft')}
                    disabled={isPending || isUploading}
                    className="flex-1 py-3.5 rounded-full border-2 border-slate-200 text-dark font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {(isPending || isUploading) && submitStatus === 'draft' ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('published')}
                    disabled={isPending || isUploading}
                    className="flex-[2] py-3.5 rounded-full bg-primary text-dark font-bold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {(isPending || isUploading) && submitStatus === 'published'
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
