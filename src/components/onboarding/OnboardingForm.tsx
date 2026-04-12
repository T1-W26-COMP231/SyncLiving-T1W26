'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { updateProfile } from '../../../app/onboarding/actions';
import { createClient } from '@/utils/supabase/client';
import { validateAge, validateFullName, validateMoveInDate } from '@/utils/validation';
import AddressAutocomplete from '../dashboard/AddressAutocomplete';
import {
  Sun, Moon, Sparkles, Users, VolumeX, Heart, Ban, Star, Leaf,
  Camera, Plus, X, Home, UserSearch,
  Check, ChevronLeft, ChevronRight, Search,
  User, MapPin, Calendar, SlidersHorizontal, FileText,
  DollarSign, MessageSquare, Tag, Images,
  Volume2, Clock, Shield, Lightbulb,
} from 'lucide-react';
import { Database } from '@/types/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingFormProps {
  initialData?: any;
  isModal?: boolean;
  onClose?: () => void;
}

type HousingPurpose = 'find_roommate' | 'have_space';
type DimKey = 'social' | 'acoustic' | 'sanitary' | 'rhythm' | 'boundary';
type DimTags = Record<string, string>;

type DbDimension = Database['public']['Tables']['lifestyle_dimensions']['Row'];
type DbOption = Database['public']['Tables']['lifestyle_options']['Row'];

interface LifestyleDimension extends DbDimension {
  options: DbOption[];
}

// ─── Icon Mapping ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<any>> = {
  Users,
  Volume2,
  Sparkles,
  Clock,
  Shield,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIM_ORDER = ['social', 'acoustic', 'sanitary', 'rhythm', 'boundary'];

const HOUSING_OPTIONS: { value: HousingPurpose; label: string; desc: string; Icon: React.FC<any> }[] = [
  {
    value: 'find_roommate',
    label: 'Looking for a Roommate',
    desc:  "I need a compatible roommate — I don't have a space to show yet",
    Icon:  UserSearch,
  },
  {
    value: 'have_space',
    label: 'Space Available',
    desc:  'I live in a shared house and want to find the right housemate',
    Icon:  Home,
  },
];

const HOUSE_VIBE_OPTIONS: { label: string; Icon: React.FC<any> }[] = [
  { label: 'Quiet',            Icon: VolumeX  },
  { label: 'Social',           Icon: Users    },
  { label: 'Student-Friendly', Icon: Star     },
  { label: 'Pet-Friendly',     Icon: Heart    },
  { label: 'Clean & Tidy',     Icon: Sparkles },
  { label: 'Family-Friendly',  Icon: Home     },
];

