"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, UserCircle2 } from "lucide-react";
import type { MatchedProfile } from "../../../app/discovery/actions";
import {
  tierBadgeClass,
  tierLabel,
  getBinaryTags,
  conflictHint,
} from "@/utils/discoveryHelper";
import { MatchFeedback } from "./MatchFeedback";

interface ProfileCardProps {
  person: MatchedProfile;
  savedIds: Set<string>;
  connectingId: string | null;
  localRequestStatuses: Record<string, string>;
  selectedPreferenceTags: string[];
  feedbackStatus: Record<string, number>;
  onHeartClick: (id: string) => void;
  onConnect: (id: string, incomingRequestId?: string | null) => void;
  onFeedback: (targetId: string, rating: number) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  person,
  savedIds,
  connectingId,
  localRequestStatuses,
  selectedPreferenceTags,
  feedbackStatus,
  onHeartClick,
  onConnect,
  onFeedback,
}) => {
  const router = useRouter();

  const binaryTags = getBinaryTags(person.lifestyle_tags);
  const budgetLabel =
    person.budget_min && person.budget_max
      ? `$${person.budget_min}–$${person.budget_max}`
      : person.budget_max
      ? `Up to $${person.budget_max}`
      : null;

  return (
    <div
      onClick={() => router.push(`/profile/${person.id}?score=${person.score}`)}
      className="relative rounded-xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-all duration-300 h-96 cursor-pointer"
    >
      {/* Full-card photo */}
      {person.avatar_url ? (
        <img
          src={person.avatar_url}
          alt={person.full_name ?? "Profile"}
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
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${tierBadgeClass(
            person.tier,
          )}`}
        >
          {person.score}% {tierLabel(person.tier)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHeartClick(person.id);
          }}
          className="size-9 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors shadow-sm"
        >
          <Heart
            size={18}
            className={
              savedIds.has(person.id)
                ? "text-red-500 fill-red-500"
                : "text-white hover:text-red-400"
            }
          />
        </button>
      </div>

      {/* Bottom overlay content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-white">
              {person.full_name ?? "Anonymous"}
            </h3>
            <p className="text-sm text-white/70">
              {person.location
                ? person.location.split(",").slice(0, 2).join(",").trim()
                : person.role === "provider"
                ? "Provider"
                : "Seeker"}
            </p>
          </div>
          {budgetLabel && (
            <span className="text-primary font-bold text-base">
              {budgetLabel}
              <span className="text-xs text-white/50 font-normal">/mo</span>
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
              .map((tag) => {
                const isHighlighted = selectedPreferenceTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isHighlighted
                        ? "bg-primary text-dark"
                        : "bg-white/20 text-white/80"
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
              <span
                key={c.type}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/40 text-[11px] text-amber-300 font-medium"
              >
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
            onClick={(e) => {
              e.stopPropagation();
              onConnect(person.id, person.incomingRequestId);
            }}
            disabled={
              connectingId === person.id ||
              ((localRequestStatuses[person.id] || person.requestStatus) !==
                null &&
                !person.incomingRequestId)
            }
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              (localRequestStatuses[person.id] || person.requestStatus) ===
              "accepted"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : person.incomingRequestId &&
                  (localRequestStatuses[person.id] || person.requestStatus) !==
                    "accepted"
                ? "bg-green-500 text-white hover:bg-green-600"
                : (localRequestStatuses[person.id] || person.requestStatus) ===
                  "pending"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-dark"
            }`}
          >
            {connectingId === person.id
              ? "Accepting…"
              : (localRequestStatuses[person.id] || person.requestStatus) ===
                "accepted"
              ? "Matched"
              : person.incomingRequestId &&
                (localRequestStatuses[person.id] || person.requestStatus) !==
                  "accepted"
              ? "Accept"
              : (localRequestStatuses[person.id] || person.requestStatus) ===
                "pending"
              ? "Request Sent"
              : "Connect"}
          </button>
        </div>
      </div>
      {feedbackStatus[person.id] === undefined && (
        <MatchFeedback
          targetId={person.id}
          matchScore={person.score}
          onSuccess={(rating) => onFeedback(person.id, rating)}
        />
      )}
    </div>
  );
};
