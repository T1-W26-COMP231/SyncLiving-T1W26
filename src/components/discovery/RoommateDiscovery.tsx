'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, UserCircle, UserCircle2, ChevronDown, Check, Heart, UserSearch, Map, X, Building2, MapPin, Calendar, Banknote, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import type { MatchedProfile, MatchedListing } from '../../../app/discovery/actions';
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

// ─── Profile Detail Drawer ────────────────────────────────────────────────────
interface ProfileDetailDrawerProps {
  profile: MatchedProfile | null;
  onClose: () => void;
  isSaved: boolean;
  onHeartClick: (id: string) => void;
  onConnect: (id: string) => void;
  connectingId: string | null;
  localRequestStatuses: Record<string, string>;
  selectedPreferenceTags: string[];
}

function ProfileDetailDrawer({
  profile,
  onClose,
  isSaved,
  onHeartClick,
  onConnect,
  connectingId,
  localRequestStatuses,
  selectedPreferenceTags,
}: ProfileDetailDrawerProps) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (profile) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [profile]);

  if (!profile) return null;

  const budgetLabel = profile.budget_min && profile.budget_max
    ? `$${profile.budget_min} – $${profile.budget_max}/mo`
    : profile.budget_max
    ? `Up to $${profile.budget_max}/mo`
    : null;

  const requestStatus = localRequestStatuses[profile.id] || profile.requestStatus;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Hero photo */}
        <div className="relative h-64 shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <UserCircle2 size={96} className="text-slate-300" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 size-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Match badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${tierBadgeClass(profile.tier)}`}>
              {profile.score}% {tierLabel(profile.tier)}
            </span>
          </div>

          {/* Name over photo */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {profile.full_name ?? 'Anonymous'}
              {profile.age && <span className="font-normal text-white/80">, {profile.age}</span>}
            </h2>
            <p className="text-sm text-white/70 capitalize mt-0.5">
              {profile.role === 'provider' ? 'Roommate with Room' : 'Looking for Room'}
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Quick info row */}
          <div className="flex flex-wrap gap-3">
            {profile.location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                {profile.location}
              </div>
            )}
            {budgetLabel && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Banknote size={14} className="text-slate-400 shrink-0" />
                {budgetLabel}
              </div>
            )}
            {profile.preferred_gender && profile.preferred_gender !== 'Prefer not to say' && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <User size={14} className="text-slate-400 shrink-0" />
                Prefers {profile.preferred_gender}
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">About</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Lifestyle tags */}
          {profile.lifestyle_tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lifestyle</h4>
              <div className="flex flex-wrap gap-2">
                {profile.lifestyle_tags.map(tag => {
                  const isHighlighted = selectedPreferenceTags.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        isHighlighted
                          ? 'bg-primary/20 border-primary/50 text-dark'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compatibility conflicts */}
          {profile.conflicts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Potential Conflicts</h4>
              <div className="space-y-1.5">
                {profile.conflicts.map(c => (
                  <div key={c.type} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">{conflictHint(c.type)}</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">{c.clause}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 flex items-center gap-3 bg-white">
          <button
            onClick={() => onHeartClick(profile.id)}
            className={`size-11 flex items-center justify-center rounded-full border transition-all ${
              isSaved
                ? 'bg-red-50 border-red-300 text-red-500'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-400'
            }`}
          >
            <Heart size={20} className={isSaved ? 'fill-red-500' : ''} />
          </button>

          <button
            onClick={() => onConnect(profile.id)}
            disabled={connectingId === profile.id || requestStatus !== null}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              requestStatus === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : requestStatus === 'accepted'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-primary text-dark hover:brightness-105'
            }`}
          >
            {connectingId === profile.id
              ? 'Sending…'
              : requestStatus === 'pending'
              ? 'Request Sent'
              : requestStatus === 'accepted'
              ? 'Matched'
              : 'Connect'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  matches: MatchedProfile[];
  roomListings: MatchedListing[];
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
  allAmenityNames: string[];
  allRoomTypeNames: string[];
  error: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
const RoommateDiscovery: React.FC<Props> = ({
  matches,
  roomListings,
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
  allAmenityNames,
  allRoomTypeNames,
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

  // Two-stage preference tag filters (roommate view):
  //   selectedPreferenceTags — tags clicked in advanced panel → chips in filter bar + highlighted in cards
  //   activeTagFilters       — chips clicked → deal-breaker filter (already declared above)
  const [selectedPreferenceTags, setSelectedPreferenceTags] = useState<string[]>(() => [...userBinaryPrefs]);

  // Two-stage room tag filters:
  //   selectedRoomTags  — tags clicked in the advanced panel → chips appear in filter bar (no filtering yet)
  //   activeRoomTagFilters — chips clicked in filter bar → filtering applied + cards highlighted
  const [selectedRoomTags, setSelectedRoomTags] = useState<string[]>([]);
  const [activeRoomTagFilters, setActiveRoomTagFilters] = useState<string[]>([]);

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
  const [selectedProfile, setSelectedProfile] = useState<MatchedProfile | null>(null);

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
    setSelectedRoomTags([...userRoomTypeNames, ...userAmenityNames]);
    setActiveRoomTagFilters([]);
    setSelectedPreferenceTags([...userBinaryPrefs]);
    setActiveTagFilters([]);
  }

  // ── Quick-filter chip visibility ────────────────────────────────────────────

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

  // Filter room listings (only used when isRoomView)
  const isRoomView = activeFilters.length === 1 && activeFilters[0] === 'room';

  const visibleListings = isRoomView ? roomListings.filter(listing => {
    if (budgetFilterOn && (listing.rental_fee < filterBudgetMin || listing.rental_fee > filterBudgetMax)) return false;
    if (distFilterOn && prefLat !== null && prefLng !== null) {
      if (listing.lat !== null && listing.lng !== null) {
        if (haversineKm(prefLat, prefLng, listing.lat, listing.lng) > filterMaxDist) return false;
      }
    }
    if (activeRoomTagFilters.length > 0) {
      for (const tag of activeRoomTagFilters) {
        if (listing.room_type !== tag && !listing.amenities.includes(tag)) return false;
      }
    }
    return true;
  }) : [];

  // Auto-disable age filter when switching to Room view
  useEffect(() => {
    if (isRoomView) setAgeFilterOn(false);
  }, [isRoomView]);

  // When entering room view, pre-select chips from user's saved preferences (they appear in the filter bar but don't filter until clicked).
  // When leaving room view, clear both states.
  useEffect(() => {
    if (isRoomView) {
      setSelectedRoomTags([...userRoomTypeNames, ...userAmenityNames]);
    } else {
      setSelectedRoomTags([]);
      setActiveRoomTagFilters([]);
    }
  }, [isRoomView]);

  // Panel click: add chip to filter bar; clicking again removes chip (and deactivates filter)
  function toggleSelectedRoomTag(tag: string) {
    setSelectedRoomTags(prev => {
      if (prev.includes(tag)) {
        setActiveRoomTagFilters(a => a.filter(t => t !== tag));
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  }

  // Chip click: toggle whether the chip actively filters + highlights cards
  function toggleActiveRoomTag(tag: string) {
    setActiveRoomTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  // Panel click: add/remove preference tag chip from filter bar; also removes from active filters if deselecting
  function toggleSelectedPreferenceTag(tag: string) {
    setSelectedPreferenceTags(prev => {
      if (prev.includes(tag)) {
        setActiveTagFilters(a => a.filter(t => t !== tag));
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  }

  // Chip click: toggle preference tag as deal-breaker filter
  function toggleActivePreferenceTag(tag: string) {
    setActiveTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

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
                /* Room preferences — all available options shown; selected ones appear as chips in filter bar */
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Room Preferences</p>
                  {allRoomTypeNames.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] text-slate-400 mb-1.5">Room types</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allRoomTypeNames.map(name => {
                          const isSelected = selectedRoomTags.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleSelectedRoomTag(name)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-primary/15 border-primary/40 text-dark'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30'
                              }`}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {allAmenityNames.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1.5">Amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allAmenityNames.map(name => {
                          const isSelected = selectedRoomTags.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleSelectedRoomTag(name)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-primary/15 border-primary/40 text-dark'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30'
                              }`}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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

            {/* Preference tags — shown in Roommate view */}
            {!isRoomView && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Lifestyle Preferences</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FILTER_TAGS.map(({ tag, label }) => {
                    const isSelected = selectedPreferenceTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSelectedPreferenceTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary/15 border-primary/40 text-dark'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
            {isRoomView
              ? visibleListings.length === 0
                ? 'No room listings found — try adjusting your filters.'
                : `${visibleListings.length} listing${visibleListings.length !== 1 ? 's' : ''} found`
              : visibleMatches.length === 0
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

          {/* Preference tag chips — hidden in Room view; active = deal-breaker filter */}
          {!isRoomView && selectedPreferenceTags.length > 0 && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              {selectedPreferenceTags.map(tag => {
                const isActive = activeTagFilters.includes(tag);
                const label = QUICK_FILTER_TAGS.find(f => f.tag === tag)?.label ?? tag;
                return (
                  <button
                    key={tag}
                    onClick={() => toggleActivePreferenceTag(tag)}
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

          {/* Room preference chips — shown in Room view when tags are selected in advanced panel */}
          {isRoomView && selectedRoomTags.length > 0 && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              {selectedRoomTags.map(tag => {
                const isActive = activeRoomTagFilters.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleActiveRoomTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                      isActive
                        ? 'bg-primary/20 border-primary/50 text-dark'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-primary/40'
                    }`}
                  >
                    {isActive && <span className="mr-1">✓</span>}
                    {tag}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Roommate Grid */}
        {!isRoomView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {visibleMatches.map(person => {
            const binaryTags = getBinaryTags(person.lifestyle_tags);
            const budgetLabel = person.budget_min && person.budget_max
              ? `$${person.budget_min}–$${person.budget_max}`
              : person.budget_max
              ? `Up to $${person.budget_max}`
              : null;

            return (
              <div key={person.id} onClick={() => router.push(`/profile/${person.id}?score=${person.score}`)} className="relative rounded-xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-all duration-300 h-96 cursor-pointer">

                {/* Full-card photo */}
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name ?? 'Profile'}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                    <UserCircle2 size={80} className="text-slate-300" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Top row: score badge + heart */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${tierBadgeClass(person.tier)}`}>
                    {person.score}% {tierLabel(person.tier)}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleHeartClick(person.id); }}
                    className="size-9 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors shadow-sm"
                  >
                    <Heart
                      size={18}
                      className={savedIds.has(person.id) ? 'text-red-500 fill-red-500' : 'text-white hover:text-red-400'}
                    />
                  </button>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-white">{person.full_name ?? 'Anonymous'}</h3>
                      <p className="text-sm text-white/70">
                        {person.location ?? (person.role === 'provider' ? 'Provider' : 'Seeker')}
                      </p>
                    </div>
                    {budgetLabel && (
                      <span className="text-primary font-bold text-base">
                        {budgetLabel}<span className="text-xs text-white/50 font-normal">/mo</span>
                      </span>
                    )}
                  </div>

                  {/* Binary lifestyle tags — preferred tags sorted to front and highlighted */}
                  {binaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {[...binaryTags]
                        .sort((a, b) => {
                          const aSelected = selectedPreferenceTags.includes(a) ? 0 : 1;
                          const bSelected = selectedPreferenceTags.includes(b) ? 0 : 1;
                          return aSelected - bSelected;
                        })
                        .slice(0, 4)
                        .map(tag => {
                          const isHighlighted = selectedPreferenceTags.includes(tag);
                          return (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                isHighlighted
                                  ? 'bg-primary text-dark'
                                  : 'bg-white/20 text-white/80'
                              }`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                    </div>
                  )}

                  {/* Conflict triggers */}
                  {person.conflicts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {person.conflicts.slice(0, 2).map((c: any) => (
                        <span key={c.type} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/40 text-[11px] text-amber-300 font-medium">
                          <span>⚠</span>
                          {conflictHint(c.type)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <button 
                      onClick={() => router.push(`/discovery/profile/${person.id}`)}
                      className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/profile/${person.id}?score=${person.score}`); }}
                      className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleConnect(person.id); }}
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
        )}

        {/* Room Listings Grid */}
        {isRoomView && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {visibleListings.map(listing => {
              const photo = listing.photos[0] ?? null;
              const distKm = (prefLat !== null && prefLng !== null && listing.lat !== null && listing.lng !== null)
                ? haversineKm(prefLat, prefLng, listing.lat, listing.lng)
                : null;

              return (
                <div key={listing.id} className="relative rounded-xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-all duration-300 h-96">
                  {/* Full-card photo */}
                  {photo ? (
                    <img
                      src={photo}
                      alt={listing.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                      <Building2 size={64} className="text-slate-300" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Top row: distance + room type */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                    {distKm !== null && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/30 backdrop-blur-sm text-white shadow shrink-0">
                        {distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)}km away`}
                      </span>
                    )}
                    {listing.room_type && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ml-auto shrink-0 transition-colors ${
                        selectedRoomTags.includes(listing.room_type)
                          ? 'bg-primary text-dark'
                          : 'bg-black/30 backdrop-blur-sm text-white'
                      }`}>
                        {listing.room_type}
                      </span>
                    )}
                  </div>

                  {/* Bottom overlay content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Provider info */}
                    <div className="flex items-center gap-2 mb-2">
                      {listing.provider_avatar ? (
                        <img src={listing.provider_avatar} alt={listing.provider_name ?? ''} className="size-6 rounded-full object-cover border border-white/30" />
                      ) : (
                        <UserCircle2 size={20} className="text-white/60" />
                      )}
                      <span className="text-xs text-white/70 font-medium">{listing.provider_name ?? 'Provider'}</span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-white leading-tight">{listing.title}</h3>
                      <span className="text-primary font-bold text-base ml-2 shrink-0">
                        ${listing.rental_fee.toLocaleString()}<span className="text-xs text-white/50 font-normal">/mo</span>
                      </span>
                    </div>

                    <p className="text-sm text-white/70 mb-2 truncate">{listing.address}</p>

                    {/* Amenity chips — preferred tags sorted to front and highlighted */}
                    {listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[...listing.amenities]
                          .sort((a, b) => {
                            const aSelected = selectedRoomTags.includes(a) ? 0 : 1;
                            const bSelected = selectedRoomTags.includes(b) ? 0 : 1;
                            return aSelected - bSelected;
                          })
                          .slice(0, 4)
                          .map(a => {
                            const isHighlighted = selectedRoomTags.includes(a);
                            return (
                              <span key={a} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                isHighlighted
                                  ? 'bg-primary text-dark'
                                  : 'bg-white/20 text-white/80'
                              }`}>
                                {a}
                              </span>
                            );
                          })}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <button className="text-sm font-bold text-white/80 hover:text-white transition-colors">View Listing</button>
                      <button
                        onClick={() => handleConnect(listing.provider_id)}
                        disabled={connectingId === listing.provider_id}
                        className="px-4 py-2 bg-primary text-dark rounded-full text-sm font-bold hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {connectingId === listing.provider_id ? 'Requesting…' : 'Request'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {visibleListings.length === 0 && !error && (
              <div className="col-span-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="size-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <Building2 size={32} className="text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-700">No room listings found</h4>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>
        )}

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

    {/* Profile Detail Drawer */}
    <ProfileDetailDrawer
      profile={selectedProfile}
      onClose={() => setSelectedProfile(null)}
      isSaved={selectedProfile ? savedIds.has(selectedProfile.id) : false}
      onHeartClick={handleHeartClick}
      onConnect={handleConnect}
      connectingId={connectingId}
      localRequestStatuses={localRequestStatuses}
      selectedPreferenceTags={selectedPreferenceTags}
    />
    </>
  );
};

export default RoommateDiscovery;