const STEP_PERCENTS = [33, 66, 100];
const STEP_NAMES    = ['About You', 'Lifestyle', 'Photos'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasSpacePurpose = (p: HousingPurpose) => p === 'have_space';
const purposeToRole = (p: HousingPurpose): 'seeker' | 'provider' => p === 'have_space' ? 'provider' : 'seeker';

// Parse existing FCRM prefixed tags (e.g. "wd:social:BalancedSocial")
const parseFcrmTags = (tags: string[], prefix: 'wd' | 'we'): DimTags => {
  const result: Record<string, string> = {};
  (tags || []).forEach((tag: string) => {
    const m = tag.match(new RegExp(`^${prefix}:([^:]+):(.+)$`));
    if (m) result[m[1]] = m[2];
  });
  return {
    social:   result.social   || '',
    acoustic: result.acoustic || '',
    sanitary: result.sanitary || '',
    rhythm:   result.rhythm   || '',
    boundary: result.boundary || '',
  };
};

// Build numeric feature vector from selected tags (defaults to 0.5 if unset)
const buildVector = (tags: DimTags, dimensions: LifestyleDimension[]): number[] => {
  return DIM_ORDER.map(dimId => {
    const tagName = tags[dimId];
    if (!tagName) return 0.5;
    const dim = dimensions.find(d => d.id === dimId);
    const opt = dim?.options.find(o => o.tag === tagName);
    return opt ? Number(opt.value) : 0.5;
  });
};

const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-dark';

// ─── Dual-range slider ────────────────────────────────────────────────────────

// pointer-events-none on the track, pointer-events-auto only on the thumb
// — this prevents the top input from blocking the bottom input's thumb
const thumbCls =
  'absolute w-full h-full appearance-none bg-transparent pointer-events-none ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md ' +
  '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto ' +
  '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 ' +
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md ' +
  '[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent';

function DualRangeSlider({
  min, max, step, valueMin, valueMax, onChangeMin, onChangeMax, formatValue,
}: {
  min: number; max: number; step: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const fmt    = formatValue ?? String;
  const range  = max - min;
  const minPct = ((valueMin - min) / range) * 100;
  const maxPct = ((valueMax - min) / range) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-bold text-primary">{fmt(valueMin)}</span>
        <span className="text-xs text-slate-400">to</span>
        <span className="text-sm font-bold text-primary">{fmt(valueMax)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 bg-slate-200 rounded-full pointer-events-none" />
        <div
          className="absolute h-1.5 bg-primary rounded-full pointer-events-none"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMin}
          onChange={e => onChangeMin(Math.min(Number(e.target.value), valueMax - step))}
          className={thumbCls}
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
          className={thumbCls}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}+</span>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  Icon, label, optional, required,
}: {
  Icon: React.FC<any>; label: string; optional?: boolean; required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} className="text-primary shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {required && <span className="text-red-500 text-xs font-bold">*</span>}
      {optional && (
        <span className="text-[10px] font-normal italic text-slate-400 normal-case tracking-normal">
          optional
        </span>
      )}
    </div>
  );
}

