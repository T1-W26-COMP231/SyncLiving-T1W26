'use client';

import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  defaultValue?: string;
  onAddressSelect: (address: string, city: string, postalCode: string, lat: number, lng: number) => void;
}

// Uses the new google.maps.places.AutocompleteSuggestion API (required for API keys
// created after March 1, 2025 — the old AutocompleteService is unavailable for new keys).
export default function AddressAutocomplete({ defaultValue, onAddressSelect }: AddressAutocompleteProps) {
  const [value, setValue]           = useState(defaultValue ?? '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const sessionTokenRef             = useRef<any>(null);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync defaultValue once on mount
  const defaultValueSynced = useRef(false);
  useEffect(() => {
    if (defaultValue && !defaultValueSynced.current) {
      setValue(defaultValue);
      defaultValueSynced.current = true;
    }
  }, [defaultValue]);

  async function fetchSuggestions(input: string) {
    if (!input.trim()) { setSuggestions([]); return; }

    const google = (window as any).google;
    if (!google?.maps?.places?.AutocompleteSuggestion) return;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    try {
      const { suggestions: results } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken:         sessionTokenRef.current,
          includedRegionCodes:  ['ca'],
        });
      setSuggestions(results ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  async function handleSelect(suggestion: any) {
    const place = suggestion.placePrediction.toPlace();
    try {
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'addressComponents'] });

      const address = place.formattedAddress ?? '';
      const lat     = place.location?.lat() ?? 0;
      const lng     = place.location?.lng() ?? 0;

      let city = '';
      let postalCode = '';
      (place.addressComponents ?? []).forEach((c: any) => {
        if (c.types?.includes('locality'))    city       = c.longText ?? '';
        if (c.types?.includes('postal_code')) postalCode = c.longText ?? '';
      });

      setValue(address);
      setSuggestions([]);
      sessionTokenRef.current = null; // Reset token after a completed selection

      onAddressSelect(address, city, postalCode, lat, lng);
    } catch (err) {
      console.error('Place fetch error:', err);
    }
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
      <input
        value={value}
        onChange={handleInput}
        placeholder="Enter property address"
        className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-4 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm transition-all"
        name="address"
        autoComplete="off"
        required
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-auto py-2">
          {suggestions.map((s, i) => {
            const p = s.placePrediction;
            return (
              <li
                key={i}
                onClick={() => handleSelect(s)}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="font-bold">{p.mainText?.toString()}</span>{' '}
                <span className="text-slate-500 text-xs">{p.secondaryText?.toString()}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
