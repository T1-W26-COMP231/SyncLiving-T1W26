"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  Share2,
  MoreHorizontal,
  Home,
  Send,
  MessageCircle,
  AlertTriangle,
  UserX,
  Flag,
  Pencil,
} from "lucide-react";
import SyncLivingLogo from "@/components/ui/SyncLivingLogo";
import { sendMatchRequest } from "../../../app/discovery/actions";
import { unmatchUser, reportUser } from "../../../app/matches/actions";
import ReviewDetailsModal from "./ReviewDetailsModal";
import { ReportUserModal } from "../matches/ReportUserModal";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { createClient } from "@/utils/supabase/client";

import {
  type ProfileData,
  type ReviewData,
  type CompatibilityItem,
} from "./types";

interface ProfileDetailsPageProps {
  profile: ProfileData;
  initialRequestStatus?: "pending" | "accepted" | "declined" | null;
  currentUserId?: string | null;
}

// Render star rating as a row of filled/empty stars
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

// Lifestyle tag icon mapping
const LIFESTYLE_ICONS: Record<string, string> = {
  "Early Riser": "🌅",
  "Pet Friendly": "🐾",
  "Non-Smoker": "🚭",
  "Non-smoker": "🚭",
  "Remote Worker": "💻",
  "Clean Freak": "🧹",
  "Night Owl": "🦉",
  Vegan: "🌱",
  Vegetarian: "🥦",
  Social: "🎉",
  Quiet: "🤫",
  "Gym Goer": "💪",
  Student: "📚",
  "No Pets": "🚫",
};

function getLifestyleIcon(tag: string): string {
  return LIFESTYLE_ICONS[tag] ?? "✨";
}

function formatMoveInDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function averageRating(reviews: ReviewData[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

// Threshold below which a dimension is flagged as a potential conflict
const CONFLICT_THRESHOLD = 65;

// Per-dimension "may..." warning shown on conflict items
const CONFLICT_DESCRIPTIONS: Record<string, string> = {
  "Sleep Schedule": "may affect your rest and daily routine",
  "Noise Level": "may cause disruptions at home",
  Cleanliness: "may lead to disagreements on household tidiness",
  "Cleanliness & Organization":
    "may lead to disagreements on household tidiness",
  "Guest Policy": "may create tension around visitors",
  "Social Style": "may lead to friction around social gatherings",
  "Social Style & Guests": "may lead to friction around social gatherings",
  "Pet Policy": "may be an issue if you have or dislike pets",
  Smoking: "may affect indoor air quality and comfort",
  "Work From Home": "may affect shared space usage during the day",
  "Study Habits": "may impact quiet hours and concentration",
  Budget: "may lead to disagreements on shared expenses",
  "Work Schedule": "may affect shared routines and quiet hours",
  "Cooking Habits": "may lead to friction over kitchen use",
  Temperature: "may cause disagreements on heating or cooling",
};

export default function ProfileDetailsPage({
  profile,
  initialRequestStatus = null,
  currentUserId = null,
}: ProfileDetailsPageProps) {
  const [requestStatus, setRequestStatus] = useState<
    "pending" | "accepted" | "declined" | null
  >(initialRequestStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      router.refresh();
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleEditProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, bio, age, preferred_gender, location, lat, lng, role, budget_min, budget_max, move_in_date, age_min, age_max, lifestyle_tags')
      .eq('id', user.id)
      .single();
    if (profileData) {
      setEditProfileData({ ...profileData, latitude: profileData.lat, longitude: profileData.lng });
      setShowEditProfile(true);
    }
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleUnmatch() {
    if (!confirm(`Are you sure you want to unmatch with ${profile.full_name}?`)) return;
    setIsUnmatching(true);
    setMenuOpen(false);
    const result = await unmatchUser(profile.id);
    if (result.success) {
      router.push("/matches");
    } else {
      alert("Could not unmatch: " + result.error);
      setIsUnmatching(false);
    }
  }

  async function handleConnect() {
    if (requestStatus !== null || isConnecting) return;
    setIsConnecting(true);
    try {
      const result = await sendMatchRequest(profile.id);
      if (result.error) {
        alert("Could not send connection request: " + result.error);
        return;
      }
      setRequestStatus("pending");
    } finally {
      setIsConnecting(false);
    }
  }

  const avgRating = profile.reviews?.length
    ? averageRating(profile.reviews)
    : 0;
  const displayedReviews = showAllReviews
    ? (profile.reviews ?? [])
    : (profile.reviews ?? []).slice(0, 2);

  const roleLabel =
    profile.role === "provider" ? "Verified Provider" : "Room Seeker";
  const roleColor =
    profile.role === "provider"
      ? "bg-primary/10 text-primary"
      : "bg-secondary/30 text-foreground";

  const visibleTags = (profile.lifestyle_tags ?? []).filter(
    (t) => !t.startsWith("wd:") && !t.startsWith("we:"),
  );

  // Parse weekday/weekend schedule tags — format: "wd:dimension:Value" / "we:dimension:Value"
  function parseScheduleTags(prefix: "wd" | "we") {
    return (profile.lifestyle_tags ?? [])
      .filter((t) => t.startsWith(`${prefix}:`))
      .map((t) => {
        const [, dim, value] = t.split(":");
        // Humanize dimension key and camelCase value
        const dimLabel =
          dim === "social"   ? "Social Style"    :
          dim === "acoustic" ? "Noise Level"      :
          dim === "sanitary" ? "Cleanliness"      :
          dim === "rhythm"   ? "Sleep Schedule"   :
          dim === "boundary" ? "Guest Policy"     :
          dim;
        // Insert spaces before capital letters: "NightOwl" → "Night Owl"
        const valueLabel = value?.replace(/([A-Z])/g, " $1").trim() ?? "";
        return { dim: dimLabel, value: valueLabel };
      });
  }

  const weekdayTags = parseScheduleTags("wd");
  const weekendTags = parseScheduleTags("we");

  const conflictDimensions = (profile.compatibility ?? []).filter(
    (c) => c.percentage < CONFLICT_THRESHOLD,
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <Link
              href="/discovery"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Back</span>
            </Link>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <SyncLivingLogo size="md" href="/dashboard" />
          </div>
          <div className="flex gap-2 items-center">
            <button
              className="flex items-center justify-center rounded-full h-9 w-9 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* 3-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="flex items-center justify-center rounded-full h-9 w-9 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); setShowReportModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Flag size={15} className="text-slate-400" />
                    Report User
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleUnmatch}
                    disabled={isUnmatching}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <UserX size={15} />
                    {isUnmatching ? "Unmatching…" : "Unmatch"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex justify-center py-6 px-4 lg:px-40">
        <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Overview */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:self-start">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="relative">
                <div className="size-32 rounded-full border-4 border-primary/20 p-1">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`Profile photo of ${profile.full_name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                      {profile.full_name?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                {currentUserId === profile.id ? (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-1 right-1 size-7 rounded-full bg-primary border-2 border-white flex items-center justify-center hover:brightness-105 transition-all shadow-sm disabled:opacity-60"
                      title="Change profile photo"
                    >
                      {avatarUploading
                        ? <div className="size-3 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                        : <Pencil size={12} className="text-dark" />
                      }
                    </button>
                  </>
                ) : (
                  <div className="absolute bottom-1 right-1 bg-green-500 border-2 border-white size-4 rounded-full" />
                )}
              </div>

              <div className="mt-4 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.full_name}
                  {profile.age ? `, ${profile.age}` : ""}
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                  {profile.occupation && (
                    <>
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{profile.occupation}</span>
                    </>
                  )}
                  {profile.location && (
                    <>
                      {profile.occupation && <span>•</span>}
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{profile.location}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Role badge */}
              <div
                className={`flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleColor}`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {roleLabel}
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-8 space-y-3">
                {currentUserId === profile.id ? (
                  <button
                    onClick={handleEditProfile}
                    className="w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 bg-primary text-dark hover:brightness-105"
                  >
                    <Pencil size={15} />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || requestStatus !== null}
                    className={`w-full font-bold py-3 rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      requestStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : requestStatus === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-primary text-white hover:opacity-90"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {isConnecting
                      ? "Sending…"
                      : requestStatus === "pending"
                        ? "Request Sent"
                        : requestStatus === "accepted"
                          ? "Matched!"
                          : "Send Connection Request"}
                  </button>
                )}
                <button
                  disabled={requestStatus !== "accepted"}
                  className="w-full bg-slate-100 text-foreground font-bold py-3 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-4 mt-8">
                <div className="bg-background p-3 rounded-xl text-center border border-slate-100">
                  <span className="text-primary font-bold text-xl">
                    {profile.reputation?.toFixed(1) ?? avgRating.toFixed(1)}
                  </span>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mt-0.5">
                    Reputation
                  </p>
                </div>
                <div className="bg-background p-3 rounded-xl text-center border border-slate-100">
                  <span className="text-primary font-bold text-xl">
                    {profile.match_score ? `${profile.match_score}%` : "N/A"}
                  </span>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mt-0.5">
                    Match Score
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Bio — includes profile_photos (personal extra photos) */}
            {(profile.bio ||
              (profile.profile_photos &&
                profile.profile_photos.length > 0)) && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-primary">👤</span> About{" "}
                  {profile.full_name?.split(" ")[0]}
                </h2>
                {profile.bio && (
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                {/* Personal extra photos — 1 wide left (row-span-2) + 2 small stacked right, same as Living Space */}
                {profile.profile_photos &&
                  profile.profile_photos.length > 0 && (
                    <div className={profile.bio ? "mt-6" : ""}>
                      {profile.profile_photos.length === 1 ? (
                        <div
                          className="rounded-xl overflow-hidden bg-slate-100"
                          style={{ height: "240px" }}
                        >
                          <img
                            src={profile.profile_photos[0]}
                            alt="Photo 1"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="grid gap-3"
                          style={{
                            gridTemplateColumns: "3fr 2fr",
                            gridTemplateRows: "1fr 1fr",
                            height: "240px",
                          }}
                        >
                          {/* Wide featured photo spanning full height on the left */}
                          <div className="row-span-2 rounded-xl overflow-hidden bg-slate-100">
                            <img
                              src={profile.profile_photos[0]}
                              alt="Photo 1"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Up to 2 smaller photos stacked on the right */}
                          {profile.profile_photos
                            .slice(1, 3)
                            .map((url, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl overflow-hidden bg-slate-100"
                              >
                                <img
                                  src={url}
                                  alt={`Photo ${idx + 2}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Preferences — Budget & Move-in */}
            {(profile.budget_min ||
              profile.budget_max ||
              profile.move_in_date) && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 space-y-4">
                <h2 className="text-xl font-bold">Preferences</h2>
                {(profile.budget_min || profile.budget_max) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Monthly Budget</span>
                    <span className="text-sm font-bold text-foreground">
                      ${profile.budget_min?.toLocaleString() ?? "?"} – ${profile.budget_max?.toLocaleString() ?? "?"}
                    </span>
                  </div>
                )}
                {profile.move_in_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Move-in Date</span>
                    <span className="text-sm font-bold text-foreground">
                      {formatMoveInDate(profile.move_in_date)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Compatibility Breakdown — conflicts highlighted */}
            {profile.compatibility && profile.compatibility.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <span className="text-primary">📊</span> Compatibility
                  Breakdown
                </h2>

                {/* Conflict summary banner */}
                {conflictDimensions.length > 0 && (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-amber-700">
                        Potential conflicts — discuss before moving in
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {conflictDimensions.map((c) => (
                        <li
                          key={c.label}
                          className="flex items-start gap-1.5 text-xs text-amber-700"
                        >
                          <span className="mt-0.5 shrink-0">•</span>
                          <span>
                            <span className="font-semibold">{c.label}</span>
                            {" — "}
                            {CONFLICT_DESCRIPTIONS[c.label] ??
                              "may need a conversation before moving in together"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-5">
                  {profile.compatibility.map((item) => {
                    const isConflict = item.percentage < CONFLICT_THRESHOLD;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-2 items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                            {isConflict && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 border border-amber-200">
                                Conflict
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-sm font-bold ${isConflict ? "text-amber-500" : "text-primary"}`}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isConflict ? "bg-amber-400" : "bg-primary"}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lifestyle Tags — placed below Compatibility Breakdown */}
            {(visibleTags.length > 0 || weekdayTags.length > 0 || weekendTags.length > 0) && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-primary">✨</span> Lifestyle
                </h2>

                {/* General lifestyle chips */}
                {visibleTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {visibleTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium flex items-center gap-1.5"
                      >
                        <span>{getLifestyleIcon(tag)}</span>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Weekday / Weekend schedule — two columns */}
                {(weekdayTags.length > 0 || weekendTags.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Weekday column */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
                        ☀️ Weekday
                      </p>
                      {weekdayTags.length > 0 ? (
                        <ul className="space-y-2">
                          {weekdayTags.map(({ dim, value }) => (
                            <li key={dim} className="flex items-start justify-between gap-2 text-xs">
                              <span className="text-slate-500 font-medium shrink-0">{dim}</span>
                              <span className="font-semibold text-dark text-right">{value}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Not specified</p>
                      )}
                    </div>

                    {/* Weekend column */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
                        🌙 Weekend
                      </p>
                      {weekendTags.length > 0 ? (
                        <ul className="space-y-2">
                          {weekendTags.map(({ dim, value }) => (
                            <li key={dim} className="flex items-start justify-between gap-2 text-xs">
                              <span className="text-slate-500 font-medium shrink-0">{dim}</span>
                              <span className="font-semibold text-dark text-right">{value}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Not specified</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Living Space — space_photos from room_listings + listing info */}
            {((profile.space_photos && profile.space_photos.length > 0) ||
              profile.space_listing) && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  {profile.full_name?.split(" ")[0]}&apos;s Living Space
                </h2>

                {/* Space photo grid — 1 wide left (row-span-2) + 2 small stacked right, matching Stitch design */}
                {profile.space_photos && profile.space_photos.length > 0 && (
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: "3fr 2fr",
                      gridTemplateRows: "1fr 1fr",
                      height: "280px",
                    }}
                  >
                    {/* Wide featured photo spanning full height on the left */}
                    <div className="row-span-2 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={profile.space_photos[0]}
                        alt="Living space main photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Two small photos stacked on the right */}
                    {profile.space_photos.slice(1, 3).map((url, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden bg-slate-100"
                      >
                        <img
                          src={url}
                          alt={`Space photo ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Listing info below the photos — title left, address/price left, "View Details" link right */}
                {profile.space_listing && (
                  <div className="flex items-start justify-between mt-4">
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {profile.space_listing.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {profile.space_listing.address} • $
                        {profile.space_listing.rental_fee.toLocaleString()}/mo
                      </p>
                    </div>
                    <button className="text-xs font-semibold text-primary hover:opacity-75 transition-opacity shrink-0 ml-4">
                      View Details
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {profile.reviews && profile.reviews.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary fill-primary" /> Past
                    Reviews
                  </h2>
                  <div className="flex items-center gap-2 text-primary">
                    <StarRating rating={avgRating} />
                    <span className="ml-1 font-bold">
                      {avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {displayedReviews.map((review, index) => (
                    <button
                      key={review.id}
                      onClick={() => setSelectedReview(review)}
                      className={`w-full text-left p-4 rounded-lg transition-colors hover:bg-slate-50 ${
                        index < displayedReviews.length - 1
                          ? "border-b border-slate-100 pb-6"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 w-full">
                        <div className="flex items-center gap-3">
                          {review.reviewer_avatar ? (
                            <img
                              src={review.reviewer_avatar}
                              alt={review.reviewer_name}
                              className="size-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                              {review.reviewer_name[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">
                              {review.reviewer_name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {review.duration}
                            </p>
                          </div>
                        </div>

                        {review.status === "reported" && (
                          <span className="bg-red-50 text-red-500 border border-red-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            Reported
                          </span>
                        )}
                      </div>

                      <StarRating rating={review.rating} />
                      <p className="text-slate-600 text-sm leading-relaxed mt-2">
                        &ldquo;{review.text}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>

                {profile.reviews.length > 2 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full mt-6 text-slate-500 font-bold text-sm hover:text-primary transition-colors"
                  >
                    {showAllReviews
                      ? "Show fewer reviews"
                      : `View all ${profile.reviews.length} reviews`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {showReportModal && (
        <ReportUserModal
          reportedUserId={profile.id}
          reportedUserName={profile.full_name}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showEditProfile && (
        <OnboardingForm
          initialData={editProfileData}
          isModal
          onClose={() => {
            setShowEditProfile(false);
            setEditProfileData(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
