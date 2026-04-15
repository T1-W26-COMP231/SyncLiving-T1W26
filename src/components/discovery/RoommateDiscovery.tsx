"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  UserCircle,
  Heart,
  UserSearch,
  Map,
  Building2,
  Check,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import type {
  MatchedProfile,
  MatchedListing,
} from "../../../app/discovery/actions";
import { toggleSavedProfile } from "../../../app/discovery/saved-actions";
import { sendMatchRequest } from "../../../app/discovery/actions";
import { respondToMatchRequest } from "../../../app/messages/actions";
import { MatchConfirmedModal } from "@/components/ui/MatchConfirmedModal";
import { createClient } from "@/utils/supabase/client";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { RoomListingCard } from "./RoomListingCard";
import {
  applyFilters,
  defaultFilters,
  haversineKm,
  QUICK_FILTER_TAGS,
  FILTERS,
  FilterKey,
} from "@/utils/discoveryHelper";
import { AdvancedFilterPanel } from "./AdvancedFilterPanel";
import { ProfileDetailDrawer } from "./ProfileDetailDrawer";
import { ProfileCard } from "./ProfileCard";

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

  // ─── Type / tag filters ──────────────────────────────────────────────────────
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>(() =>
    defaultFilters(userRole),
  );
  const [showSaved, setShowSaved] = useState(false);
  const [showIncompatible, setShowIncompatible] = useState(false);
  // Pre-set preferences from settings become active deal-breaker filters immediately
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>(() =>
    userBinaryPrefs.map((t) => (t === "Same Gender Only" ? "__same_gender__" : t)),
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(matches.filter((m) => m.isSaved).map((m) => m.id)),
  );
  const [localRequestStatuses, setLocalRequestStatuses] = useState<
    Record<string, string>
  >({});
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Edit profile modal ──────────────────────────────────────────────────────
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>(null);

  async function handleEditProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, avatar_url, bio, age, preferred_gender, location, lat, lng, location_coords, role, budget_min, budget_max, move_in_date, age_min, age_max, lifestyle_tags, pref_budget_min, pref_budget_max, pref_lat, pref_lng, pref_max_distance, pref_reference_location",
      )
      .eq("id", user.id)
      .single();
    if (profile) {
      setEditProfileData({
        ...profile,
        latitude: profile.lat,
        longitude: profile.lng,
      });
      setShowEditProfile(true);
    }
  }

  // ─── Advanced filter panel ───────────────────────────────────────────────────
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Session-local overrides — initialized from the user's saved preferences.
  // These never call any server action, so the profile is never mutated here.
  const [filterAgeMin, setFilterAgeMin] = useState<number>(prefAgeMin ?? 18);
  const [filterAgeMax, setFilterAgeMax] = useState<number>(prefAgeMax ?? 60);
  const [filterBudgetMin, setFilterBudgetMin] = useState<number>(
    prefBudgetMin ?? 500,
  );
  const [filterBudgetMax, setFilterBudgetMax] = useState<number>(
    prefBudgetMax ?? 3000,
  );
  const [filterMaxDist, setFilterMaxDist] = useState<number>(
    prefMaxDistance ?? 25,
  );

  // Whether the numeric filters are actually enabled (user may have no prefs set)
  const [ageFilterOn, setAgeFilterOn] = useState(
    prefAgeMin !== null || prefAgeMax !== null,
  );
  const [budgetFilterOn, setBudgetFilterOn] = useState(
    prefBudgetMin !== null || prefBudgetMax !== null,
  );
  const [distFilterOn, setDistFilterOn] = useState(
    prefLat !== null && prefLng !== null && prefMaxDistance !== null,
  );

  // Two-stage preference tag filters (roommate view):
  //   selectedPreferenceTags — tags clicked in advanced panel → chips in filter bar + highlighted in cards
  //   activeTagFilters       — chips clicked → deal-breaker filter (already declared above)
  // Map DB tag names to internal filter keys (e.g. "Same Gender Only" → "__same_gender__")
  const [selectedPreferenceTags, setSelectedPreferenceTags] = useState<
    string[]
  >(() =>
    userBinaryPrefs.map((t) => (t === "Same Gender Only" ? "__same_gender__" : t)),
  );

  // Two-stage room tag filters:
  //   selectedRoomTags  — tags clicked in the advanced panel → chips appear in filter bar (no filtering yet)
  //   activeRoomTagFilters — chips clicked in filter bar → filtering applied + cards highlighted
  const [selectedRoomTags, setSelectedRoomTags] = useState<string[]>([]);
  const [activeRoomTagFilters, setActiveRoomTagFilters] = useState<string[]>(
    [],
  );

  // Click-outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Filter helpers ──────────────────────────────────────────────────────────
  function toggleFilter(key: FilterKey) {
    setActiveFilters([key]);
  }

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<MatchedProfile | null>(
    null,
  );
  const [matchConfirmedUser, setMatchConfirmedUser] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Real-time: update button to "Matched" when someone accepts my sent request
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel("discovery-request-accepted")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "match_requests",
            filter: `sender_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as {
              status: string;
              receiver_id: string;
            };
            if (updated.status !== "accepted") return;
            setLocalRequestStatuses((prev) => ({
              ...prev,
              [updated.receiver_id]: "accepted",
            }));
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function handleConnect(
    targetUserId: string,
    incomingRequestId?: string | null,
  ) {
    setConnectingId(targetUserId);
    try {
      if (incomingRequestId) {
        // Accept the incoming request from this person
        const result = await respondToMatchRequest(
          incomingRequestId,
          "accepted",
        );
        if (result.error) {
          alert("Could not accept request: " + result.error);
          return;
        }
        const person = matches.find((m) => m.id === targetUserId);
        setMatchConfirmedUser({
          full_name: person?.full_name ?? null,
          avatar_url: person?.avatar_url ?? null,
        });
        setLocalRequestStatuses((prev) => ({
          ...prev,
          [targetUserId]: "accepted",
        }));
      } else {
        const result = await sendMatchRequest(targetUserId);
        if (result.error) {
          alert("Could not send match request: " + result.error);
          return;
        }
        setLocalRequestStatuses((prev) => ({
          ...prev,
          [targetUserId]: "pending",
        }));
      }
    } finally {
      setConnectingId(null);
    }
  }

  function handleHeartClick(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    startTransition(async () => {
      await toggleSavedProfile(id);
    });
  }

  function resetAdvancedFilters() {
    setFilterAgeMin(prefAgeMin ?? 18);
    setFilterAgeMax(prefAgeMax ?? 60);
    setFilterBudgetMin(prefBudgetMin ?? 500);
    setFilterBudgetMax(prefBudgetMax ?? 3000);
    setFilterMaxDist(prefMaxDistance ?? 25);
    setAgeFilterOn(prefAgeMin !== null || prefAgeMax !== null);
    setBudgetFilterOn(prefBudgetMin !== null || prefBudgetMax !== null);
    setDistFilterOn(
      prefLat !== null && prefLng !== null && prefMaxDistance !== null,
    );
    setSelectedRoomTags([...userRoomTypeNames, ...userAmenityNames]);
    setActiveRoomTagFilters([]);
    setSelectedPreferenceTags([...userBinaryPrefs]);
    setActiveTagFilters([]);
  }

  // ── Apply all filters ───────────────────────────────────────────────────────
  const visibleMatches = applyFilters(
    matches,
    activeFilters,
    savedIds,
    showSaved,
    activeTagFilters,
    userPreferredGender,
    ageFilterOn ? filterAgeMin : null,
    ageFilterOn ? filterAgeMax : null,
    budgetFilterOn ? filterBudgetMin : null,
    budgetFilterOn ? filterBudgetMax : null,
    distFilterOn ? filterMaxDist : null,
    prefLat,
    prefLng,
    showIncompatible,
  );

  // Filter room listings (only used when isRoomView)
  const isRoomView = activeFilters.length === 1 && activeFilters[0] === "room";

  const visibleListings = isRoomView
    ? roomListings.filter((listing) => {
        if (
          budgetFilterOn &&
          (listing.rental_fee < filterBudgetMin ||
            listing.rental_fee > filterBudgetMax)
        )
          return false;
        if (distFilterOn && prefLat !== null && prefLng !== null) {
          if (listing.lat !== null && listing.lng !== null) {
            if (
              haversineKm(prefLat, prefLng, listing.lat, listing.lng) >
              filterMaxDist
            )
              return false;
          }
        }
        if (activeRoomTagFilters.length > 0) {
          for (const tag of activeRoomTagFilters) {
            if (listing.room_type !== tag && !listing.amenities.includes(tag))
              return false;
          }
        }
        return true;
      })
    : [];

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
  }, [isRoomView, userRoomTypeNames, userAmenityNames]);

  // Panel click: add chip to filter bar; clicking again removes chip (and deactivates filter)
  function toggleSelectedRoomTag(tag: string) {
    setSelectedRoomTags((prev) => {
      if (prev.includes(tag)) {
        setActiveRoomTagFilters((a) => a.filter((t) => t !== tag));
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  }

  // Chip click: toggle whether the chip actively filters + highlights cards
  function toggleActiveRoomTag(tag: string) {
    setActiveRoomTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  // Panel click: add/remove preference tag chip from filter bar; also removes from active filters if deselecting
  function toggleSelectedPreferenceTag(tag: string) {
    setSelectedPreferenceTags((prev) => {
      if (prev.includes(tag)) {
        setActiveTagFilters((a) => a.filter((t) => t !== tag));
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  }

  // Chip click: toggle preference tag as deal-breaker filter
  function toggleActivePreferenceTag(tag: string) {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  // Count how many advanced filters are active
  const activeAdvancedCount = [
    ageFilterOn,
    budgetFilterOn,
    distFilterOn,
  ].filter(Boolean).length;

  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      matches.forEach((m) => {
        if (m.feedbackRating !== null && m.feedbackRating !== undefined) {
          initial[m.id] = m.feedbackRating;
        }
      });
      return initial;
    },
  );

  function handleFeedback(targetId: string, rating: number) {
    setFeedbackStatus((prev) => ({
      ...prev,
      [targetId]: rating,
    }));
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navbar activeTab="Discovery" />

        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Hero */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-dark tracking-tight">
                Find the Roommate in Sync
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Personalized roommate recommendations based on your lifestyle.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdvancedFilters((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all shadow-sm ${
                  showAdvancedFilters || activeAdvancedCount > 0
                    ? "bg-primary/15 border-primary/50 text-dark"
                    : "bg-white border-slate-200 hover:bg-slate-50"
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
            <AdvancedFilterPanel
              isRoomView={isRoomView}
              prefReferenceLocation={prefReferenceLocation}
              bufferKm={bufferKm}
              filterMaxDist={filterMaxDist}
              setFilterMaxDist={setFilterMaxDist}
              distFilterOn={distFilterOn}
              setDistFilterOn={setDistFilterOn}
              filterAgeMin={filterAgeMin}
              setFilterAgeMin={setFilterAgeMin}
              filterAgeMax={filterAgeMax}
              setFilterAgeMax={setFilterAgeMax}
              ageFilterOn={ageFilterOn}
              setAgeFilterOn={setAgeFilterOn}
              filterBudgetMin={filterBudgetMin}
              setFilterBudgetMin={setFilterBudgetMin}
              filterBudgetMax={filterBudgetMax}
              setFilterBudgetMax={setFilterBudgetMax}
              budgetFilterOn={budgetFilterOn}
              setBudgetFilterOn={setBudgetFilterOn}
              allRoomTypeNames={allRoomTypeNames}
              allAmenityNames={allAmenityNames}
              selectedRoomTags={selectedRoomTags}
              toggleSelectedRoomTag={toggleSelectedRoomTag}
              selectedPreferenceTags={selectedPreferenceTags}
              toggleSelectedPreferenceTag={toggleSelectedPreferenceTag}
              onClose={() => setShowAdvancedFilters(false)}
              onReset={resetAdvancedFilters}
            />
          )}

          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error === "Not authenticated"
                ? "Please log in to see your matches."
                : error === "Could not load your profile"
                ? "Complete your onboarding to get personalized matches."
                : error}
            </div>
          )}

          {/* Match count summary */}
          {!error && (
            <p className="text-sm text-slate-500 mb-6 font-medium">
              {isRoomView
                ? visibleListings.length === 0
                  ? "No room listings found — try adjusting your filters."
                  : `${visibleListings.length} listing${
                      visibleListings.length !== 1 ? "s" : ""
                    } found`
                : visibleMatches.length === 0
                ? "No matches found yet — make sure your lifestyle preferences are saved."
                : `${visibleMatches.length} match${
                    visibleMatches.length !== 1 ? "es" : ""
                  } found`}
            </p>
          )}

          {/* Filter row: type dropdown + saved toggle + quick-filter chips */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <div ref={dropdownRef} className="relative inline-block">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:border-primary transition-all shadow-sm"
              >
                Show:{" "}
                <span className="text-dark font-bold">
                  {activeFilters.includes("all")
                    ? "All"
                    : FILTERS.filter(
                        (f) => f.key !== "all" && activeFilters.includes(f.key),
                      )
                        .map((f) => f.label)
                        .join(", ")}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  {FILTERS.map((f) => {
                    const isActive = activeFilters.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => {
                          toggleFilter(f.key);
                          if (f.key === "all") setDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span
                          className={isActive ? "font-semibold text-dark" : ""}
                        >
                          {f.label}
                        </span>
                        {isActive && (
                          <Check size={14} className="text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved toggle */}
            <button
              onClick={() => setShowSaved((s) => !s)}
              title={showSaved ? "Showing saved only" : "Show saved only"}
              className={`size-9 flex items-center justify-center rounded-full border transition-all shadow-sm ${
                showSaved
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-slate-200 hover:border-red-300"
              }`}
            >
              <Heart
                size={16}
                className={
                  showSaved ? "text-red-500 fill-red-500" : "text-slate-400"
                }
              />
            </button>

            {/* Incompatible toggle — hidden in Room view */}
            {!isRoomView && (
              <button
                onClick={() => setShowIncompatible((s) => !s)}
                title={
                  showIncompatible
                    ? "Hiding incompatible matches"
                    : "Show incompatible matches"
                }
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                  showIncompatible
                    ? "bg-slate-200 border-slate-400 text-slate-700"
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
                }`}
              >
                {showIncompatible ? "✓ Incompatible" : "Show Incompatible"}
              </button>
            )}

            {/* Preference tag chips — hidden in Room view; active = deal-breaker filter */}
            {!isRoomView && selectedPreferenceTags.length > 0 && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                {selectedPreferenceTags.map((tag) => {
                  const isActive = activeTagFilters.includes(tag);
                  const label =
                    QUICK_FILTER_TAGS.find((f) => f.tag === tag)?.label ?? tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleActivePreferenceTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                        isActive
                          ? "bg-primary/20 border-primary/50 text-dark"
                          : "bg-white border-slate-200 text-slate-600 hover:border-primary/40"
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
                {selectedRoomTags.map((tag) => {
                  const isActive = activeRoomTagFilters.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleActiveRoomTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                        isActive
                          ? "bg-primary/20 border-primary/50 text-dark"
                          : "bg-white border-slate-200 text-slate-500 hover:border-primary/40"
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
              {visibleMatches
                .filter((person) => feedbackStatus[person.id] !== -1)
                .map((person) => (
                  <ProfileCard
                    key={person.id}
                    person={person}
                    savedIds={savedIds}
                    connectingId={connectingId}
                    localRequestStatuses={localRequestStatuses}
                    selectedPreferenceTags={selectedPreferenceTags}
                    feedbackStatus={feedbackStatus}
                    onHeartClick={handleHeartClick}
                    onConnect={handleConnect}
                    onFeedback={handleFeedback}
                  />
                ))}
            </div>
          )}

          {/* Empty state — roommate view only */}
          {!isRoomView && visibleMatches.length === 0 && !error && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="size-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                <UserSearch size={32} className="text-slate-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-700">
                No matches yet
              </h4>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Complete your lifestyle preferences to get matched.
              </p>
              <button
                onClick={() => router.push("/onboarding")}
                className="px-6 py-2 bg-dark text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Complete Profile
              </button>
            </div>
          )}

          {/* Room Listings Grid */}
          {isRoomView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {visibleListings.map((listing) => {
                const distKm =
                  prefLat !== null &&
                  prefLng !== null &&
                  listing.lat !== null &&
                  listing.lng !== null
                    ? haversineKm(prefLat, prefLng, listing.lat, listing.lng)
                    : null;

                return (
                  <RoomListingCard
                    key={listing.id}
                    listing={listing}
                    distKm={distKm}
                    selectedRoomTags={selectedRoomTags}
                    connectingId={connectingId}
                    onConnect={handleConnect}
                  />
                );
              })}

              {/* Empty state */}
              {visibleListings.length === 0 && !error && (
                <div className="col-span-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                  <div className="size-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                    <Building2 size={32} className="text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700">
                    No room listings found
                  </h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location Discovery banner */}
          <div className="rounded-2xl overflow-hidden relative min-h-[300px] flex items-center p-8 mb-8 mt-12">
            <div className="absolute inset-0 bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=60&w=1400"
                alt="City map"
                className="w-full h-full object-cover opacity-40 grayscale"
              />
            </div>
            <div className="relative z-10 max-w-md">
              <h2 className="text-3xl font-bold text-white mb-4">
                Location Search
              </h2>
              <p className="text-slate-300 mb-6">
                Explore roommate matches by neighborhood proximity to your
                workplace or campus.
              </p>
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
          onClose={() => {
            setShowEditProfile(false);
            setEditProfileData(null);
          }}
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

      {matchConfirmedUser && (
        <MatchConfirmedModal
          matchedUser={matchConfirmedUser}
          onClose={() => setMatchConfirmedUser(null)}
        />
      )}
    </>
  );
};

export default RoommateDiscovery;
