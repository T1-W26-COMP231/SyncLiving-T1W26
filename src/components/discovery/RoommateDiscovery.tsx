'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, UserCircle, UserCircle2, ChevronDown, Check, Heart, UserSearch, Map, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import type { MatchedProfile } from '../../../app/discovery/actions';
import { toggleSavedProfile } from '../../../app/discovery/saved-actions';
import { sendMatchRequest } from '../../../app/discovery/actions';
import { startOrGetConversation } from '../../../app/messages/actions';
import { createClient } from '@/utils/supabase/client';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKey = 'roommate' | 'roommate_with_room' | 'room' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',                label: 'All'                },
  { key: 'roommate',           label: 'Roommate'           },
  { key: 'roommate_with_room', label: 'Roommate with Room' },
  { key: 'room',               label: 'Room'               },
];

function defaultFilters(role: string | null): FilterKey[] {
  if (role === 'provider') return ['roommate'];
  return ['all'];
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Filter logic ─────────────────────────────────────────────────────────────
function applyFilters(
  matches: MatchedProfile[],
  active: FilterKey[],
  savedIds: Set<string>,
  showSaved: boolean,
  activeTagFilters: string[],
  userPreferredGender: string | null,
  // Advanced numeric filters
  filterAgeMin: number | null,
  filterAgeMax: number | null,
  filterBudgetMin: number | null,
  filterBudgetMax: number | null,
  filterMaxDist: number | null,
  userLat: number | null,
  userLng: number | null,
  showIncompatible: boolean,
): MatchedProfile[] {
  let result = active.includes('all')
    ? matches
    : matches.filter(p => {
        if (active.includes('roommate') && p.role === 'seeker') return true;
        if (active.includes('roommate_with_room') && p.role === 'provider') return true;
        if (active.includes('room') && p.role === 'provider') return true;
        return false;
      });

  // Tag / gender filters
  if (activeTagFilters.length > 0) {
    result = result.filter(p => {
      for (const tag of activeTagFilters) {
        if (tag === '__same_gender__') {
          if (
            p.preferred_gender &&
            p.preferred_gender !== 'Prefer not to say' &&
            p.preferred_gender !== userPreferredGender
          ) return false;
        } else {
          if (!p.lifestyle_tags.includes(tag)) return false;
        }
      }
      return true;
    });
  }

  // Age range filter
  if (filterAgeMin !== null && filterAgeMax !== null) {
    result = result.filter(p => {
      if (p.age === null) return true; // keep unset ages
      return p.age >= filterAgeMin && p.age <= filterAgeMax;
    });
  }

  // Budget overlap filter
  if (filterBudgetMin !== null && filterBudgetMax !== null) {
    result = result.filter(p => {
      if (p.budget_min === null && p.budget_max === null) return true;
      const cMin = p.budget_min ?? 0;
      const cMax = p.budget_max ?? 999999;
      // Ranges overlap when: candidate_min <= filter_max AND candidate_max >= filter_min
      return cMin <= filterBudgetMax && cMax >= filterBudgetMin;
    });
  }

  // Distance filter — exclude profiles without coords when filter is active
  if (filterMaxDist !== null && userLat !== null && userLng !== null) {
    result = result.filter(p => {
      if (p.lat === null || p.lng === null) return false;
      return haversineKm(userLat, userLng, p.lat, p.lng) <= filterMaxDist;
    });
  }

  // Hide incompatible tier unless user explicitly enables it
  if (!showIncompatible) {
    result = result.filter(p => p.tier !== 'incompatible');
  }

  if (showSaved) return result.filter(p => savedIds.has(p.id));
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BINARY_TAGS = ['Pet Allowed', 'Non-Smoker', 'LGBTQ+ Friendly', 'Vegan Friendly'];
function getBinaryTags(tags: string[]): string[] {
  return tags.filter(t => BINARY_TAGS.includes(t));
}

function tierLabel(tier: MatchedProfile['tier']): string {
  switch (tier) {
    case 'strong':       return 'Strong Match';
    case 'good':         return 'Good Match';
    case 'borderline':   return 'Weak Match';
    case 'incompatible': return 'Poor Match';
    default:             return 'Neutral Match';
  }
}

function conflictHint(type: string): string {
  switch (type) {
    case 'Social Density':                          return 'May differ on guest habits';
    case 'Acoustic Environment':                    return 'May differ on noise levels';
    case 'Sanitary Standards':                      return 'May differ on cleanliness';
    case 'Circadian Rhythm (Resource Bottleneck)':  return 'May have similar daily schedules';
    case 'Circadian Rhythm (Extreme Mismatch)':     return 'May have opposite sleep schedules';
    case 'Boundary Philosophy':                     return 'May differ on shared space boundaries';
    case 'Weekend Lifestyle Divergence':            return 'May differ on weekend lifestyle';
    default:                                        return type;
  }
}

function tierBadgeClass(tier: MatchedProfile['tier']): string {
  switch (tier) {
    case 'strong':       return 'bg-primary text-dark';
    case 'good':         return 'bg-emerald-100 text-emerald-800';
    case 'borderline':   return 'bg-amber-100 text-amber-800';
    case 'incompatible': return 'bg-red-100 text-red-700';
    default:             return 'bg-slate-100 text-slate-700';
  }
}

const QUICK_FILTER_TAGS = [
  { tag: 'Pet Allowed',     label: 'Pet Allowed'     },
  { tag: 'Non-Smoker',      label: 'Non-Smoker'      },
  { tag: 'LGBTQ+ Friendly', label: 'LGBTQ+ Friendly' },
  { tag: 'Vegan Friendly',  label: 'Vegan Friendly'  },
  { tag: '__same_gender__', label: 'Same Gender'     },
];

// ─── Inline dual-range slider (session filters only, no profile mutation) ─────
interface DualSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

function DualRangeSlider({ min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax }: DualSliderProps) {
  const thumbCls =
    'absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none ' +
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 ' +
    '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dark [&::-webkit-slider-thumb]:border-2 ' +
    '[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto ' +
    '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full ' +
    '[&::-moz-range-thumb]:bg-dark [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-solid';

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="relative h-5 flex items-center">
      {/* Track */}
      <div className="absolute left-0 right-0 h-1 rounded bg-slate-200">
        <div
          className="absolute h-1 bg-primary rounded"
          style={{ left: `${pct(valueMin)}%`, right: `${100 - pct(valueMax)}%` }}
        />
      </div>
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
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  matches: MatchedProfile[];
  userRole: string | null;
  preferredTagNames: string[];
  userBinaryPrefs: string[];
  userPreferredGender: string | null;
  prefAgeMin: number | null;
  prefAgeMax: number | null;
  prefBudgetMin: number | null;
  prefBudgetMax: number | null;
  prefLat: number | null;
  prefLng: number | null;
  prefMaxDistance: number | null;
  prefReferenceLocation: string | null;
  bufferKm: number | null;
  userAmenityNames: string[];
  userRoomTypeNames: string[];
  error: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
const RoommateDiscovery: React.FC<Props> = ({
  matches,
  userRole,
  preferredTagNames,
  userBinaryPrefs,
  userPreferredGender,
  prefAgeMin,
  prefAgeMax,
  prefBudgetMin,
  prefBudgetMax,
  prefLat,
  prefLng,
  prefMaxDistance,
  prefReferenceLocation,
  bufferKm,
  userAmenityNames,
  userRoomTypeNames,
  error,
}) => {
  const router = useRouter();

  // ── Type / tag filters ──────────────────────────────────────────────────────
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>(() => defaultFilters(userRole));
  const [showSaved, setShowSaved] = useState(false);
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(matches.filter(m => m.isSaved).map(m => m.id))
  );
  const [localRequestStatuses, setLocalRequestStatuses] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Edit profile modal ──────────────────────────────────────────────────────
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>(null);

  async function handleEditProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, bio, age, preferred_gender, location, lat, lng, location_coords, role, budget_min, budget_max, move_in_date, age_min, age_max, lifestyle_tags, pref_budget_min, pref_budget_max, pref_lat, pref_lng, pref_max_distance, pref_reference_location')
      .eq('id', user.id)
      .single();
    if (profile) {
      setEditProfileData({ ...profile, latitude: profile.lat, longitude: profile.lng });
      setShowEditProfile(true);
    }
  }

  // ── Advanced filter panel ───────────────────────────────────────────────────
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Session-local overrides — initialized from the user's saved preferences.
  // These never call any server action, so the profile is never mutated here.
  const [filterAgeMin,    setFilterAgeMin]    = useState<number>(prefAgeMin    ?? 18);
  const [filterAgeMax,    setFilterAgeMax]    = useState<number>(prefAgeMax    ?? 60);
  const [filterBudgetMin, setFilterBudgetMin] = useState<number>(prefBudgetMin ?? 500);
  const [filterBudgetMax, setFilterBudgetMax] = useState<number>(prefBudgetMax ?? 3000);
  const [filterMaxDist,   setFilterMaxDist]   = useState<number>(prefMaxDistance ?? 25);

  // Whether the numeric filters are actually enabled (user may have no prefs set)
  const [ageFilterOn,    setAgeFilterOn]    = useState(prefAgeMin    !== null || prefAgeMax    !== null);
  const [budgetFilterOn, setBudgetFilterOn] = useState(prefBudgetMin !== null || prefBudgetMax !== null);
  const [distFilterOn,   setDistFilterOn]   = useState(prefLat !== null && prefLng !== null && prefMaxDistance !== null);

  // Click-outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Filter helpers ──────────────────────────────────────────────────────────
  function toggleFilter(key: FilterKey) {
    if (key === 'all') { setActiveFilters(['all']); return; }
    setActiveFilters(prev => {
      const withoutAll = prev.filter(f => f !== 'all');
      const next = withoutAll.includes(key)
        ? withoutAll.filter(f => f !== key)
        : [...withoutAll, key];
      return next.length === 0 ? ['all'] : next;
    });
  }

  const [connectingId, setConnectingId] = useState<string | null>(null);

  async function handleConnect(targetUserId: string) {
    setConnectingId(targetUserId);
    try {
      const result = await sendMatchRequest(targetUserId);
      if (result.error) {
        alert('Could not send match request: ' + result.error);
        return;
      }
      setLocalRequestStatuses(prev => ({ ...prev, [targetUserId]: 'pending' }));
    } finally {
      setConnectingId(null);
    }
  }

  function handleHeartClick(id: string) {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    startTransition(async () => { await toggleSavedProfile(id); });
  }

  function resetAdvancedFilters() {
    setFilterAgeMin(prefAgeMin    ?? 18);
    setFilterAgeMax(prefAgeMax    ?? 60);
    setFilterBudgetMin(prefBudgetMin ?? 500);
    setFilterBudgetMax(prefBudgetMax ?? 3000);
    setFilterMaxDist(prefMaxDistance ?? 25);
    setAgeFilterOn(prefAgeMin !== null || prefAgeMax !== null);
    setBudgetFilterOn(prefBudgetMin !== null || prefBudgetMax !== null);
    setDistFilterOn(prefLat !== null && prefLng !== null && prefMaxDistance !== null);
  }

  // ── Quick-filter chip visibility ────────────────────────────────────────────
  const normalize = (t: string) => t.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const normalizedBinaryPrefs = userBinaryPrefs.map(normalize);
  const availableQuickFilters = QUICK_FILTER_TAGS.filter(({ tag }) => {
    if (tag === '__same_gender__') return normalizedBinaryPrefs.includes('samegenderonly');
    return normalizedBinaryPrefs.includes(normalize(tag));
  });

  function toggleTagFilter(tag: string) {
    setActiveTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  // ── Apply all filters ───────────────────────────────────────────────────────
  const visibleMatches = applyFilters(
    matches,
    activeFilters,
    savedIds,
    showSaved,
    activeTagFilters,
    userPreferredGender,
    ageFilterOn    ? filterAgeMin    : null,
    ageFilterOn    ? filterAgeMax    : null,
    budgetFilterOn ? filterBudgetMin : null,
    budgetFilterOn ? filterBudgetMax : null,
    distFilterOn   ? filterMaxDist   : null,
    prefLat,
    prefLng,
    showIncompatible,
  );

  // Detect when the user is viewing Room results only — age filter is irrelevant for rooms
  const isRoomView = activeFilters.length === 1 && activeFilters[0] === 'room';

  // Auto-disable age filter when switching to Room view
  useEffect(() => {
    if (isRoomView) setAgeFilterOn(false);
  }, [isRoomView]);

  // Count how many advanced filters are active
  const activeAdvancedCount = [ageFilterOn, budgetFilterOn, distFilterOn].filter(Boolean).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Navbar activeTab="Discovery" />

      <main className="max-w-7xl mx-auto w-full px-6 py-8">

        {/* Hero */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-dark tracking-tight">Find your perfect match</h1>
            <p className="text-slate-500 font-medium mt-1">Personalized roommate recommendations based on your lifestyle.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all shadow-sm ${
                showAdvancedFilters || activeAdvancedCount > 0
                  ? 'bg-primary/15 border-primary/50 text-dark'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              Advanced Filters
              {activeAdvancedCount > 0 && (
                <span className="size-5 flex items-center justify-center rounded-full bg-primary text-dark text-[10px] font-bold">
                  {activeAdvancedCount}
                </span>
              )}
            </button>
            <button
              onClick={handleEditProfile}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark rounded-full text-sm font-bold shadow-sm hover:brightness-105 transition-all"
            >
              <UserCircle size={16} />
              Edit Your Profile
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ─────────────────────────────────────────── */}
        {showAdvancedFilters && (
          <div className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-bold text-dark text-sm">Advanced Filters</span>
                <span className="ml-2 text-xs text-slate-400 font-normal">Session only — won't change your saved preferences</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetAdvancedFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline underline-offset-2"
                >
                  Reset to preferences
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="size-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Distance filter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Max Distance
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={distFilterOn}
                      onChange={e => setDistFilterOn(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    Enable
                  </label>
                </div>
                {prefReferenceLocation && (
                  <p className="text-[11px] text-slate-400 mb-2 truncate">Near: {prefReferenceLocation}</p>
                )}
                {!prefReferenceLocation && distFilterOn && (
                  <p className="text-[11px] text-amber-500 mb-2">Set a reference location in Settings first</p>
                )}
                <input
                  type="range" min={1} max={bufferKm ?? 100} step={1} value={filterMaxDist}
                  onChange={e => setFilterMaxDist(Number(e.target.value))}
                  disabled={!distFilterOn}
                  className="w-full accent-primary disabled:opacity-40"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>1 km</span>
                  <span className="font-semibold text-slate-600">{filterMaxDist} km</span>
                  <span>{bufferKm ?? 100} km</span>
                </div>
              </div>

              {/* Age range filter — hidden in Room view */}
              {!isRoomView ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Age Range
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ageFilterOn}
                        onChange={e => setAgeFilterOn(e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      Enable
                    </label>
                  </div>
                  <div className={`transition-opacity ${ageFilterOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <DualRangeSlider
                      min={18} max={80}
                      valueMin={filterAgeMin} valueMax={filterAgeMax}
                      onChangeMin={setFilterAgeMin} onChangeMax={setFilterAgeMax}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>18</span>
                      <span className="font-semibold text-slate-600">{filterAgeMin} – {filterAgeMax} yrs</span>
                      <span>80</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Room preferences summary shown instead of age filter */
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Your Room Preferences</p>
                  {userRoomTypeNames.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] text-slate-400 mb-1">Room types</p>
                      <div className="flex flex-wrap gap-1">
                        {userRoomTypeNames.map(name => (
                          <span key={name} className="px-2 py-0.5 rounded-full bg-primary/15 text-dark text-[11px] font-semibold border border-primary/30">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userAmenityNames.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {userAmenityNames.map(name => (
                          <span key={name} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userRoomTypeNames.length === 0 && userAmenityNames.length === 0 && (
                    <p className="text-[11px] text-slate-400">No room preferences saved — set them in Settings.</p>
                  )}
                </div>
              )}

              {/* Budget range filter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Budget Range
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={budgetFilterOn}
                      onChange={e => setBudgetFilterOn(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    Enable
                  </label>
                </div>
                <div className={`transition-opacity ${budgetFilterOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <DualRangeSlider
                    min={0} max={5000} step={50}
                    valueMin={filterBudgetMin} valueMax={filterBudgetMax}
                    onChangeMin={setFilterBudgetMin} onChangeMax={setFilterBudgetMax}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>$0</span>
                    <span className="font-semibold text-slate-600">${filterBudgetMin} – ${filterBudgetMax}/mo</span>
                    <span>$5000</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error === 'Not authenticated'
              ? 'Please log in to see your matches.'
              : error === 'Could not load your profile'
              ? 'Complete your onboarding to get personalized matches.'
              : error}
          </div>
        )}

        {/* Match count summary */}
        {!error && (
          <p className="text-sm text-slate-500 mb-6 font-medium">
            {visibleMatches.length === 0
              ? 'No matches found yet — make sure your lifestyle preferences are saved.'
              : `${visibleMatches.length} match${visibleMatches.length !== 1 ? 'es' : ''} found`}
          </p>
        )}

        {/* Filter row: type dropdown + saved toggle + quick-filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div ref={dropdownRef} className="relative inline-block">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:border-primary transition-all shadow-sm"
            >
              Show:{' '}
              <span className="text-dark font-bold">
                {activeFilters.includes('all')
                  ? 'All'
                  : FILTERS.filter(f => f.key !== 'all' && activeFilters.includes(f.key))
                      .map(f => f.label)
                      .join(', ')}
              </span>
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                {FILTERS.map(f => {
                  const isActive = activeFilters.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => { toggleFilter(f.key); if (f.key === 'all') setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-semibold text-dark' : ''}>{f.label}</span>
                      {isActive && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved toggle */}
          <button
            onClick={() => setShowSaved(s => !s)}
            title={showSaved ? 'Showing saved only' : 'Show saved only'}
            className={`size-9 flex items-center justify-center rounded-full border transition-all shadow-sm ${
              showSaved ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:border-red-300'
            }`}
          >
            <Heart size={16} className={showSaved ? 'text-red-500 fill-red-500' : 'text-slate-400'} />
          </button>

          {/* Incompatible toggle — hidden in Room view */}
          {!isRoomView && (
            <button
              onClick={() => setShowIncompatible(s => !s)}
              title={showIncompatible ? 'Hiding incompatible matches' : 'Show incompatible matches'}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                showIncompatible
                  ? 'bg-slate-200 border-slate-400 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
              }`}
            >
              {showIncompatible ? '✓ Incompatible' : 'Show Incompatible'}
            </button>
          )}

          {/* Quick-filter chips — hidden in Room view */}
          {!isRoomView && availableQuickFilters.length > 0 && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              {availableQuickFilters.map(({ tag, label }) => {
                const isActive = activeTagFilters.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                      isActive
                        ? 'bg-primary/20 border-primary/50 text-dark'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'
                    }`}
                  >
                    {isActive && <span className="mr-1">✓</span>}
                    {label}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Roommate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {visibleMatches.map(person => {
            const binaryTags = getBinaryTags(person.lifestyle_tags);
            const budgetLabel = person.budget_min && person.budget_max
              ? `$${person.budget_min}–$${person.budget_max}`
              : person.budget_max
              ? `Up to $${person.budget_max}`
              : null;

            return (
              <div key={person.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-all duration-300">

                {/* Avatar / Photo area */}
                <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.full_name ?? 'Profile'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <UserCircle2 size={80} className="text-slate-300" />
                  )}

                  {/* Favourite button */}
                  <button
                    onClick={() => handleHeartClick(person.id)}
                    className="absolute top-3 right-3 size-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full transition-colors shadow-sm"
                  >
                    <Heart
                      size={18}
                      className={savedIds.has(person.id) ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-400'}
                    />
                  </button>

                  {/* Score badge */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${tierBadgeClass(person.tier)}`}>
                      {person.score}% {tierLabel(person.tier)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-dark">{person.full_name ?? 'Anonymous'}</h3>
                      <p className="text-sm text-slate-500">
                        {person.location ?? (person.role === 'provider' ? 'Provider' : 'Seeker')}
                      </p>
                    </div>
                    {budgetLabel && (
                      <span className="text-primary font-bold text-base">
                        {budgetLabel}<span className="text-xs text-slate-400 font-normal">/mo</span>
                      </span>
                    )}
                  </div>

                  {/* Bio snippet */}
                  {person.bio && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{person.bio}</p>
                  )}

                  {/* Binary lifestyle tags */}
                  {binaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-3">
                      {binaryTags.map(tag => {
                        const isHighlighted = (person.highlightedTags ?? []).includes(tag);
                        return (
                          <span
                            key={tag}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isHighlighted
                                ? 'bg-primary/20 text-dark border border-primary/40'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isHighlighted && <span className="mr-1">✓</span>}
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Conflict triggers */}
                  {person.conflicts.length > 0 && (
                    <div className="mt-2 mb-1 flex flex-wrap gap-1">
                      {person.conflicts.map((c: any) => (
                        <span key={c.type} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-medium">
                          <span className="text-amber-400">⚠</span>
                          {conflictHint(c.type)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <button className="text-sm font-bold text-primary hover:underline">View Profile</button>
                    <button
                      onClick={() => handleConnect(person.id)}
                      disabled={connectingId === person.id || (localRequestStatuses[person.id] || person.requestStatus) !== null}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                        (localRequestStatuses[person.id] || person.requestStatus) === 'pending'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : (localRequestStatuses[person.id] || person.requestStatus) === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-primary/10 text-primary hover:bg-primary hover:text-dark'
                      }`}
                    >
                      {connectingId === person.id 
                        ? 'Sending…' 
                        : (localRequestStatuses[person.id] || person.requestStatus) === 'pending'
                        ? 'Request Sent'
                        : (localRequestStatuses[person.id] || person.requestStatus) === 'accepted'
                        ? 'Matched'
                        : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {visibleMatches.length === 0 && !error && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="size-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                <UserSearch size={32} className="text-slate-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-700">No matches yet</h4>
              <p className="text-sm text-slate-500 mt-2 mb-6">Complete your lifestyle preferences to get matched.</p>
              <button className="px-6 py-2 bg-dark text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">
                Complete Profile
              </button>
            </div>
          )}
        </div>

        {/* Location Discovery banner */}
        <div className="rounded-2xl overflow-hidden relative min-h-[300px] flex items-center p-8 mb-8">
          <div className="absolute inset-0 bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=60&w=1400"
              alt="City map"
              className="w-full h-full object-cover opacity-40 grayscale"
            />
          </div>
          <div className="relative z-10 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">Location Search</h2>
            <p className="text-slate-300 mb-6">Explore roommate matches by neighborhood proximity to your workplace or campus.</p>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-dark rounded-full font-bold hover:brightness-105 transition-all">
              <Map size={18} />
              Open Map Discovery
            </button>
          </div>
        </div>

      </main>
    </div>

    {/* Edit Profile modal */}
    {showEditProfile && (
      <OnboardingForm
        initialData={editProfileData}
        isModal
        onClose={() => { setShowEditProfile(false); setEditProfileData(null); }}
      />
    )}
    </>
  );
};

export default RoommateDiscovery;
