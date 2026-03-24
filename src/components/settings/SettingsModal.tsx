'use client';

import React, { useState } from 'react';
import { X, DollarSign, Calendar, User, PawPrint, Cigarette, Heart, Save } from 'lucide-react';
import { updatePreferences } from '../../../app/settings/actions';


interface SettingsModalProps {
  initialProfile?: any;
  onClose: () => void;
}

type TriState = 'yes' | 'no' | 'na';

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

// ─── Yes / No / N/A selector ─────────────────────────────────────────────────

function TriStateSelect({ value, onChange }: { value: TriState; onChange: (v: TriState) => void }) {
  const options: { value: TriState; label: string }[] = [
    { value: 'yes', label: 'Yes'  },
    { value: 'no',  label: 'No'   },
    { value: 'na',  label: 'N/A'  },
  ];

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            value === opt.value
              ? 'bg-primary text-dark shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
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

const SettingsModal: React.FC<SettingsModalProps> = ({ initialProfile, onClose }) => {
  const tags: string[] = initialProfile?.lifestyle_tags || [];

  // Derive initial tri-state from existing tags
  const initPets:    TriState = tags.includes('Pet Friendly')    ? 'yes' : 'na';
  const initSmoking: TriState = tags.includes('Non-Smoker')      ? 'no'  : 'na';
  const initLgbt:    TriState = tags.includes('LGBTQ+ Friendly') ? 'yes' : 'na';

  const [ageMin,     setAgeMin]     = useState<number>(initialProfile?.age_min || 18);
  const [ageMax,     setAgeMax]     = useState<number>(initialProfile?.age_max || 45);
  const [budgetMin,  setBudgetMin]  = useState<number>(initialProfile?.budget_min || 800);
  const [budgetMax,  setBudgetMax]  = useState<number>(initialProfile?.budget_max || 2500);
  const [moveInDate, setMoveInDate] = useState<string>(initialProfile?.move_in_date || '');
  const [pets,     setPets]     = useState<TriState>(initPets);
  const [smoking,  setSmoking]  = useState<TriState>(initSmoking);
  const [lgbt,     setLgbt]     = useState<TriState>(initLgbt);

  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Preserve other existing tags, then apply the tri-state selections
      const otherTags = tags.filter(
        t => t !== 'Pet Friendly' && t !== 'Non-Smoker' && t !== 'LGBTQ+ Friendly'
      );
      const newTags = [
        ...otherTags,
        ...(pets    === 'yes' ? ['Pet Friendly']    : []),
        ...(smoking === 'no'  ? ['Non-Smoker']      : []),
        ...(lgbt    === 'yes' ? ['LGBTQ+ Friendly'] : []),
      ];

      const result = await updatePreferences({
        age_min:        ageMin,
        age_max:        ageMax,
        budget_min:     budgetMin,
        budget_max:     budgetMax,
        move_in_date:   moveInDate,
        lifestyle_tags: newTags,
      });

      if (result?.error) {
        alert('Error saving: ' + result.error);
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

        {/* Body */}
        <div className="px-8 py-6 space-y-8 max-h-[65vh] overflow-y-auto">

          {/* Age Range */}
          <div>
            <SectionLabel Icon={User} label="Age Range" />
            <DualRangeSlider
              min={18}
              max={80}
              step={1}
              valueMin={ageMin}
              valueMax={ageMax}
              onChangeMin={setAgeMin}
              onChangeMax={setAgeMax}
              formatValue={v => `${v} yrs`}
            />
          </div>

          {/* Budget */}
          <div>
            <SectionLabel Icon={DollarSign} label="Monthly Budget" />
            <DualRangeSlider
              min={200}
              max={5000}
              step={50}
              valueMin={budgetMin}
              valueMax={budgetMax}
              onChangeMin={setBudgetMin}
              onChangeMax={setBudgetMax}
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
            <SectionLabel Icon={Heart} label="House Preferences" />
            <p className="text-xs text-slate-400 mb-4 -mt-1">
              Used to filter roommate search results. Select <span className="font-semibold">N/A</span> to show all.
            </p>
            <div className="space-y-3">

              {/* Pets Allowed */}
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
                <TriStateSelect value={pets} onChange={setPets} />
              </div>

              {/* Smoking Allowed */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Cigarette size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">Smoking Allowed</p>
                    <p className="text-xs text-slate-400">Comfortable with smokers</p>
                  </div>
                </div>
                <TriStateSelect value={smoking} onChange={setSmoking} />
              </div>

              {/* LGBT+ Friendly */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Heart size={16} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">LGBT+ Friendly</p>
                    <p className="text-xs text-slate-400">Inclusive and welcoming space</p>
                  </div>
                </div>
                <TriStateSelect value={lgbt} onChange={setLgbt} />
              </div>

            </div>
          </div>
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
