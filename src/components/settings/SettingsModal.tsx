'use client';

import React, { useState } from 'react';
import {
  X, DollarSign, Calendar, User, PawPrint, Cigarette,
  Heart, Save, MapPin, Search, LocateFixed, Building2, Home, CheckCircle2, PlusCircle, Leaf,
} from 'lucide-react';
import { updatePreferences, updateRoomPreferences } from '../../../app/settings/actions';


interface SettingsModalProps {
  initialProfile?: any;
  onClose: () => void;
  allAmenities?: { id: string; name: string; category: string | null }[];
  allRoomTypes?: { id: string; name: string }[];
  initialAmenityIds?: string[];
  initialRoomTypeIds?: string[];
}

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

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
        value ? 'bg-primary' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ Icon, label }: { Icon: React.FC<any>; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-primary shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const SettingsModal: React.FC<SettingsModalProps> = ({
  initialProfile,
  onClose,
  allAmenities = [],
  allRoomTypes = [],
  initialAmenityIds = [],
  initialRoomTypeIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<'roommate' | 'room'>('roommate');

  // ── Roommate tab state ──────────────────────────────────────────────────────
  const tags: string[] = initialProfile?.lifestyle_tags || [];
  const [ageMin,     setAgeMin]     = useState<number>(initialProfile?.age_min     || 18);
  const [ageMax,     setAgeMax]     = useState<number>(initialProfile?.age_max     || 45);
  const [budgetMin,  setBudgetMin]  = useState<number>(initialProfile?.budget_min  || 800);
  const [budgetMax,  setBudgetMax]  = useState<number>(initialProfile?.budget_max  || 2500);
  const [moveInDate, setMoveInDate] = useState<string>(initialProfile?.move_in_date || '');
  const [pets,       setPets]       = useState<boolean>(tags.includes('Pet Friendly'));
  const [smoking,    setSmoking]    = useState<boolean>(tags.includes('Non-Smoker'));
  const [lgbt,       setLgbt]       = useState<boolean>(tags.includes('LGBTQ+ Friendly'));
  const [sameGender, setSameGender] = useState<boolean>(tags.includes('Same Gender Only'));
  const [vegan,      setVegan]      = useState<boolean>(tags.includes('Vegan Friendly'));

  // ── Room tab state ──────────────────────────────────────────────────────────
  // Parse initial pref_location_coords
  let initialLat: number | undefined;
  let initialLng: number | undefined;
  if (initialProfile?.pref_location_coords) {
    if (typeof initialProfile.pref_location_coords === 'string') {
      const m = initialProfile.pref_location_coords.match(/POINT\((.+) (.+)\)/);
      if (m) { initialLng = parseFloat(m[1]); initialLat = parseFloat(m[2]); }
    } else if (initialProfile.pref_location_coords?.coordinates) {
      initialLng = initialProfile.pref_location_coords.coordinates[0];
      initialLat = initialProfile.pref_location_coords.coordinates[1];
    }
  }

  const [location,            setLocation]            = useState<string>(initialProfile?.pref_reference_location || '');
  const [latitude,            setLatitude]            = useState<number | undefined>(initialLat);
  const [longitude,           setLongitude]           = useState<number | undefined>(initialLng);
  const [maxDistance,         setMaxDistance]         = useState<number>(initialProfile?.pref_max_distance || 10);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions,     setShowSuggestions]     = useState(false);
  const [selectedAmenities,   setSelectedAmenities]   = useState<string[]>(initialAmenityIds);
  const [selectedRoomTypes,   setSelectedRoomTypes]   = useState<string[]>(initialRoomTypeIds);

  const searchLocation = async (query: string) => {
    setLocation(query);
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
    setLocation(s.display_name);
    setLatitude(parseFloat(s.lat));
    setLongitude(parseFloat(s.lon));
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const toggleAmenity  = (id: string) => setSelectedAmenities(prev  => prev.includes(id)  ? prev.filter(a => a !== id)  : [...prev, id]);
  const toggleRoomType = (id: string) => setSelectedRoomTypes(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const otherTags = tags.filter(
        t => !['Pet Friendly', 'Non-Smoker', 'LGBTQ+ Friendly', 'Same Gender Only', 'Vegan Friendly'].includes(t)
      );
      const newTags = [
        ...otherTags,
        ...(pets       ? ['Pet Friendly']    : []),
        ...(smoking    ? ['Non-Smoker']      : []),
        ...(lgbt       ? ['LGBTQ+ Friendly'] : []),
        ...(sameGender ? ['Same Gender Only'] : []),
        ...(vegan      ? ['Vegan Friendly']  : []),
      ];

      const [roommateResult, roomResult] = await Promise.all([
        updatePreferences({
          age_min:        ageMin,
          age_max:        ageMax,
          budget_min:     budgetMin,
          budget_max:     budgetMax,
          move_in_date:   moveInDate,
          lifestyle_tags: newTags,
        }),
        updateRoomPreferences({
          amenity_ids:        selectedAmenities,
          room_type_ids:      selectedRoomTypes,
          reference_location: location,
          latitude,
          longitude,
          max_distance:       maxDistance,
        }),
      ]);

      if (roommateResult?.error || roomResult?.error) {
        alert('Error saving: ' + (roommateResult?.error || roomResult?.error));
      } else {
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-dark">Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preset your roommate-matching filters</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mx-8 mt-5 mb-1 bg-slate-100 p-1 rounded-xl">
          {(['roommate', 'room'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'roommate' ? 'Roommate' : 'Room'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-8 max-h-[60vh] overflow-y-auto">

          {/* ── ROOMMATE TAB ─────────────────────────────────────────────── */}
          {activeTab === 'roommate' && (
            <>
              {/* Age Range */}
              <div>
                <SectionLabel Icon={User} label="Age Range" />
                <DualRangeSlider
                  min={18} max={80} step={1}
                  valueMin={ageMin} valueMax={ageMax}
                  onChangeMin={setAgeMin} onChangeMax={setAgeMax}
                  formatValue={v => `${v} yrs`}
                />
              </div>

              {/* Budget */}
              <div>
                <SectionLabel Icon={DollarSign} label="Monthly Budget" />
                <DualRangeSlider
                  min={200} max={5000} step={50}
                  valueMin={budgetMin} valueMax={budgetMax}
                  onChangeMin={setBudgetMin} onChangeMax={setBudgetMax}
                  formatValue={v => `$${v.toLocaleString()}`}
                />
              </div>

              {/* Move-in Date */}
              <div>
                <SectionLabel Icon={Calendar} label="Move-in Date" />
                <input
                  type="date"
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* House Preferences */}
              <div>
                <SectionLabel Icon={Heart} label="Housemate Preferences" />
                <p className="text-xs text-slate-400 mb-4 -mt-1">
                  Used to filter roommate search results.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center">
                        <PawPrint size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">Pets Allowed</p>
                        <p className="text-xs text-slate-400">Open to living with pets</p>
                      </div>
                    </div>
                    <Toggle value={pets} onChange={setPets} />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Cigarette size={16} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">Non-Smoker</p>
                        <p className="text-xs text-slate-400">Prefer a smoke-free environment</p>
                      </div>
                    </div>
                    <Toggle value={smoking} onChange={setSmoking} />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Heart size={16} className="text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">LGBTQ+ Friendly</p>
                        <p className="text-xs text-slate-400">Inclusive and welcoming space</p>
                      </div>
                    </div>
                    <Toggle value={lgbt} onChange={setLgbt} />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">Same Gender Only</p>
                        <p className="text-xs text-slate-400">Prefer a roommate of the same gender</p>
                      </div>
                    </div>
                    <Toggle value={sameGender} onChange={setSameGender} />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-green-100 flex items-center justify-center">
                        <Leaf size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">Vegan Friendly</p>
                        <p className="text-xs text-slate-400">Prefer a vegan or plant-based household</p>
                      </div>
                    </div>
                    <Toggle value={vegan} onChange={setVegan} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ROOM TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'room' && (
            <>
              {/* Location & Distance */}
              <div>
                <SectionLabel Icon={LocateFixed} label="Location & Distance" />
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => searchLocation(e.target.value)}
                    onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search city or neighborhood…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      {locationSuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-2"
                        >
                          <MapPin size={13} className="mt-0.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-dark truncate">{s.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Maximum Distance</span>
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                      within {maxDistance} km
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={100} step={1}
                    value={maxDistance}
                    onChange={e => setMaxDistance(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                    <span>1 km</span><span>50 km</span><span>100 km</span>
                  </div>
                </div>
              </div>

              {/* Room Type */}
              <div>
                <SectionLabel Icon={Building2} label="Preferred Room Type" />
                <div className="grid grid-cols-2 gap-2">
                  {allRoomTypes.map(type => {
                    const active = selectedRoomTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleRoomType(type.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'border-primary bg-primary/10 text-dark'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {active
                          ? <CheckCircle2 size={15} className="text-primary shrink-0" />
                          : <div className="size-4 rounded-full border-2 border-slate-200 shrink-0" />
                        }
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <SectionLabel Icon={Home} label="Must-have Amenities" />
                <div className="grid grid-cols-2 gap-2">
                  {allAmenities.map(amenity => {
                    const active = selectedAmenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'border-primary bg-primary/10 text-dark'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {active
                          ? <CheckCircle2 size={15} className="text-primary shrink-0" />
                          : <PlusCircle size={15} className="text-slate-300 shrink-0" />
                        }
                        {amenity.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:brightness-105 disabled:opacity-70 text-dark font-bold text-sm rounded-full transition-all active:scale-95 shadow-sm shadow-primary/20"
          >
            <Save size={15} />
            {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