function FieldLabel({ children, optional, required }: { children: React.ReactNode; optional?: boolean; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
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
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [lifestyleDimensions, setLifestyleDimensions] = useState<LifestyleDimension[]>([]);
  
  const morePhotosInputRef = useRef<HTMLInputElement>(null);

  // Fetch lifestyle dimensions from DB
  useEffect(() => {
    const fetchDimensions = async () => {
      const { data: dims, error } = await supabase
        .from('lifestyle_dimensions')
        .select(`
          *,
          options:lifestyle_options(*)
        `)
        .order('display_order');
      
      if (error) {
        console.error('Error fetching lifestyle dimensions:', error);
      } else if (dims) {
        setLifestyleDimensions(dims as LifestyleDimension[]);
      }
    };
    fetchDimensions();
  }, [supabase]);

  // Poll for google maps availability
  useEffect(() => {
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }, []);

  // Parse initial PostGIS / GeoJSON coordinates
  let initialLat: number | undefined = initialData?.latitude;
  let initialLng: number | undefined = initialData?.longitude;

  if (initialData?.location_coords) {
    const coords = initialData.location_coords as any;
    if (typeof coords === 'string') {
      // Handle WKT format: POINT(lng lat)
      const m = coords.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (m) { 
        initialLng = parseFloat(m[1]); 
        initialLat = parseFloat(m[2]); 
      }
    } else if (coords.coordinates && Array.isArray(coords.coordinates)) {
      // Handle GeoJSON format: [lng, lat]
      initialLng = coords.coordinates[0];
      initialLat = coords.coordinates[1];
    } else if (typeof coords.x === 'number' && typeof coords.y === 'number') {
      // Handle flat object format if applicable
      initialLng = coords.x;
      initialLat = coords.y;
    }
  }

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name:        initialData?.full_name        || '',
    age:              initialData?.age              || '',
    gender:           initialData?.preferred_gender || '',
    location:         initialData?.location         || '',
    latitude:         initialLat,
    longitude:        initialLng,
    housingPurpose:  (initialData?.role === 'provider' ? 'have_space' : 'find_roommate') as HousingPurpose,
    budget_min:       initialData?.budget_min       || 800,
    budget_max:       initialData?.budget_max       || 2500,
    roommate_age_min: initialData?.age_min ?? 18,
    roommate_age_max: initialData?.age_max ?? 35,
    move_in_date:     initialData?.move_in_date     || '',
    bio:              initialData?.bio              || '',
  });

  // ── Binary preference tags ───────────────────────────────────────────────────
  const BINARY_TAGS = ['Pet Allowed', 'Non-Smoker', 'LGBTQ+ Friendly', 'Vegan Friendly'] as const;
  const [binaryTags, setBinaryTags] = useState<string[]>(
    (initialData?.lifestyle_tags || []).filter((t: string) => BINARY_TAGS.includes(t as any))
  );
  const toggleBinaryTag = (tag: string) =>
    setBinaryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── FCRM lifestyle tags ──────────────────────────────────────────────────────
  const [weekdayTags, setWeekdayTags] = useState<DimTags>(
    parseFcrmTags(initialData?.lifestyle_tags, 'wd')
  );
  const [weekendTags, setWeekendTags] = useState<DimTags>(
    parseFcrmTags(initialData?.lifestyle_tags, 'we')
  );
  // Social and Circadian Rhythm default to "different on weekends" being open
  const [differentWeekend, setDifferentWeekend] = useState<Record<DimKey, boolean>>({
    social:   true,
    acoustic: false,
    sanitary: false,
    rhythm:   true,
    boundary: false,
  });

  const handleWeekdayTag = (dim: DimKey, tag: string) => {
    const next = weekdayTags[dim] === tag ? '' : tag;
    setWeekdayTags(prev => ({ ...prev, [dim]: next }));
    // Mirror to weekend when the toggle is off
    if (!differentWeekend[dim]) {
      setWeekendTags(prev => ({ ...prev, [dim]: next }));
    }
  };

  const toggleDifferentWeekend = (dim: DimKey) => {
    const opening = !differentWeekend[dim];
    setDifferentWeekend(prev => ({ ...prev, [dim]: opening }));
    // When closing, sync weekend back to weekday
    if (!opening) {
      setWeekendTags(prev => ({ ...prev, [dim]: weekdayTags[dim] }));
    }
  };

  // ── My Space state ──────────────────────────────────────────────────────────
  const [includeMySpace,  setIncludeMySpace]  = useState(false);
  const [spaceAddress,    setSpaceAddress]    = useState('');
  const [spaceRent,       setSpaceRent]       = useState('');
  const [spaceVibes,      setSpaceVibes]      = useState<string[]>([]);
  const [spaceNote,       setSpaceNote]       = useState('');

  useEffect(() => {
    setIncludeMySpace(hasSpacePurpose(formData.housingPurpose));
  }, [formData.housingPurpose]);

  // ── Photo state ─────────────────────────────────────────────────────────────
  const [profilePhotoUrl,  setProfilePhotoUrl]  = useState<string | null>(initialData?.avatar_url || null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [morePhotoUrls,    setMorePhotoUrls]    = useState<string[]>(initialData?.photos || []);
  const [morePhotoFiles,   setMorePhotoFiles]   = useState<File[]>([]);
  const [spacePhotoUrls,   setSpacePhotoUrls]   = useState<(string | null)[]>(Array(4).fill(null));
  const [spacePhotoFiles,  setSpacePhotoFiles]  = useState<(File | null)[]>(Array(4).fill(null));

  // ── Photo pickers ─────────────────────────────────────────────────────────────
  const pickProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoUrl(URL.createObjectURL(file));
    setProfilePhotoFile(file);
  };

  const pickSpacePhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSpacePhotoUrls(prev => { const next = [...prev]; next[index] = URL.createObjectURL(file); return next; });
    setSpacePhotoFiles(prev => { const next = [...prev]; next[index] = file; return next; });
  };

  const toggleSpaceVibe = (label: string) => {
    setSpaceVibes(prev => prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]);
  };

  const addMorePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newUrls = newFiles.map(f => URL.createObjectURL(f));
      setMorePhotoUrls(prev => [...prev, ...newUrls]);
      setMorePhotoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeMorePhoto = (index: number) => {
    setMorePhotoUrls(prev => prev.filter((_, i) => i !== index));
    // Important: we need to handle both newly added files and existing DB URLs
    // The number of files might be different from the number of URLs if some were pre-existing
    const urlToRemove = morePhotoUrls[index];
    const isNewFile = morePhotoFiles.some(f => URL.createObjectURL(f) === urlToRemove);
    if (isNewFile) {
      setMorePhotoFiles(prev => prev.filter(f => URL.createObjectURL(f) !== urlToRemove));
    }
  };

  const removeSpacePhoto = (index: number) => {
    setSpacePhotoUrls(prev => { const next = [...prev]; next[index] = null; return next; });
    setSpacePhotoFiles(prev => { const next = [...prev]; next[index] = null; return next; });
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (stepNum: number): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      const nameErr = validateFullName(formData.full_name);
      if (nameErr) errs.full_name = nameErr;

      const ageErr = validateAge(formData.age);
      if (ageErr) errs.age = ageErr;

      if (!formData.gender)
        errs.gender = 'Please select your gender.';
      if (!formData.location.trim())
        errs.location = 'Please enter and select your location.';

      const dateErr = validateMoveInDate(formData.move_in_date);
      if (dateErr) errs.move_in_date = dateErr;
    }

    if (stepNum === 2) {
      DIM_ORDER.forEach(dimStr => {
        const dim = dimStr as DimKey;
        if (!weekdayTags[dim])
          errs[`wd_${dim}`] = 'Please select an option.';
        if (differentWeekend[dim] && !weekendTags[dim])
          errs[`we_${dim}`] = 'Please select a weekend option.';
      });
    }

    if (stepNum === 3) {
      if (!profilePhotoUrl)
        errs.profile_photo = 'A profile photo is required.';
    }

    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleClose = () => {
    setVisible(false);
    if (onClose)  { onClose(); return; }
    if (isModal)  { router.back(); return; }
    router.push('/dashboard');
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validateStep(3);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Upload Profile Photo
      let finalAvatarUrl = initialData?.avatar_url || '';
      if (profilePhotoFile) {
        const fileExt = profilePhotoFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profilePhotoFile, { upsert: true });

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }

      // 2. Upload More Photos
      const finalMorePhotoUrls: string[] = [...morePhotoUrls.filter(url => url.startsWith('http'))];
      
      for (let i = 0; i < morePhotoFiles.length; i++) {
        const file = morePhotoFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
          finalMorePhotoUrls.push(publicUrl);
        }
      }

      // 3. Build FCRM prefixed lifestyle tags
      const wdTags = DIM_ORDER.filter(d => weekdayTags[d]).map(d => `wd:${d}:${weekdayTags[d]}`);
      const weTags = DIM_ORDER.filter(d => weekendTags[d]).map(d => `we:${d}:${weekendTags[d]}`);
      const lifestyle_tags = [...wdTags, ...weTags, ...binaryTags];

      // Build numeric feature vectors
      const v_wd = buildVector(weekdayTags, lifestyleDimensions);
      const v_we = buildVector(weekendTags, lifestyleDimensions);

      // Fallback geocoding: if the autocomplete didn't fire but location text exists,
      // resolve coordinates from the text so lat/lng are never saved as null.
      let submitLat = formData.latitude;
      let submitLng = formData.longitude;
      if ((!submitLat || !submitLng) && formData.location.trim()) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          const result = await geocoder.geocode({ address: formData.location });
          if (result.results[0]) {
            const loc = result.results[0].geometry.location;
            submitLat = loc.lat();
            submitLng = loc.lng();
          }
        } catch {
          // Geocoding failed — proceed without coordinates
        }
      }

      const result = await updateProfile({
        full_name:        formData.full_name,
        avatar_url:       finalAvatarUrl,
        bio:              formData.bio,
        photos:           finalMorePhotoUrls,
        age:              parseInt(String(formData.age)) || 0,
        location:         formData.location,
        longitude:        submitLng,
        latitude:         submitLat,
        role:             purposeToRole(formData.housingPurpose),
        lifestyle_tags,
        budget_min:       formData.budget_min,
        budget_max:       formData.budget_max,
        preferred_gender:  formData.gender,
        move_in_date:      formData.move_in_date,
        roommate_age_min:  formData.roommate_age_min,
        roommate_age_max:  formData.roommate_age_max,
        v_wd,
        v_we,
      });

      if (result?.error) {
        alert('Error: ' + result.error);
      } else {
        if (onClose) { onClose(); return; }
        router.push('/discovery');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert('An error occurred: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  // ── Shared card content ───────────────────────────────────────────────────────
  const cardContent = (
    <>
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
            {isModal && (
              <button
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
          {step === 1 && 'Help us find your perfect match by sharing a few details.'}
          {step === 2 && 'Tell us how you live — weekday and weekend can differ.'}
          {step === 3 && 'Help your matches get to know you. Profiles with photos get 3× more connections.'}
        </p>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className={`flex-1 px-8 pb-4 space-y-8 ${isModal ? 'overflow-y-auto' : ''}`}>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — About You                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Personal details */}
            <section>
              <SectionLabel Icon={User} label="Personal Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel required>Full Name</FieldLabel>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => { setFormData(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: '' })); }}
                    placeholder="Your full name"
                    className={`${inputCls} ${errors.full_name ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                  {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <input
                    type="number"
                    min={18} max={99}
                    value={formData.age}
                    placeholder="e.g. 25"
                    onChange={e => { setFormData(p => ({ ...p, age: e.target.value as any })); setErrors(p => ({ ...p, age: '' })); }}
                    className={`${inputCls} ${errors.age ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                </div>
                <div>
                  <FieldLabel>Your Gender</FieldLabel>
                  <select
                    value={formData.gender}
                    onChange={e => { setFormData(p => ({ ...p, gender: e.target.value })); setErrors(p => ({ ...p, gender: '' })); }}
                    className={`${inputCls} ${errors.gender ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  >
                    <option value="">Select gender…</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <SectionLabel Icon={MapPin} label="Location" required />
              {/* Only mount AddressAutocomplete once Google Maps is ready so initOnMount: true always works */}
              {!isGoogleLoaded && (
                <input
                  disabled
                  placeholder="Loading address service..."
                  className={inputCls + ' opacity-60'}
                />
              )}
              {isGoogleLoaded && <AddressAutocomplete
                defaultValue={formData.location}
                onAddressSelect={(address, _city, _zip, lat, lng) => {
                  setFormData(p => ({ ...p, location: address, latitude: lat, longitude: lng }));
                  setErrors(p => ({ ...p, location: '' }));
                }}
              />}
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              {formData.latitude && (
                <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
                  Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)}
                </p>
              )}
            </section>

            {/* Housing purpose */}
            <section>
              <SectionLabel Icon={UserSearch} label="What Describes You Best?" />
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
                        active ? 'bg-primary/20 text-dark' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${active ? 'text-dark' : 'text-slate-700'}`}>{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
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

            {/* Roommate preferences */}
            <section>
              <SectionLabel Icon={SlidersHorizontal} label="Roommate Preferences" />
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Monthly Budget</p>
                  <DualRangeSlider
                    min={500} max={5000} step={100}
                    valueMin={formData.budget_min}
                    valueMax={formData.budget_max}
                    onChangeMin={v => setFormData(p => ({ ...p, budget_min: v }))}
                    onChangeMax={v => setFormData(p => ({ ...p, budget_max: v }))}
                    formatValue={v => `$${v.toLocaleString()}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Roommate Age Range</p>
                  <DualRangeSlider
                    min={18} max={70} step={1}
                    valueMin={formData.roommate_age_min}
                    valueMax={formData.roommate_age_max}
                    onChangeMin={v => setFormData(p => ({ ...p, roommate_age_min: v }))}
                    onChangeMax={v => setFormData(p => ({ ...p, roommate_age_max: v }))}
                    formatValue={v => `${v} yrs`}
                  />
                </div>
              </div>
            </section>

            {/* Move-in date */}
            <section>
              <SectionLabel Icon={Calendar} label="Estimated Move-in Date" required />
              <input
                type="date"
                value={formData.move_in_date}
                onChange={e => { setFormData(p => ({ ...p, move_in_date: e.target.value })); setErrors(p => ({ ...p, move_in_date: '' })); }}
                className={`${inputCls} ${errors.move_in_date ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              />
              {errors.move_in_date && <p className="text-xs text-red-500 mt-1">{errors.move_in_date}</p>}
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Lifestyle Tags (FCRM 5-dimension system)              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <section>
              {/* 5 dimension cards */}
              <div className="space-y-4">
                {lifestyleDimensions.map(dim => {
                  const dimKey = dim.id as DimKey;
                  const wdSelected = weekdayTags[dimKey];
                  const weSelected = weekendTags[dimKey];
                  const isDiff     = differentWeekend[dimKey];
                  const IconComp   = ICON_MAP[dim.icon_name || 'Users'] || Users;

                  return (
                    <div key={dim.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">

                      {/* Dimension header + weekend toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComp size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-dark leading-none">{dim.label}<span className="ml-0.5 text-red-500">*</span></p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{dim.description}</p>
                          </div>
                        </div>
                        {/* "Differs on weekends?" toggle */}
                        <button
                          type="button"
                          onClick={() => toggleDifferentWeekend(dimKey)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
                            isDiff
                              ? 'border-primary bg-primary/10 text-dark'
                              : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className={`size-3.5 rounded-full flex-shrink-0 transition-colors ${isDiff ? 'bg-primary' : 'bg-slate-200'}`} />
                          Differs on weekends
                        </button>
                      </div>

                      {/* Weekday tags */}
                      {isDiff && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Weekday</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {dim.options.map(opt => (
                          <button
                            key={opt.tag}
                            type="button"
                            onClick={() => { handleWeekdayTag(dimKey, opt.tag); setErrors(p => ({ ...p, [`wd_${dim.id}`]: '' })); }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              wdSelected === opt.tag
                                ? 'bg-primary border-primary text-dark'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-dark'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {errors[`wd_${dim.id}`] && (
                        <p className="text-xs text-red-500 mt-2">{errors[`wd_${dim.id}`]}</p>
                      )}

                      {/* Weekend tags — only visible when toggle is on */}
                      {isDiff && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Weekend</p>
                          <div className="flex flex-wrap gap-2">
                            {dim.options.map(opt => (
                              <button
                                key={opt.tag}
                                type="button"
                                onClick={() => {
                                  setWeekendTags(prev => ({
                                    ...prev,
                                    [dimKey]: prev[dimKey] === opt.tag ? '' : opt.tag,
                                  }));
                                  setErrors(p => ({ ...p, [`we_${dim.id}`]: '' }));
                                }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  weSelected === opt.tag
                                    ? 'bg-primary border-primary text-dark'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-dark'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {errors[`we_${dim.id}`] && (
                            <p className="text-xs text-red-500 mt-2">{errors[`we_${dim.id}`]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionLabel Icon={Tag} label="Additional" optional />
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: 'Pet Allowed',     Icon: Heart, label: 'Pet Allowed'     },
                  { tag: 'Non-Smoker',      Icon: Ban,   label: 'Non-Smoker'      },
                  { tag: 'LGBTQ+ Friendly', Icon: Star,  label: 'LGBTQ+ Friendly' },
                  { tag: 'Vegan Friendly',  Icon: Leaf,  label: 'Vegan Friendly'  },
                ].map(({ tag, Icon, label }) => {
                  const active = binaryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleBinaryTag(tag)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-primary border-primary text-dark'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-dark'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionLabel Icon={FileText} label="Describe Yourself" optional />
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
            {/* Profile photo */}
            <section>
              <SectionLabel Icon={User} label="Profile Photo" required />
              <div className="flex flex-col items-center gap-2">
                <label className="relative group cursor-pointer">
                  <div className={`w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                    profilePhotoUrl
                      ? 'border-primary'
                      : errors.profile_photo
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-300 bg-slate-50 group-hover:border-primary group-hover:bg-primary/5'
                  }`}>
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className={`${errors.profile_photo ? 'text-red-400' : 'text-slate-400 group-hover:text-primary'} transition-colors mb-1`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${errors.profile_photo ? 'text-red-400' : 'text-slate-400 group-hover:text-primary'}`}>
                          Add Photo
                        </span>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 bg-primary size-7 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <Plus size={12} className="text-dark" strokeWidth={3} />
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { pickProfilePhoto(e); setErrors(p => ({ ...p, profile_photo: '' })); }} />
                </label>
                {errors.profile_photo && <p className="text-xs text-red-500">{errors.profile_photo}</p>}
              </div>
            </section>

            {/* More photos */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <SectionLabel Icon={Images} label="More Photos" />
                <span className="text-[10px] font-medium text-slate-400 italic -mt-4">Add up to 5 more</span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* Dynamic Preview List */}
                {morePhotoUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square group">
                    <div className="w-full h-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMorePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 size-6 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button (only show if < 5) */}
                {morePhotoUrls.length < 5 && (
                  <label className="aspect-square cursor-pointer group">
                    <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                      <Plus size={24} className="text-slate-300 group-hover:text-primary transition-colors mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-primary">
                        Add Photo
                      </span>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" multiple onChange={addMorePhotos} />
                  </label>
                )}

                {morePhotoUrls.length === 0 && (
                  <div className="aspect-square rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center p-3 text-center">
                    <Lightbulb size={16} className="text-amber-400 mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500 leading-tight">
                      Photos help you stand out!
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* My Space toggle + details */}
            <section>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-xl bg-primary/10">
                    <Home size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">Include My Living Space</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {hasSpacePurpose(formData.housingPurpose)
                        ? 'Recommended — let potential housemates see your space'
                        : 'Optionally show others your current living environment'}
                    </p>
                  </div>
                  <input 
                    ref={morePhotosInputRef}
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={addMorePhotos}
                  />
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeMySpace}
                  onClick={() => setIncludeMySpace(v => !v)}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                    includeMySpace ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      includeMySpace ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {includeMySpace && (
                <div className="mt-4 space-y-5 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                  {/* Space photos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera size={13} className="text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Space Photos</span>
                      <span className="text-[10px] italic text-slate-400">Up to 4 — common areas, room, etc.</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <label key={i} className="aspect-square cursor-pointer group block">
                          <div className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                            spacePhotoUrls[i]
                              ? 'border-primary'
                              : 'border-slate-200 bg-white group-hover:border-primary group-hover:bg-primary/5'
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

                  {/* Address */}
                  <div>
                    <FieldLabel>Address</FieldLabel>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={spaceAddress}
                        onChange={e => setSpaceAddress(e.target.value)}
                        placeholder="Street address or general area"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  {/* Monthly rent */}
                  <div>
                    <FieldLabel>Monthly Rent (per person)</FieldLabel>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="number"
                        value={spaceRent}
                        onChange={e => setSpaceRent(e.target.value)}
                        placeholder="e.g. 1200"
                        min={0}
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  {/* House vibe tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={13} className="text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">House Vibe</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {HOUSE_VIBE_OPTIONS.map(({ label, Icon }) => {
                        const active = spaceVibes.includes(label);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleSpaceVibe(label)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                              active
                                ? 'border-primary bg-primary/10 text-dark'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-primary/40'
                            }`}
                          >
                            <Icon size={12} className={active ? 'text-primary' : 'text-slate-400'} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note to seekers */}
                  <div>
                    <FieldLabel optional>Note to Interested Seekers</FieldLabel>
                    <div className="relative">
                      <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                      <textarea
                        value={spaceNote}
                        onChange={e => setSpaceNote(e.target.value)}
                        rows={3}
                        placeholder="e.g. I'm a tenant — contact me to arrange a viewing and I'll connect you with the landlord."
                        className={`${inputCls} resize-none pl-10`}
                      />
                    </div>
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
              {isModal ? 'Cancel' : 'Back to Dashboard'}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
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
                  Complete Profile
                  <Check size={16} strokeWidth={3} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );

  // ── Page vs Modal render ──────────────────────────────────────────────────────
  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 my-auto"
          onClick={e => e.stopPropagation()}
        >
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        id="google-maps"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
      />
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col border border-slate-100">
        {cardContent}
      </div>
    </>
  );
};

export default OnboardingForm;
