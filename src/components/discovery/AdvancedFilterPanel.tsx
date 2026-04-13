"use client";

import React from "react";
import { X } from "lucide-react";
import { DualRangeSlider } from "@/components/ui/DualRangeSlider";
import { QUICK_FILTER_TAGS } from "@/utils/discoveryHelper";

interface AdvancedFilterPanelProps {
  isRoomView: boolean;
  prefReferenceLocation: string | null;
  bufferKm: number | null;
  filterMaxDist: number;
  setFilterMaxDist: (value: number) => void;
  distFilterOn: boolean;
  setDistFilterOn: (on: boolean) => void;
  filterAgeMin: number;
  setFilterAgeMin: (value: number) => void;
  filterAgeMax: number;
  setFilterAgeMax: (value: number) => void;
  ageFilterOn: boolean;
  setAgeFilterOn: (on: boolean) => void;
  filterBudgetMin: number;
  setFilterBudgetMin: (value: number) => void;
  filterBudgetMax: number;
  setFilterBudgetMax: (value: number) => void;
  budgetFilterOn: boolean;
  setBudgetFilterOn: (on: boolean) => void;
  allRoomTypeNames: string[];
  allAmenityNames: string[];
  selectedRoomTags: string[];
  toggleSelectedRoomTag: (tag: string) => void;
  selectedPreferenceTags: string[];
  toggleSelectedPreferenceTag: (tag: string) => void;
  onClose: () => void;
  onReset: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isRoomView,
  prefReferenceLocation,
  bufferKm,
  filterMaxDist,
  setFilterMaxDist,
  distFilterOn,
  setDistFilterOn,
  filterAgeMin,
  setFilterAgeMin,
  filterAgeMax,
  setFilterAgeMax,
  ageFilterOn,
  setAgeFilterOn,
  filterBudgetMin,
  setFilterBudgetMin,
  filterBudgetMax,
  setFilterBudgetMax,
  budgetFilterOn,
  setBudgetFilterOn,
  allRoomTypeNames,
  allAmenityNames,
  selectedRoomTags,
  toggleSelectedRoomTag,
  selectedPreferenceTags,
  toggleSelectedPreferenceTag,
  onClose,
  onReset,
}) => {
  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-bold text-dark text-sm">
            Advanced Filters
          </span>
          <span className="ml-2 text-xs text-slate-400 font-normal">
            Session only — won't change your saved preferences
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline underline-offset-2"
          >
            Reset to preferences
          </button>
          <button
            onClick={onClose}
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
                onChange={(e) => setDistFilterOn(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary"
              />
              Enable
            </label>
          </div>
          {prefReferenceLocation && (
            <p className="text-[11px] text-slate-400 mb-2 truncate">
              Near: {prefReferenceLocation}
            </p>
          )}
          {!prefReferenceLocation && distFilterOn && (
            <p className="text-[11px] text-amber-500 mb-2">
              Set a reference location in Settings first
            </p>
          )}
          <input
            type="range"
            min={1}
            max={bufferKm ?? 100}
            step={1}
            value={filterMaxDist}
            onChange={(e) => setFilterMaxDist(Number(e.target.value))}
            disabled={!distFilterOn}
            className="w-full accent-primary disabled:opacity-40"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
            <span>1 km</span>
            <span className="font-semibold text-slate-600">
              {filterMaxDist} km
            </span>
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
                  onChange={(e) => setAgeFilterOn(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary"
                />
                Enable
              </label>
            </div>
            <div
              className={`transition-opacity ${
                ageFilterOn ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <DualRangeSlider
                min={18}
                max={80}
                valueMin={filterAgeMin}
                valueMax={filterAgeMax}
                onChangeMin={setFilterAgeMin}
                onChangeMax={setFilterAgeMax}
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>18</span>
                <span className="font-semibold text-slate-600">
                  {filterAgeMin} – {filterAgeMax} yrs
                </span>
                <span>80</span>
              </div>
            </div>
          </div>
        ) : (
          /* Room preferences — all available options shown; selected ones appear as chips in filter bar */
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Room Preferences
            </p>
            {allRoomTypeNames.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Room types
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allRoomTypeNames.map((name) => {
                    const isSelected = selectedRoomTags.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleSelectedRoomTag(name)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 text-dark"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30"
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
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allAmenityNames.map((name) => {
                    const isSelected = selectedRoomTags.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleSelectedRoomTag(name)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 text-dark"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30"
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
                onChange={(e) => setBudgetFilterOn(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary"
              />
              Enable
            </label>
          </div>
          <div
            className={`transition-opacity ${
              budgetFilterOn ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}
          >
            <DualRangeSlider
              min={0}
              max={5000}
              step={50}
              valueMin={filterBudgetMin}
              valueMax={filterBudgetMax}
              onChangeMin={setFilterBudgetMin}
              onChangeMax={setFilterBudgetMax}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>$0</span>
              <span className="font-semibold text-slate-600">
                ${filterBudgetMin} – ${filterBudgetMax}/mo
              </span>
              <span>$5000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preference tags — shown in Roommate view */}
      {!isRoomView && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Lifestyle Preferences
          </p>
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
                      ? "bg-primary/15 border-primary/40 text-dark"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/30"
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
  );
};
