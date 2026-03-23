'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../../app/onboarding/actions';
import {
  Sun, Moon, Sparkles, Users, VolumeX, Heart, Ban, Star,
  Camera, Plus, X, Home, UserSearch,
  Check, ChevronLeft, ChevronRight, Search,
  User, MapPin, Calendar, SlidersHorizontal, FileText,
  DollarSign, MessageSquare, Tag, Images,
  Volume2, Clock, Shield, Lightbulb,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingFormProps {
  initialData?: any;
  isModal?: boolean;
  onClose?: () => void;
}

type HousingPurpose = 'find_roommate' | 'have_space';
type DimKey = 'social' | 'acoustic' | 'sanitary' | 'rhythm' | 'boundary';
type DimTags = Record<DimKey, string>;

// ─── FCRM Dimension Constants (from matchingAlgorithm.md) ────────────────────

const FCRM_DIMENSIONS: {
  key: DimKey;
  label: string;
  description: string;
  Icon: React.FC<any>;
  options: { tag: string; label: string; value: number }[];
}[] = [
  {
    key: 'social',
    label: 'Social Density',
    description: 'How often do you have guests over?',
    Icon: Users,
    options: [
      { tag: 'TheHermit',      label: '#TheHermit',      value: 0.1 },
      { tag: 'QuietLiving',    label: '#QuietLiving',    value: 0.3 },
      { tag: 'BalancedSocial', label: '#BalancedSocial', value: 0.5 },
      { tag: 'FrequentHost',   label: '#FrequentHost',   value: 0.7 },
      { tag: 'OpenHouse',      label: '#OpenHouse',      value: 0.9 },
    ],
  },
  {
    key: 'acoustic',
    label: 'Acoustic Environment',
    description: 'Typical noise level at home',
    Icon: Volume2,
    options: [
      { tag: 'LibraryZone', label: '#LibraryZone', value: 0.1 },
      { tag: 'QuietFocus',  label: '#QuietFocus',  value: 0.3 },
      { tag: 'AmbientLife', label: '#AmbientLife', value: 0.5 },
      { tag: 'VibrantHome', label: '#VibrantHome', value: 0.7 },
      { tag: 'HighDecibel', label: '#HighDecibel', value: 0.9 },
    ],
  },
  {
    key: 'sanitary',
    label: 'Sanitary Standards',
    description: 'Cleanliness & tidiness level',
    Icon: Sparkles,
    options: [
      { tag: 'ChaosLover',      label: '#ChaosLover',      value: 0.1 },
      { tag: 'LifeOverLaundry', label: '#LifeOverLaundry', value: 0.3 },
      { tag: 'AverageTidy',     label: '#AverageTidy',     value: 0.5 },
      { tag: 'PubliclyTidy',    label: '#PubliclyTidy',    value: 0.7 },
      { tag: 'Minimalist24_7',  label: '#Minimalist24/7',  value: 0.9 },
    ],
  },
  {
    key: 'rhythm',
    label: 'Circadian Rhythm',
    description: 'Sleep & daily activity schedule',
    Icon: Clock,
    options: [
      { tag: 'StrictEarlyBird', label: '#StrictEarlyBird', value: 0.1 },
      { tag: 'AM_Routine',      label: '#AM_Routine',      value: 0.3 },
      { tag: 'The9to5er',       label: '#The9to5er',       value: 0.5 },
      { tag: 'TheLateShifter',  label: '#TheLateShifter',  value: 0.7 },
      { tag: 'TrueNightOwl',    label: '#TrueNightOwl',    value: 0.9 },
    ],
  },
  {
    key: 'boundary',
    label: 'Boundary Philosophy',
    description: 'How you treat shared spaces & items',
    Icon: Shield,
    options: [
      { tag: 'StrictlyPrivate',    label: '#StrictlyPrivate',    value: 0.1 },
      { tag: 'RespectfulDistance', label: '#RespectfulDistance', value: 0.3 },
      { tag: 'Borrower',           label: '#Borrower',           value: 0.5 },
      { tag: 'SharedHousehold',    label: '#SharedHousehold',    value: 0.7 },
      { tag: 'CommunalLiving',     label: '#CommunalLiving',     value: 0.9 },
    ],
  },
];

// Tag → numeric value lookup (order matches v_wd / v_we: [social, acoustic, sanitary, rhythm, boundary])
const TAG_VALUES: Record<DimKey, Record<string, number>> = {
  social:   { TheHermit: 0.1, QuietLiving: 0.3, BalancedSocial: 0.5, FrequentHost: 0.7, OpenHouse: 0.9 },
  acoustic: { LibraryZone: 0.1, QuietFocus: 0.3, AmbientLife: 0.5, VibrantHome: 0.7, HighDecibel: 0.9 },
  sanitary: { ChaosLover: 0.1, LifeOverLaundry: 0.3, AverageTidy: 0.5, PubliclyTidy: 0.7, Minimalist24_7: 0.9 },
  rhythm:   { StrictEarlyBird: 0.1, AM_Routine: 0.3, The9to5er: 0.5, TheLateShifter: 0.7, TrueNightOwl: 0.9 },
  boundary: { StrictlyPrivate: 0.1, RespectfulDistance: 0.3, Borrower: 0.5, SharedHousehold: 0.7, CommunalLiving: 0.9 },
};

const DIM_ORDER: DimKey[] = ['social', 'acoustic', 'sanitary', 'rhythm', 'boundary'];

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
const purposeToRole = (_p: HousingPurpose): 'seeker' | 'provider' => 'seeker';

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
const buildVector = (tags: DimTags): number[] =>
  DIM_ORDER.map(dim => TAG_VALUES[dim][tags[dim]] ?? 0.5);

const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-dark';

// ─── Dual-range slider ────────────────────────────────────────────────────────

const thumbCls =
  'absolute w-full h-full appearance-none bg-transparent cursor-pointer ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md ' +
  '[&::-webkit-slider-thumb]:cursor-pointer ' +
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
          style={{ zIndex: valueMin >= valueMax - step ? 5 : 3 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
          className={thumbCls}
          style={{ zIndex: 4 }}
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
  Icon, label, optional,
}: {
  Icon: React.FC<any>; label: string; optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} className="text-primary shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {optional && (
        <span className="text-[10px] font-normal italic text-slate-400 normal-case tracking-normal">
          optional
        </span>
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
    gender:           initialData?.preferred_gender || 'Prefer not to say',
    location:         initialData?.location         || '',
    latitude:         initialLat                    as number | undefined,
    longitude:        initialLng                    as number | undefined,
    housingPurpose:  'find_roommate'                as HousingPurpose,
    budget_min:       initialData?.budget_min       || 800,
    budget_max:       initialData?.budget_max       || 2500,
    roommate_age_min: 18,
    roommate_age_max: 35,
    move_in_date:     initialData?.move_in_date     || '',
    bio:              '',
  });

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
  const [spacePhotoUrls,  setSpacePhotoUrls]  = useState<(string | null)[]>(Array(4).fill(null));

  useEffect(() => {
    setIncludeMySpace(hasSpacePurpose(formData.housingPurpose));
  }, [formData.housingPurpose]);

  // ── Photo state ─────────────────────────────────────────────────────────────
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [morePhotoUrls,   setMorePhotoUrls]   = useState<(string | null)[]>(Array(5).fill(null));

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

  const toggleSpaceVibe = (vibe: string) => {
    setSpaceVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleClose = () => {
    setVisible(false);
    if (onClose)  { onClose(); return; }
    if (isModal)  { router.back(); return; }
    router.push('/provider-dashboard');
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build FCRM prefixed lifestyle tags
      const wdTags = DIM_ORDER.filter(d => weekdayTags[d]).map(d => `wd:${d}:${weekdayTags[d]}`);
      const weTags = DIM_ORDER.filter(d => weekendTags[d]).map(d => `we:${d}:${weekendTags[d]}`);
      // Preserve binary preference tags from existing profile (managed in Settings)
      const binaryTags = (initialData?.lifestyle_tags || []).filter(
        (t: string) => ['Pet Friendly', 'Non-Smoker', 'LGBTQ+ Friendly'].includes(t)
      );
      const lifestyle_tags = [...wdTags, ...weTags, ...binaryTags];

      // Build numeric feature vectors for the FCRM engine
      const v_wd = buildVector(weekdayTags);
      const v_we = buildVector(weekendTags);

      const result = await updateProfile({
        full_name:        formData.full_name,
        age:              formData.age,
        location:         formData.location,
        longitude:        formData.longitude,
        latitude:         formData.latitude,
        role:             purposeToRole(formData.housingPurpose),
        lifestyle_tags,
        budget_min:       formData.budget_min,
        budget_max:       formData.budget_max,
        preferred_gender: formData.gender,
        move_in_date:     formData.move_in_date,
        v_wd,
        v_we,
      });

      if (result?.error) {
        alert('Error: ' + result.error);
      } else {
        if (onClose) { onClose(); return; }
        // Navigate to discovery page after profile completion
        router.push('/discovery');
      }
    } catch (err) {
      console.error('Submit error:', err);
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
                  <FieldLabel>Your Gender</FieldLabel>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                    className={inputCls}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <SectionLabel Icon={MapPin} label="Location" />
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
                    Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)}
                  </p>
                )}
              </div>
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
              <SectionLabel Icon={Calendar} label="Estimated Move-in Date" />
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
        {/* STEP 2 — Lifestyle Tags (FCRM 5-dimension system)              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <section>
              {/* 5 dimension cards */}
              <div className="space-y-4">
                {FCRM_DIMENSIONS.map(dim => {
                  const wdSelected = weekdayTags[dim.key];
                  const weSelected = weekendTags[dim.key];
                  const isDiff     = differentWeekend[dim.key];

                  return (
                    <div key={dim.key} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">

                      {/* Dimension header + weekend toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <dim.Icon size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-dark leading-none">{dim.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{dim.description}</p>
                          </div>
                        </div>
                        {/* "Differs on weekends?" toggle */}
                        <button
                          type="button"
                          onClick={() => toggleDifferentWeekend(dim.key)}
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
                            onClick={() => handleWeekdayTag(dim.key, opt.tag)}
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

                      {/* Weekend tags — only visible when toggle is on */}
                      {isDiff && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Weekend</p>
                          <div className="flex flex-wrap gap-2">
                            {dim.options.map(opt => (
                              <button
                                key={opt.tag}
                                type="button"
                                onClick={() =>
                                  setWeekendTags(prev => ({
                                    ...prev,
                                    [dim.key]: prev[dim.key] === opt.tag ? '' : opt.tag,
                                  }))
                                }
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
                        </div>
                      )}
                    </div>
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
              <SectionLabel Icon={User} label="Profile Photo" />
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
                  <div className="absolute bottom-0.5 right-0.5 bg-primary size-7 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <Plus size={12} className="text-dark" strokeWidth={3} />
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={pickProfilePhoto} />
                </label>
              </div>
            </section>

            {/* More photos */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <SectionLabel Icon={Images} label="More Photos" />
                <span className="text-[10px] font-medium text-slate-400 italic -mt-4">Add up to 5 more</span>
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
                <div className="aspect-square rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center p-3 text-center">
                  <Lightbulb size={16} className="text-amber-400 mb-1.5" />
                  <span className="text-[10px] font-bold text-slate-500 leading-tight">
                    Show your pet's best side!
                  </span>
                </div>
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
    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col border border-slate-100">
      {cardContent}
    </div>
  );
};

export default OnboardingForm;
