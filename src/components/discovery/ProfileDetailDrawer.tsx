"use client";

import React, { useEffect } from "react";
import type { MatchedProfile } from "../../../app/discovery/actions";
import {
  UserCircle2,
  X,
  Heart,
  MapPin,
  Banknote,
  User,
} from "lucide-react";
import { tierBadgeClass, tierLabel, conflictHint } from "@/utils/discoveryHelper";

interface ProfileDetailDrawerProps {
  profile: MatchedProfile | null;
  onClose: () => void;
  isSaved: boolean;
  onHeartClick: (id: string) => void;
  onConnect: (id: string, incomingRequestId?: string | null) => void;
  connectingId: string | null;
  localRequestStatuses: Record<string, string>;
  selectedPreferenceTags: string[];
}

export function ProfileDetailDrawer({
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
    if (profile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [profile]);

  if (!profile) return null;

  const budgetLabel =
    profile.budget_min && profile.budget_max
      ? `$${profile.budget_min} – $${profile.budget_max}/mo`
      : profile.budget_max
      ? `Up to $${profile.budget_max}/mo`
      : null;

  const requestStatus =
    localRequestStatuses[profile.id] || profile.requestStatus;

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
              alt={profile.full_name ?? "Profile"}
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
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${tierBadgeClass(
                profile.tier,
              )}`}
            >
              {profile.score}% {tierLabel(profile.tier)}
            </span>
          </div>

          {/* Name over photo */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {profile.full_name ?? "Anonymous"}
              {profile.age && (
                <span className="font-normal text-white/80">
                  , {profile.age}
                </span>
              )}
            </h2>
            <p className="text-sm text-white/70 capitalize mt-0.5">
              {profile.role === "provider"
                ? "Roommate with Room"
                : "Looking for Room"}
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
            {profile.preferred_gender &&
              profile.preferred_gender !== "Prefer not to say" && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <User size={14} className="text-slate-400 shrink-0" />
                  Prefers {profile.preferred_gender}
                </div>
              )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                About
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Lifestyle tags */}
          {profile.lifestyle_tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Lifestyle
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.lifestyle_tags.map((tag) => {
                  const isHighlighted = selectedPreferenceTags.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        isHighlighted
                          ? "bg-primary/20 border-primary/50 text-dark"
                          : "bg-slate-50 border-slate-200 text-slate-600"
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
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Potential Conflicts
              </h4>
              <div className="space-y-1.5">
                {profile.conflicts.map((c) => (
                  <div
                    key={c.type}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">
                        {conflictHint(c.type)}
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        {c.clause}
                      </p>
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
                ? "bg-red-50 border-red-300 text-red-500"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-400"
            }`}
          >
            <Heart size={20} className={isSaved ? "fill-red-500" : ""} />
          </button>

          <button
            onClick={() => onConnect(profile.id, profile.incomingRequestId)}
            disabled={
              connectingId === profile.id ||
              (requestStatus !== null && !profile.incomingRequestId)
            }
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              requestStatus === "accepted"
                ? "bg-emerald-100 text-emerald-700"
                : profile.incomingRequestId
                ? "bg-green-500 text-white hover:bg-green-600"
                : requestStatus === "pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-primary text-dark hover:brightness-105"
            }`}
          >
            {connectingId === profile.id
              ? profile.incomingRequestId
                ? "Accepting…"
                : "Sending…"
              : requestStatus === "accepted"
              ? "Matched"
              : profile.incomingRequestId
              ? "Accept"
              : requestStatus === "pending"
              ? "Request Sent"
              : "Connect"}
          </button>
        </div>
      </div>
    </>
  );
}
